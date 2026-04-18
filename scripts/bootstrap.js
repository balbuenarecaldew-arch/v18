document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
    if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    e.preventDefault(); deshacerUltima();
  }
  if((e.ctrlKey||e.metaKey)&&e.key==='s'){
    e.preventDefault(); guardarFirebase();
  }
  if(e.key==='Escape'){
    document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open'));
    ocultarResultadosGlobal();
  }
});
// Click fuera de modal cierra
document.querySelectorAll('.modal-bg').forEach(bg=>bg.addEventListener('click',e=>{if(e.target===bg)bg.classList.remove('open')}));
// Alerta al salir sin guardar
window.addEventListener('beforeunload',e=>{if(hayUnsaved){e.preventDefault();e.returnValue=''}});

// Click afuera del buscador global
document.addEventListener('click',e=>{
  if(!document.querySelector('.global-search-wrap')?.contains(e.target)) ocultarResultadosGlobal();
});
