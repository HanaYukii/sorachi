import { readFile, writeFile, readdir, mkdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, join, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { renderPages } from './render-pages.mjs';

export const sha256 = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const mimeFor = (name) => ({ '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain', '.xml': 'application/xml' }[extname(name)] || null);
export const isMain = (url) => Boolean(process.argv[1]) && pathToFileURL(resolve(process.argv[1])).href === url;

async function filesUnder(dir, prefix = '') {
  const files = [];
  for (const entry of await readdir(join(dir, prefix), { withFileTypes: true })) {
    if (entry.name === '.DS_Store' || (prefix === '' && entry.name === 'release.json')) continue;
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Publishable symlinks are unsupported: ${path}`);
    if (entry.isDirectory()) files.push(...await filesUnder(dir, path));
    else if (entry.isFile()) files.push(path);
  }
  return files.sort();
}

export async function prepareRelease({ dir = resolve('dist'), check = false } = {}) {
  dir = resolve(dir);
  const oldPaths = await filesUnder(dir);
  const originals = new Map(await Promise.all(oldPaths.map(async (path) => [path, await readFile(join(dir, path))])));
  const contents = renderPages(originals);
  const paths = [...contents.keys()].sort();
  if (!contents.has('index.html')) throw new Error('Missing dist/index.html');
  for (const page of paths.filter(path => path.endsWith('.html'))) {
    const html = contents.get(page).toString().replace(/<(?:script|link)\b[^>]*>/gi, (tag) => tag.replace(/\b(src|href)\s*=\s*(["'])(.*?)\2/gi, (attribute, key, quote, raw) => {
      const ref = raw.replaceAll('&amp;', '&');
      if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(ref)) return attribute;
      const url = new URL(ref, 'https://release.invalid/');
      if (!/\.(?:m?js|css)$/i.test(url.pathname)) return attribute;
      if (ref.startsWith('/') || ref.split(/[?#]/)[0].split('/').includes('..')) throw new Error(`Use a relative local asset path: ${ref}`);
      const path = decodeURIComponent(url.pathname.slice(1));
      if (!contents.has(path)) throw new Error(`Missing referenced asset: ${path}`);
      url.searchParams.set('v', sha256(contents.get(path)).slice(0, 10));
      const updated = ref.split(/[?#]/)[0] + url.search + url.hash;
      return `${key}=${quote}${updated.replaceAll('&', '&amp;')}${quote}`;
    }));
    contents.set(page, Buffer.from(html));
  }
  // Every entry page compares the same build marker with the root update check.
  const versionTag = /<meta name="sorachi-version" content="[^"]*" \/>/g;
  for (const path of paths.filter(path => path.endsWith('.html'))) contents.set(path, Buffer.from(contents.get(path).toString().replace(versionTag, '<meta name="sorachi-version" content="" />')));
  const version = sha256(JSON.stringify(paths.map(path => [path, sha256(contents.get(path))])));
  for (const path of paths.filter(path => path.endsWith('.html'))) contents.set(path, Buffer.from(contents.get(path).toString().replace(versionTag, `<meta name="sorachi-version" content="${version}" />`)));
  const files = paths.map((path) => ({ path, sha256: sha256(contents.get(path)), bytes: contents.get(path).length, mime: mimeFor(path) }));
  const manifest = { schemaVersion: 1, buildId: sha256(JSON.stringify(files)), files };
  const serialized = JSON.stringify(manifest, null, 2) + '\n';
  if (check) {
    if (oldPaths.length !== paths.length || paths.some(path => !originals.get(path)?.equals(contents.get(path)))) throw new Error('Stale static pages or asset hashes; run node scripts/prepare-release.mjs');
    let saved;
    try { saved = await readFile(join(dir, 'release.json'), 'utf8'); } catch { throw new Error('Missing release.json; run node scripts/prepare-release.mjs'); }
    if (saved !== serialized) throw new Error('Stale release.json; run node scripts/prepare-release.mjs');
  } else {
    for (const path of oldPaths.filter(path => !contents.has(path))) await rm(join(dir, path));
    for (const path of paths) { await mkdir(dirname(join(dir, path)), { recursive: true }); await writeFile(join(dir, path), contents.get(path)); }
    await writeFile(join(dir, 'release.json'), serialized);
  }
  return manifest;
}

if (isMain(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    if (args.some((arg) => arg !== '--check')) throw new Error('Usage: node scripts/prepare-release.mjs [--check]');
    const manifest = await prepareRelease({ check: args.includes('--check') });
    console.log(`${args.includes('--check') ? 'Verified' : 'Prepared'} release ${manifest.buildId} (${manifest.files.length} files)`);
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
