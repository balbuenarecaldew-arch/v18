// ADMIN â€” USUARIOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
async function cargarUsuarios(){
  if(!isAdmin) return;
  const el=document.getElementById('users-list');
  el.innerHTML='<div class="loading"><div class="spinner"></div>Cargando...</div>';
  try{
    const snap=await db.collection('usuarios').get();
    if(snap.empty){ el.innerHTML=`<div style="color:var(--txt3);font-size:12px;padding:20px 0"><p>No hay registros de usuarios aÃºn.</p><p style="margin-top:6px">Los usuarios aparecen aquÃ­ la primera vez que inician sesiÃ³n.</p></div>`; return; }
    let html='';
    snap.forEach(doc=>{
      const u=doc.data(); const activo=u.activo!==false;
      html+=`<div class="user-card">
        <div>
          <div class="uc-email">${u.email||doc.id}</div>
          <div class="uc-role">${u.rol||'Operador'} Â· Ãšltimo acceso: ${u.ultimoAcceso||'â€”'}</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <span class="${activo?'user-status-on':'user-status-off'}">${activo?'â— Activo':'â— Bloqueado'}</span>
          <button class="btn btn-sm ${activo?'btn-danger':'btn-primary'}" onclick="toggleUsuario('${doc.id}',${activo})">${activo?'Bloquear':'Habilitar'}</button>
        </div>
      </div>`;
    });
    el.innerHTML=html;
  }catch(e){ el.innerHTML=`<p style="color:var(--rojo);font-size:12px">Error: ${e.message}</p>`; }
}
async function toggleUsuario(uid,activo){
  if(!confirm(`Â¿${activo?'Bloquear':'Habilitar'} el acceso de este usuario?`)) return;
  await db.collection('usuarios').doc(uid).update({activo:!activo});
  notif(`âœ“ Acceso ${activo?'bloqueado':'habilitado'}`);
  cargarUsuarios();
}
async function registrarAcceso(user){
  try{
    const docRef=db.collection('usuarios').doc(user.uid);
    const snap=await docRef.get();
    if(snap.exists&&snap.data().activo===false) return false;
    await docRef.set({email:user.email,ultimoAcceso:new Date().toLocaleString('es-PY')},{merge:true});
    if(!snap.exists) await docRef.update({activo:true});
    return true;
  }catch(e){ console.warn('registrarAcceso error:',e); return true; }
}
async function verificarAdmin(user){
  try{
    const ref=db.collection('admins').doc(user.uid);
    const doc=await ref.get();
    if(doc.exists) return true;
    const snap=await db.collection('admins').limit(1).get();
    if(snap.empty){ await ref.set({email:user.email,desde:new Date().toISOString()}); return true; }
    return false;
  }catch(e){ console.warn('verificarAdmin error:',e); return false; }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DATOS INICIALES (Mandua 2025)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
