import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { prepareRelease, sha256, isMain } from './prepare-release.mjs';

const matchesMime = (actual, expected) => actual === expected || (expected === 'text/javascript' && actual === 'application/javascript') || (expected === 'image/x-icon' && actual === 'image/vnd.microsoft.icon');

export async function verifyDeployment({ dir = resolve('dist'), url = 'https://hanayukii.github.io/sorachi/', timeoutMs = 10000 } = {}) {
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1) throw new Error('timeoutMs must be a positive integer');
  const base = new URL(url);
  if (!['https:', 'http:'].includes(base.protocol) || base.username || base.password || base.search || base.hash) throw new Error('Use an HTTP(S) base URL without credentials, query or hash');
  if (!base.pathname.endsWith('/')) base.pathname += '/';
  const manifest = await prepareRelease({ dir, check: true });
  const releaseBytes = await readFile(join(dir, 'release.json'));
  const files = [...manifest.files, { path: 'release.json', bytes: releaseBytes.length, sha256: sha256(releaseBytes), mime: 'application/json' }];
  for (const file of files) {
    const target = new URL(file.path.split('/').map(encodeURIComponent).join('/'), base);
    const response = await fetch(target, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
    if (response.status !== 200) throw new Error(`${file.path}: expected HTTP 200, got ${response.status}`);
    const mime = (response.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (file.mime && !matchesMime(mime, file.mime)) throw new Error(`${file.path}: MIME ${mime || '(missing)'}; expected ${file.mime}`);
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== file.bytes || sha256(bytes) !== file.sha256) throw new Error(`${file.path}: deployed bytes do not match release ${manifest.buildId}`);
  }
  // Hash routes exist only in the client: HTTP cannot prove that #travel or #study renders.
  const missing = await fetch(new URL(`__sorachi_missing_${manifest.buildId}.txt`, base), { signal: AbortSignal.timeout(timeoutMs), redirect: 'error' });
  await missing.body?.cancel();
  if (missing.status !== 404) throw new Error(`Missing resource must return HTTP 404, got ${missing.status}`);
  // Also verify the public directory entry, which can differ from /index.html on a host.
  const root = await fetch(base, { signal: AbortSignal.timeout(timeoutMs), redirect: 'error', headers: { 'Cache-Control': 'no-cache' } });
  const index = manifest.files.find((file) => file.path === 'index.html');
  if (root.status !== 200 || !matchesMime((root.headers.get('content-type') || '').split(';')[0].trim(), 'text/html') || sha256(Buffer.from(await root.arrayBuffer())) !== index.sha256) throw new Error('Site root does not serve the expected index.html');
  return { buildId: manifest.buildId, files: files.length, url: base.href };
}

// Pages usually finishes 20–60 s after a push; retry until the exact build is served.
export async function verifyWithRetry({ attempts = 18, intervalMs = 10000, log = console.error, verify = verifyDeployment, wait = delay, ...options } = {}) {
  for (let attempt = 1; ; attempt++) {
    try { return await verify(options); }
    catch (error) {
      if (attempt >= attempts) throw error;
      log(`Attempt ${attempt}/${attempts}: ${error.message}`);
      await wait(intervalMs);
    }
  }
}

if (isMain(import.meta.url)) {
  try {
    const options = {}, args = process.argv.slice(2);
    let attempts = 1, intervalMs = 5000;
    while (args.length) {
      const key = args.shift(), value = args.shift();
      if (key === '--url' && value) options.url = value;
      // --dir verifies a checkout other than ./dist, e.g. the good commit after an emergency rollback.
      else if (key === '--dir' && value) options.dir = resolve(value, 'dist');
      else if (['--attempts', '--interval-ms', '--timeout-ms'].includes(key) && /^\d+$/.test(value || '')) {
        const number = Number(value);
        if (!Number.isSafeInteger(number) || number < 1) throw new Error(`Invalid ${key}`);
        if (key === '--attempts') attempts = number;
        else if (key === '--interval-ms') intervalMs = number;
        else options.timeoutMs = number;
      } else throw new Error('Usage: node scripts/verify-deploy.mjs [--url URL] [--dir CHECKOUT] [--attempts N] [--interval-ms N] [--timeout-ms N]');
    }
    if (attempts > 60 || intervalMs > 60000 || (options.timeoutMs || 10000) > 60000) throw new Error('Limits: 60 attempts, 60000 ms interval/timeout');
    const result = await verifyWithRetry({ attempts, intervalMs, ...options });
    console.log(`Verified ${result.files} files, root and missing-resource 404: ${result.buildId}`);
    console.log('Hash-route rendering, interactions and audio still require browser QA.');
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
