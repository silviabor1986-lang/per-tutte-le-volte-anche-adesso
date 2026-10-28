/* Fase 5: Benvenuto (S0), Sfondi (S4), Il libro (S5), Privacy (S7), Se il peso diventa troppo.
   Tutti i testi arrivano da js/testi_fase5.js (generato da strumenti/estrai_fase5.py dai documenti approvati).
   Fanno eccezione le due etichette della scelta con/senza frase (ETICHETTE_SFONDI): testi tecnici provvisori, da approvare (W2 §13.10). */
(function () {
  'use strict';
  var T = window.TESTI5;
  var C = window.CONTENUTI;
  var U = window.Scatola.util;

  // ⚠ Provvisorie: W2 §13.10 chiede di proporre queste etichette all'autrice. Un solo punto da cambiare.
  var ETICHETTE_SFONDI = { con: 'Con la frase', senza: 'Senza la frase' };

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo !== undefined) e.textContent = testo;
    return e;
  }
  function riduciMovimento() {
    return !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }
  // **grassetto** e *corsivo* dei testi approvati
  function md(e, s) {
    s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).forEach(function (p) {
      if (!p) return;
      if (p.indexOf('**') === 0) e.appendChild(el('strong', null, p.slice(2, -2)));
      else if (p.charAt(0) === '*') e.appendChild(el('em', null, p.slice(1, -1)));
      else e.appendChild(document.createTextNode(p));
    });
    return e;
  }
  function mdEl(tag, cls, s) { return md(el(tag, cls), s); }

  /* ---------- Salvataggio: benvenuto già visto, cancellazione, disponibilità ---------- */
  var KEY_B = 'ptlv.v1.benvenuto';
  var benvenutoMem = false;
  function benvenutoVisto() {
    try { if (JSON.parse(window.localStorage.getItem(KEY_B) || 'null')) return true; } catch (e) { /* non disponibile */ }
    return benvenutoMem;
  }
  function segnaBenvenuto() {
    benvenutoMem = true;
    try { window.localStorage.setItem(KEY_B, JSON.stringify({ v: 1, visto: true })); } catch (e) { /* non disponibile */ }
  }
  function salvataggioDisponibile() {
    try {
      var k = 'ptlv.v1.prova';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) { return false; }
  }
  var avvisato = false;
  // «Avviso al primo salvataggio» (D.11), solo se il salvataggio non è disponibile
  function avvisoSalvataggio() {
    if (avvisato || salvataggioDisponibile()) return null;
    avvisato = true;
    return T.privacy.nonDisponibile;
  }
  function cancellaTutto() {
    try {
      var ch = [];
      for (var i = 0; i < window.localStorage.length; i++) ch.push(window.localStorage.key(i));
      ch.forEach(function (k) { if (k.indexOf('ptlv.') === 0 || k === 'ptlvm_aspetto') window.localStorage.removeItem(k); });
    } catch (e) { /* non disponibile */ }
    benvenutoMem = false;
    avvisato = false;
    if (window.Scatola.azzera) window.Scatola.azzera();
    if (window.Fase4.azzera) window.Fase4.azzera();
    window.Aspetto.imposta('sistema');
    try { window.localStorage.removeItem('ptlvm_aspetto'); } catch (e) { /* non disponibile */ }
  }

  /* ---------- S0 · Benvenuto ---------- */
  var vistaBenv = document.getElementById('vista-benvenuto');
  function costruisciBenvenuto() {
    var B = T.benvenuto;
    vistaBenv.textContent = '';
    var c = el('div', 'benvenuto-corpo');
    var busta = el('div', 'benvenuto-busta');
    busta.setAttribute('aria-hidden', 'true');
    busta.appendChild(el('span', 'benvenuto-lembo'));
    busta.appendChild(el('span', 'benvenuto-titolo-busta', B.busta));
    c.appendChild(busta);
    var h = el('h1', 'solo-schermo', B.busta);
    h.id = 'titolo-benvenuto';
    h.tabIndex = -1;
    c.appendChild(h);
    var pp = el('div', 'pannello benvenuto-pannello');
    c.appendChild(pp);
    pp.appendChild(el('p', 'benvenuto-intro', B.intro));
    var g = el('div', 'benvenuto-aspetto');
    g.setAttribute('role', 'group');
    g.setAttribute('aria-labelledby', 'benvenuto-domanda');
    var d = el('p', 'benvenuto-domanda', B.domanda);
    d.id = 'benvenuto-domanda';
    g.appendChild(d);
    var riga = el('div', 'aspetto benvenuto-scelte');
    [['giorno', 'Giorno'], ['notte', 'Notte'], ['sistema', 'Come il telefono']].forEach(function (a) {
      var b = el('button', null, a[1]);
      b.type = 'button';
      b.setAttribute('data-aspetto', a[0]);
      b.setAttribute('aria-pressed', 'false');
      riga.appendChild(b);
    });
    riga.addEventListener('click', function (e) {
      var t = e.target;
      while (t && t !== riga && t.tagName !== 'BUTTON') t = t.parentNode;
      if (!t || t === riga) return;
      window.Aspetto.imposta(t.getAttribute('data-aspetto'));
    });
    g.appendChild(riga);
    pp.appendChild(g);
    var entra = el('button', 'pulsante benvenuto-entra', B.entra);
    entra.type = 'button';
    entra.addEventListener('click', function () {
      segnaBenvenuto();
      if (window.location.hash !== '' && window.location.hash !== '#/') window.location.hash = '#/';
      else window.dispatchEvent(new Event('hashchange'));
    });
    pp.appendChild(entra);
    pp.appendChild(el('p', 'benvenuto-nota', B.nota));
    vistaBenv.appendChild(c);
    window.Aspetto.ripristina();
    return h;
  }

  /* ---------- S4 · Sfondi per il telefono ---------- */
  function piattaforma() {
    var ua = navigator.userAgent || '';
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return null;
  }
  var anteprimaAperta = null;
  function chiudiAnteprima() {
    if (!anteprimaAperta) return;
    var o = anteprimaAperta.el, ritorno = anteprimaAperta.ritorno;
    anteprimaAperta = null;
    document.removeEventListener('keydown', tastoAnteprima, true);
    if (o.parentNode) o.parentNode.removeChild(o);
    document.body.classList.remove('anteprima-aperta');
    if (ritorno && ritorno.focus) { try { ritorno.focus({ preventScroll: true }); } catch (e) { ritorno.focus(); } }
  }
  function tastoAnteprima(e) { if (e.key === 'Escape') { e.preventDefault(); chiudiAnteprima(); } }
  function apriAnteprima(src, alt, ritorno) {
    chiudiAnteprima();
    var o = el('div', 'anteprima');
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    o.setAttribute('aria-label', alt);
    var img = document.createElement('img');
    img.src = src;
    img.alt = alt;
    var b = el('button', 'anteprima-chiudi');
    b.type = 'button';
    b.setAttribute('aria-label', 'Torna alla schermata precedente');
    b.addEventListener('click', chiudiAnteprima);
    o.appendChild(img);
    o.appendChild(b);
    document.body.appendChild(o);
    document.body.classList.add('anteprima-aperta');
    anteprimaAperta = { el: o, ritorno: ritorno };
    document.addEventListener('keydown', tastoAnteprima, true);
    try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
  }

  function nomeFile(url) { return url.split('/').pop(); }
  function scarica(v, versione, bottone, esito) {
    var url = v[versione].jpg;
    var piatt = piattaforma();
    bottone.classList.remove('scaricando');
    void bottone.offsetWidth;
    bottone.classList.add('scaricando');   // feedback: il pulsante si riempie dolcemente
    setTimeout(function () { bottone.classList.remove('scaricando'); }, 900);
    var timer = null;
    function messaggio(t) {
      esito.textContent = t;
      esito.classList.remove('visibile');
      void esito.offsetWidth;
      esito.classList.add('visibile');
      clearTimeout(timer);
      timer = setTimeout(function () { esito.classList.remove('visibile'); }, 4000);
    }
    function link(href, blob) {
      var a = document.createElement('a');
      a.href = href;
      a.download = nomeFile(url);
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      if (blob) setTimeout(function () { URL.revokeObjectURL(href); }, 4000);
    }
    if (piatt === 'ios' || window.location.protocol === 'file:') {
      // iPhone (e anteprima aperta direttamente dal file, dove il browser non permette il download): l'immagine si apre a schermo intero
      var w = null;
      try { w = window.open(url, '_blank'); } catch (e) { w = null; }
      if (!w) window.location.href = url;
      return;
    }
    if (!window.fetch) { link(url); messaggio(T.sfondi.scaricato); return; }
    // Senza rete si prova comunque: se lo sfondo è già stato aperto è nella memoria offline (W2 §5); altrimenti arriva il messaggio D.8
    window.fetch(url).then(function (r) {
      if (!r.ok) throw new Error('http');
      return r.blob();
    }).then(function (blob) {
      link(URL.createObjectURL(blob), true);
      messaggio(T.sfondi.scaricato);
    }).catch(function () {
      messaggio(navigator.onLine === false ? T.sfondi.offline : T.sfondi.errore);
    });
  }

  function mostraSfondi(vista, anima) {
    var S = T.sfondi;
    var alto = U.svuota(vista);
    alto.appendChild(U.linkIndietro('/'));
    var p = el('div', 'pannello sfondi-vista');
    if (anima) U.apri(p);
    p.appendChild(U.titolo(S.titolo));

    var versione = 'con';
    var scelta = el('div', 'sfondi-scelta');
    scelta.setAttribute('role', 'group');
    var bScelta = {};
    ['con', 'senza'].forEach(function (k) {
      var b = el('button', 'sfondi-versione', ETICHETTE_SFONDI[k]);
      b.type = 'button';
      b.setAttribute('aria-pressed', k === versione ? 'true' : 'false');
      b.addEventListener('click', function () {
        if (versione === k) return;
        versione = k;
        Object.keys(bScelta).forEach(function (x) { bScelta[x].setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
        aggiorna();
      });
      bScelta[k] = b;
      scelta.appendChild(b);
    });
    p.appendChild(scelta);

    var ul = el('ul', 'sfondi-griglia');
    var schede = [];
    S.voci.forEach(function (v, i) {
      var li = el('li', 'sfondo');
      li.style.setProperty('--i', i);
      var fig = el('button', 'sfondo-anteprima');
      fig.type = 'button';
      var img = document.createElement('img');
      img.decoding = 'async';
      img.width = 430; img.height = 932;
      fig.appendChild(img);
      var nome = el('h2', 'sfondo-nome', v.nome);
      var bs = el('button', 'pulsante sfondo-scarica');
      bs.type = 'button';
      bs.appendChild(el('span', 'sfondo-scarica-riempi'));
      bs.appendChild(el('span', 'sfondo-scarica-testo', S.scarica));
      var esito = el('p', 'sfondo-esito');
      esito.setAttribute('role', 'status');
      bs.addEventListener('click', function () { scarica(v, versione, bs, esito); });
      fig.addEventListener('click', function () { apriAnteprima(v[versione].p860, alt(v), fig); });
      li.appendChild(fig);
      li.appendChild(nome);
      li.appendChild(bs);
      li.appendChild(esito);
      ul.appendChild(li);
      schede.push({ v: v, img: img });
    });
    function alt(v) {
      return versione === 'con' ? 'Sfondo «' + v.nome + '», con la frase: ' + v.citazione : 'Sfondo «' + v.nome + '»';
    }
    function aggiorna() {
      schede.forEach(function (s) {
        s.img.src = s.v[versione].p430;
        s.img.alt = alt(s.v);
        s.img.classList.remove('cambia');
        void s.img.offsetWidth;
        s.img.classList.add('cambia');
      });
    }
    aggiorna();
    p.appendChild(ul);

    // Istruzioni (D.8): una sola se il dispositivo è riconosciuto, entrambe altrimenti
    var piatt = piattaforma();
    var istr = el('div', 'sfondi-istruzioni');
    function riga(etichetta, testo) {
      var r = el('p');
      if (etichetta) r.appendChild(el('strong', null, etichetta + ' '));
      r.appendChild(document.createTextNode(testo));
      istr.appendChild(r);
    }
    if (piatt === 'ios') riga('', S.iphone);
    else if (piatt === 'android') riga('', S.android);
    else { riga('iPhone:', S.iphone); riga('Android:', S.android); }
    p.appendChild(istr);
    vista.appendChild(p);
  }

  /* ---------- S5 · Il libro ---------- */
  function mostraLibro(vista) {
    var L = T.libro;
    var alto = U.svuota(vista);
    alto.appendChild(U.linkIndietro('/'));
    var art = el('article', 'lettera pagina-info entra-pagina libro-pagina');
    art.appendChild(U.titolo(L.titolo, 'pagina-titolo'));
    art.appendChild(mdEl('p', 'lettera-par libro-sotto', L.sottotitolo));

    var filtro = el('div', 'libro-filtro');
    filtro.setAttribute('role', 'group');
    filtro.setAttribute('aria-labelledby', 'titolo-vista');
    var voci = [{ slug: null, nome: L.tutte }];
    Object.keys(C.lettere).map(function (k) { return C.lettere[k]; }).sort(function (a, b) { return a.numero - b.numero; })
      .forEach(function (l) { for (var k in C.lettere) if (C.lettere[k] === l) voci.push({ slug: k, nome: l.emozione }); });
    var attivo = null;
    var bottoni = [];
    var elenco = el('div', 'libro-elenco');
    function idsDi(slug) {
      var d = C.libro[slug], ids = {};
      d.prime.concat(d.altre).forEach(function (r) { ids[r.id] = true; });
      return ids;
    }
    function disegnaElenco() {
      var ids = attivo ? idsDi(attivo) : null;
      elenco.textContent = '';
      T.libro.parti.forEach(function (parte) {
        var rif = L.riflessioni.filter(function (r) { return r.parte === parte.nome && (!ids || ids[r.id]); });
        if (!rif.length) return;
        var sez = el('section', 'libro-parte');
        var h = el('h2', 'libro-parte-titolo', parte.titolo);
        sez.appendChild(h);
        var ul = el('ul', 'elenco-rif libro-voci');
        rif.forEach(function (r) {
          var li = el('li', 'rif');
          li.appendChild(el('span', 'rif-titolo', 'Apri quando… ' + r.titolo));
          li.appendChild(el('span', 'rif-pag', 'p. ' + r.pagina));
          ul.appendChild(li);
        });
        sez.appendChild(ul);
        elenco.appendChild(sez);
      });
      elenco.classList.remove('cambia');
      void elenco.offsetWidth;
      elenco.classList.add('cambia');
    }
    voci.forEach(function (v) {
      var b = el('button', 'libro-chip', v.nome);
      b.type = 'button';
      b.setAttribute('aria-pressed', v.slug === attivo ? 'true' : 'false');
      b.addEventListener('click', function () {
        attivo = v.slug;
        bottoni.forEach(function (x) { x.b.setAttribute('aria-pressed', x.slug === attivo ? 'true' : 'false'); });
        disegnaElenco();
      });
      bottoni.push({ b: b, slug: v.slug });
      filtro.appendChild(b);
    });
    art.appendChild(filtro);
    disegnaElenco();
    art.appendChild(elenco);
    vista.appendChild(art);
  }

  /* ---------- S7 · Privacy e i tuoi dati ---------- */
  function mostraPrivacy(vista) {
    var P = T.privacy;
    var alto = U.svuota(vista);
    alto.appendChild(U.linkIndietro('/'));
    var art = el('article', 'lettera pagina-info entra-pagina');
    art.appendChild(U.titolo('Privacy e i tuoi dati', 'pagina-titolo'));
    ['p1', 'p2', 'p3', 'p4'].forEach(function (k) { art.appendChild(el('p', 'lettera-par', P[k])); });
    if (!salvataggioDisponibile()) art.appendChild(el('p', 'lettera-par', P.nonDisponibile));

    art.appendChild(el('h2', 'pagina-sotto', P.agg));
    function istruzione(etichetta, testo) {
      var r = el('p', 'lettera-par');
      r.appendChild(el('strong', null, etichetta + ' '));
      r.appendChild(document.createTextNode(testo));
      art.appendChild(r);
    }
    istruzione('iPhone (Safari):', P.iphone);
    istruzione('Android (Chrome):', P.android);

    var zona = el('div', 'privacy-cancella');
    var b = el('button', 'pulsante', P.cancella);
    b.type = 'button';
    var conferma = el('div', 'privacy-conferma');
    conferma.hidden = true;
    conferma.setAttribute('role', 'group');
    conferma.setAttribute('aria-labelledby', 'privacy-conferma-testo');
    var t = el('p', 'lettera-par', P.conferma);
    t.id = 'privacy-conferma-testo';
    var si = el('button', 'pulsante', P.si); si.type = 'button';
    var no = el('button', 'pulsante', P.annulla); no.type = 'button';
    var riga = el('div', 'privacy-bottoni');
    riga.appendChild(si); riga.appendChild(no);
    conferma.appendChild(t); conferma.appendChild(riga);
    var fatto = el('p', 'lettera-par privacy-fatto');
    fatto.setAttribute('role', 'status');
    b.addEventListener('click', function () { b.hidden = true; fatto.textContent = ''; conferma.hidden = false; try { si.focus({ preventScroll: true }); } catch (e) { si.focus(); } });
    no.addEventListener('click', function () { conferma.hidden = true; b.hidden = false; try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); } });
    si.addEventListener('click', function () {
      cancellaTutto();
      conferma.hidden = true; b.hidden = false;
      fatto.textContent = T.privacy.fatto;
      try { b.focus({ preventScroll: true }); } catch (e) { b.focus(); }
    });
    zona.appendChild(b); zona.appendChild(conferma); zona.appendChild(fatto);
    art.appendChild(zona);
    vista.appendChild(art);
  }

  /* ---------- Se il peso diventa troppo ---------- */
  function mostraSupporto(vista) {
    var S = T.supporto;
    var alto = U.svuota(vista);
    alto.appendChild(U.linkIndietro('/'));
    var art = el('article', 'lettera pagina-info supporto entra-pagina');
    art.appendChild(U.titolo(S.titolo, 'pagina-titolo'));
    S.blocchi.forEach(function (b) {
      if (b.t === 'emergenza') {
        var box = el('section', 'emergenza');
        box.setAttribute('aria-label', S.titolo);
        b.p.forEach(function (s) { box.appendChild(mdEl('p', 'emergenza-testo', s)); });
        var a = el('a', 'pulsante chiama-112', b.bottone);
        a.href = 'tel:112';
        box.appendChild(a);
        art.appendChild(box);
      } else if (b.t === 'p') {
        art.appendChild(mdEl('p', 'lettera-par', b.s));
      } else if (b.t === 'ul') {
        var ul = el('ul', 'supporto-elenco');
        b.v.forEach(function (s) { ul.appendChild(mdEl('li', null, s)); });
        art.appendChild(ul);
      } else if (b.t === 'h') {
        art.appendChild(el('h2', 'pagina-sotto', b.s));
      } else if (b.t === 'tel') {
        var q = el('p', 'lettera-par supporto-tel');
        var m = b.s.match(/^(.*· )(\d[\d ]+\d)$/);
        var st = el('strong');
        st.appendChild(document.createTextNode(m[1]));
        var n = el('a', 'supporto-numero', m[2]);
        n.href = 'tel:' + m[2].replace(/ /g, '');
        st.appendChild(n);
        q.appendChild(st);
        art.appendChild(q);
      } else if (b.t === 'link') {
        var pl = el('p', 'lettera-par');
        var al = el('a', 'supporto-link', b.s);
        al.href = b.href;
        al.target = '_blank';
        al.rel = 'noopener noreferrer';
        al.setAttribute('aria-label', b.s + ' (si apre in una nuova scheda)');
        pl.appendChild(al);
        art.appendChild(pl);
      } else if (b.t === 'nota') {
        art.appendChild(mdEl('p', 'supporto-nota', b.s));
      }
    });
    vista.appendChild(art);
  }

  window.Fase5 = {
    benvenutoDaMostrare: function () { return !benvenutoVisto(); },
    mostraBenvenuto: costruisciBenvenuto,
    mostraSfondi: mostraSfondi,
    mostraLibro: mostraLibro,
    mostraPrivacy: mostraPrivacy,
    mostraSupporto: mostraSupporto,
    avvisoSalvataggio: avvisoSalvataggio,
    chiudiAnteprima: chiudiAnteprima
  };
})();
