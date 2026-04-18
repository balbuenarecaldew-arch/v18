// MULTI-EMPRESA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function renderEmpresasSel(){
  const sel=document.getElementById('empresa-sel');
  sel.innerHTML='<option value="">— Seleccioná una empresa —</option>';
  Object.entries(EMPRESAS).forEach(([id,emp])=>{
    const opt=document.createElement('option');
    opt.value=id; opt.textContent=emp.nombre||'(sin nombre)';
    if(id===empresaActivaId) opt.selected=true;
    sel.appendChild(opt);
  });
}
function cargarEmpresa(){
  const id=document.getElementById('empresa-sel').value;
  if(!id) return;
  // Guardar datos de empresa anterior
  if(empresaActivaId&&empresaActivaId!==id&&EMPRESAS[empresaActivaId]){
    EMPRESAS[empresaActivaId]={
      nombre:document.getElementById('emp-nombre').value,
      ruc:document.getElementById('emp-ruc').value,
      dir:document.getElementById('emp-dir').value,
      nota:document.getElementById('emp-nota').value,
      plazo:document.getElementById('emp-plazo').value,
      pago:document.getElementById('emp-pago').value,
      validez:document.getElementById('emp-validez').value,
      logo:logoDataURL||null,
    };
  }
  empresaActivaId=id;
  const emp=EMPRESAS[id]; if(!emp) return;
  document.getElementById('emp-nombre').value=emp.nombre||'';
  document.getElementById('emp-ruc').value=emp.ruc||'';
  document.getElementById('emp-dir').value=emp.dir||'';
  document.getElementById('emp-nota').value=emp.nota||'';
  document.getElementById('emp-plazo').value=emp.plazo||'';
  document.getElementById('emp-pago').value=emp.pago||'';
  document.getElementById('emp-validez').value=emp.validez||'';
  logoDataURL=emp.logo||null;
  const prev=document.getElementById('logo-preview');
  if(emp.logo) prev.innerHTML=`<img src="${emp.logo}" style="width:100%;height:100%;object-fit:contain;border-radius:6px">`;
  else prev.innerHTML='+ Logo';
  notif('Empresa cargada: '+(emp.nombre||id));
  generarPreview();
}
function agregarEmpresa(){
  const nombre=prompt('Nombre de la nueva empresa:'); if(!nombre) return;
  const id='emp_'+Date.now();
  EMPRESAS[id]={nombre,ruc:'',dir:'',logo:null,nota:'',plazo:'',pago:'',validez:''};
  empresaActivaId=id;
  renderEmpresasSel(); cargarEmpresa();
  notif('Empresa "'+nombre+'" creada'); marcarUnsaved();
}
function guardarEmpresaActual(){
  if(!empresaActivaId){ notif('Seleccioná o creá una empresa primero','#E05555'); return; }
  EMPRESAS[empresaActivaId]={
    nombre:document.getElementById('emp-nombre').value,
    ruc:document.getElementById('emp-ruc').value,
    dir:document.getElementById('emp-dir').value,
    nota:document.getElementById('emp-nota').value,
    plazo:document.getElementById('emp-plazo').value,
    pago:document.getElementById('emp-pago').value,
    validez:document.getElementById('emp-validez').value,
    logo:logoDataURL||null,
  };
  renderEmpresasSel(); marcarUnsaved(); notif('Empresa guardada');
}
function eliminarEmpresaActual(){
  if(!empresaActivaId){ notif('Seleccioná una empresa primero','#E05555'); return; }
  const nombre=EMPRESAS[empresaActivaId]?.nombre||'';
  if(!confirm(`¿Eliminar la empresa "${nombre}"?`)) return;
  delete EMPRESAS[empresaActivaId];
  empresaActivaId=null; logoDataURL=null;
  ['emp-nombre','emp-ruc','emp-dir','emp-nota','emp-plazo','emp-pago','emp-validez'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('logo-preview').innerHTML='+ Logo';
  renderEmpresasSel(); marcarUnsaved(); notif('Empresa eliminada','#E05555');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CAPÃTULOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function abrirModalCaps(){ renderCapsModal(); abrirModal('modal-caps'); }
function renderCapsModal(){
  const container=document.getElementById('caps-list');
  let html='';
  CAPS.forEach((cap,idx)=>{
    const ramos=['todos','civil','vial','electrica','sanitaria','hvac','acabados'];
    const ramosCheck=ramos.map(r=>{
      const sel=cap.ramos&&cap.ramos.includes(r);
      return `<label style="display:inline-flex;align-items:center;gap:3px;font-size:10px;color:var(--txt2);cursor:pointer;white-space:nowrap">
        <input type="checkbox" id="cap-ramo-${idx}-${r}" ${sel?'checked':''} style="accent-color:var(--acento);width:12px;height:12px">${r}
      </label>`;
    }).join('');
    html+=`<div style="padding:10px 0;border-bottom:1px solid var(--borde)">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:6px">
        <input type="text" value="${cap.id}" readonly style="width:44px;text-align:center;font-family:'DM Mono',monospace;font-weight:700;font-size:12px;background:var(--bg3);border:1px solid var(--borde2);border-radius:6px;padding:5px;color:var(--acento);flex-shrink:0">
        <input type="text" id="cap-name-${idx}" value="${cap.name}" style="flex:1;padding:6px 10px;border:1px solid var(--borde2);border-radius:6px;font-size:12px;background:var(--bg2);color:var(--txt)">
        <input type="color" id="cap-color-${idx}" value="${cap.color}" style="width:38px;height:34px;border:none;border-radius:6px;cursor:pointer;background:none;padding:2px;flex-shrink:0">
        <button class="btn btn-danger btn-xs" onclick="eliminarCapitulo(${idx})" title="Eliminar" style="flex-shrink:0">×</button>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;padding-left:52px">${ramosCheck}</div>
    </div>`;
  });
  container.innerHTML=html||'<p style="color:var(--txt3);font-size:12px">Sin capítulos definidos</p>';
}
function agregarCapitulo(){
  const maxId=CAPS.length>0?Math.max(...CAPS.map(c=>parseInt(c.id)))+1:1;
  const newId=String(maxId).padStart(2,'0');
  const color=COLORES_PRESET[CAPS.length%COLORES_PRESET.length];
  CAPS.push({id:newId,name:'Nuevo capítulo',color,ramos:['todos']});
  renderCapsModal();
}
function eliminarCapitulo(idx){
  const cap=CAPS[idx];
  const tienePartidas=DB.some(p=>p.cap===cap.id);
  if(tienePartidas&&!confirm(`"${cap.name}" tiene partidas asignadas.\n¿Eliminar igual?`)) return;
  CAPS.splice(idx,1); renderCapsModal();
}
function guardarCapitulos(){
  const ramos=['todos','civil','vial','electrica','sanitaria','hvac','acabados'];
  CAPS.forEach((cap,idx)=>{
    const n=document.getElementById(`cap-name-${idx}`);
    const c=document.getElementById(`cap-color-${idx}`);
    if(n) cap.name=n.value.trim()||cap.name;
    if(c) cap.color=c.value;
    // Leer checkboxes de ramos
    const selRamos=ramos.filter(r=>{
      const cb=document.getElementById(`cap-ramo-${idx}-${r}`);
      return cb&&cb.checked;
    });
    cap.ramos=selRamos.length?selRamos:['todos'];
  });
  cerrarModal('modal-caps');
  marcarUnsaved();
  guardarFirebase();
  renderBD();
  notif('âœ“ CapÃ­tulos guardados â€” ' + CAPS.length + ' capÃ­tulos');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
