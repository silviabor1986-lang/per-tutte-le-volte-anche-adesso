/* Fase 2: apertura e lettura delle 11 lettere, messaggio nascosto, «Nel libro».
   I testi arrivano da js/contenuti.js (generato dalle fonti definitive): qui non si scrive nessun testo editoriale. */
(function () {
  'use strict';
  var C = window.CONTENUTI;
  var vista = document.getElementById('vista-lettera');
  var apertura = null;

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo !== undefined) e.textContent = testo;
    return e;
  }
  function riduciMovimento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  function linkTorna(cls) {
    var a = el('a', cls, 'Torna alla scrivania');
    a.href = '#/';
    a.setAttribute('data-torna', '');
    return a;
  }

  /* ---------- Apertura della busta (CSS soltanto; si salta con un tocco o un tasto) ---------- */
  function chiudiApertura() {
    if (apertura && apertura.parentNode) apertura.parentNode.removeChild(apertura);
    apertura = null;
    document.removeEventListener('keydown', chiudiApertura, true);
  }
  function avviaApertura(busta) {
    chiudiApertura();
    var o = el('div', 'apertura');
    o.setAttribute('aria-hidden', 'true');
    var b = el('div', 'apertura-busta');
    var f = el('span', 'francobollo');
    var base = new URL('img/francobolli/' + busta.id, document.baseURI).href;
    f.style.setProperty('--f-giorno', 'url("' + base + '-giorno.webp")');
    f.style.setProperty('--f-notte', 'url("' + base + '-notte.webp")');
    b.appendChild(f);
    b.appendChild(el('span', 'apertura-lembo'));
    b.appendChild(el('span', 'apertura-nome', busta.nome));
    o.appendChild(b);
    o.addEventListener('animationend', function (e) { if (e.target === o) chiudiApertura(); });
    o.addEventListener('pointerdown', chiudiApertura);
    document.addEventListener('keydown', chiudiApertura, true);
    document.body.appendChild(o);
    apertura = o;
  }

  /* ---------- Sigillo e messaggio nascosto ---------- */
  function creaSigillo(testoNascosto, area, slug) {
    var bottone = el('button', 'sigillo');
    bottone.type = 'button';
    bottone.setAttribute('aria-label', 'Sigillo. Apri il messaggio nascosto.');
    bottone.appendChild(el('span', 'sigillo-testo', 'Ancora una cosa…'));
    var aiuto = el('p', 'sigillo-aiuto', 'Tocca il sigillo per aprirlo.');
    area.appendChild(bottone);
    area.appendChild(aiuto);

    bottone.addEventListener('click', function () {
      // Il messaggio entra nel documento soltanto adesso: prima non esiste né per la vista né per i lettori di schermo.
      var scatola = el('div', 'nascosto');
      var p = el('p', 'nascosto-testo', testoNascosto);
      p.tabIndex = -1;
      scatola.appendChild(p);
      if (window.Fase4) scatola.appendChild(window.Fase4.pulsante('nascosto', slug));
      if (window.Cartolina) scatola.appendChild(window.Cartolina.pulsante('nascosto', slug));
      area.textContent = '';
      area.appendChild(scatola);
      try { p.focus({ preventScroll: true }); } catch (e) { p.focus(); }
      if (typeof p.scrollIntoView === 'function') {
        try { p.scrollIntoView({ block: 'center', behavior: riduciMovimento() ? 'auto' : 'smooth' }); } catch (e) { p.scrollIntoView(); }
      }
    });
  }

  /* ---------- «Nel libro» ---------- */
  function voce(r, extra) {
    var li = el('li', extra ? 'rif rif-extra' : 'rif');
    li.appendChild(el('span', 'rif-titolo', r.titolo));
    li.appendChild(el('span', 'rif-pag', 'p. ' + r.pagina));
    return li;
  }
  function creaNelLibro(dati) {
    var s = el('section', 'nel-libro');
    s.setAttribute('aria-labelledby', 'titolo-nel-libro');
    var h = el('h2', null, 'Nel libro');
    h.id = 'titolo-nel-libro';
    s.appendChild(h);
    s.appendChild(el('p', 'nel-libro-intro', 'Trovi queste riflessioni nel libro:'));
    var ul = el('ul', 'elenco-rif');
    ul.id = 'elenco-rif';
    dati.prime.forEach(function (r) { ul.appendChild(voce(r, false)); });
    s.appendChild(ul);

    if (dati.altre.length) {
      var b = el('button', 'pulsante mostra-tutte', 'Mostra tutte le riflessioni (' + dati.totale + ')');
      b.type = 'button';
      b.setAttribute('aria-expanded', 'false');
      b.setAttribute('aria-controls', 'elenco-rif');
      b.addEventListener('click', function () {
        var aperto = b.getAttribute('aria-expanded') === 'true';
        if (!aperto) {
          dati.altre.forEach(function (r) { ul.appendChild(voce(r, true)); });
          b.textContent = 'Mostra meno';
          b.setAttribute('aria-expanded', 'true');
        } else {
          var extra = ul.querySelectorAll('.rif-extra');
          for (var i = 0; i < extra.length; i++) ul.removeChild(extra[i]);
          b.textContent = 'Mostra tutte le riflessioni (' + dati.totale + ')';
          b.setAttribute('aria-expanded', 'false');
        }
      });
      s.appendChild(b);
    }
    return s;
  }

  /* ---------- Schermata della lettera ---------- */
  // «momento» (facoltativo): se la lettera è stata aperta da un momento, in fondo c'è «Torna a «[momento]»»
  function mostra(busta, anima, momento) {
    var L = C.lettere[busta.slug];
    var N = C.libro[busta.slug];
    vista.textContent = '';
    vista.setAttribute('aria-labelledby', 'titolo-lettera');

    var alto = el('div', 'lettera-alto');
    alto.appendChild(linkTorna('indietro'));
    vista.appendChild(alto);

    var art = el('article', 'lettera');
    var h = el('h1', 'lettera-etichetta', L.emozione);
    h.id = 'titolo-lettera';
    h.tabIndex = -1;
    art.appendChild(h);
    art.appendChild(el('p', 'lettera-dedica', L.dedica));
    L.paragrafi.forEach(function (t) { art.appendChild(el('p', 'lettera-par', t)); });
    if (window.Fase4) art.appendChild(window.Fase4.pulsante('lettera', busta.slug));
    var area = el('div', 'sigillo-area');
    art.appendChild(area);
    creaSigillo(L.nascosto, area, busta.slug);
    vista.appendChild(art);

    // Fase 3: scoperta dell'oggetto della busta (prima volta) oppure «L'oggetto di questa busta è nella tua scatola.»
    var oggetto = window.Scatola ? window.Scatola.blocco('busta', busta.slug) : null;
    if (oggetto) vista.appendChild(oggetto);

    vista.appendChild(creaNelLibro(N));

    var piede = el('div', 'lettera-piede');
    if (momento) {
      var tm = el('a', 'pulsante', 'Torna a «' + momento.nome + '»');
      tm.href = '#/momento/' + momento.slug;
      tm.setAttribute('data-torna-momento', momento.slug);
      piede.appendChild(tm);
    } else {
      piede.appendChild(linkTorna('pulsante'));
    }
    var sup = el('a', 'link-supporto', 'Se il peso diventa troppo →');
    sup.href = '#/supporto';
    piede.appendChild(sup);
    vista.appendChild(piede);

    if (anima && !riduciMovimento()) {
      vista.classList.remove('entra-dissolvi'); vista.classList.add('entra');
      avviaApertura(busta);
    } else {
      chiudiApertura();
      vista.classList.remove('entra');
      // con «riduci movimento» l'apertura diventa una semplice dissolvenza
      if (anima) vista.classList.add('entra-dissolvi'); else vista.classList.remove('entra-dissolvi');
    }
  }

  window.Lettere = { mostra: mostra, chiudiApertura: chiudiApertura };
})();
