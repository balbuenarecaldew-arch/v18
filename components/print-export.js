function generarDocHTML(){
  const nombre=document.getElementById('p-nombre').value||'';
  const cliente=document.getElementById('p-cliente').value||'';
  const ubic=document.getElementById('p-ubic').value||'';
  const resp=document.getElementById('p-resp').value||'';
  const nro=document.getElementById('p-nro').value||'';
  const fecha=document.getElementById('p-fecha').value?new Date(document.getElementById('p-fecha').value+'T00:00:00').toLocaleDateString('es-PY',{day:'2-digit',month:'long',year:'numeric'}):'';
  const empNombre=document.getElementById('emp-nombre').value||'';
  const empRuc=document.getElementById('emp-ruc').value||'';
  const empDir=document.getElementById('emp-dir').value||'';
  const empNota=document.getElementById('emp-nota').value||'';
  const empPlazo=document.getElementById('emp-plazo').value||'';
  const empPago=document.getElementById('emp-pago').value||'';
  const empValidez=document.getElementById('emp-validez').value||'';
  const gi=parseFloat(document.getElementById('pct-gi').value)||0;
  const bi=parseFloat(document.getElementById('pct-bi').value)||0;
  const iva=parseFloat(document.getElementById('pct-iva').value)||0;
  const factor=(1+gi/100)*(1+bi/100)*(1+iva/100);
  const puFinal=p=>Math.round(pu(p)*factor);
  const fmtP=n=>'â‚² '+Math.round(n).toLocaleString('es-PY');
  let totalGeneral=0;
  PRESUPUESTO.forEach(it=>{const p=DB.find(x=>x.id===it.pid);if(p)totalGeneral+=puFinal(p)*it.qty});
  let html='';

  if(SECC_STATE['sec-portada']){
    html+=`<div class="doc-header">
      <div class="doc-empresa">
        ${logoDataURL?`<img src="${logoDataURL}" style="height:56px;margin-bottom:8px;display:block;max-width:180px;object-fit:contain">`:''}
        <h2>${empNombre}</h2>
        ${empRuc?`<p>RUC/Tel: ${empRuc}</p>`:''}
        ${empDir?`<p>${empDir}</p>`:''}
      </div>
      <div class="doc-datos">
        <p><strong>NÂ° Presupuesto:</strong> ${nro}</p>
        <p><strong>Fecha:</strong> ${fecha}</p>
        <p style="margin-top:6px"><strong>Proyecto:</strong> ${nombre}</p>
        <p><strong>Cliente:</strong> ${cliente}</p>
        ${ubic?`<p><strong>UbicaciÃ³n:</strong> ${ubic}</p>`:''}
        ${resp?`<p><strong>Responsable:</strong> ${resp}</p>`:''}
      </div>
    </div>
    <div class="doc-titulo">Presupuesto de Obra</div>
    <div class="doc-subtitulo">${nombre}${cliente?' â€” '+cliente:''}</div>`;
  }

  if(SECC_STATE['sec-detalle']&&PRESUPUESTO.length){
    const byCap={};
    PRESUPUESTO.forEach(it=>{const p=DB.find(x=>x.id===it.pid);if(!p)return;if(!byCap[p.cap])byCap[p.cap]=[];byCap[p.cap].push({it,p})});
    html+=`<h3 style="font-size:11pt;color:#1B4432;margin:14px 0 7px;border-bottom:2px solid #1B4432;padding-bottom:3px">Detalle de Partidas</h3>
    <table class="doc-table">
      <thead><tr>
        <th style="width:60px">Ãtem</th><th>DescripciÃ³n</th>
        <th style="width:38px;text-align:center">Ud.</th>
        <th style="width:105px;text-align:right">P. Unit. â‚²</th>
        <th style="width:70px;text-align:right">Cant.</th>
        <th style="width:115px;text-align:right">Total â‚²</th>
      </tr></thead><tbody>`;
    Object.keys(byCap).sort().forEach(cid=>{
      const cap=capOf(cid);
      const capT=byCap[cid].reduce((a,{it,p})=>a+puFinal(p)*it.qty,0);
      html+=`<tr class="doc-cap-row"><td colspan="5" style="font-weight:700">${cid} â€” ${cap.name}</td><td style="text-align:right;font-weight:700">${fmtP(capT)}</td></tr>`;
      byCap[cid].forEach(({it,p})=>{
        const puf=puFinal(p); const t=puf*it.qty;
        html+=`<tr>
          <td style="font-family:monospace;font-size:8pt;color:#555">${p.cod}</td>
          <td style="font-size:9pt">${p.desc}</td>
          <td style="text-align:center;font-size:9pt;color:#555">${p.u}</td>
          <td style="text-align:right;font-size:9pt">${fmtP(puf)}</td>
          <td style="text-align:right;font-size:9pt">${it.qty%1===0?it.qty:it.qty.toFixed(2)}</td>
          <td style="text-align:right;font-weight:700;font-size:9pt">${fmtP(t)}</td>
        </tr>`;
      });
    });
    html+=`<tr>
      <td colspan="5" style="text-align:right;font-weight:700;font-size:10pt;padding:10px 8px;color:#111!important;background:#fff!important;border-top:3px solid #1B4432;border-bottom:2px solid #1B4432">TOTAL GENERAL DE OBRA</td>
      <td style="text-align:right;font-weight:700;font-size:13pt;padding:10px 8px;color:#1B4432!important;background:#fff!important;border-top:3px solid #1B4432;border-bottom:2px solid #1B4432">${fmtP(totalGeneral)}</td>
    </tr></tbody></table>`;
  }
  if(SECC_STATE['sec-letras']){
    html+=`<div style="border:1px solid #c5ddd4;border-radius:5px;padding:9px 13px;margin-top:8px;background:#f0f7f3">
      <span style="font-size:8pt;color:#1B4432;font-weight:700;text-transform:uppercase;letter-spacing:.04em">Son: </span>
      <span style="font-size:9pt;color:#1B4432;font-weight:700">${numeroALetras(totalGeneral)} GUARANÃES</span>
    </div>`;
  }
  if(SECC_STATE['sec-nota-pct']){
    html+=`<p style="font-size:7.5pt;color:#888;margin-top:6px;font-style:italic">* Precios unitarios incluyen: gastos indirectos (${gi}%), beneficio (${bi}%) e IVA (${iva}%).</p>`;
  }
  if(SECC_STATE['sec-caps']&&PRESUPUESTO.length){
    const byCap={}; PRESUPUESTO.forEach(it=>{const p=DB.find(x=>x.id===it.pid);if(!p)return;if(!byCap[p.cap])byCap[p.cap]=0;byCap[p.cap]+=puFinal(p)*it.qty});
    html+=`<h3 style="font-size:11pt;color:#1B4432;margin:14px 0 7px;border-bottom:2px solid #1B4432;padding-bottom:3px">Resumen por CapÃ­tulo</h3>
    <table class="doc-table"><thead><tr><th>Cap.</th><th>CapÃ­tulo</th><th style="text-align:right">Total â‚²</th><th style="text-align:right">% Obra</th></tr></thead><tbody>`;
    Object.keys(byCap).sort().forEach(cid=>{const cap=capOf(cid);const pct=totalGeneral>0?(byCap[cid]/totalGeneral*100).toFixed(1):0;html+=`<tr><td><strong>${cid}</strong></td><td>${cap.name}</td><td style="text-align:right;font-weight:700">${fmtP(byCap[cid])}</td><td style="text-align:right">${pct}%</td></tr>`;});
    html+=`<tr><td colspan="2" style="text-align:right;font-weight:700;color:#111!important;background:#fff!important;padding:8px;border-top:3px solid #1B4432">TOTAL</td><td style="text-align:right;font-weight:700;color:#1B4432!important;background:#fff!important;padding:8px;border-top:3px solid #1B4432">${fmtP(totalGeneral)}</td><td style="text-align:right;color:#111!important;background:#fff!important;padding:8px;border-top:3px solid #1B4432">100%</td></tr></tbody></table>`;
  }
  if(SECC_STATE['sec-apu']){
    const lista=PRESUPUESTO.map(it=>DB.find(x=>x.id===it.pid)).filter(p=>p&&APU[p.cod.replace('.','_')]&&APU[p.cod.replace('.','_')].length);
    if(lista.length){
      html+=`<h3 style="font-size:11pt;color:#1B4432;margin:14px 0 7px;border-bottom:2px solid #1B4432;padding-bottom:3px">AnÃ¡lisis de Precios Unitarios</h3>`;
      lista.forEach(p=>{
        const ins=APU[p.cod.replace('.','_')];
        const matT=ins.filter(i=>i.tipo==='M').reduce((a,i)=>a+i.qty*i.pu,0);
        const moT =ins.filter(i=>i.tipo==='L').reduce((a,i)=>a+i.qty*i.pu,0);
        const eqT =ins.filter(i=>i.tipo==='E').reduce((a,i)=>a+i.qty*i.pu,0);
        const subT=ins.filter(i=>i.tipo==='S').reduce((a,i)=>a+i.qty*i.pu,0);
        // Encabezado de la partida
        html+=`<div style="margin-bottom:14px;border:1px solid #ddd;border-radius:6px;overflow:hidden;page-break-inside:avoid">
          <div style="background:#1B4432;color:#fff;padding:6px 12px;display:flex;justify-content:space-between;align-items:center;-webkit-print-color-adjust:exact;print-color-adjust:exact">
            <span style="font-weight:700;font-size:9pt;color:#fff">${p.cod} â€” ${p.desc}</span>
            <span style="font-size:8.5pt;background:rgba(255,255,255,.15);padding:2px 8px;border-radius:4px;color:#fff">Unidad: ${p.u} &nbsp;|&nbsp; P.Unit: ${fmtP(pu(p))}</span>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:8.5pt">
            <thead><tr style="background:#f0f7f3;-webkit-print-color-adjust:exact">
              <th style="padding:5px 10px;text-align:left;color:#1B4432;border-bottom:1px solid #c5ddd4;width:60px">Tipo</th>
              <th style="padding:5px 10px;text-align:left;color:#1B4432;border-bottom:1px solid #c5ddd4">DescripciÃ³n del insumo</th>
              <th style="padding:5px 10px;text-align:center;color:#1B4432;border-bottom:1px solid #c5ddd4;width:35px">Ud.</th>
              <th style="padding:5px 10px;text-align:right;color:#1B4432;border-bottom:1px solid #c5ddd4;width:60px">Cant.</th>
              <th style="padding:5px 10px;text-align:right;color:#1B4432;border-bottom:1px solid #c5ddd4;width:90px">P.Unit â‚²</th>
              <th style="padding:5px 10px;text-align:right;color:#1B4432;border-bottom:1px solid #c5ddd4;width:90px">Subtotal â‚²</th>
            </tr></thead>
            <tbody>`;
        // Filas de insumos agrupadas por tipo
        const tiposOrden=[['M','Material','#e8f2ff'],['L','Mano de Obra','#e8f9f3'],['E','Equipo','#fffae8'],['S','Subcontrato','#fff1e5']];
        tiposOrden.forEach(([tipo,tipoLabel,bg])=>{
          const grupo=ins.filter(i=>i.tipo===tipo); if(!grupo.length) return;
          html+=`<tr style="background:${bg};-webkit-print-color-adjust:exact"><td colspan="6" style="padding:3px 10px;font-size:7.5pt;font-weight:700;color:#555;letter-spacing:.04em;text-transform:uppercase">${tipoLabel}</td></tr>`;
          grupo.forEach(i=>{
            const st=i.qty*i.pu;
            html+=`<tr><td style="padding:4px 10px;color:#666;font-size:8pt"></td><td style="padding:4px 10px;color:#111">${i.desc}</td><td style="padding:4px 10px;text-align:center;color:#555">${i.u}</td><td style="padding:4px 10px;text-align:right;color:#111">${i.qty%1===0?i.qty:i.qty.toFixed(3)}</td><td style="padding:4px 10px;text-align:right;color:#111">${fmtP(i.pu)}</td><td style="padding:4px 10px;text-align:right;font-weight:600;color:#111">${fmtP(st)}</td></tr>`;
          });
        });
        // Fila de totales por tipo y total general
        html+=`<tr style="background:#f5f5f5;border-top:1px solid #ddd">
          <td colspan="4" style="padding:5px 10px;font-size:8pt;color:#555">
            ${matT>0?`<span style="margin-right:12px">Mat: ${fmtP(matT)}</span>`:''}
            ${moT>0?`<span style="margin-right:12px">M.O: ${fmtP(moT)}</span>`:''}
            ${eqT>0?`<span style="margin-right:12px">Eq: ${fmtP(eqT)}</span>`:''}
            ${subT>0?`<span>Subc: ${fmtP(subT)}</span>`:''}
          </td>
          <td style="padding:5px 10px;text-align:right;font-size:8pt;font-weight:700;color:#1B4432">P. UNITARIO</td>
          <td style="padding:5px 10px;text-align:right;font-weight:700;font-size:10pt;color:#1B4432">${fmtP(pu(p))}</td>
        </tr>
        </tbody></table></div>`;
      }); // fin lista.forEach
    }   // fin if lista.length
  }     // fin if sec-apu
  if(SECC_STATE['sec-condiciones']){
    html+=`<h3 style="font-size:11pt;color:#1B4432;margin:14px 0 7px;border-bottom:2px solid #1B4432;padding-bottom:3px">Condiciones Generales</h3>
    <table style="width:100%;border-collapse:collapse;font-size:9pt;border:1px solid #ddd">
      ${empPlazo?`<tr style="background:#f5faf7"><td style="padding:7px 12px;width:155px;font-weight:700;color:#1B4432;border-bottom:1px solid #eee">Plazo de ejecuciÃ³n</td><td style="padding:7px 12px;border-bottom:1px solid #eee;color:#111">${empPlazo}</td></tr>`:''}
      ${empPago?`<tr style="background:#fff"><td style="padding:7px 12px;font-weight:700;color:#1B4432;border-bottom:1px solid #eee">Forma de pago</td><td style="padding:7px 12px;border-bottom:1px solid #eee;color:#111">${empPago}</td></tr>`:''}
      ${empValidez?`<tr style="background:#f5faf7"><td style="padding:7px 12px;font-weight:700;color:#1B4432">Validez</td><td style="padding:7px 12px;color:#111">${empValidez}</td></tr>`:''}
    </table>`;
  }
  if(SECC_STATE['sec-firmas']){
    html+=`<div class="doc-firma">
      <div class="doc-firma-item"><div class="linea"></div><p><strong>${resp||'_________________________'}</strong></p><p>Responsable TÃ©cnico</p></div>
      <div class="doc-firma-item"><div class="linea"></div><p><strong>${cliente||'_________________________'}</strong></p><p>Cliente / Contratante</p></div>
    </div>`;
  }
  if(SECC_STATE['sec-nota']&&empNota){
    html+=`<p class="doc-nota">${empNota}</p>`;
  }
  return html;
}
function generarPreview(){
  document.getElementById('preview-doc').innerHTML = generarDocHTML() || '<p style="color:#999;text-align:center;padding:40px 0">AgregÃ¡ partidas al presupuesto para ver la vista previa.</p>';
}
function imprimirDocumento(){
  const content = generarDocHTML();
  document.getElementById('print-output').innerHTML = content;
  window.print();
  setTimeout(()=>document.getElementById('print-output').innerHTML='', 500);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EXPORTAR EXCEL COMPLETO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function exportarExcel(){
  if(!isAdmin){ notif('âš  Solo el administrador puede exportar Excel completo','#E05555'); return; }
  const wb = XLSX.utils.book_new();

  // Hoja 1: Base de Datos
  const bd = [['CapÃ­tulo','CÃ³digo','DescripciÃ³n','Unidad','Ramo','Materiales','Mano Obra','Equipo','Subcontrato','P.Unitario']];
  DB.forEach(p=>bd.push([capOf(p.cap).name, p.cod, p.desc, p.u, p.ramo||'', p.mat, p.mo, p.eq, p.sub, pu(p)]));
  const ws1 = XLSX.utils.aoa_to_sheet(bd);
  ws1['!cols']=[{wch:30},{wch:10},{wch:50},{wch:6},{wch:12},{wch:14},{wch:14},{wch:14},{wch:14},{wch:14}];
  XLSX.utils.book_append_sheet(wb, ws1, 'Base de Datos');

  // Hoja 2: Presupuesto
  const gi=parseFloat(document.getElementById('pct-gi').value)||0;
  const bi=parseFloat(document.getElementById('pct-bi').value)||0;
  const iva=parseFloat(document.getElementById('pct-iva').value)||0;
  const factor=(1+gi/100)*(1+bi/100)*(1+iva/100);
  const puFinal=p=>Math.round(pu(p)*factor);
  const pd=[
    ['PRESUPUESTO DE OBRA'],
    ['Proyecto:', document.getElementById('p-nombre').value],
    ['Cliente:', document.getElementById('p-cliente').value],
    ['UbicaciÃ³n:', document.getElementById('p-ubic').value],
    ['Responsable:', document.getElementById('p-resp').value],
    ['NÂ° Presupuesto:', document.getElementById('p-nro').value],
    ['Fecha:', document.getElementById('p-fecha').value],
    [''],
    ['GI %:', gi, 'Beneficio %:', bi, 'IVA %:', iva],
    [''],
    ['CÃ³digo','DescripciÃ³n','Unidad','P.Unit Base â‚²','P.Unit Final â‚²','Cantidad','Total â‚²','CapÃ­tulo']
  ];
  const byCap={};
  PRESUPUESTO.forEach(it=>{const p=DB.find(x=>x.id===it.pid);if(!p)return;if(!byCap[p.cap])byCap[p.cap]=[];byCap[p.cap].push({it,p})});
  let total=0, totalBase=0;
  Object.keys(byCap).sort().forEach(cid=>{
    pd.push([`--- ${cid}: ${capOf(cid).name} ---`,'','','','','','','']);
    byCap[cid].forEach(({it,p})=>{
      const puf=puFinal(p); const t=puf*it.qty; total+=t;
      const pb=pu(p); totalBase+=pb*it.qty;
      pd.push([p.cod, p.desc, p.u, pb, puf, it.qty, t, capOf(p.cap).name]);
    });
  });
  pd.push([''],['','','','','','TOTAL COSTO DIRECTO','',totalBase],[],['','','','','','TOTAL OBRA (c/GI+B+IVA)','',total]);
  const ws2 = XLSX.utils.aoa_to_sheet(pd);
  ws2['!cols']=[{wch:12},{wch:50},{wch:7},{wch:16},{wch:16},{wch:10},{wch:16},{wch:30}];
  XLSX.utils.book_append_sheet(wb, ws2, 'Presupuesto');

  // Hoja 3: Presupuestos guardados
  if(PRESUPUESTOS_GUARDADOS.length){
    const pg=[['Proyectos Archivados','','','',''],['Nombre','Cliente','NÂ°','Fecha','Guardado por']];
    PRESUPUESTOS_GUARDADOS.forEach(p=>pg.push([p.nombre||'â€”',p.cliente||'â€”',p.nro||'â€”',p.fecha||'â€”',p.guardadoPor||'â€”']));
    const ws3=XLSX.utils.aoa_to_sheet(pg);
    ws3['!cols']=[{wch:35},{wch:25},{wch:15},{wch:15},{wch:25}];
    XLSX.utils.book_append_sheet(wb, ws3, 'Proyectos Archivados');
  }

  // Hoja 4: APU detallado
  const apuRows=[['ANÃLISIS DE PRECIOS UNITARIOS'],[''],['Partida','Tipo','DescripciÃ³n Insumo','Unidad','Cantidad','Precio Unit.','Subtotal','% del APU']];
  DB.forEach(p=>{
    const ins=APU[p.cod.replace('.','_')]||[];
    if(!ins.length) return;
    const total=ins.reduce((a,i)=>a+i.qty*i.pu,0);
    apuRows.push([`${p.cod} â€” ${p.desc}`,'','','','','',`â‚² ${fmtN(pu(p))}`,'']);
    ins.forEach(i=>{
      const st=i.qty*i.pu;
      const pct=total>0?(st/total*100).toFixed(1)+'%':'0%';
      const tc={'M':'Material','L':'Mano Obra','E':'Equipo','S':'Subcontrato'}[i.tipo]||i.tipo;
      apuRows.push(['',tc,i.desc,i.u,i.qty,i.pu,st,pct]);
    });
    apuRows.push(['']);
  });
  if(apuRows.length>3){
    const ws4=XLSX.utils.aoa_to_sheet(apuRows);
    ws4['!cols']=[{wch:40},{wch:12},{wch:40},{wch:8},{wch:10},{wch:14},{wch:14},{wch:8}];
    XLSX.utils.book_append_sheet(wb, ws4, 'APU Detallado');
  }

  const nroFile = document.getElementById('p-nro').value||'OBRA';
  XLSX.writeFile(wb, `PresupuestAPP_${nroFile}_${new Date().toISOString().split('T')[0]}.xlsx`);
  notif('âœ“ Excel exportado â€” ' + (2+(PRESUPUESTOS_GUARDADOS.length?1:0)+(Object.keys(APU).length?1:0)) + ' hojas');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// IMPORTAR EXCEL
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
function abrirImportarExcel(){ abrirModal('modal-importar'); }
function dragOver(e){ e.preventDefault(); document.getElementById('import-drop-zone').classList.add('drag-over'); }
function dragLeave(e){ document.getElementById('import-drop-zone').classList.remove('drag-over'); }
function dropImport(e){
  e.preventDefault(); dragLeave(e);
  const file=e.dataTransfer.files[0]; if(!file) return;
  leerArchivoImport(file);
}
function procesarImportExcel(e){ const file=e.target.files[0]; if(!file) return; leerArchivoImport(file); }
function leerArchivoImport(file){
  const r=new FileReader(); r.onload=ev=>{
    try{
      const wb=XLSX.read(ev.target.result,{type:'binary'});
      const ws=wb.Sheets[wb.SheetNames[0]];
      const data=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
      if(!data.length){ notif('Archivo vacÃ­o o invÃ¡lido','#E05555'); return; }
      // Detectar fila de encabezado (buscar fila con "descripciÃ³n" o "cÃ³digo")
      let headerRow=0;
      for(let i=0;i<Math.min(5,data.length);i++){
        const row=data[i].join(',').toLowerCase();
        if(row.includes('descripci') || row.includes('codigo') || row.includes('cÃ³digo')){ headerRow=i; break; }
      }
      const rows=data.slice(headerRow+1).filter(r=>r.some(c=>c!==''));
      _importData=rows.map(r=>({
        cap: r[0]||'01', cod: String(r[1]||''), desc: String(r[2]||''),
        u: r[3]||'un', mat: parseFloat(r[4])||0, mo: parseFloat(r[5])||0,
        eq: parseFloat(r[6])||0, sub: parseFloat(r[7])||0,
        ramo: 'civil'
      })).filter(r=>r.desc && r.cod);

      // Preview
      const preview=document.getElementById('import-preview');
      const info=document.getElementById('import-info');
      const tbl=document.getElementById('import-table');
      info.textContent=`âœ“ ${_importData.length} partidas detectadas en "${file.name}"`;
      let th='<thead><tr><th style="padding:5px 8px;background:var(--bg2);font-size:10px;color:var(--txt3)">CÃ³digo</th><th style="padding:5px 8px;background:var(--bg2);font-size:10px;color:var(--txt3)">DescripciÃ³n</th><th style="padding:5px 8px;background:var(--bg2);font-size:10px;color:var(--txt3)">Ud.</th><th style="padding:5px 8px;background:var(--bg2);font-size:10px;color:var(--txt3);text-align:right">P.Unit â‚²</th></tr></thead><tbody>';
      _importData.slice(0,10).forEach(r=>{ th+=`<tr><td style="padding:4px 8px;font-size:11px;font-family:monospace">${r.cod}</td><td style="padding:4px 8px;font-size:11px">${r.desc}</td><td style="padding:4px 8px;font-size:11px">${r.u}</td><td style="padding:4px 8px;font-size:11px;text-align:right">${fmtN(r.mat+r.mo+r.eq+r.sub)}</td></tr>`; });
      if(_importData.length>10) th+=`<tr><td colspan="4" style="padding:6px 8px;font-size:10px;color:var(--txt3);text-align:center">... y ${_importData.length-10} mÃ¡s</td></tr>`;
      th+='</tbody>';
      tbl.innerHTML=th; preview.style.display='block';
      document.getElementById('btn-confirmar-import').style.display='';
    }catch(e){ notif('Error al leer el archivo: '+e.message,'#E05555'); }
  }; r.readAsBinaryString(file);
}
function confirmarImport(){
  if(!_importData.length) return;
  let agregadas=0, existentes=0;
  _importData.forEach(r=>{
    const existe=DB.some(p=>p.cod===r.cod);
    if(!existe){
      // Intentar mapear el capÃ­tulo por nombre
      let capId='01';
      const capMatch=CAPS.find(c=>c.name.toLowerCase().includes((r.cap||'').toLowerCase().substring(0,5)));
      if(capMatch) capId=capMatch.id;
      else if(/^\d+$/.test(r.cap)) capId=String(parseInt(r.cap)).padStart(2,'0');
      DB.push({id:DB.length?Math.max(...DB.map(p=>p.id))+1:1, cap:capId, cod:r.cod, desc:r.desc, u:r.u, ramo:r.ramo, mat:r.mat, mo:r.mo, eq:r.eq, sub:r.sub});
      agregadas++;
    } else { existentes++; }
  });
  cerrarModal('modal-importar');
  marcarUnsaved(); renderBD(); renderDashboard();
  _importData=[];
  document.getElementById('import-preview').style.display='none';
  document.getElementById('btn-confirmar-import').style.display='none';
  notif(`âœ“ ${agregadas} partidas importadas${existentes?` (${existentes} ya existÃ­an, no se duplicaron)`:''}`);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// PRESUPUESTOS GUARDADOS
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
