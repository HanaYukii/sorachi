import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/account.js',import.meta.url),'utf8');
const id='11111111-1111-4111-8111-111111111111';
function setup({signedIn=true,failed=false,confirm=true}={}) {
  const calls=[],state={user:signedIn?{id,email:'learner@example.test'}:null};let onUser;
  const service={user:()=>state.user,async start(){if(failed)throw Error('offline');onUser(state.user);},async signIn(url){calls.push(['login',url]);},async signOut(){state.user=null;onUser(null);},
    async readBackup(){return state.remote||null;},async writeBackup(_snapshot,revision){calls.push(['write',revision]);if(state.conflict)throw Error('backup-conflict');return {revision:revision+1};}};
  const ctx=vm.createContext({CloudConfig:{url:'test',publishableKey:'test'},Cloud:{load:async()=>({}),create:options=>{onUser=options.onUser;return service;}},Navigation:{setAccountLabel:value=>calls.push(['label',value])},DataStore:{MAX_ATTEMPTS:200},location:{hash:'#account',origin:'https://sorachi.app'},window:{confirm:()=>confirm},setTimeout,clearTimeout});
  vm.runInContext(source+';globalThis.make=Account.create',ctx);
  const api={lock:value=>calls.push(['lock',value]),owner:value=>calls.push(['owner',value]),render(){},notice:value=>calls.push(['notice',value]),reload:()=>calls.push(['reload']),beforeLogout:value=>calls.push(['beforeLogout',value]),
    importGuest:()=>{calls.push(['claim']);return {ok:true};},importRemote:()=>{calls.push(['restore']);return {ok:true};},importSummary:r=>r.ok?'已帶入':'失敗',export:()=>JSON.stringify({owner:{kind:'account',id}})};
  const account=ctx.make(api);
  return {account,calls,state,service,change:user=>{state.user=user;onUser(user);}};
}
test('boot selects owner without claiming guest data; later auth changes reload memory',async()=>{
  const b=setup();await b.account.start();
  assert.deepEqual(b.calls.filter(x=>x[0]==='owner'),[['owner',id]]);
  assert.equal(b.calls.some(x=>x[0]==='claim'),false);
  b.change(null);assert.deepEqual(b.calls.slice(-2),[['lock',true],['reload']]);
});
test('offline auth releases learning and reports the guest fallback',async()=>{
  const b=setup({failed:true});await b.account.start();
  assert.equal(b.account.service(),null);assert.deepEqual(b.calls.at(-1),['lock',false]);
  assert.equal(b.calls.some(x=>x[0]==='notice'),true);
});
test('guest import and removing local account data require an explicit confirmation',async()=>{
  const b=setup({confirm:false});await b.account.start();
  await b.account.action('account-claim');await b.account.action('account-logout-remove');
  assert.equal(b.calls.some(x=>['claim','beforeLogout'].includes(x[0])),false);
});
test('cloud overwrite requires reading then importing the current revision; conflicts do not retry',async()=>{
  const b=setup();await b.account.start();b.state.remote={revision:7,payload:{},updated_at:'2026-10-18T00:00:00Z'};
  await b.account.action('account-save');assert.equal(b.calls.some(x=>x[0]==='write'),false);
  await b.account.action('account-read');await b.account.action('account-save');assert.equal(b.calls.some(x=>x[0]==='write'),false);
  await b.account.action('account-restore');b.state.conflict=true;await b.account.action('account-save');
  assert.deepEqual(b.calls.filter(x=>x[0]==='write'),[['write',7]]);assert.match(b.account.render(),/這次沒有覆寫/);
});
test('failed logout cancels pending local removal',async()=>{
  const b=setup();await b.account.start();b.service.signOut=async()=>{throw Error('logout-failed');};
  await b.account.action('account-logout-remove');
  assert.deepEqual(b.calls.filter(x=>x[0]==='beforeLogout'),[['beforeLogout',id],['beforeLogout',null]]);
  assert.match(b.account.render(),/登出沒有完成/);
});
