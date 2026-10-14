/* Il vecchio indirizzo non ha piu' un'app: ha solo il cartello che manda a
   quello nuovo. Ma chi era passato di qui si e' portato in tasca una copia
   salvata, e quella copia continua a servirsi da sola — il cartello non lo
   vede mai, e resta fermo alla versione di ieri.
   Questo file sostituisce quella copia e la cancella: si installa, butta
   tutto quello che c'era, si disiscrive e manda le pagine aperte al nuovo
   indirizzo. Dopo una volta sola, questo guscio non esiste piu'. */
const NUOVO = 'https://bubunikolic.github.io/yourbea/';

self.addEventListener('install', (e) => { self.skipWaiting(); });

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    try {
      const nomi = await caches.keys();
      await Promise.all(nomi.map((n) => caches.delete(n)));
    } catch (err) {}
    try { await self.registration.unregister(); } catch (err) {}
    try {
      const pagine = await self.clients.matchAll({ type: 'window' });
      for (const p of pagine) {
        try { await p.navigate(NUOVO); } catch (err) { try { p.postMessage({ vai: NUOVO }); } catch (e2) {} }
      }
    } catch (err) {}
  })());
});

/* finche' e' ancora vivo non serve piu' niente dalla copia salvata:
   ogni richiesta va alla rete, cosi' il cartello si vede subito */
self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request).catch(() => new Response(
    '<!doctype html><meta charset="utf-8"><meta http-equiv="refresh" content="0; url=' + NUOVO + '">',
    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )));
});
