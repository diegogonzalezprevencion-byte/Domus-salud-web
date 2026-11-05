// La portada NO genera eventos de analítica. Solo marca intención temporal interna.
// El marcador persistente se crea únicamente al iniciar sesión correctamente.
(() => {
  const intentKey='domus_internal_intent_v1';
  document.querySelectorAll('[data-access]').forEach(link=>link.addEventListener('click',()=>{
    try {
      if (link.dataset.access==='paciente') sessionStorage.removeItem(intentKey);
      else sessionStorage.setItem(intentKey,link.dataset.access);
    } catch (_) { /* Almacenamiento privado deshabilitado. La ruta sigue indicando el perfil. */ }
  }));
})();
