import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'node:http';
import { prepareRelease } from '../scripts/prepare-release.mjs';
import { verifyDeployment } from '../scripts/verify-deploy.mjs';
import { publish } from '../scripts/publish.mjs';

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'sorachi-release-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(join(dir, 'assets'));
  await writeFile(join(dir, 'index.html'), '<link href="./styles.css"><script src="./content.js?v=old"></script><script src="./storage.js?mode=x&amp;v=old#init"></script>');
  await writeFile(join(dir, 'styles.css'), 'body { color: purple; }');
  await writeFile(join(dir, 'content.js'), 'const lessons = [];');
  await writeFile(join(dir, 'storage.js'), 'const storage = {};');
  await writeFile(join(dir, 'assets', 'friend.png'), Buffer.from([137, 80, 78, 71]));
  await writeFile(join(dir, '.nojekyll'), '');
  return dir;
}

test('release updates every local JS/CSS reference and is deterministic', async (t) => {
  const dir = await fixture(t);
  await assert.rejects(prepareRelease({ dir, check: true }), /stale|missing/i);
  const manifest = await prepareRelease({ dir });
  const html = await readFile(join(dir, 'index.html'), 'utf8');
  assert.match(html, /styles\.css\?v=[a-f0-9]{10}/);
  assert.match(html, /content\.js\?v=[a-f0-9]{10}/);
  assert.match(html, /storage\.js\?mode=x&amp;v=[a-f0-9]{10}#init/);
  assert.equal(manifest.files.length, 6);
  assert.ok(manifest.files.some((f) => f.path === '.nojekyll'));
  assert.ok(!manifest.files.some((f) => f.path === 'release.json'));
  assert.deepEqual(await prepareRelease({ dir, check: true }), manifest);
  assert.deepEqual(await prepareRelease({ dir }), manifest);
  await writeFile(join(dir, 'assets', 'friend.png'), 'changed');
  await assert.rejects(prepareRelease({ dir, check: true }), /stale/i);
  assert.notEqual((await prepareRelease({ dir })).buildId, manifest.buildId);
});

test('check never writes and rejects a missing referenced asset', async (t) => {
  const dir = await fixture(t);
  const original = await readFile(join(dir, 'index.html'), 'utf8');
  await assert.rejects(prepareRelease({ dir, check: true }));
  assert.equal(await readFile(join(dir, 'index.html'), 'utf8'), original);
  await rm(join(dir, 'storage.js'));
  await assert.rejects(prepareRelease({ dir }), /storage\.js/);
  assert.equal(await readFile(join(dir, 'index.html'), 'utf8'), original);
});

test('live verification rejects wrong bytes, MIME, status, fallback 200 and timeout', async (t) => {
  const dir = await fixture(t);
  await prepareRelease({ dir });
  let mode = 'good';
  const server = createServer(async (req, res) => {
    const path = new URL(req.url, 'http://localhost').pathname.replace(/^\/site\//, '') || 'index.html';
    if (mode === 'timeout' && path === 'index.html') return;
    try {
      let bytes = await readFile(join(dir, path));
      if (mode === 'bytes' && path === 'content.js') bytes = Buffer.from('old content');
      res.statusCode = mode === 'status' && path === 'content.js' ? 500 : 200;
      res.setHeader('Content-Type', mode === 'mime' && path === 'content.js' ? 'text/html' : path.endsWith('.js') ? 'text/javascript' : path.endsWith('.css') ? 'text/css' : path.endsWith('.json') ? 'application/json' : path.endsWith('.png') ? 'image/png' : path.endsWith('.html') ? 'text/html' : 'application/octet-stream');
      res.end(bytes);
    } catch {
      res.statusCode = mode === 'fallback' ? 200 : 404;
      res.end('missing');
    }
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  t.after(() => { server.closeAllConnections(); server.close(); });
  const url = `http://127.0.0.1:${server.address().port}/site/`;
  const result = await verifyDeployment({ dir, url, timeoutMs: 1000 });
  assert.equal(result.files, 7);
  for (mode of ['bytes', 'mime', 'status', 'fallback']) {
    await assert.rejects(verifyDeployment({ dir, url, timeoutMs: 1000 }), undefined, mode);
  }
  mode = 'timeout';
  await assert.rejects(verifyDeployment({ dir, url, timeoutMs: 50 }), /timeout|abort/i);
});

test('publish refuses dirty state and never pushes after failed exact-SHA CI', async () => {
  const calls = [];
  const run = async (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (args[0] === 'status') return ' M dist/app.js';
    throw new Error('unexpected command');
  };
  await assert.rejects(publish({ run }), /clean/i);
  assert.equal(calls.length, 1);
  const sha = 'a'.repeat(40);
  const ciCalls = [];
  const failedCI = async (cmd, args) => {
    ciCalls.push([cmd, ...args].join(' '));
    if (args[0] === 'status') return '';
    if (args[0] === 'branch') return 'main';
    if (args[0] === 'rev-parse') return sha;
    if (args[0] === 'ls-remote') return `${sha}\trefs/heads/main`;
    if (cmd === 'gh' && args[1] === 'list') return JSON.stringify([{ databaseId: 42, headSha: sha, event: 'push', status: 'completed', conclusion: 'failure' }]);
    throw new Error('unexpected command');
  };
  await assert.rejects(publish({ run: failedCI, validate: async () => {} }), /CI/i);
  assert.ok(!ciCalls.some((c) => c.includes('subtree')));
  assert.ok(ciCalls.some((c) => c.includes(`--commit ${sha}`)));
});

test('publish waits for exact CI and rechecks main before subtree push', async () => {
  const sha = 'b'.repeat(40);
  let remoteReads = 0, changed = false;
  const calls = [];
  const run = async (cmd, args) => {
    calls.push([cmd, ...args].join(' '));
    if (args[0] === 'status') return '';
    if (args[0] === 'branch') return 'main';
    if (args[0] === 'rev-parse') return sha;
    if (args[0] === 'ls-remote') return `${changed && ++remoteReads > 1 ? 'c'.repeat(40) : sha}\trefs/heads/main`;
    if (args[0] === 'subtree') return '';
    if (cmd === 'gh' && args[1] === 'list') return JSON.stringify([{ databaseId: 7, headSha: sha, event: 'push', status: 'in_progress', conclusion: null }]);
    if (cmd === 'gh' && args[1] === 'watch') return '';
    if (cmd === 'gh' && args[1] === 'view') return JSON.stringify({ headSha: sha, status: 'completed', conclusion: 'success' });
    throw new Error(`unexpected command: ${cmd} ${args}`);
  };
  assert.equal(await publish({ run, validate: async () => {} }), sha);
  assert.ok(calls.findIndex((c) => c.includes('run watch 7')) < calls.findIndex((c) => c.includes('subtree push')));
  calls.length = 0;
  changed = true;
  await assert.rejects(publish({ run, validate: async () => {} }), /changed/i);
  assert.ok(!calls.some((c) => c.includes('subtree')));
});
