function renderGuardados(){
  const el=document.getElementById('lista-guardados');
  const q=(document.getElementById('guardados-search')?.value||'').toLowerCase();
  const lista=q?PRESUPUESTOS_GUARDADOS.filter(p=>(p.nombre||'').toLowerCase().includes(q)||(p.cliente||'').toLowerCase().includes(q)||(p.nro||'').toLowerCase().includes(q)):PRESUPUESTOS_GUARDADOS;
  if(!lista.length){
    el.innerHTML=`<div class="empty-state"><div class="icon">ðŸ—‚</div><h3>Sin presupuestos guardados</h3><p>Clic en <strong style="color:var(--acento)">ðŸ’¾ Guardar presupuesto activo</strong> para archivar el actual</p></div>`;
    return;
  }
  let html=`<div class="tbl-wrap"><table style="width:100%;border-collapse:collapse">
    <thead><tr>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">NÂ°</th>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">Proyecto</th>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">Cliente</th>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">Fecha</th>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em;text-align:right">Total â‚²</th>
      <th style="padding:8px 12px;background:var(--bg2);font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">Guardado por</th>
      <th style="padding:8px 12px;background:var(--bg2);width:155px;font-size:10px;color:var(--txt3);text-transform:uppercase;letter-spacing:.06em">Acciones</th>
    </tr></thead><tbody>`;
  lista.forEach((pres,idx)=>{
    const realIdx=PRESUPUESTOS_GUARDADOS.indexOf(pres);
    const total=pres.items.reduce((a,it)=>{const p=DB.find(x=>x.id===it.pid);return a+(p?pu(p)*it.qty:0)},0);
    const esActivo=pres.id===presupuestoActivoGuardadoId;
    html+=`<tr style="${esActivo?'background:rgba(29,186,123,.06);':''}">
      <td style="padding:8px 12px;font-family:'DM Mono',monospace;font-size:11px;color:var(--acento)">${pres.nro||'â€”'}</td>
      <td style="padding:8px 12px;font-size:13px;font-weight:${esActivo?700:400}">${pres.nombre||'Sin nombre'}${esActivo?'<span style="background:var(--acento4);color:var(--acento);font-size:9px;padding:1px 7px;border-radius:99px;margin-left:6px;font-weight:700">â— activo</span>':''}</td>
      <td style="padding:8px 12px;font-size:12px;color:var(--txt2)">${pres.cliente||'â€”'}</td>
      <td style="padding:8px 12px;font-size:11px;color:var(--txt3)">${pres.fecha||'â€”'}</td>
      <td style="padding:8px 12px;text-align:right;font-weight:700;color:var(--acento);font-family:'DM Mono',monospace;font-size:12px">â‚² ${fmtN(total)}</td>
      <td style="padding:8px 12px;font-size:10px;color:var(--txt3)">${pres.guardadoPor||'â€”'}</td>
      <td style="padding:8px 12px">
        <div style="display:flex;gap:4px">
          <button class="btn btn-primary btn-xs" onclick="abrirPresupuestoGuardado(${realIdx})" title="Cargar">ðŸ“‚ Abrir</button>
          <button class="btn btn-secondary btn-xs" onclick="duplicarPresupuesto(${realIdx})" title="Duplicar">âŽ˜</button>
          <button class="btn btn-danger btn-xs" onclick="eliminarPresupuestoGuardado(${realIdx})" title="Eliminar">âœ•</button>
        </div>
      </td>
    </tr>`;
  });
  html+='</tbody></table></div>';
  el.innerHTML=html;
}
async function guardarPresupuestoActual(){
  if(!PRESUPUESTO.length){ notif('El presupuesto activo estÃ¡ vacÃ­o','#E05555'); return; }
  const nombre=document.getElementById('p-nombre').value||'Sin nombre';
  if(!confirm(`Â¿Guardar el presupuesto "${nombre}"?\n\nPodÃ©s editarlo y reabrirlo cuando quieras.`)) return;

  // Generar NÂ° automÃ¡tico si no tiene
  let nro = document.getElementById('p-nro').value.trim();
  if(!nro){ nro = generarNroAutoSilencioso(); document.getElementById('p-nro').value = nro; }

  const nuevo={
    id:'pres_'+Date.now(),
    nombre:document.getElementById('p-nombre').value,
    cliente:document.getElementById('p-cliente').value,
    nro,
    fecha:document.getElementById('p-fecha').value,
    items:JSON.parse(JSON.stringify(PRESUPUESTO)),
    guardadoPor:currentUser?.email||'â€”',
    guardadoEl:new Date().toLocaleString('es-PY'),
    config:{
      pNombre:document.getElementById('p-nombre').value,
      pCliente:document.getElementById('p-cliente').value,
      pUbic:document.getElementById('p-ubic').value,
      pResp:document.getElementById('p-resp').value,
      pNro:nro,
      pFecha:document.getElementById('p-fecha').value,
      pctGi:document.getElementById('pct-gi').value,
      pctBi:document.getElementById('pct-bi').value,
      pctIva:document.getElementById('pct-iva').value,
    }
  };
  PRESUPUESTOS_GUARDADOS.unshift(nuevo);
  presupuestoActivoGuardadoId=null;

  // Vaciar primero el presupuesto activo en memoria
  PRESUPUESTO=[];
  ['p-nombre','p-cliente','p-ubic','p-resp','p-nro'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.value='';
  });
  document.getElementById('p-fecha').value=new Date().toISOString().split('T')[0];

  // Guardar en Firebase con flag para ignorar el prÃ³ximo snapshot de PRESUPUESTO
  _ignorarProximoSnapshotPres = Date.now() + 5000; // ignorar snapshots por 5 segundos
  await guardarFirebase();

  renderPres(); renderBD(); renderGuardados(); setTimeout(()=>renderDashboard(),50);
  notif('âœ“ Presupuesto "'+nuevo.nombre+'" guardado y panel vaciado');
}
function abrirPresupuestoGuardado(idx){
  const pres=PRESUPUESTOS_GUARDADOS[idx];
  if(!confirm(`Â¿Abrir "${pres.nombre}"?\n\nEsto reemplazarÃ¡ el presupuesto activo actual.`)) return;
  PRESUPUESTO=JSON.parse(JSON.stringify(pres.items));
  presupuestoActivoGuardadoId=pres.id;
  if(pres.config){
    ['pNombre','pCliente','pUbic','pResp','pNro','pFecha'].forEach(k=>{
      const id='p-'+k.slice(1).toLowerCase(); const el=document.getElementById(id);
      if(el&&pres.config[k]) el.value=pres.config[k];
    });
    if(pres.config.pctGi) document.getElementById('pct-gi').value=pres.config.pctGi;
    if(pres.config.pctBi) document.getElementById('pct-bi').value=pres.config.pctBi;
    if(pres.config.pctIva) document.getElementById('pct-iva').value=pres.config.pctIva;
  }
  showTab('pres', getTabButton('pres'));
  renderPres(); renderGuardados(); renderDashboard();
  notif('âœ“ Presupuesto "'+pres.nombre+'" cargado');
}
function duplicarPresupuesto(idx){
  const pres=PRESUPUESTOS_GUARDADOS[idx];
  const copia=JSON.parse(JSON.stringify(pres));
  copia.id='pres_'+Date.now();
  copia.nombre=pres.nombre+' (copia)';
  copia.guardadoPor=currentUser?.email||'â€”';
  copia.guardadoEl=new Date().toLocaleString('es-PY');
  if(copia.nro) copia.nro=copia.nro+'-COPIA';
  PRESUPUESTOS_GUARDADOS.splice(idx+1,0,copia);
  marcarUnsaved(); renderGuardados(); renderDashboard();
  notif('âœ“ Presupuesto duplicado');
}
function eliminarPresupuestoGuardado(idx){
  const pres=PRESUPUESTOS_GUARDADOS[idx];
  const ok=prompt(`âš  Para eliminar escribÃ­ el nombre exacto:\n\n"${pres.nombre}"\n\nNombre:`);
  if(ok===null) return;
  if(ok.trim()!==pres.nombre){ notif('Nombre incorrecto â€” no se eliminÃ³','#E05555'); return; }
  PRESUPUESTOS_GUARDADOS.splice(idx,1);
  marcarUnsaved(); renderGuardados(); renderDashboard();
  notif('Presupuesto eliminado','#E05555');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
