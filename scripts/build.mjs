// Copia i file del sito in dist/, la cartella che l'hosting (Cloudflare Pages) pubblica.
// Il sito è statico: non c'è trasformazione, solo copia.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const OUT = 'dist';
const ITEMS = ['index.html', 'privacy.html', 'css', 'js', 'assets'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const item of ITEMS) {
  cpSync(item, `${OUT}/${item}`, {
    recursive: true,
    // la lettera del committente e la locandina intera non servono online
    filter: (src) => !src.includes(`assets${'/'}src`) && !src.includes(`assets${'\\'}src`) && !src.endsWith('locandina.jpg'),
  });
}
console.log(`Sito copiato in ${OUT}/ (${ITEMS.join(', ')}).`);
