let _renderBDTimer = null;
let expandedPartidas = new Set();

const APU_TYPE_META = {
  M: { label: 'Material', short: 'MAT', color: 'var(--azul)' },
  L: { label: 'Mano de Obra', short: 'M.O.', color: 'var(--acento)' },
  E: { label: 'Equipo', short: 'EQ.', color: 'var(--amarillo)' },
  S: { label: 'Subcontrato', short: 'SUB', color: 'var(--naranja)' },
};

function partidaKeyFromCode(cod){
  return String(cod || '').replace(/\./g, '_');
}

function getPartidaApu(cod){
  return APU[partidaKeyFromCode(cod)] || [];
}

function formatCantidad(valor){
  return Number.isInteger(valor) ? String(valor) : Number(valor || 0).toFixed(3);
}

function getApuTotals(insumos){
  return {
    M: Math.round(insumos.filter(i=>i.tipo==='M').reduce((acc,i)=>acc+(i.qty*i.pu),0)),
    L: Math.round(insumos.filter(i=>i.tipo==='L').reduce((acc,i)=>acc+(i.qty*i.pu),0)),
    E: Math.round(insumos.filter(i=>i.tipo==='E').reduce((acc,i)=>acc+(i.qty*i.pu),0)),
    S: Math.round(insumos.filter(i=>i.tipo==='S').reduce((acc,i)=>acc+(i.qty*i.pu),0)),
  };
}

function expandirPartida(id, forceOpen){
  const key = String(id);
  const debeAbrir = typeof forceOpen === 'boolean' ? forceOpen : !expandedPartidas.has(key);
  if(debeAbrir) expandedPartidas.add(key);
  else expandedPartidas.delete(key);
  renderBD();
}

function renderBD(){
  clearTimeout(_renderBDTimer);
  _renderBDTimer = setTimeout(_renderBDNow, 60);
}

function limpiarBusquedaBD(){
  const input = document.getElementById('bd-search');
  if(input) input.value = '';
  renderBD();
}

