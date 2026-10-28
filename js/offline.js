/* Funzionamento offline (W2 §5).
   Registra il service worker solo su indirizzi sicuri (https o localhost).
   Non mostra testi, non tocca i dati salvati (localStorage). */
(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;
  if (location.protocol !== 'https:' && location.protocol !== 'http:') return;
  window.addEventListener('load', function () {
    try {
      navigator.serviceWorker.register('sw.js').catch(function () { /* l'app funziona comunque online */ });
    } catch (e) { /* nessuna conseguenza */ }
  });
})();
