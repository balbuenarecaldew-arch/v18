function setSyncStatus(syncing, error=false){
  const el  = document.getElementById('sync-indicator');
  const dot = el.querySelector('.sync-dot');
  const txt = document.getElementById('sync-text');
  if(error){ dot.className='sync-dot error'; txt.textContent='error de sync'; el.style.color='var(--rojo)'; return; }
  if(syncing){ dot.className='sync-dot warning'; txt.textContent='sincronizando...'; el.style.color='var(--naranja)'; }
  else { dot.className='sync-dot'; txt.textContent='sincronizado'; el.style.color='var(--txt3)'; }
}

async function cargarDesdeFirebase(){
  setSyncStatus(true);
  try{
    // Guardar el unsubscriber para poder desuscribirse al cerrar sesion
    _firestoreUnsub = db.collection('datos').doc('base').onSnapshot(snap => {
      if(snap.exists){
        const d = snap.data();
        DB = d.DB||[]; APU = d.APU||{};
        // Solo actualizar PRESUPUESTO desde Firebase si no estamos en medio de un vaciado intencional
        if(Date.now() < _ignorarProximoSnapshotPres){
          // Ignorar este snapshot: acabamos de vaciar el presupuesto
        } else {
          PRESUPUESTO = d.PRESUPUESTO||[];
        }
        // Cargar CAPS solo si tienen estructura valida (con campo ramos)
        if(d.CAPS && d.CAPS.length && d.CAPS[0].ramos){
          CAPS = d.CAPS;
        } else if(d.CAPS && d.CAPS.length){
          // Migrar CAPS viejos (sin ramos) agregando ramos:['todos']
          CAPS = d.CAPS.map(c=>({...c, ramos: c.ramos||['todos']}));
        }
        if(d.PRESUPUESTOS_GUARDADOS) PRESUPUESTOS_GUARDADOS = d.PRESUPUESTOS_GUARDADOS;
        if(d.EMPRESAS){ EMPRESAS=d.EMPRESAS; empresaActivaId=d.empresaActivaId||null; renderEmpresasSel(); if(empresaActivaId) cargarEmpresa(); }
        if(d.config && !_initialLoadDone){
          setTimeout(() => {
            const c = d.config;
            if(c.pNombre) document.getElementById('p-nombre').value = c.pNombre;
            if(c.pCliente) document.getElementById('p-cliente').value = c.pCliente;
            if(c.pUbic) document.getElementById('p-ubic').value = c.pUbic;
            if(c.pResp) document.getElementById('p-resp').value = c.pResp;
            if(c.pNro) document.getElementById('p-nro').value = c.pNro;
            if(c.pFecha) document.getElementById('p-fecha').value = c.pFecha;
            if(c.pctGi) document.getElementById('pct-gi').value = c.pctGi;
            if(c.pctBi) document.getElementById('pct-bi').value = c.pctBi;
            if(c.pctIva) document.getElementById('pct-iva').value = c.pctIva;
            if(c.logo){ logoDataURL=c.logo; const p=document.getElementById('logo-preview'); if(p) p.innerHTML=`<img src="${c.logo}" style="width:100%;height:100%;object-fit:contain;border-radius:6px">`; }
          }, 100);
        }
        renderBD(); renderPres();
        _initialLoadDone = true;
        setTimeout(()=>renderDashboard(), 50);
        guardarCacheLocal();
        if(DB.length) notif('Datos sincronizados - ' + DB.length + ' partidas');
      } else {
        // Intentar cargar cache local mientras
        const cache = cargarCacheLocal();
        if(cache && cache.DB && cache.DB.length){
          DB=cache.DB; APU=cache.APU||{}; PRESUPUESTO=cache.PRESUPUESTO||[];
          if(cache.CAPS) CAPS=cache.CAPS;
          if(cache.PRESUPUESTOS_GUARDADOS) PRESUPUESTOS_GUARDADOS=cache.PRESUPUESTOS_GUARDADOS;
          renderBD(); renderPres(); renderDashboard();
          notif('Usando cache local - ' + DB.length + ' partidas', '#E89020');
        } else {
          cargarDatosIniciales();
        }
      }
      setSyncStatus(false);
    });
  }catch(e){
    // Si falla Firebase, usar cache
    const cache = cargarCacheLocal();
    if(cache && cache.DB){
      DB=cache.DB; APU=cache.APU||{}; PRESUPUESTO=cache.PRESUPUESTO||[];
      if(cache.CAPS) CAPS=cache.CAPS;
      if(cache.PRESUPUESTOS_GUARDADOS) PRESUPUESTOS_GUARDADOS=cache.PRESUPUESTOS_GUARDADOS;
      renderBD(); renderPres(); renderDashboard();
      notif('Modo offline - usando datos locales', '#E89020');
    } else {
      notif('Error de conexión: ' + e.message, '#E05555');
    }
    setSyncStatus(false, true);
  }
}

