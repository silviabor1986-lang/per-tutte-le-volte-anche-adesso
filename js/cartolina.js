/* Fase 6: «Condividi come cartolina» (W2 §8, BOZZE D.9).
   La cartolina è disegnata sul telefono (canvas 1080 × 1920), sempre in versione diurna, con le sole risorse approvate:
   texture di carta, francobollo (dell'emozione per i messaggi nascosti, neutro per il cassetto), font Lora.
   Nessun servizio esterno, nessun dato personale, nessun ricordo salvato nell'immagine.
   Testi: frasi e messaggi arrivano da js/contenuti.js e js/cassetto.js; le frasi dell'interfaccia sono quelle di D.9. */
(function () {
  'use strict';
  var C = window.CONTENUTI;
  var K = window.CASSETTO;

  /* Indirizzo pubblico dell'app: NON ancora scelto. Finché è vuoto non compare né nell'immagine né nel testo di
     condivisione. Quando sarà definito, basta scriverlo qui (es. 'https://…') e rigenerare sw.js. */
  var INDIRIZZO = '';

  var NOME_APP = 'Per tutte le volte, anche adesso';
  var TITOLO_LIBRO = 'Per tutte le volte, mamma';
  var AUTRICE = 'Gioia Fiorelli';

  /* Misure e colori: sono quelli delle due anteprime approvate (28/10/2026) */
  var W = 1080, H = 1920;
  var TESTO = '#3b2a3a';
  var MARGINE = 132, LARGH_TESTO = 816, TOP_TESTO = 640, MAX_FONDO_TESTO = 1240;
  var MAX_PX = 76, MIN_PX = 56;

  function el(tag, cls, testo) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (testo !== undefined) e.textContent = testo;
    return e;
  }

  /* ---------- Contenuti condivisibili ---------- */
  function contenutoPer(tipo, id) {
    var L, f, i;
    if (tipo === 'nascosto') {
      L = C.lettere[id];
      if (!L) return null;
      return { frase: L.nascosto, francobollo: 'img/cartolina/francobollo-' + id + '.webp', attribuzione: 'libro', tipo: 'nascosto' };
    }
    if (tipo === 'frase') {
      for (i = 0; i < K.length; i++) if (K[i].id === id) { f = K[i]; break; }
      if (!f) return null;
      /* V.1 e V.9 sono testi originali della web app: solo il nome dell'app, mai il riferimento al libro (W2 §3.1 H) */
      return { frase: f.frase, francobollo: 'img/cartolina/francobollo-neutro.webp', attribuzione: f.originale ? 'app' : 'libro', tipo: 'frase' };
    }
    return null;
  }

  /* Testo che accompagna la condivisione (D.9). Il «[link]» compare solo quando l'indirizzo è definito. */
  function testoCondivisione(tipo, id) {
    var d = contenutoPer(tipo, id);
    if (!d) return '';
    if (d.tipo === 'nascosto') {
      return d.frase + ' — da ' + NOME_APP + (INDIRIZZO ? ' ' + INDIRIZZO : '');
    }
    if (d.attribuzione === 'app') {
      /* V.1 e V.9 (testi originali della web app): la riga «— Per tutte le volte, anche adesso» indica già l'app,
         quindi non si ripete «Da Per tutte le volte, anche adesso» (approvato il 28/10/2026) */
      return d.frase + '\n— ' + NOME_APP + (INDIRIZZO ? '\n' + INDIRIZZO : '');
    }
    return d.frase + '\n— ' + TITOLO_LIBRO + ' — ' + AUTRICE + '\nDa ' + NOME_APP + (INDIRIZZO ? ': ' + INDIRIZZO : '');
  }

  /* ---------- Risorse ---------- */
  var immagini = {};
  function caricaImmagine(src) {
    if (!immagini[src]) {
      immagini[src] = new Promise(function (ok, no) {
        var i = new Image();
        i.onload = function () { ok(i); };
        i.onerror = function () { delete immagini[src]; no(new Error('immagine non disponibile: ' + src)); };
        i.src = src;
      });
    }
    return immagini[src];
  }
  function caricaFont() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('400 76px Lora'),
      document.fonts.load('italic 400 42px Lora')
    ]).catch(function () { /* si usa il carattere di riserva */ });
  }

  /* ---------- Disegno ---------- */
  function ellisse(ctx, cx, cy, rx, ry, rgb, alfa) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, ry / rx);
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
    g.addColorStop(0, 'rgba(' + rgb + ',' + alfa + ')');
    g.addColorStop(0.7, 'rgba(' + rgb + ',0)');
    ctx.fillStyle = g;
    ctx.fillRect(-cx, -cy * rx / ry, W, H * rx / ry);
    ctx.restore();
  }
  function rettArrotondato(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
    ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  }
  function metriche(ctx, px) {
    var m = ctx.measureText('Hg');
    var a = m.fontBoundingBoxAscent, d = m.fontBoundingBoxDescent;
    if (!(a > 0)) { a = px * 1.006; d = px * 0.274; }   // metriche di Lora, se il browser non le fornisce
    return { a: a, d: d };
  }
  // spaziatura tra le lettere del testo principale: 0,002 em, come nelle anteprime (dove il browser la supporta)
  function spaziatura(ctx, px) { if ('letterSpacing' in ctx) ctx.letterSpacing = (px * 0.002) + 'px'; }
  function spezza(ctx, testo, larghezza) {
    var parole = testo.split(' '), righe = [], corrente = '', troppoLunga = false;
    parole.forEach(function (p) {
      var prova = corrente ? corrente + ' ' + p : p;
      if (ctx.measureText(prova).width <= larghezza || !corrente) {
        corrente = prova;
      } else {
        righe.push(corrente);
        corrente = p;
      }
    });
    if (corrente) righe.push(corrente);
    righe.forEach(function (r) { if (ctx.measureText(r).width > larghezza + 0.5) troppoLunga = true; });
    return { righe: righe, troppoLunga: troppoLunga };
  }
  // Dimensione del testo principale: la più grande tra 76 e 56 px che resta nei margini e sopra il filetto
  function adatta(ctx, testo) {
    for (var px = MAX_PX; px >= MIN_PX; px--) {
      var rapporto = 1.44 + (px - MIN_PX) * (0.02 / (MAX_PX - MIN_PX));   // 1,46 a 76 px, 1,44 a 56 px (come le anteprime)
      ctx.font = '400 ' + px + 'px Lora, Georgia, serif';
      spaziatura(ctx, px);
      var s = spezza(ctx, testo, LARGH_TESTO);
      var fondo = TOP_TESTO + s.righe.length * px * rapporto;
      if (!s.troppoLunga && fondo <= MAX_FONDO_TESTO) return { px: px, interlinea: px * rapporto, righe: s.righe, fondo: fondo, entra: true };
    }
    px = MIN_PX;
    rapporto = 1.44;
    ctx.font = '400 ' + px + 'px Lora, Georgia, serif';
    spaziatura(ctx, px);
    var u = spezza(ctx, testo, LARGH_TESTO);
    return { px: px, interlinea: px * rapporto, righe: u.righe, fondo: TOP_TESTO + u.righe.length * px * rapporto, entra: false };
  }
  // Testo con spaziatura tra le lettere (letter-spacing dell'anteprima: 0,06 em)
  function disegnaSpaziato(ctx, testo, x, y, spazio) {
    if ('letterSpacing' in ctx) {
      ctx.letterSpacing = spazio + 'px';
      ctx.fillText(testo, x, y);
      ctx.letterSpacing = '0px';
      return x + ctx.measureText(testo).width + spazio * testo.length;
    }
    for (var i = 0; i < testo.length; i++) {
      ctx.fillText(testo[i], x, y);
      x += ctx.measureText(testo[i]).width + spazio;
    }
    return x;
  }

  function disegna(d, tela, francobollo) {
    var ctx = tela.getContext('2d');
    ctx.clearRect(0, 0, W, H);
    // sfondo crema con sfumature rosa
    ctx.fillStyle = '#f6ecdf';
    ctx.fillRect(0, 0, W, H);
    ellisse(ctx, 0.85 * W, 0.30 * H, 700, 600, '246,222,200', 0.55);
    ellisse(ctx, 0.95 * W, 0.92 * H, 1000, 800, '232,196,176', 0.40);
    ellisse(ctx, 0.12 * W, 0.08 * H, 900, 700, '236,190,180', 0.42);
    return caricaImmagine('img/carta/carta.webp').then(function (carta) {
      // texture di carta (stessa dell'app), a 256 px, sovrapposta in moltiplicazione
      var t = document.createElement('canvas');
      t.width = 256; t.height = 256;
      t.getContext('2d').drawImage(carta, 0, 0, 256, 256);
      ctx.save();
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = ctx.createPattern(t, 'repeat');
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // doppia cornice sottile
      ctx.lineWidth = 2;
      ctx.strokeStyle = 'rgba(189,169,157,0.65)';
      rettArrotondato(ctx, 65, 65, 950, 1790, 9);
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(189,169,157,0.38)';
      rettArrotondato(ctx, 80.5, 80.5, 919, 1759, 6);
      ctx.stroke();
      // francobollo (196 px di larghezza, inclinato di 2,2°)
      var fw = 196, fh = fw * francobollo.naturalHeight / francobollo.naturalWidth;
      ctx.save();
      ctx.translate(756 + fw / 2, 300 + fh / 2);
      ctx.rotate(2.2 * Math.PI / 180);
      ctx.shadowColor = 'rgba(59,42,58,0.22)';
      ctx.shadowOffsetY = 2;
      ctx.shadowBlur = 6;
      ctx.drawImage(francobollo, -fw / 2, -fh / 2, fw, fh);
      ctx.restore();
      // frase
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      var ad = adatta(ctx, d.frase);
      ctx.fillStyle = TESTO;
      ctx.font = '400 ' + ad.px + 'px Lora, Georgia, serif';
      spaziatura(ctx, ad.px);
      var mt = metriche(ctx, ad.px);
      var asc = Math.round(mt.a), disc = Math.round(mt.d);
      ad.righe.forEach(function (r, i) {
        ctx.fillText(r, MARGINE, Math.round(TOP_TESTO + i * ad.interlinea) + Math.floor((ad.interlinea - (asc + disc)) / 2) + asc);
      });
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      // filetto rosa antico
      ctx.fillStyle = 'rgba(185,120,111,0.75)';
      ctx.fillRect(MARGINE, 1332, 96, 2);
      // nome dell'app
      ctx.fillStyle = '#7a4d5c';
      ctx.font = 'italic 400 42px Lora, Georgia, serif';
      ctx.fillText(NOME_APP, MARGINE, 1378 + metriche(ctx, 42).a);
      // riferimento al libro (solo per le citazioni del libro e per i messaggi nascosti)
      if (d.attribuzione === 'libro') {
        ctx.fillStyle = '#6b5566';
        ctx.font = 'italic 400 29px Lora, Georgia, serif';
        var y = 1458 + metriche(ctx, 29).a, sp = 29 * 0.06;
        var x = disegnaSpaziato(ctx, TITOLO_LIBRO, MARGINE, y, sp);
        ctx.font = '400 29px Lora, Georgia, serif';
        disegnaSpaziato(ctx, ' · ' + AUTRICE, x, y, sp);
      }
      return ad;
    });
  }

  /* Genera la cartolina: restituisce { tela, blob, testo, info } */
  function genera(tipo, id) {
    var d = contenutoPer(tipo, id);
    if (!d) return Promise.reject(new Error('contenuto non previsto'));
    var tela = document.createElement('canvas');
    tela.width = W; tela.height = H;
    return Promise.all([caricaFont(), caricaImmagine(d.francobollo)]).then(function (r) {
      return disegna(d, tela, r[1]);
    }).then(function (info) {
      return new Promise(function (ok, no) {
        tela.toBlob(function (blob) {
          if (blob) ok({ tela: tela, blob: blob, testo: testoCondivisione(tipo, id), frase: d.frase, info: info });
          else no(new Error('immagine non creata'));
        }, 'image/png');
      });
    });
  }

  /* ---------- Pannello di condivisione ---------- */
  var aperto = null;
  function chiudi() {
    if (!aperto) return;
    var a = aperto;
    aperto = null;
    document.removeEventListener('keydown', tasto, true);
    clearTimeout(a.timer);
    if (a.url) { try { URL.revokeObjectURL(a.url); } catch (e) { /* nessuna conseguenza */ } }
    if (a.el.parentNode) a.el.parentNode.removeChild(a.el);
    document.body.classList.remove('cartolina-aperta');
    if (a.ritorno && a.ritorno.focus) { try { a.ritorno.focus({ preventScroll: true }); } catch (e) { a.ritorno.focus(); } }
  }
  function tasto(e) {
    if (!aperto) return;
    if (e.key === 'Escape') { e.preventDefault(); chiudi(); return; }
    if (e.key === 'Tab') {   // il focus resta dentro il pannello
      var f = aperto.el.querySelectorAll('button:not([disabled])');
      if (!f.length) return;
      var primo = f[0], ultimo = f[f.length - 1];
      if (e.shiftKey && document.activeElement === primo) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primo.focus(); }
      else if (!aperto.el.contains(document.activeElement)) { e.preventDefault(); primo.focus(); }
    }
  }
  window.addEventListener('hashchange', chiudi);

  function copiaTesto(testo) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(testo).catch(function () { return copiaVecchioMetodo(testo); });
    }
    return copiaVecchioMetodo(testo);
  }
  function copiaVecchioMetodo(testo) {
    return new Promise(function (ok, no) {
      var t = document.createElement('textarea');
      t.value = testo;
      t.setAttribute('readonly', '');
      t.style.position = 'fixed';
      t.style.top = '0';
      t.style.opacity = '0';
      document.body.appendChild(t);
      t.select();
      try { t.setSelectionRange(0, testo.length); } catch (e) { /* non supportato */ }
      var riuscito = false;
      try { riuscito = document.execCommand('copy'); } catch (e) { riuscito = false; }
      document.body.removeChild(t);
      if (riuscito) ok(); else no(new Error('copia non riuscita'));
    });
  }
  function scaricaBlob(blob) {
    return new Promise(function (ok, no) {
      try {
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'per-tutte-le-volte-cartolina.png';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
        ok();
      } catch (e) { no(e); }
    });
  }
  function puoCondividereImmagine(file) {
    try { return !!(navigator.share && navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) { return false; }
  }

  function apriPannello(r, ritorno) {
    chiudi();
    var file = null;
    try { file = new File([r.blob], 'per-tutte-le-volte-cartolina.png', { type: 'image/png' }); } catch (e) { file = null; }
    var nativa = !!file && puoCondividereImmagine(file);

    var o = el('div', 'cartolina-dialogo');
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-modal', 'true');
    var p = el('div', 'cartolina-pannello');
    if (nativa) {
      o.setAttribute('aria-label', 'Condividi come cartolina');
    } else {
      var h = el('h2', 'cartolina-titolo', 'Condividi questa cartolina');
      h.id = 'cartolina-titolo';
      o.setAttribute('aria-labelledby', 'cartolina-titolo');
      p.appendChild(h);
    }
    var url = URL.createObjectURL(r.blob);
    var img = document.createElement('img');
    img.className = 'cartolina-immagine';
    img.src = url;
    img.alt = r.frase;
    img.width = 540; img.height = 960;
    p.appendChild(img);

    var esito = el('p', 'cartolina-esito');
    esito.setAttribute('role', 'status');
    var timer = null;
    function messaggio(t) {
      esito.textContent = t;
      esito.classList.remove('visibile');
      void esito.offsetWidth;
      esito.classList.add('visibile');
      clearTimeout(timer);
      timer = setTimeout(function () { esito.classList.remove('visibile'); }, 4000);
      if (aperto) aperto.timer = timer;
    }
    var azioni = el('div', 'cartolina-azioni');
    function bottone(testo) {
      var b = el('button', 'pulsante', testo);
      b.type = 'button';
      azioni.appendChild(b);
      return b;
    }
    var primo = null;
    if (nativa) {
      var bc = bottone('Condividi come cartolina');
      primo = bc;
      bc.addEventListener('click', function () {
        var dati = { files: [file], text: r.testo };
        navigator.share(dati).catch(function () { /* annullata o non riuscita: restano gli altri pulsanti */ });
      });
    }
    var bt = bottone('Copia il testo');
    var bs = bottone('Scarica la cartolina');
    var bx = bottone('Chiudi');
    if (!primo) primo = bt;
    bt.addEventListener('click', function () {
      copiaTesto(r.testo).then(function () { messaggio('Testo copiato.'); },
        function () { messaggio('Non è stato possibile copiare il testo.'); });
    });
    bs.addEventListener('click', function () {
      scaricaBlob(r.blob).then(function () { messaggio('Cartolina scaricata.'); },
        function () { messaggio('Non è stato possibile scaricare la cartolina. Riprova.'); });
    });
    bx.addEventListener('click', chiudi);
    p.appendChild(esito);
    p.appendChild(azioni);
    o.appendChild(p);
    o.addEventListener('click', function (e) { if (e.target === o) chiudi(); });
    document.body.appendChild(o);
    document.body.classList.add('cartolina-aperta');
    aperto = { el: o, ritorno: ritorno, url: url, timer: null };
    document.addEventListener('keydown', tasto, true);
    try { primo.focus({ preventScroll: true }); } catch (e) { primo.focus(); }
  }

  /* ---------- Pulsante «Condividi come cartolina» ---------- */
  function pulsante(tipo, id) {
    var riga = el('p', 'tieni-riga cartolina-riga');
    var b = el('button', 'pulsante cartolina-bottone', 'Condividi come cartolina');
    b.type = 'button';
    var esito = el('span', 'tieni-esito cartolina-esito-bottone');
    esito.setAttribute('role', 'status');
    var occupato = false;
    b.addEventListener('click', function () {
      if (occupato) return;
      occupato = true;
      b.setAttribute('aria-busy', 'true');
      esito.textContent = '';
      genera(tipo, id).then(function (r) {
        apriPannello(r, b);
      }).catch(function () {
        esito.textContent = 'Non è stato possibile scaricare la cartolina. Riprova.';
        esito.classList.add('visibile');
        setTimeout(function () { esito.classList.remove('visibile'); }, 4000);
      }).then(function () {
        occupato = false;
        b.removeAttribute('aria-busy');
      });
    });
    riga.appendChild(b);
    riga.appendChild(esito);
    return riga;
  }

  window.Cartolina = {
    pulsante: pulsante,
    genera: genera,
    testoCondivisione: testoCondivisione,
    contenutoPer: contenutoPer,
    chiudi: chiudi
  };
})();
