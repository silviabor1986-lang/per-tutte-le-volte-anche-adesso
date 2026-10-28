/* Aspetto dell'app (giorno / notte / come il telefono).
   Precedenza (W2 §6): 1) scelta manuale salvata; 2) tema del telefono;
   3) se il telefono non lo indica: notte dalle 20:00 alle 6:00.
   Nessun dato lascia il dispositivo. */
(function () {
  'use strict';
  var CHIAVE = 'ptlvm_aspetto';
  var radice = document.documentElement;
  var scuro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var chiaro = window.matchMedia ? window.matchMedia('(prefers-color-scheme: light)') : null;

  function leggi() {
    try {
      var v = window.localStorage.getItem(CHIAVE);
      if (v === 'giorno' || v === 'notte' || v === 'sistema') return v;
    } catch (e) { /* archivio non disponibile: si usa «Come il telefono» */ }
    return 'sistema';
  }

  function salva(v) {
    try { window.localStorage.setItem(CHIAVE, v); } catch (e) { /* la scelta vale solo per questa visita */ }
  }

  function dalTelefono() {
    if (scuro && scuro.matches) return 'notte';
    if (chiaro && chiaro.matches) return 'giorno';
    // Il telefono non indica nulla: regola oraria
    var ora = new Date().getHours();
    return (ora >= 20 || ora < 6) ? 'notte' : 'giorno';
  }

  function tema(aspetto) {
    return aspetto === 'sistema' ? dalTelefono() : aspetto;
  }

  function applica(aspetto) {
    var t = tema(aspetto);
    radice.setAttribute('data-aspetto', aspetto);
    radice.setAttribute('data-tema', t);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t === 'notte' ? '#1f1c3d' : '#e9d6c8');
    var bottoni = document.querySelectorAll('[data-aspetto]');
    for (var i = 0; i < bottoni.length; i++) {
      if (bottoni[i].tagName === 'BUTTON') {
        bottoni[i].setAttribute('aria-pressed', bottoni[i].getAttribute('data-aspetto') === aspetto ? 'true' : 'false');
      }
    }
  }

  function imposta(aspetto) {
    salva(aspetto);
    applica(aspetto);
  }

  function seguiTelefono() {
    if (radice.getAttribute('data-aspetto') === 'sistema') applica('sistema');
  }
  [scuro, chiaro].forEach(function (m) {
    if (!m) return;
    if (m.addEventListener) m.addEventListener('change', seguiTelefono);
    else if (m.addListener) m.addListener(seguiTelefono);
  });

  applica(leggi());
  window.Aspetto = { imposta: imposta, ripristina: function () { applica(radice.getAttribute('data-aspetto')); } };
})();
