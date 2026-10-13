// Estrae da index.html i testi che vanno detti a voce e li scrive in voce/testi.json
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const src = fs.readFileSync(path.join(root, 'index.html'), 'utf8');

function blocco(nome) {
  const i = src.indexOf('var ' + nome + '=[');
  if (i < 0) throw new Error('non trovo ' + nome);
  let j = src.indexOf('[', i), liv = 0, k = j;
  for (; k < src.length; k++) {
    if (src[k] === '[') liv++;
    else if (src[k] === ']') { liv--; if (liv === 0) break; }
  }
  return eval(src.slice(j, k + 1));
}

const POI = blocco('POI');
const ROUTES = blocco('ROUTES');

const clip = [];
const vis = new Set();
function agg(id, testo) {
  if (!testo || vis.has(id)) return;
  vis.add(id);
  clip.push({ id, testo: String(testo).trim() });
}

POI.forEach((p, n) => {
  const b = 'poi-' + String(n + 1).padStart(2, '0');
  agg(b + '-nome', p.n);
  agg(b + '-intro', (p.t || '') + (p.y ? ' del ' + p.y : ''));
  agg(b + '-scheda', p.d);
  agg(b + '-dentro', p.i);
});
ROUTES.forEach((r) => agg('percorso-' + r.id, r.n));

// spezzoni fissi, uguali a quelli che l'app compone a voce
['dritto davanti', 'sulla destra', 'sulla sinistra', 'proprio a destra',
 'proprio a sinistra', 'indietro a destra', 'indietro a sinistra',
 'alle tue spalle'].forEach((t) => agg('dir-' + t.replace(/ /g, '-'), t));

agg('m-passi', 'a pochi passi');

// distanze larghe, per i riferimenti lontani
for (let v = 100; v <= 900; v += 100) agg('dl-' + v, 'a ' + v + ' metri');
for (let v = 1000; v <= 5000; v += 500) {
  const k = Math.floor(v / 1000), mezzo = (v % 1000) >= 500;
  const nome = ['', 'un', 'due', 'tre', 'quattro', 'cinque'][k] || k;
  agg('dl-' + v, 'a ' + nome + ' chilometr' + (k === 1 ? 'o' : 'i') + (mezzo ? ' e mezzo' : ''));
}
for (let m = 10; m <= 500; m += 10) agg('m-' + m, 'a ' + m + ' metri');

[['come-cammini', 'Vuoi camminare libero, o seguire un percorso?'],
 ['aiuto', 'Puoi dire: approfondisci, avanti, ripeti, dove sono, oppure ferma.'],
 ['niente-intorno', 'Qui intorno non ho niente da dirti.'],
 ['chiedi', 'Vuoi approfondire, o andiamo avanti?'],
 ['cosa-vedere', 'Cosa vedere:'],
 ['avanti', 'Andiamo avanti.'],
 ['voce-attiva', 'Modalità voce attiva. Ti annuncio ogni luogo che passi, da che parte e a quanti metri.']
].forEach(([k, t]) => agg('frase-' + k, t));

fs.writeFileSync(path.join(__dirname, 'testi.json'), JSON.stringify(clip, null, 1), 'utf8');
console.log('luoghi:', POI.length, '| percorsi:', ROUTES.length, '| clip da generare:', clip.length);
