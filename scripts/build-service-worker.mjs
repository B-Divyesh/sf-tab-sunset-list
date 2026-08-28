import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const siteRoot = new URL('../dist/site/', import.meta.url);
const template = await readFile(new URL('../site/sw.template.js', import.meta.url), 'utf8');

async function filesBelow(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesBelow(path) : [path];
  }));
  return nested.flat();
}

const rootPath = siteRoot.pathname;
const assetFiles = await filesBelow(join(rootPath, 'assets'));
const shell = [
  '/',
  '/privacy/',
  '/terms/',
  '/favicon.svg',
  '/assets/sunset-horizon-768.webp',
  '/assets/sunset-horizon-1536.webp',
  ...assetFiles.map((file) => `/${relative(rootPath, file).replaceAll('\\', '/')}`),
].filter((value, index, values) => values.indexOf(value) === index).sort();

const releaseMaterial = await Promise.all(shell.map(async (path) => {
  if (path === '/' || path.endsWith('/')) return `${path}:${await readFile(join(rootPath, path === '/' ? 'index.html' : `${path.slice(1)}index.html`))}`;
  return `${path}:${await readFile(join(rootPath, path.slice(1)))}`;
}));
const release = createHash('sha256').update(releaseMaterial.join('\n')).digest('hex').slice(0, 12);
const rendered = template
  .replace('__CACHE_NAME__', `tab-sunset-list-${release}`)
  .replace('__SHELL_ASSETS__', JSON.stringify(shell));

await writeFile(join(rootPath, 'sw.js'), rendered);