async function guardarFirebase(silencioso=false){
  if(!currentUser) return;
  setSyncStatus(true);
  const btn = document.getElementById('save-btn');
  if(!silencioso){ btn.innerHTML='<span>Guardando...</span>'; btn.disabled=true; }
  try{
    const config = {
      pNombre:document.getElementById('p-nombre').value,
      pCliente:document.getElementById('p-cliente').value,
      pUbic:document.getElementById('p-ubic').value,
      pResp:document.getElementById('p-resp').value,
      pNro:document.getElementById('p-nro').value,
      pFecha:document.getElementById('p-fecha').value,
      pctGi:document.getElementById('pct-gi').value,
      pctBi:document.getElementById('pct-bi').value,
      pctIva:document.getElementById('pct-iva').value,
      logo:logoDataURL||null,
    };
    await db.collection('datos').doc('base').set({
      DB, APU, PRESUPUESTO, CAPS, EMPRESAS, empresaActivaId,
      PRESUPUESTOS_GUARDADOS, config,
      updatedBy: currentUser.email,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    hayUnsaved = false;
    btn.classList.add('saved'); btn.classList.remove('unsaved');
    btn.innerHTML = '<span>Guardado</span>'; btn.disabled = false;
    setSyncStatus(false);
    guardarCacheLocal();
    if(!silencioso) notif('Guardado en la nube');
    setTimeout(() => { if(!hayUnsaved){ btn.innerHTML='<span>Guardar</span>'; } }, 3000);
  }catch(e){
    if(!silencioso) notif('Error al guardar: ' + e.message, '#E05555');
    btn.innerHTML = '<span>Guardar</span>'; btn.disabled = false;
    setSyncStatus(false, true);
    guardarCacheLocal(); // guardar en local de todas formas
  }
}

function marcarUnsaved(){
  hayUnsaved = true;
  const btn = document.getElementById('save-btn');
  btn.classList.remove('saved');
  btn.classList.add('unsaved');
  btn.innerHTML = '<span>Guardar</span>';
}

async function resetearDatos(){
  if(!isAdmin){ notif('Solo el administrador puede borrar todos los datos','#E05555'); return; }
  if(!confirm('ATENCION\n\nBorrar TODOS los datos de la nube?\n\nEsto afecta a TODOS los usuarios.')) return;
  if(!confirm('Segunda confirmacion: esta accion NO se puede deshacer.\n\nConfirmar borrado total?')) return;
  try{
    const adminDoc = await db.collection('admins').doc(currentUser.uid).get();
    if(!adminDoc.exists){ notif('Verificacion fallida - no sos admin','#E05555'); return; }
  }catch(e){ notif('Error de verificación: '+e.message,'#E05555'); return; }
  await db.collection('datos').doc('base').delete();
  DB=[]; APU={}; PRESUPUESTO=[]; PRESUPUESTOS_GUARDADOS=[];
  localStorage.removeItem('presupuestapp_cache');
  renderBD(); renderPres(); renderGuardados(); setTimeout(()=>renderDashboard(),50);
  notif('Datos borrados','#E05555');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// HISTORIAL / DESHACER â€” COMPLETO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function pushHistorial(tipo, datos){
  HISTORIAL.push({tipo, datos, ts: Date.now()});
  if(HISTORIAL.length > 50) HISTORIAL.shift();
  actualizarBtnUndo();
}
function actualizarBtnUndo(){
  const btn = document.getElementById('undo-btn');
  if(!btn) return;
  if(!HISTORIAL.length){
    btn.classList.remove('active');
    btn.title = 'Sin acciones para deshacer';
  } else {
    const l = HISTORIAL[HISTORIAL.length-1];
    const lb = {
      elimPartida:'Eliminar partida', editPartida:'Editar partida',
      elimInsumo:'Eliminar insumo', editInsumo:'Editar insumo',
      agregarInsumo:'Agregar insumo',
      limpiarPres:'Vaciar presupuesto', quitarPres:'Quitar partida',
      updQty:'Cambio de cantidad'
    };
    btn.classList.add('active');
    btn.title = 'Deshacer: ' + (lb[l.tipo] || l.tipo);
  }
}
function deshacerUltima(){
  if(!HISTORIAL.length) return;
  const a = HISTORIAL.pop();
  switch(a.tipo){
    case 'elimPartida':
      DB.splice(a.datos.idx, 0, a.datos.partida);
      if(a.datos.apu) APU[a.datos.partida.cod.replace('.','_')] = a.datos.apu;
      if(a.datos.presItems) a.datos.presItems.forEach(it=>PRESUPUESTO.push(it));
      renderBD(); renderPres(); notif('Partida recuperada'); break;
    case 'editPartida':
      DB[DB.findIndex(x=>x.id===a.datos.partida.id)] = a.datos.partida;
      renderBD(); notif('Edicion revertida'); break;
    case 'elimInsumo':
      if(!APU[a.datos.cod]) APU[a.datos.cod]=[];
      APU[a.datos.cod].splice(a.datos.idx, 0, a.datos.insumo);
      recalcDesdeAPU(a.datos.cod.replace('_','.'));
      renderAPU(); renderBD(); notif('Insumo recuperado'); break;
    case 'editInsumo':
    case 'agregarInsumo':
      APU[a.datos.cod] = a.datos.insumosPrev;
      recalcDesdeAPU(a.datos.cod.replace('_','.'));
      renderAPU(); renderBD(); notif('Insumo revertido'); break;
    case 'limpiarPres':
      PRESUPUESTO = a.datos.items; renderPres(); renderBD(); notif('Presupuesto restaurado'); break;
    case 'quitarPres':
      PRESUPUESTO.push(a.datos.item); renderPres(); renderBD(); notif('Partida devuelta'); break;
    case 'updQty':
      const item = PRESUPUESTO.find(x=>x.pid===a.datos.pid);
      if(item){ item.qty=a.datos.prevQty; renderPres(); notif('Cantidad revertida'); } break;
  }
  marcarUnsaved(); actualizarBtnUndo();
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// TABS Y RAMOS