function _renderBDNow(){
  document.getElementById('badge-count').textContent = `${DB.length} partidas`;
  const lista = filtrarDB();
  const q = (document.getElementById('bd-search')?.value || '').toLowerCase();
  const clearBtn = document.getElementById('bd-clear-btn');
  const status = document.getElementById('bd-status-text');
  let html = '';
  let prevCap = null;

  if(clearBtn) clearBtn.style.display = q ? 'inline-flex' : 'none';
  if(status){
    status.textContent = q
      ? `Mostrando ${lista.length} de ${DB.length} partidas para "${q}". Limpiá el filtro para ver toda la base.`
      : 'Cada partida concentra su resumen económico y su desglose APU en el mismo lugar. Expandí una fila para ver, editar y recalcular insumos sin salir de la base.';
  }

  lista.forEach(p=>{
    const cap = capOf(p.cap);
    const apu = getPartidaApu(p.cod);
    const enPres = PRESUPUESTO.some(x=>x.pid===p.id);
    const qtyPres = enPres ? PRESUPUESTO.find(x=>x.pid===p.id).qty : 0;
    const estaExpandida = expandedPartidas.has(String(p.id));
    const rowBg = enPres ? 'background:rgba(29,186,123,.04);border-left:2px solid var(--acento)' : '';
    const ramoBadge = p.ramo && p.ramo !== 'todos'
      ? `<span class="chip" style="background:${RAMO_COLORS[p.ramo] || '#888'}22;color:${RAMO_COLORS[p.ramo] || '#888'}">${p.ramo}</span>`
      : '<span class="chip chip-muted">general</span>';
    const presBadge = enPres
      ? `<span class="chip chip-success">En presupuesto Â· ${qtyPres % 1 === 0 ? qtyPres : qtyPres.toFixed(2)}</span>`
      : '';

    if(p.cap !== prevCap){
      prevCap = p.cap;
      html += `<tr class="cap-row" style="border-left-color:${cap.color}"><td colspan="11" style="background:${cap.color}CC">&nbsp;${p.cap} â€” ${cap.name}</td></tr>`;
    }

    html += `
      <tr class="db-summary-row" style="${rowBg}" data-pid="${p.id}">
        <td>
          <button class="accordion-toggle ${estaExpandida ? 'is-open' : ''}" type="button" onclick="expandirPartida(${p.id})" aria-expanded="${estaExpandida}" aria-controls="apu-panel-${p.id}" title="${estaExpandida ? 'Ocultar' : 'Mostrar'} desglose APU">
            <span>${estaExpandida ? 'âˆ’' : '+'}</span>
          </button>
        </td>
        <td><code class="cell-code">${p.cod}</code></td>
        <td>
          <div class="cell-description">${p.desc}</div>
          <div class="cell-meta">${presBadge}<span class="chip chip-outline">${apu.length} insumo${apu.length===1?'':'s'}</span></div>
        </td>
        <td class="cell-unit">${p.u}</td>
        <td>${ramoBadge}</td>
        <td class="num" style="color:var(--azul)">${p.mat>0?fmtN(p.mat):'â€”'}</td>
        <td class="num" style="color:var(--acento)">${p.mo>0?fmtN(p.mo):'â€”'}</td>
        <td class="num" style="color:var(--amarillo)">${p.eq>0?fmtN(p.eq):'â€”'}</td>
        <td class="num" style="color:var(--naranja)">${p.sub>0?fmtN(p.sub):'â€”'}</td>
        <td class="num total-cell">${fmtN(pu(p))}</td>
        <td>
          <div class="table-actions">
            <button class="btn btn-secondary btn-xs" onclick="editarPartida(${p.id})">Editar</button>
            <button class="btn btn-xs" onclick="addToPres(${p.id})" style="${enPres?'background:var(--acento4);color:var(--acento);border:1px solid var(--acento2)':'background:var(--naranjabg);color:var(--naranja);border:1px solid rgba(232,144,32,.2)'}">${enPres?'+1':'Agregar'}</button>
            <button class="btn btn-danger btn-xs" onclick="eliminarPartida(${p.id})">Eliminar</button>
          </div>
        </td>
      </tr>
    `;

    if(estaExpandida){
      html += renderDetallePartidaRow(p, cap, apu);
    }
  });

  if(!lista.length){
    html = `<tr><td colspan="11"><div class="empty-state" style="padding:48px 0"><div class="icon">+</div><h3>Sin partidas</h3><p>CambiÃ¡ el filtro actual o agregÃ¡ una nueva partida.</p></div></td></tr>`;
  }

  document.getElementById('bd-tbody').innerHTML = html;
}

function renderDetallePartidaRow(partida, cap, insumos){
  const totals = insumos.length
    ? getApuTotals(insumos)
    : { M: partida.mat || 0, L: partida.mo || 0, E: partida.eq || 0, S: partida.sub || 0 };
  const total = Math.round(totals.M + totals.L + totals.E + totals.S);
  const resumenTecnico = `
    <div class="apu-inline-summary">
      <div>
        <p class="apu-inline-label">CapÃ­tulo</p>
        <strong>${cap.id} â€” ${cap.name}</strong>
      </div>
      <div>
        <p class="apu-inline-label">Unidad</p>
        <strong>${partida.u}</strong>
      </div>
      <div>
        <p class="apu-inline-label">Ramo</p>
        <strong>${partida.ramo || 'todos'}</strong>
      </div>
      <div>
        <p class="apu-inline-label">Precio unitario</p>
        <strong>${fmt(total)}</strong>
      </div>
    </div>
  `;

  const kpis = Object.entries(APU_TYPE_META).map(([tipo, meta])=>{
    return `<div class="apu-kpi">
      <span class="bdg bdg-${tipo}">${meta.short}</span>
      <div>
        <p>${meta.label}</p>
        <strong style="color:${meta.color}">${fmt(totals[tipo])}</strong>
      </div>
    </div>`;
  }).join('');

  const tabla = insumos.length ? renderTablaApuInline(partida, insumos, totals) : `
    <div class="apu-empty">
      <div>
        <h3>Sin insumos cargados</h3>
        <p>AgregÃ¡ materiales, mano de obra, equipo o subcontrato para construir el APU de esta partida.</p>
      </div>
      <button class="btn btn-primary" onclick="agregarInsumoA('${partida.cod}')">+ Agregar insumo</button>
    </div>
  `;

  return `
    <tr class="db-detail-row">
      <td colspan="11">
        <article class="apu-inline-card" id="apu-panel-${partida.id}">
          <div class="apu-inline-head">
            <div>
              <p class="apu-inline-eyebrow">APU integrado</p>
              <h3>${partida.cod} â€” ${partida.desc}</h3>
              <p class="apu-inline-sub">El desglose tÃ©cnico ahora vive dentro de la Base de Datos para mantener contexto, trazabilidad y ediciÃ³n rÃ¡pida.</p>
            </div>
            <div class="apu-inline-head-actions">
              <button class="btn btn-secondary" onclick="editarPartida(${partida.id})">Editar partida</button>
              <button class="btn btn-primary" onclick="agregarInsumoA('${partida.cod}')">+ Agregar insumo</button>
            </div>
          </div>
          ${resumenTecnico}
          <div class="apu-kpis">${kpis}</div>
          ${tabla}
        </article>
      </td>
    </tr>
  `;
}

