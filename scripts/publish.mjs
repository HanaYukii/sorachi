import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readdir } from 'node:fs/promises';
import { prepareRelease, isMain } from './prepare-release.mjs';
import { verifyWithRetry } from './verify-deploy.mjs';

const exec = promisify(execFile);
// Source and production Pages share one repository; publish only the tested dist subtree.
export const DEPLOY_REMOTE = 'https://github.com/HanaYukii/sorachi.git';
// On failure, put the child's full output in the message so CI logs show which test failed.
export const command = async (bin, args) => {
  try { return (await exec(bin, args, { timeout: 20 * 60 * 1000, maxBuffer: 16 * 1024 * 1024 })).stdout.trim(); }
  catch (error) { throw new Error(`${bin} ${args.join(' ')} failed (${error.signal ? `signal ${error.signal}` : `exit ${error.code ?? 'unknown'}`})\n${error.stdout || ''}${error.stderr || ''}`, { cause: error }); }
};

export async function validateLocal(run = command) {
  await prepareRelease({ check: true });
  for (const file of (await readdir('dist')).filter((file) => /\.(?:m?js)$/.test(file)).sort()) await run('node', ['--check', `dist/${file}`]);
  await run('node', ['scripts/check-content.mjs']);
  const tests = (await readdir('tests')).filter((file) => file.endsWith('.test.mjs')).sort().map((file) => `tests/${file}`);
  if (!tests.length) throw new Error('No tests found');
  await run('node', ['--test', ...tests]);
}

export async function publish({ run = command, validate = () => validateLocal(run), verify = () => verifyWithRetry() } = {}) {
  const clean = async () => {
    if (await run('git', ['status', '--porcelain', '--untracked-files=all'])) throw new Error('Publish requires a clean working tree; prepare, review and commit release files first.');
  };
  await clean();
  if (await run('git', ['branch', '--show-current']) !== 'main') throw new Error('Publish must run from main.');
  const sha = await run('git', ['rev-parse', 'HEAD']);
  const currentRemote = async () => (await run('git', ['ls-remote', '--exit-code', 'origin', 'refs/heads/main'])).split(/\s+/)[0];
  if (await currentRemote() !== sha) throw new Error('Push the current main commit to origin before publishing.');
  await validate();
  const getRuns = async () => JSON.parse(await run('gh', ['run', 'list', '--workflow', 'ci.yml', '--branch', 'main', '--commit', sha, '--event', 'push', '--limit', '10', '--json', 'databaseId,headSha,event,status,conclusion']));
  const runs = await getRuns();
  const ci = runs.find((item) => item.headSha === sha && item.event === 'push');
  if (!ci) throw new Error(`No main push CI run found for ${sha}; wait for GitHub to register it and retry.`);
  if (ci.status !== 'completed') {
    console.log(`Waiting for CI run ${ci.databaseId} at ${sha}…`);
    await run('gh', ['run', 'watch', String(ci.databaseId), '--exit-status', '--interval', '5']);
    const result = JSON.parse(await run('gh', ['run', 'view', String(ci.databaseId), '--json', 'headSha,status,conclusion']));
    if (result.headSha !== sha || result.status !== 'completed' || result.conclusion !== 'success') throw new Error('Exact-commit CI did not succeed.');
  } else if (ci.conclusion !== 'success') throw new Error(`CI ${ci.databaseId} did not succeed: ${ci.conclusion}`);
  await clean();
  if (await run('git', ['branch', '--show-current']) !== 'main' || await run('git', ['rev-parse', 'HEAD']) !== sha || await currentRemote() !== sha) throw new Error('Main changed while waiting for CI; retry with the new commit.');
  await run('git', ['subtree', 'push', '--prefix=dist', DEPLOY_REMOTE, 'gh-pages']);
  console.log(`Pushed dist from tested main ${sha} to ${DEPLOY_REMOTE} gh-pages; waiting for Pages to serve it…`);
  // A cancelled Pages build would otherwise look published; only the served bytes count.
  let result;
  try { result = await verify(); }
  catch (error) { throw new Error(`gh-pages is already pushed from main ${sha}, but Pages did not serve this build yet: ${error.message}\nCheck again later: node scripts/verify-deploy.mjs --attempts 18 --interval-ms 10000`, { cause: error }); }
  console.log(`Published and verified build ${result.buildId} (${result.files} files) from main ${sha}.`);
  return sha;
}

if (isMain(import.meta.url)) {
  try {
    if (process.argv.length > 2) throw new Error('Usage: node scripts/publish.mjs');
    await publish();
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
