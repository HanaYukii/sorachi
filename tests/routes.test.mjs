import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFile, mkdtemp, cp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { prepareRelease } from '../scripts/prepare-release.mjs';

const content = await readFile(new URL('../dist/content.js', import.meta.url), 'utf8');
const source = await readFile(new URL('../dist/routes.js', import.meta.url), 'utf8');
function setup(address = 'https://sorachi.app/') {
  const location = new URL(address), replacements = [], head = new Map();
  const document = {title:'', querySelector(selector) { return {setAttribute(attr,value) { head.set(`${selector}:${attr}`,value); }}; }};
  const state = {from:'#grammar',feedback:{back:'#grammar'}};
  const ctx = vm.createContext({location,document,window:{history:{state,replaceState(value,_title,target){assert.equal(value,state); replacements.push(target); location.href = new URL(target,location).href;}}}});
  vm.runInContext(content + '\n' + source,ctx);
  return {routes:vm.runInContext('Routes',ctx),location,replacements,head,document};
}
test('every registered route has a unique reloadable path and round trips to its stable ID', () => {
  const {routes}=setup(), paths=new Set();
  for(const id of routes.ids()) {
    const path=routes.path(id); assert.ok(!paths.has(path),path); paths.add(path);
    assert.equal(routes.fromPath(path),id); assert.equal(routes.current({pathname:path,hash:''}),id);
    assert.equal(routes.fromPath(path+'index.html'),id);
    assert.equal(routes.metadata(id).canonical,'https://sorachi.app'+path);
  }
  assert.equal(routes.path('#home'),'/');
  assert.equal(routes.path('#study/g-identity'),'/study/g-identity/');
  assert.equal(routes.fromPath('/%E0%A4'), '#not-found');
  assert.equal(routes.known(routes.fromPath('/no-such-course/')),false);
});
test('legacy fragments replace the address without discarding history state or duplicating entries', () => {
  for(const [address,target] of [['https://sorachi.app/#grammar','/grammar/'],['https://sorachi.app/#study/g-identity','/study/g-identity/'],['https://sorachi.app/?source=guide#home','/?source=guide'],['https://sorachi.app/grammar','/grammar/']]) {
    const b=setup(address); b.routes.normalize(); assert.deepEqual(b.replacements,[target]);
    assert.equal(b.location.hash,''); b.routes.normalize(); assert.equal(b.replacements.length,1);
  }
});
test('routing leaves provider fragments and query codes for the authentication SDK', () => {
  for(const fragment of ['#access_token=test-only&refresh_token=example','#error=server_error&error_description=test-only']) {
    const b=setup('https://sorachi.app/'+fragment);b.routes.normalize();
    assert.equal(b.routes.current(),'#account');assert.equal(b.location.hash,fragment);assert.equal(b.replacements.length,0);
  }
  const b=setup('https://sorachi.app/?code=test-only#account');b.routes.normalize();
  assert.equal(b.location.href,'https://sorachi.app/account/?code=test-only');
});
test('HTML links use paths while external links and document anchors keep their meaning', () => {
  const {routes}=setup();
  assert.equal(routes.links('<a href="#grammar">文法</a><a href="#main">內容</a><a href="https://example.test/#grammar">外部</a>'),'<a href="/grammar/">文法</a><a href="#main">內容</a><a href="https://example.test/#grammar">外部</a>');
});
test('head metadata follows the visible route; personal utilities are not indexed', () => {
  const b=setup();b.routes.updateMeta('#study/g-question');
  assert.match(b.document.title,/疑問句/);
  assert.equal(b.head.get('link[rel="canonical"]:href'),'https://sorachi.app/study/g-question/');
  assert.equal(b.head.get('meta[property="og:title"]:content'),b.document.title);
  for(const id of ['#account','#history','#feedback','#settings','#travel/favorites','#kana-review']) assert.equal(b.routes.metadata(id).robots,'noindex,follow');
  assert.equal(b.routes.metadata('#grammar').robots,'index,follow');
});
test('release emits real HTML and a sitemap from the same route list and detects drift', async t => {
  const dir=await mkdtemp(join(tmpdir(),'sorachi-routes-')); t.after(()=>rm(dir,{recursive:true,force:true}));
  await cp(new URL('../dist/',import.meta.url),dir,{recursive:true});
  const release=await prepareRelease({dir}), {routes}=setup();
  const sitemap=await readFile(join(dir,'sitemap.xml'),'utf8');
  for(const id of routes.ids()) {
    const meta=routes.metadata(id), file=id==='#home'?'index.html':meta.path.slice(1)+'index.html';
    const html=await readFile(join(dir,file),'utf8');
    assert.ok(html.includes(`<link rel="canonical" href="${meta.canonical}"`),file);
    assert.ok(html.includes(`<meta name="robots" content="${meta.robots}"`),file);
    assert.ok(html.includes('<base href="/" />'),file);
    assert.ok(html.includes('<h1>'),file);assert.doesNotMatch(html,/href="#(?:home|kana|grammar|study\/|travel)/);
    assert.equal(sitemap.includes(`<loc>${meta.canonical}</loc>`),meta.robots==='index,follow',id);
    assert.equal(html.match(/name="sorachi-version" content="([a-f0-9]+)"/)[1],(await readFile(join(dir,'index.html'),'utf8')).match(/name="sorachi-version" content="([a-f0-9]+)"/)[1]);
  }
  assert.match(await readFile(join(dir,'study/g-question/index.html'),'utf8'),/ですか/);
  assert.match(await readFile(join(dir,'travel/hotel/index.html'),'utf8'),/チェックイン/);
  assert.match(await readFile(join(dir,'404.html'),'utf8'),/noindex,follow/);
  assert.deepEqual(await prepareRelease({dir,check:true}),release);
  await writeFile(join(dir,'grammar/index.html'),'stale page');
  await assert.rejects(prepareRelease({dir,check:true}),/Stale/);
});