function renderTablaApuInline(partida, insumos, totals){
  const total = Math.max(1, totals.M + totals.L + totals.E + totals.S);
  const rows = insumos.map((insumo, idx)=>{
    const subtotal = Math.round(insumo.qty * insumo.pu);
    const pct = ((subtotal / total) * 100).toFixed(1);
    const meta = APU_TYPE_META[insumo.tipo] || APU_TYPE_META.M;
    return `
      <tr class="apu-inline-row" onclick="editarInsumo('${partida.cod}',${idx})">
        <td>${idx + 1}</td>
        <td>${insumo.desc}</td>
        <td class="cell-unit">${insumo.u}</td>
        <td><span class="bdg bdg-${insumo.tipo}">${meta.short}</span></td>
        <td class="num">${formatCantidad(insumo.qty)}</td>
        <td class="num">${fmtN(insumo.pu)}</td>
        <td class="num" style="color:${meta.color}">${fmtN(subtotal)}</td>
        <td class="num">${pct}%</td>
        <td><button class="btn btn-danger btn-xs" onclick="event.stopPropagation(); eliminarInsumo('${partida.cod}',${idx})">Quitar</button></td>
      </tr>
    `;
  }).join('');

  return `
    <div class="tbl-wrap apu-inline-table-wrap">
      <table class="apu-inline-table">
        <thead>
          <tr>
            <th>#</th>
            <th>DescripciÃ³n</th>
            <th>Unidad</th>
            <th>Tipo</th>
            <th class="num">Cantidad</th>
            <th class="num">P. unitario</th>
            <th class="num">Subtotal</th>
            <th class="num">% APU</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
        <tfoot>
          <tr>
            <td colspan="5">
              <div class="apu-foot-pills">
                <span class="cost-pill" style="color:var(--azul)">Materiales: ${fmt(totals.M)}</span>
                <span class="cost-pill" style="color:var(--acento)">Mano de obra: ${fmt(totals.L)}</span>
                <span class="cost-pill" style="color:var(--amarillo)">Equipo: ${fmt(totals.E)}</span>
                <span class="cost-pill" style="color:var(--naranja)">Subcontrato: ${fmt(totals.S)}</span>
              </div>
            </td>
            <td colspan="3" class="num apu-total-label">Precio unitario final [${partida.u}]</td>
            <td class="num apu-total-value">${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  `;
}

function abrirModalPartida(id){
  editPid = id || null;
  document.getElementById('f-cap').innerHTML = CAPS.map(c=>`<option value="${c.id}">${c.id} â€” ${c.name}</option>`).join('');

  if(id){
    const p = DB.find(x=>x.id===id);
    document.getElementById('mp-title').textContent = `Editar Partida â€” ${p.cod}`;
    document.getElementById('f-cap').value = p.cap;
    document.getElementById('f-cod').value = p.cod;
    document.getElementById('f-ramo').value = p.ramo || 'todos';
    document.getElementById('f-u').value = p.u;
    document.getElementById('f-desc').value = p.desc;
    document.getElementById('f-mat').value = p.mat;
    document.getElementById('f-mo').value = p.mo;
    document.getElementById('f-eq').value = p.eq;
    document.getElementById('f-sub').value = p.sub;
  } else {
    document.getElementById('mp-title').textContent = 'Nueva Partida';
    document.getElementById('f-cod').value = '';
    document.getElementById('f-desc').value = '';
    ['f-mat','f-mo','f-eq','f-sub'].forEach(idCampo=>document.getElementById(idCampo).value = 0);
    document.getElementById('f-cap').value = '01';
    document.getElementById('f-ramo').value = ramoActivo === 'todos' ? 'civil' : ramoActivo;
    autoCod();
  }

  updPU();
  abrirModal('modal-partida');
}

