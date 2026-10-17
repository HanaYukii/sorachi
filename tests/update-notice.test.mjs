import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source = readFileSync(new URL('../dist/update-notice.js', import.meta.url), 'utf8');
const a = 'a'.repeat(64), b = 'b'.repeat(64);
const html = version => `<meta name="sorachi-version" content="${version}" />`;
const flush = () => new Promise(resolve => setImmediate(resolve));
function setup(initial = a) {
  let now = 0, response = html(initial), ok = true, redirected = false, fail = false, allowed = true, reloads = 0;
  const calls = [], intervals = [], events = {};
  const notice = {hidden:true, replaceChildren(button) {this.button=button;}};
  const document = {hidden:false, baseURI:'https://example.com/sorachi/#grammar',
    querySelector: selector => selector.startsWith('meta') ? {content:a} : notice,
    createElement: () => ({addEventListener(name,fn) {this[name]=fn;}}),
    addEventListener(name,fn) {events[name]=fn;}};
  const context = vm.createContext({document, window:{addEventListener(name,fn) {events[name]=fn;}},
    location:{reload() {reloads++;}}, Date:{now:()=>now}, URL, AbortController,
    setInterval:fn=>intervals.push(fn), setTimeout:()=>1, clearTimeout(){},
    fetch:async (url,options)=>{calls.push({url,options});if(fail)throw Error('offline');return {ok,redirected,text:async()=>response};}});
  vm.runInContext(source+'\nthis.start = UpdateNotice.start;',context);
  const handle=context.start({beforeReload:()=>allowed});
  return {notice,document,calls,events,intervals,handle,
    set response(value) {response=value;},set ok(value) {ok=value;},set redirected(value) {redirected=value;},set fail(value) {fail=value;},set allowed(value) {allowed=value;},
    advance(){now+=60001;}, get reloads(){return reloads;}};
}
test('an old page detects a new build without refreshing or moving focus, and reloads only after an accepted click',async()=>{
  const t=setup();await flush();assert.equal(t.notice.hidden,true);
  t.response=html(b);t.advance();await t.handle.check();
  assert.equal(t.notice.hidden,false);assert.equal(t.notice.button.textContent,'有新版本，點此更新');assert.equal(t.reloads,0);
  assert.equal(new URL(t.calls[0].url).pathname,'/sorachi/index.html');assert.equal(t.calls[0].options.cache,'no-store');
  t.allowed=false;t.notice.button.click();assert.equal(t.reloads,0);assert.notEqual(t.notice.button.disabled,true);
  t.allowed=true;t.notice.button.click();t.notice.button.click();assert.equal(t.reloads,1);
});
test('invalid responses and offline checks stay quiet; visible return retries and a rollback hides a stale notice',async()=>{
  const t=setup();await flush();
  for(const response of ['<h1>Error</h1>',html('bad'),html('')]) {t.response=response;t.advance();await t.handle.check();assert.equal(t.notice.hidden,true);}
  t.response=html(b);t.ok=false;t.advance();await t.handle.check();assert.equal(t.notice.hidden,true);
  t.ok=true;t.redirected=true;t.advance();await t.handle.check();assert.equal(t.notice.hidden,true);
  t.redirected=false;t.fail=true;t.advance();await t.handle.check();assert.equal(t.notice.hidden,true);
  t.fail=false;t.advance();t.events.online();await flush();assert.equal(t.notice.hidden,false);
  const count=t.calls.length;t.document.hidden=true;t.advance();t.intervals[0]();await flush();assert.equal(t.calls.length,count);
  t.response=html(a);t.document.hidden=false;t.events.visibilitychange();await flush();assert.equal(t.notice.hidden,true);
  t.events.visibilitychange();await flush();assert.equal(t.calls.length,count+1,'focus changes are throttled');
  assert.equal(t.reloads,0);
});


test('the first check compares with the loaded page rather than adopting the current server as baseline',async()=>{
 const t=setup(b);await flush();assert.equal(t.notice.hidden,false);assert.equal(t.reloads,0);
});
