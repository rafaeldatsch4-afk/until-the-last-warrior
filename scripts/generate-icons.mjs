import { writeFileSync } from 'fs';
import { ICON_192_ANY, ICON_512_ANY, ICON_192_MASKABLE, ICON_512_MASKABLE } from './icon-data.mjs';

const icons = {
  'public/icon-192-any.png': ICON_192_ANY,
  'public/icon-512-any.png': ICON_512_ANY,
  'public/icon-192-maskable.png': ICON_192_MASKABLE,
  'public/icon-512-maskable.png': ICON_512_MASKABLE,
};

for (const [path, base64Data] of Object.entries(icons)) {
  const buffer = Buffer.from(base64Data, 'base64');
  writeFileSync(path, buffer);
  console.log(`Gerado: ${path} (${(buffer.length / 1024).toFixed(1)} KB)`);
}

console.log('Todos os ícones foram gerados a partir do base64!');