function editarPartida(id){
  abrirModalPartida(id);
}

function autoCod(){
  if(editPid) return;
  const cap = document.getElementById('f-cap').value;
  const correlativos = DB
    .filter(p=>p.cap===cap)
    .map(p=>parseInt((String(p.cod).split('.')[1] || '0'), 10))
    .filter(Number.isFinite);
  const siguiente = correlativos.length ? Math.max(...correlativos) + 1 : 1;
  document.getElementById('f-cod').value = `${cap}.${String(siguiente).padStart(2,'0')}`;
}

function updPU(){
  const tot = ['f-mat','f-mo','f-eq','f-sub'].reduce((acc,idCampo)=>acc + (parseFloat(document.getElementById(idCampo).value) || 0), 0);
  document.getElementById('f-pu-show').textContent = `â‚² ${Math.round(tot).toLocaleString('es-PY')}`;
}

function guardarPartida(){
  const cod = document.getElementById('f-cod').value.trim();
  const desc = document.getElementById('f-desc').value.trim();
  if(!cod || !desc){
    notif('CompletÃ¡ cÃ³digo y descripciÃ³n', '#E05555');
    return;
  }

  const codigoDuplicado = DB.some(p=>p.cod===cod && p.id!==editPid);
  if(codigoDuplicado){
    notif('Ya existe una partida con ese cÃ³digo', '#E05555');
    return;
  }

  const p = {
    id: editPid || nextNumericId(DB),
    cap: document.getElementById('f-cap').value,
    cod,
    desc,
    u: document.getElementById('f-u').value,
    ramo: document.getElementById('f-ramo').value,
    mat: toNonNegativeNumber(document.getElementById('f-mat').value),
    mo: toNonNegativeNumber(document.getElementById('f-mo').value),
    eq: toNonNegativeNumber(document.getElementById('f-eq').value),
    sub: toNonNegativeNumber(document.getElementById('f-sub').value),
  };

  if(editPid){
    const idx = DB.findIndex(x=>x.id===editPid);
    const anterior = DB[idx];
    pushHistorial('editPartida', { partida: { ...anterior } });
    DB[idx] = p;

    if(anterior.cod !== cod){
      const oldKey = partidaKeyFromCode(anterior.cod);
      const newKey = partidaKeyFromCode(cod);
      if(APU[oldKey]){
        APU[newKey] = [...(APU[newKey] || []), ...APU[oldKey]];
        delete APU[oldKey];
      }
    }
  } else {
    DB.push(p);
  }

  cerrarModal('modal-partida');
  marcarUnsaved();
  renderBD();
  renderDashboard();
  notif(editPid ? 'Partida actualizada' : 'Partida agregada');
}

function eliminarPartida(id){
  const p = DB.find(x=>x.id===id);
  const ok = prompt(`Para eliminar escribÃ­ el cÃ³digo exacto:\n\n"${p.cod} â€” ${p.desc}"\n\nCÃ³digo:`);
  if(ok===null) return;
  if(ok.trim()!==p.cod){
    notif('CÃ³digo incorrecto â€” no se eliminÃ³', '#E05555');
    return;
  }
  const idx = DB.findIndex(x=>x.id===id);
  const presItems = PRESUPUESTO.filter(x=>x.pid===id);
  pushHistorial('elimPartida', {
    idx,
    partida:{...p},
    apu:getPartidaApu(p.cod).length ? [...getPartidaApu(p.cod)] : null,
    presItems:[...presItems],
  });
  DB = DB.filter(x=>x.id!==id);
  PRESUPUESTO = PRESUPUESTO.filter(x=>x.pid!==id);
  expandedPartidas.delete(String(id));
  delete APU[partidaKeyFromCode(p.cod)];
  marcarUnsaved();
  renderBD();
  renderPres();
  renderDashboard();
  notif('Eliminada â€” Ctrl+Z para deshacer', '#E05555');
}

function renderAPU(){
  renderBD();
}

