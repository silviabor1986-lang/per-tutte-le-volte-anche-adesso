/* Fase 4: «♡ Tieni», «Le parole che tengo», cassetto delle citazioni.
   I testi arrivano da js/contenuti.js, js/oggetti_momenti.js e js/cassetto.js (generati dalle fonti definitive).
   Le frasi dell'interfaccia sono quelle approvate (BOZZE sezione D.6, D.7, D.13). Nessun testo editoriale è scritto qui. */
(function () {
  'use strict';
  var C = window.CONTENUTI;
  var K = window.CASSETTO;
  var F = window.FASE3;
  var U = window.Scatola.util;

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo !== undefined) e.textContent = testo;
    return e;
  }
  function riduciMovimento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  /* ---------- Salvataggio sul dispositivo (W2 §4): parole tenute e frasi già uscite dal cassetto ---------- */
  var KEY_T = 'ptlv.v1.tenute';
  var KEY_C = 'ptlv.v1.cassetto';
  var memT = [];
  var memC = [];

  function frasePer(id) {
    for (var i = 0; i < K.length; i++) if (K[i].id === id) return K[i];
    return null;
  }
  function momentoPer(slug) {
    for (var i = 0; i < F.momenti.length; i++) if (F.momenti[i].slug === slug) return F.momenti[i];
    return null;
  }
  function voceValida(v) {
    if (!v || typeof v.t !== 'string' || typeof v.id !== 'string') return false;
    if (v.t === 'lettera' || v.t === 'nascosto') return !!C.lettere[v.id];
    if (v.t === 'momento') return !!momentoPer(v.id);
    if (v.t === 'frase') return !!frasePer(v.id);
    return false;
  }
  function leggiTenute() {
    var out = [];
    function aggiungi(lista) {
      if (!Array.isArray(lista)) return;
      lista.forEach(function (v) {
        if (!voceValida(v)) return;
        for (var i = 0; i < out.length; i++) if (out[i].t === v.t && out[i].id === v.id) return;
        out.push({ t: v.t, id: v.id });
      });
    }
    try {
      var s = window.localStorage.getItem(KEY_T);
      if (s) { var o = JSON.parse(s); aggiungi(o && o.voci); }
    } catch (e) { out = []; }
    aggiungi(memT);
    return out;
  }
  function scriviTenute(voci) {
    memT = voci.slice();
    try { window.localStorage.setItem(KEY_T, JSON.stringify({ v: 1, voci: voci })); } catch (e) { /* non disponibile */ }
  }
  function eTenuta(t, id) {
    var l = leggiTenute();
    for (var i = 0; i < l.length; i++) if (l[i].t === t && l[i].id === id) return true;
    return false;
  }
  // true se adesso è salvata, false se è stata tolta
  function alterna(t, id) {
    var l = leggiTenute();
    for (var i = 0; i < l.length; i++) if (l[i].t === t && l[i].id === id) { l.splice(i, 1); scriviTenute(l); return false; }
    l.push({ t: t, id: id });
    scriviTenute(l);
    return true;
  }
  function togli(t, id) {
    var l = leggiTenute().filter(function (v) { return !(v.t === t && v.id === id); });
    scriviTenute(l);
  }

  /* ---------- Testi del pulsante ♡ (D.6): l'accordo segue il tipo di contenuto ---------- */
  var ETICHETTE = {
    lettera:  { tieni: 'Tieni questa lettera',  gia: 'Già salvata', salvato: 'Salvata in Le parole che tengo.',  tolto: 'Rimossa da Le parole che tengo.',  f: true },
    frase:    { tieni: 'Tieni questa frase',    gia: 'Già salvata', salvato: 'Salvata in Le parole che tengo.',  tolto: 'Rimossa da Le parole che tengo.',  f: true },
    nascosto: { tieni: 'Tieni questo messaggio', gia: 'Già salvato', salvato: 'Salvato in Le parole che tengo.', tolto: 'Rimosso da Le parole che tengo.', f: false },
    momento:  { tieni: 'Tieni questo testo',    gia: 'Già salvato', salvato: 'Salvato in Le parole che tengo.', tolto: 'Rimosso da Le parole che tengo.', f: false }
  };

  /* ---------- Pulsante «♡ Tieni» ---------- */
  function pulsante(t, id) {
    var E = ETICHETTE[t];
    var riga = el('div', 'tieni-riga');
    var b = el('button', 'pulsante tieni-bottone');
    b.type = 'button';
    var cuore = el('span', 'tieni-cuore');
    cuore.setAttribute('aria-hidden', 'true');
    var testo = el('span', 'tieni-testo');
    b.appendChild(cuore);
    b.appendChild(testo);
    var esito = el('p', 'tieni-esito');
    esito.setAttribute('role', 'status');
    var timer = null;

    function disegna(salvata) {
      b.classList.toggle('salvata', salvata);
      cuore.textContent = salvata ? '♥' : '♡';
      testo.textContent = ' ' + (salvata ? E.gia : E.tieni);
      b.setAttribute('aria-label', salvata ? E.gia + '. Tocca per rimuovere.' : 'Tieni in Le parole che tengo');
    }
    disegna(eTenuta(t, id));

    b.addEventListener('click', function () {
      var salvata = alterna(t, id);
      disegna(salvata);
      // feedback: il cuore cambia stato con una breve animazione (CSS), poi compare la conferma
      cuore.classList.remove('batte', 'sfuma');
      void cuore.offsetWidth;
      cuore.classList.add(salvata ? 'batte' : 'sfuma');
      esito.classList.remove('visibile');
      esito.textContent = salvata ? E.salvato : E.tolto;
      // D.11: avviso al primo salvataggio, solo se il salvataggio non è disponibile
      var avviso = (salvata && window.Fase5) ? window.Fase5.avvisoSalvataggio() : null;
      if (avviso) esito.textContent += ' ' + avviso;
      void esito.offsetWidth;
      esito.classList.add('visibile');
      clearTimeout(timer);
      timer = setTimeout(function () { esito.classList.remove('visibile'); }, 3500);
    });

    riga.appendChild(b);
    riga.appendChild(esito);
    return riga;
  }

  /* ---------- «Le parole che tengo» (primo ripiano della scatola) ---------- */
  function contenuto(v) {
    var L, m, f;
    if (v.t === 'lettera') {
      L = C.lettere[v.id];
      return { anteprima: L.dedica, righe: [L.dedica].concat(L.paragrafi), da: 'Dalla lettera «' + L.emozione + '»', cls: 'lettera' };
    }
    if (v.t === 'nascosto') {
      L = C.lettere[v.id];
      return { anteprima: L.nascosto, righe: [L.nascosto], da: 'Dal messaggio nascosto di «' + L.emozione + '»', cls: 'nascosto' };
    }
    if (v.t === 'momento') {
      m = momentoPer(v.id);
      return { anteprima: m.testo[0], righe: m.testo, da: 'Dal momento «' + m.nome + '»', cls: 'momento' };
    }
    f = frasePer(v.id);
    return { anteprima: f.frase, righe: [f.frase], da: f.originale ? '— Per tutte le volte, anche adesso' : 'Dal libro, p. ' + f.pagina, cls: 'frase' };
  }
  var contatore = 0;
  function creaVoce(v) {
    var d = contenuto(v);
    var li = el('li', 'parola parola-' + d.cls);
    var corpoId = 'parola-corpo-' + (++contatore);
    var testa = el('button', 'parola-testa');
    testa.type = 'button';
    testa.setAttribute('aria-expanded', 'false');
    testa.setAttribute('aria-controls', corpoId);
    testa.appendChild(el('span', 'parola-anteprima', d.anteprima));
    testa.appendChild(el('span', 'parola-da', d.da));
    var corpo = el('div', 'parola-corpo');
    corpo.id = corpoId;
    corpo.hidden = true;
    d.righe.forEach(function (r, i) {
      corpo.appendChild(el('p', (v.t === 'lettera' && i === 0) ? 'parola-dedica' : 'parola-par', r));
    });
    var t = el('button', 'pulsante parola-togli', 'Togli dalla scatola');
    t.type = 'button';
    corpo.appendChild(t);
    testa.addEventListener('click', function () {
      var aperto = testa.getAttribute('aria-expanded') === 'true';
      testa.setAttribute('aria-expanded', aperto ? 'false' : 'true');
      corpo.hidden = aperto;
    });
    li.appendChild(testa);
    li.appendChild(corpo);
    li._voce = v;
    return li;
  }

  var NOTA_VUOTO = 'Qui ritroverai le parole che decidi di tenere. Per tenerne una, tocca ♡ sotto una lettera, un messaggio, un testo dei momenti o una frase del cassetto.';
  function ripiano() {
    var s = el('section', 'ripiano-parole');
    s.setAttribute('aria-labelledby', 'titolo-parole');
    var h = el('h2', 'ripiano-titolo', 'Le parole che tengo');
    h.id = 'titolo-parole';
    h.tabIndex = -1;
    s.appendChild(h);
    var vuoto = el('p', 'ripiano-nota', NOTA_VUOTO);
    var ul = el('ul', 'parole-elenco');
    var esito = el('p', 'parole-esito');
    esito.setAttribute('role', 'status');
    // la più recente per prima
    leggiTenute().reverse().forEach(function (v) { ul.appendChild(creaVoce(v)); });
    function aggiornaVuoto() { var e = ul.children.length === 0; vuoto.hidden = !e; ul.hidden = e; }
    s.appendChild(vuoto);
    s.appendChild(ul);
    s.appendChild(esito);
    aggiornaVuoto();

    ul.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('.parola-togli') : null;
      if (!b) return;
      var li = b.closest('li');
      var v = li._voce;
      togli(v.t, v.id);
      esito.textContent = ETICHETTE[v.t].tolto;
      var prossimo = li.nextElementSibling || li.previousElementSibling;
      function via() {
        if (li.parentNode) li.parentNode.removeChild(li);
        aggiornaVuoto();
        var fuoco = prossimo ? prossimo.querySelector('.parola-testa') : h;
        try { fuoco.focus({ preventScroll: true }); } catch (e) { fuoco.focus(); }
      }
      if (riduciMovimento() === false) {
        li.classList.add('esce');
        setTimeout(via, 300);
      } else {
        li.classList.add('esce');
        setTimeout(via, 200);
      }
    });
    return s;
  }

  /* ---------- Cassetto (D.7): le 34 frasi ---------- */
  function leggiUsciti() {
    var u = [];
    function aggiungi(l) { if (Array.isArray(l)) l.forEach(function (id) { if (typeof id === 'string' && frasePer(id) && u.indexOf(id) < 0) u.push(id); }); }
    try {
      var s = window.localStorage.getItem(KEY_C);
      if (s) { var o = JSON.parse(s); aggiungi(o && o.usciti); }
    } catch (e) { u = []; }
    if (!u.length) aggiungi(memC);
    return u;
  }
  function scriviUsciti(u) {
    memC = u.slice();
    try { window.localStorage.setItem(KEY_C, JSON.stringify({ v: 1, usciti: u })); } catch (e) { /* non disponibile */ }
  }
  // Una frase che non è ancora uscita in questo giro; quando sono uscite tutte e 34 si ricomincia (senza ripetere subito l'ultima)
  function estrai() {
    var u = leggiUsciti();
    var libere = K.filter(function (f) { return u.indexOf(f.id) < 0; });
    if (!libere.length) {
      var ultima = u[u.length - 1];
      u = [];
      libere = K.filter(function (f) { return f.id !== ultima; });
    }
    var f = libere[Math.floor(Math.random() * libere.length)];
    u.push(f.id);
    scriviUsciti(u);
    return f;
  }

  function disegnaFrase(contenitore, f, azioneTieni) {
    contenitore.textContent = '';
    var q = el('blockquote', 'cassetto-frase');
    q.appendChild(el('p', null, f.frase));
    contenitore.appendChild(q);
    contenitore.appendChild(el('p', 'cassetto-fonte', f.originale ? '— Per tutte le volte, anche adesso' : '— dal libro, p. ' + f.pagina));
    contenitore.appendChild(el('p', 'cassetto-apri', 'Apri quando… ' + f.titolo));
  }

  function mostraCassetto(vista, anima) {
    var alto = U.svuota(vista);
    alto.appendChild(U.linkIndietro('/'));
    var c = el('div', 'cassetto-vista');
    var h = U.titolo('Cassetto della scrivania', 'solo-schermo');
    c.appendChild(h);
    if (anima) apri(c);

    var box = el('div', 'cassetto-box');
    var carta = el('div', 'cassetto-carta');
    var testo = el('div', 'cassetto-testo');
    testo.setAttribute('aria-live', 'polite');
    var tieniPosto = el('div', 'cassetto-tieni');
    carta.appendChild(testo);
    carta.appendChild(tieniPosto);
    var fronte = el('div', 'cassetto-fronte');
    fronte.setAttribute('aria-hidden', 'true');
    fronte.appendChild(el('span', 'cassetto-pomello'));
    box.appendChild(carta);
    box.appendChild(fronte);
    c.appendChild(box);

    function mostra(f) {
      disegnaFrase(testo, f);
      tieniPosto.textContent = '';
      tieniPosto.appendChild(pulsante('frase', f.id));
      if (window.Cartolina) tieniPosto.appendChild(window.Cartolina.pulsante('frase', f.id));
      testo.classList.remove('cambia');
      void testo.offsetWidth;
      testo.classList.add('cambia');
    }
    mostra(estrai());

    var azioni = el('div', 'cassetto-azioni');
    var altra = el('button', 'pulsante', 'Un\'altra frase');
    altra.type = 'button';
    altra.addEventListener('click', function () { mostra(estrai()); });
    var chiudi = el('a', 'pulsante', 'Chiudi il cassetto');
    chiudi.href = '#/';
    azioni.appendChild(altra);
    azioni.appendChild(chiudi);
    c.appendChild(azioni);
    c.addEventListener('keydown', function (e) { if (e.key === 'Escape') window.location.hash = '#/'; });
    vista.appendChild(c);
    return h;
  }

  // Apertura del cassetto (≈0,7 s): interrompibile con un tocco o un tasto
  function apri(c) {
    c.classList.add('apre');
    function off() {
      document.removeEventListener('pointerdown', salta, true);
      document.removeEventListener('keydown', salta, true);
    }
    function salta(e) { if (e.repeat) return; c.classList.add('salta'); off(); }
    document.addEventListener('pointerdown', salta, true);
    document.addEventListener('keydown', salta, true);
    setTimeout(off, 800);
  }

  window.Fase4 = { pulsante: pulsante, ripiano: ripiano, mostraCassetto: mostraCassetto, azzera: function () { memT = []; memC = []; } };
})();
