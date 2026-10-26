import { cp, mkdir, readdir, rm, stat } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// A Vercel recebe somente os arquivos públicos deste projeto.
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
const files = [
  'index.html', 'styles.css', 'builder.css', 'ordering.css', 'ending.css',
  'app.js', 'data.js', 'builder.js', 'ordering.js', 'motion.js', 'cake-3d.mjs',
  'assets', 'vendor'
];

// A limpeza fica limitada ao diretório de saída gerado pelo build.
if (relative(root, output) !== 'dist' || dirname(output) !== root) {
  throw new Error('Diretório de publicação inválido.');
}
for (const file of files) await stat(join(root, file));
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of files) await cp(join(root, file), join(output, file), { recursive: true });

async function measure(directory) {
  let count = 0, bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      const size = await measure(path); count += size.count; bytes += size.bytes;
    } else { count++; bytes += (await stat(path)).size; }
  }
  return { count, bytes };
}
const size = await measure(output);
console.log(`Publicação pronta em dist/: ${size.count} arquivos, ${(size.bytes / 1024 / 1024).toFixed(2)} MB.`);