function abrirModalInsumo(){
  editInsIdx = null;
  editInsCod = null;
  _openIM();
}

function agregarInsumoA(cod){
  editInsIdx = null;
  editInsCod = cod;
  _openIM(cod);
}

function editarInsumo(cod, idx){
  editInsCod = cod;
  editInsIdx = idx;
  const ins = getPartidaApu(cod)[idx];
  _openIM(cod);
  document.getElementById('ai-desc').value = ins.desc;
  document.getElementById('ai-u').value = ins.u;
  document.getElementById('ai-tipo').value = ins.tipo;
  document.getElementById('ai-qty').value = ins.qty;
  document.getElementById('ai-pu').value = ins.pu;
  document.getElementById('mi-title').textContent = 'Editar Insumo';
}

function _openIM(cod){
  document.getElementById('ai-partida').innerHTML = DB.map(p=>`<option value="${p.cod}" ${p.cod === (cod || '') ? 'selected' : ''}>${p.cod} â€” ${p.desc}</option>`).join('');
  document.getElementById('ai-partida').disabled = editInsIdx != null;
  document.getElementById('mi-title').textContent = 'Agregar Insumo';
  if(editInsIdx == null){
    document.getElementById('ai-desc').value = '';
    document.getElementById('ai-u').value = 'un';
    document.getElementById('ai-tipo').value = 'M';
    document.getElementById('ai-qty').value = 1;
    document.getElementById('ai-pu').value = 0;
  }
  abrirModal('modal-insumo');
}

function guardarInsumo(){
  const cod = document.getElementById('ai-partida').value;
  const desc = document.getElementById('ai-desc').value.trim();
  const qty = parseFloat(document.getElementById('ai-qty').value);
  const puInsumo = parseFloat(document.getElementById('ai-pu').value);

  if(!desc){
    notif('IngresÃ¡ la descripciÃ³n del insumo', '#E05555');
    return;
  }
  if(!(qty > 0)){
    notif('La cantidad del insumo debe ser mayor a cero', '#E05555');
    return;
  }
  if(puInsumo < 0){
    notif('El precio unitario del insumo no puede ser negativo', '#E05555');
    return;
  }

  const insumo = {
    desc,
    u: document.getElementById('ai-u').value,
    tipo: document.getElementById('ai-tipo').value,
    qty,
    pu: toNonNegativeNumber(puInsumo),
  };

  const codKey = partidaKeyFromCode(cod);
  if(!APU[codKey]) APU[codKey] = [];
  const prevIns = [...APU[codKey]];

  if(editInsIdx != null){
    pushHistorial('editInsumo', { cod: codKey, insumosPrev: prevIns });
    APU[codKey][editInsIdx] = insumo;
  } else {
    pushHistorial('agregarInsumo', { cod: codKey, insumosPrev: prevIns });
    APU[codKey].push(insumo);
  }

  recalcDesdeAPU(cod);
  const partida = DB.find(p=>p.cod===cod);
  if(partida) expandedPartidas.add(String(partida.id));
  cerrarModal('modal-insumo');
  marcarUnsaved();
  renderBD();
  notif('Insumo guardado');
}

function eliminarInsumo(cod, idx){
  const codKey = partidaKeyFromCode(cod);
  pushHistorial('elimInsumo', { cod: codKey, idx, insumo: { ...APU[codKey][idx] } });
  APU[codKey].splice(idx, 1);
  recalcDesdeAPU(cod);
  marcarUnsaved();
  renderBD();
  notif('Eliminado â€” Ctrl+Z para deshacer', '#E89020');
}

function recalcDesdeAPU(cod){
  const ins = getPartidaApu(cod);
  const p = DB.find(x=>x.cod===cod);
  if(!p) return;
  p.mat = Math.round(ins.filter(i=>i.tipo==='M').reduce((acc,i)=>acc+(i.qty*i.pu),0));
  p.mo = Math.round(ins.filter(i=>i.tipo==='L').reduce((acc,i)=>acc+(i.qty*i.pu),0));
  p.eq = Math.round(ins.filter(i=>i.tipo==='E').reduce((acc,i)=>acc+(i.qty*i.pu),0));
  p.sub = Math.round(ins.filter(i=>i.tipo==='S').reduce((acc,i)=>acc+(i.qty*i.pu),0));
}

