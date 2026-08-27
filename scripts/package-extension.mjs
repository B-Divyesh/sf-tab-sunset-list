import { createWriteStream } from 'node:fs';
import { cp, mkdir, stat } from 'node:fs/promises';
import archiver from 'archiver';

const source = '.output/chrome-mv3';
await stat(`${source}/manifest.json`);
await mkdir('dist/extension', { recursive: true });
await mkdir('dist/site/downloads', { recursive: true });
await cp(source, 'dist/extension', { recursive: true });

const output = createWriteStream('dist/site/downloads/tab-sunset-list-chrome.zip');
const archive = archiver('zip', { zlib: { level: 9 } });
const finished = new Promise((resolve, reject) => {
  output.on('close', resolve);
  output.on('error', reject);
  archive.on('error', reject);
});
archive.pipe(output);
archive.directory(source, false);
await archive.finalize();
await finished;

console.log(`Packaged ${archive.pointer()} bytes to dist/site/downloads/tab-sunset-list-chrome.zip`);
