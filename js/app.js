/* Fase 1: scrivania, aspetto giorno/notte, navigazione a «hash».
   Fase 2: apertura e lettura delle lettere (js/lettere.js, js/contenuti.js).
   Cassetto, scatola dei ricordi, sfondi, libro, salvataggi e
   condivisioni NON sono ancora realizzati (fasi successive). */
(function () {
  'use strict';

  // Ordine fisso delle 11 buste (W2 §3.1 B). «id» = nome del file del francobollo.
  var BUSTE = [
    { slug: 'stanca',      nome: 'Stanca',      id: 'stanca' },
    { slug: 'sola',        nome: 'Sola',        id: 'sola' },
    { slug: 'sopraffatta', nome: 'Sopraffatta', id: 'sopraffatta' },
    { slug: 'nostalgica',  nome: 'Nostalgica',  id: 'nostalgica' },
    { slug: 'in-colpa',    nome: 'In colpa',    id: 'in_colpa' },
    { slug: 'invisibile',  nome: 'Invisibile',  id: 'invisibile' },
    { slug: 'arrabbiata',  nome: 'Arrabbiata',  id: 'arrabbiata' },
    { slug: 'leggera',     nome: 'Leggera',     id: 'leggera' },
    { slug: 'sbagliata',   nome: 'Sbagliata',   id: 'sbagliata' },
    { slug: 'giudicata',   nome: 'Giudicata',   id: 'giudicata' },
    { slug: 'persa',       nome: 'Persa',       id: 'persa' }
  ];

  // Percorsi delle schermate delle fasi successive: titoli presi dai testi approvati (sezione D).
  var FUTURE = {};

  var SVG_NS = 'http://www.w3.org/2000/svg';
  var vistaBenvenuto = document.getElementById('vista-benvenuto');
  var vistaScrivania = document.getElementById('vista-scrivania');
  var vistaLettera = document.getElementById('vista-lettera');
  var vistaExtra = document.getElementById('vista-extra');
  var vistaAltra = document.getElementById('vista-altra');
  var titoloAltra = document.getElementById('titolo-altra');
  var testoAltra = document.getElementById('testo-altra');
  var vaScrivania = document.getElementById('vai-scrivania');
  var indietro = document.getElementById('indietro');
  var navigazioni = 0;      // quante schermate dell'app sono state aperte in questa visita
  var primoCaricamento = true;
  var animaProssima = false;   // la lettera si apre con l'animazione solo se si arriva toccando una busta
  var percorsoCorrente = null; // schermata mostrata ora
  var percorsoPrecedente = null;

  /* ---------- Buste ---------- */
  function creaBusta(b) {
    var a = document.createElement('a');
    a.className = 'busta';
    a.href = '#/busta/' + b.slug;
    a.setAttribute('aria-label', 'Busta «' + b.nome + '». Apri la lettera.');

    var svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('class', 'busta-lembo');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    var linea = document.createElementNS(SVG_NS, 'polyline');
    linea.setAttribute('points', '0,0 50,52 100,0');
    linea.setAttribute('fill', 'none');
    linea.setAttribute('vector-effect', 'non-scaling-stroke');
    svg.appendChild(linea);
    a.appendChild(svg);

    var f = document.createElement('span');
    f.className = 'francobollo';
    f.setAttribute('aria-hidden', 'true');
    // L'indirizzo va reso assoluto: un url() dentro una variabile CSS si risolve rispetto al file CSS, non alla pagina
    var base = new URL('img/francobolli/' + b.id, document.baseURI).href;
    f.style.setProperty('--f-giorno', 'url("' + base + '-giorno.webp")');
    f.style.setProperty('--f-notte', 'url("' + base + '-notte.webp")');
    a.appendChild(f);

    var n = document.createElement('span');
    n.className = 'busta-nome';
    n.textContent = b.nome;
    a.appendChild(n);
    return a;
  }

  var contenitore = document.getElementById('buste');
  BUSTE.forEach(function (b) { contenitore.appendChild(creaBusta(b)); });
  contenitore.addEventListener('click', function () { animaProssima = true; });
  window.Scatola.init({ buste: BUSTE, creaBusta: creaBusta });

  /* ---------- Aspetto ---------- */
  var gruppo = document.querySelector('.aspetto');
  gruppo.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== gruppo && t.tagName !== 'BUTTON') t = t.parentNode;
    if (!t || t === gruppo) return;
    window.Aspetto.imposta(t.getAttribute('data-aspetto'));
  });
  window.Aspetto.ripristina();

  /* ---------- Navigazione ---------- */
  function percorso() {
    var h = window.location.hash || '';
    h = h.replace(/^#/, '');
    if (h === '' || h === '/') return '/';
    return h.replace(/\/+$/, '');
  }

  function mostraAltra(titolo, testo, conVai) {
    nascondiTutte();
    vistaAltra.hidden = false;
    titoloAltra.textContent = titolo;
    testoAltra.textContent = testo || '';
    testoAltra.hidden = !testo;
    vaScrivania.hidden = !conVai;
    indietro.hidden = !!conVai;
  }

  function nascondiTutte() {
    vistaBenvenuto.hidden = true;
    vistaScrivania.hidden = true;
    vistaLettera.hidden = true;
    vistaExtra.hidden = true;
    vistaAltra.hidden = true;
  }

  // Schermate delle Fase 3 (momenti, scatola): costruite da js/scatola.js dentro #vista-extra
  function mostraExtra(titolo) {
    nascondiTutte();
    vistaExtra.hidden = false;
    document.title = titolo + ' · Per tutte le volte, anche adesso';
    return document.getElementById('titolo-vista');
  }

  function disegna() {
    var p = percorso();
    var m = p.match(/^\/busta\/([a-z-]+)$/);
    var mb = p.match(/^\/momento\/([a-z-]+)\/busta\/([a-z-]+)$/);
    var mm = p.match(/^\/momento\/([a-z-]+)$/);
    var mo = p.match(/^\/scatola\/oggetto\/(\d+)$/);
    var busta = null, momento = null, lettura = false;
    if (m) BUSTE.forEach(function (b) { if (b.slug === m[1]) busta = b; });
    if (mb) {
      momento = window.Scatola.momento(mb[1]);
      if (momento && momento.buste.indexOf(mb[2]) >= 0) BUSTE.forEach(function (b) { if (b.slug === mb[2]) busta = b; });
      if (!busta) momento = null;
    }
    if (mm) momento = window.Scatola.momento(mm[1]);
    var focoSu = null;
    window.Lettere.chiudiApertura();
    window.Fase5.chiudiAnteprima();

    if (p === '/' && window.Fase5.benvenutoDaMostrare()) {
      // prima apertura: pagina di benvenuto (S0)
      nascondiTutte();
      vistaBenvenuto.hidden = false;
      focoSu = window.Fase5.mostraBenvenuto();
      document.title = 'Per tutte le volte, anche adesso';
    } else if (p === '/') {
      nascondiTutte();
      vistaScrivania.hidden = false;
      document.title = 'Per tutte le volte, anche adesso';
      focoSu = document.getElementById('titolo-scrivania');
    } else if (busta) {
      nascondiTutte();
      vistaLettera.hidden = false;
      window.Lettere.mostra(busta, animaProssima && !primoCaricamento, momento);
      document.title = busta.nome + ' · Per tutte le volte, anche adesso';
      focoSu = document.getElementById('titolo-lettera');
      lettura = true;
    } else if (p === '/momenti') {
      window.Scatola.mostraMomenti(vistaExtra);
      focoSu = mostraExtra('In che momento sei?');
    } else if (mm && momento) {
      window.Scatola.mostraMomento(vistaExtra, momento);
      focoSu = mostraExtra(momento.nome);
      lettura = true;
    } else if (p === '/cassetto') {
      // l'apertura del cassetto parte quando si arriva toccando «Apri il cassetto» dalla scrivania
      window.Fase4.mostraCassetto(vistaExtra, percorsoCorrente === '/' && !primoCaricamento);
      focoSu = mostraExtra('Apri il cassetto');
    } else if (p === '/scatola') {
      // l'apertura della scatola non si ripete quando si torna da una scheda oggetto
      window.Scatola.mostraScatola(vistaExtra, !(percorsoCorrente && percorsoCorrente.indexOf('/scatola/oggetto/') === 0));
      focoSu = mostraExtra('La scatola dei ricordi');
    } else if (mo && window.Scatola.mostraOggetto(vistaExtra, parseInt(mo[1], 10))) {
      focoSu = mostraExtra(window.Scatola.nomeOggetto(parseInt(mo[1], 10)));
    } else if (p === '/sfondi') {
      window.Fase5.mostraSfondi(vistaExtra, percorsoCorrente === '/' && !primoCaricamento);
      focoSu = mostraExtra('Sfondi per il tuo telefono');
    } else if (p === '/libro') {
      window.Fase5.mostraLibro(vistaExtra);
      focoSu = mostraExtra('Il libro');
      lettura = true;
    } else if (p === '/privacy') {
      window.Fase5.mostraPrivacy(vistaExtra);
      focoSu = mostraExtra('Privacy e i tuoi dati');
      lettura = true;
    } else if (p === '/supporto') {
      window.Fase5.mostraSupporto(vistaExtra);
      focoSu = mostraExtra('Se il peso diventa troppo');
      lettura = true;
    } else if (FUTURE.hasOwnProperty(p)) {
      mostraAltra(FUTURE[p],
        '[Fase 1] Questa sezione non è ancora disponibile: verrà realizzata nelle fasi successive.', false);
      document.title = FUTURE[p] + ' · Per tutte le volte, anche adesso';
      focoSu = titoloAltra;
    } else {
      mostraAltra('Questa pagina non esiste.', '', true);
      document.title = 'Pagina non trovata · Per tutte le volte, anche adesso';
      focoSu = titoloAltra;
    }

    document.body.classList.toggle('lettura', lettura);
    animaProssima = false;
    percorsoPrecedente = percorsoCorrente;
    percorsoCorrente = p;
    window.scrollTo(0, 0);
    // Il focus passa al titolo della nuova schermata (non alla prima apertura)
    if (!primoCaricamento && focoSu) { try { focoSu.focus({ preventScroll: true }); } catch (e) { focoSu.focus(); } }
    primoCaricamento = false;
  }

  var tornoIndietro = false;
  window.addEventListener('hashchange', function () {
    if (tornoIndietro) { tornoIndietro = false; } else { navigazioni++; }
    disegna();
  });

  // «← Indietro»: torna alla schermata precedente dell'app; se non c'è, alla scrivania
  indietro.addEventListener('click', function (e) {
    e.preventDefault();
    if (navigazioni > 0) { navigazioni--; tornoIndietro = true; window.history.back(); }
    else { window.location.hash = '#/'; }
  });

  // «Torna alla scrivania» (nelle lettere): se si arriva dalla scrivania usa la cronologia, così il tasto Indietro del browser resta coerente
  vistaLettera.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== vistaLettera && !(t.hasAttribute && t.hasAttribute('data-torna'))) t = t.parentNode;
    if (!t || t === vistaLettera) return;
    e.preventDefault();
    if (navigazioni > 0 && percorsoPrecedente === '/') { navigazioni--; tornoIndietro = true; window.history.back(); }
    else { window.location.hash = '#/'; }
  });

  // Busta aperta da un momento: stessa animazione di apertura
  vistaExtra.addEventListener('click', function (e) {
    var t = e.target;
    while (t && t !== vistaExtra) { if (t.classList && t.classList.contains('busta-mini')) { animaProssima = true; return; } t = t.parentNode; }
  });

  function trovaAttributo(radice, nome, da) {
    var t = da;
    while (t && t !== radice) { if (t.hasAttribute && t.hasAttribute(nome)) return t; t = t.parentNode; }
    return null;
  }

  // «← Indietro» delle schermate dei momenti e della scatola: torna alla schermata precedente; se non c'è, al percorso indicato
  vistaExtra.addEventListener('click', function (e) {
    var t = trovaAttributo(vistaExtra, 'data-indietro', e.target);
    if (!t) return;
    e.preventDefault();
    if (navigazioni > 0) { navigazioni--; tornoIndietro = true; window.history.back(); }
    else { window.location.hash = '#' + t.getAttribute('data-indietro'); }
  });

  // «Torna a «[momento]»» (lettera aperta da un momento): usa la cronologia se si arriva dal momento
  vistaLettera.addEventListener('click', function (e) {
    var t = trovaAttributo(vistaLettera, 'data-torna-momento', e.target);
    if (!t) return;
    e.preventDefault();
    var dest = '/momento/' + t.getAttribute('data-torna-momento');
    if (navigazioni > 0 && percorsoPrecedente === dest) { navigazioni--; tornoIndietro = true; window.history.back(); }
    else { window.location.hash = '#' + dest; }
  });

  disegna();
})();
