/* Fase 3: momenti (S1b), scoperta degli oggetti, Scatola dei ricordi (S3).
   Testi e associazioni arrivano da js/oggetti_momenti.js (generato dalle fonti definitive).
   Le frasi dell'interfaccia sono quelle approvate (BOZZE sezione D.3, D.5, D.6, D.13). */
(function () {
  'use strict';
  var F = window.FASE3;
  var ctx = { buste: [], creaBusta: null };

  /* ---------- Salvataggio sul dispositivo (W2 §4): solo gli oggetti trovati, chiave versionata ---------- */
  var KEY = 'ptlv.v1.oggetti';
  var memoria = [];            // se il salvataggio non è disponibile l'app funziona lo stesso, per questa visita
  function valido(t) {
    var out = [];
    if (Array.isArray(t)) t.forEach(function (n) { if (typeof n === 'number' && n >= 1 && n <= 16 && n % 1 === 0 && out.indexOf(n) < 0) out.push(n); });
    return out;
  }
  function leggi() {
    var salvati = [];
    try {
      var s = window.localStorage.getItem(KEY);
      if (s) { var o = JSON.parse(s); salvati = valido(o && o.trovati); }
    } catch (e) { salvati = []; }
    memoria.forEach(function (n) { if (salvati.indexOf(n) < 0) salvati.push(n); });
    return salvati;
  }
  function scrivi(t) {
    memoria = t.slice();
    try { window.localStorage.setItem(KEY, JSON.stringify({ v: 1, trovati: t })); } catch (e) { /* non disponibile */ }
  }
  // true se l'oggetto è stato trovato proprio adesso (prima scoperta), false se già trovato
  function trova(n) {
    var t = leggi();
    if (t.indexOf(n) >= 0) return false;
    t.push(n);
    scrivi(t);
    return true;
  }

  /* ---------- Utilità ---------- */
  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo !== undefined) e.textContent = testo;
    return e;
  }
  function riduciMovimento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function oggetto(n) { return F.oggetti[n - 1]; }
  function oggettoPer(tipo, ref) {
    for (var i = 0; i < F.oggetti.length; i++) if (F.oggetti[i].tipo === tipo && F.oggetti[i].ref === ref) return F.oggetti[i];
    return null;
  }
  function nomeBusta(slug) {
    for (var i = 0; i < ctx.buste.length; i++) if (ctx.buste[i].slug === slug) return ctx.buste[i].nome;
    return slug;
  }
  function momentoPer(slug) {
    for (var i = 0; i < F.momenti.length; i++) if (F.momenti[i].slug === slug) return F.momenti[i];
    return null;
  }
  function cornice(src) {
    var c = el('div', 'oggetto-cornice');
    var img = document.createElement('img');
    img.src = src;
    img.alt = '';
    img.decoding = 'async';
    c.appendChild(img);
    return c;
  }
  function linkIndietro(ripiego) {
    var a = el('a', 'indietro', '← Indietro');
    a.href = '#' + ripiego;
    a.setAttribute('data-indietro', ripiego);
    a.setAttribute('aria-label', 'Torna alla schermata precedente');
    return a;
  }
  function svuota(vista) {
    vista.textContent = '';
    var alto = el('div', 'lettera-alto');
    vista.appendChild(alto);
    return alto;
  }
  function titolo(testo, cls) {
    var h = el('h1', cls, testo);
    h.id = 'titolo-vista';
    h.tabIndex = -1;
    return h;
  }
  var osservatore = null;
  function alloScorrimento(e) {
    // l'animazione di scoperta parte quando il blocco entra nello schermo
    if (!('IntersectionObserver' in window)) { e.classList.remove('attesa'); return; }
    if (!osservatore) {
      osservatore = new IntersectionObserver(function (voci) {
        voci.forEach(function (v) { if (v.isIntersecting) { v.target.classList.remove('attesa'); osservatore.unobserve(v.target); } });
      }, { threshold: 0.35 });
    }
    osservatore.observe(e);
  }

  // «Continua»: la cornice con l'oggetto si rimpicciolisce, scende e sfuma (≈1 s; con «riduci movimento» solo dissolvenza breve).
  // Un secondo tocco o un tasto la interrompe; poi la scheda sparisce e il focus passa al blocco successivo.
  function riponi(s) {
    if (s.classList.contains('esce')) return;
    s.classList.remove('attesa');
    s.classList.add('esce');
    var finito = false, timer = null;
    function fine() {
      if (finito) return;
      finito = true;
      clearTimeout(timer);
      document.removeEventListener('pointerdown', salta, true);
      document.removeEventListener('keydown', salta, true);
      var prossimo = s.nextElementSibling;
      if (s.parentNode) s.parentNode.removeChild(s);
      if (prossimo) { prossimo.setAttribute('tabindex', '-1'); try { prossimo.focus({ preventScroll: true }); } catch (e) { prossimo.focus(); } }
    }
    function salta(e) { if (!e.repeat) fine(); }
    timer = setTimeout(fine, riduciMovimento() ? 330 : 1000);
    document.addEventListener('pointerdown', salta, true);
    document.addEventListener('keydown', salta, true);
  }

  /* ---------- Scoperta di un oggetto (D.5) ---------- */
  // Restituisce l'elemento da mostrare nella pagina della busta o del momento.
  function blocco(tipo, ref) {
    var o = oggettoPer(tipo, ref);
    if (!o) return null;
    var primoInAssoluto = leggi().length === 0;
    if (!trova(o.n)) {
      return el('p', 'scoperta-gia', tipo === 'busta' ? "L'oggetto di questa busta è nella tua scatola." : "L'oggetto di questo momento è nella tua scatola.");
    }
    var s = el('section', 'scoperta attesa');
    var t = el('p', 'scoperta-titolo');
    t.id = 'scoperta-titolo';
    t.appendChild(document.createTextNode('Hai trovato un oggetto: '));
    t.appendChild(el('em', null, o.nome));
    s.setAttribute('aria-labelledby', 'scoperta-titolo');
    s.appendChild(cornice('img/oggetti/' + o.file + '_512.webp'));
    s.appendChild(t);
    s.appendChild(el('p', 'scoperta-frase', o.frase));
    s.appendChild(el('p', 'scoperta-nota', 'È nella tua scatola dei ricordi.'));
    if (primoInAssoluto) s.appendChild(el('p', 'scoperta-nota', 'Puoi ritrovarlo quando vuoi nella Scatola dei ricordi, dalla scrivania.'));
    var b = el('button', 'pulsante scoperta-continua', 'Continua');
    b.type = 'button';
    b.addEventListener('click', function () { riponi(s); });
    s.appendChild(b);
    alloScorrimento(s);
    return s;
  }

  /* ---------- S1b · «In che momento sei?» ---------- */
  function mostraMomenti(vista) {
    var alto = svuota(vista);
    alto.appendChild(linkIndietro('/'));
    var p = el('div', 'pannello');
    p.appendChild(titolo('In che momento sei?'));
    p.appendChild(el('p', null, 'Scegli un momento: troverai un breve racconto, un oggetto e le buste collegate.'));
    var ul = el('ul', 'lista-momenti');
    F.momenti.forEach(function (m) {
      var li = el('li');
      var a = el('a', 'pulsante momento-voce', m.nome);
      a.href = '#/momento/' + m.slug;
      li.appendChild(a);
      ul.appendChild(li);
    });
    p.appendChild(ul);
    vista.appendChild(p);
  }

  /* ---------- Schermata del momento ---------- */
  function mostraMomento(vista, m) {
    var alto = svuota(vista);
    alto.appendChild(linkIndietro('/momenti'));
    var art = el('article', 'lettera');
    art.appendChild(titolo(m.nome, 'momento-titolo'));
    m.testo.forEach(function (t) { art.appendChild(el('p', 'lettera-par', t)); });
    if (window.Fase4) art.appendChild(window.Fase4.pulsante('momento', m.slug));
    vista.appendChild(art);

    var sc = blocco('momento', m.slug);
    if (sc) vista.appendChild(sc);

    var sez = el('section', 'momento-buste');
    sez.setAttribute('aria-labelledby', 'titolo-buste-momento');
    var h = el('h2', null, 'Le buste di questo momento');
    h.id = 'titolo-buste-momento';
    sez.appendChild(h);
    var ul = el('ul', 'griglia-buste');
    m.buste.forEach(function (slug) {
      var b = null;
      ctx.buste.forEach(function (x) { if (x.slug === slug) b = x; });
      var a = ctx.creaBusta(b);
      a.className = 'busta-mini';
      a.href = '#/momento/' + m.slug + '/busta/' + slug;
      var li = el('li');
      li.appendChild(a);
      ul.appendChild(li);
    });
    sez.appendChild(ul);
    vista.appendChild(sez);
  }

  /* ---------- S3 · La scatola dei ricordi ---------- */
  function indicazione(o) { return o.tipo === 'busta' ? 'Si trova tra le buste.' : 'Si trova nel percorso per momento.'; }
  function provenienza(o) {
    if (o.tipo === 'busta') return 'Trovato nella busta «' + nomeBusta(o.ref) + '»';
    return 'Trovato nel momento «' + momentoPer(o.ref).nome + '»';
  }
  // Apertura della scatola (≈0,6 s): interrompibile con un tocco o un tasto
  function apri(p) {
    p.classList.add('apre');
    function off() {
      document.removeEventListener('pointerdown', salta, true);
      document.removeEventListener('keydown', salta, true);
    }
    function salta(e) { if (e.repeat) return; p.classList.add('salta'); off(); }
    document.addEventListener('pointerdown', salta, true);
    document.addEventListener('keydown', salta, true);
    setTimeout(off, 700);
  }
  function mostraScatola(vista, anima) {
    var alto = svuota(vista);
    alto.appendChild(linkIndietro('/'));
    var p = el('div', 'pannello');
    if (anima) apri(p);
    p.appendChild(titolo('La scatola dei ricordi'));
    if (window.Fase4) p.appendChild(window.Fase4.ripiano());
    var h = el('h2', 'ripiano-titolo', 'Gli oggetti delle volte');
    p.appendChild(h);
    p.appendChild(el('p', 'ripiano-nota', 'Ogni oggetto si trova aprendo una busta o un momento.'));
    var trovati = leggi();
    var ul = el('ul', 'griglia-oggetti');
    F.oggetti.forEach(function (o) {
      var li = el('li');
      if (trovati.indexOf(o.n) >= 0) {
        var a = el('a', 'oggetto-tile');
        a.href = '#/scatola/oggetto/' + o.n;
        a.setAttribute('aria-label', o.nome + '. ' + o.frase);
        a.appendChild(cornice('img/oggetti/' + o.file + '_256.webp'));
        var nome = el('span', 'oggetto-nome', o.nome);
        nome.setAttribute('aria-hidden', 'true');
        a.appendChild(nome);
        li.appendChild(a);
      } else {
        var d = el('div', 'oggetto-tile sagoma');
        d.setAttribute('role', 'img');
        d.setAttribute('aria-label', 'Oggetto non ancora trovato. ' + indicazione(o));
        d.appendChild(cornice('img/sagome/' + o.file + '_sagoma_256.webp'));
        d.appendChild(el('span', 'oggetto-nome', indicazione(o)));
        li.appendChild(d);
      }
      ul.appendChild(li);
    });
    p.appendChild(ul);
    vista.appendChild(p);
  }

  // Scheda di un oggetto trovato; restituisce false se l'oggetto non esiste o non è ancora stato trovato
  function mostraOggetto(vista, n) {
    var o = (n >= 1 && n <= 16) ? oggetto(n) : null;
    if (!o || leggi().indexOf(o.n) < 0) return false;
    var alto = svuota(vista);
    alto.appendChild(linkIndietro('/scatola'));
    var p = el('div', 'pannello scheda-oggetto');
    p.appendChild(cornice('img/oggetti/' + o.file + '_512.webp'));
    var h = titolo(o.nome, 'scheda-titolo');
    p.appendChild(h);
    p.appendChild(el('p', 'scoperta-frase', o.frase));
    p.appendChild(el('p', 'scoperta-nota', provenienza(o)));
    vista.appendChild(p);
    return true;
  }

  window.Scatola = {
    init: function (c) { ctx = c; },
    blocco: blocco,
    mostraMomenti: mostraMomenti,
    mostraMomento: mostraMomento,
    mostraScatola: mostraScatola,
    mostraOggetto: mostraOggetto,
    util: { svuota: svuota, linkIndietro: linkIndietro, titolo: titolo, apri: apri },
    azzera: function () { memoria = []; },
    momento: momentoPer,
    nomeOggetto: function (n) { return (n >= 1 && n <= 16) ? oggetto(n).nome : ''; }
  };
})();
