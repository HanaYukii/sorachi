import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const source=readFileSync(new URL('../dist/cloud.js',import.meta.url),'utf8');
const id='11111111-1111-4111-8111-111111111111', other='22222222-2222-4222-8222-222222222222';
function setup() {
  let event, readResolve, initialResolve, sent;
  const client={auth:{
    onAuthStateChange(fn){event=fn;return {data:{subscription:{unsubscribe(){}}}};},
    getSession(){return new Promise(resolve=>{initialResolve=resolve;});},
    async signOut(){event('SIGNED_OUT',null);return {};},
    async signInWithOAuth(value){sent=value;return {};},
  }, functions:{async invoke(name,options){sent={name,...options};return {data:{ok:true}};}},
  from(){return {select(){return this;},eq(){return this;},maybeSingle(){return new Promise(resolve=>{readResolve=resolve;});}};},
  async rpc(name,params){sent={name,params};return {data:{revision:2}};}};
  const ctx=vm.createContext({}); vm.runInContext(source+';globalThis.api=Cloud;',ctx);
  const changes=[], service=ctx.api.create({client,onUser:user=>changes.push(user)});
  return {service,api:ctx.api,client,changes,event:(user)=>event('SIGNED_IN',user?{user}:null),initial:(user)=>initialResolve({data:{session:user?{user}:null}}),read:(data)=>readResolve({data}),sent:()=>sent};
}
test('a late session lookup cannot undo a signout event',async()=>{
  const b=setup(), pending=b.service.start();
  b.event(null); b.initial({id}); await pending;
  assert.equal(b.service.user(),null);
});
test('switching accounts rejects late backup responses and payloads for another owner',async()=>{
  const b=setup(), start=b.service.start();b.initial({id});await start;
  const pending=b.service.readBackup();b.event({id:other});b.read({revision:4,payload:{private:'A'}});
  await assert.rejects(pending,/account-changed/);
  await assert.rejects(b.service.writeBackup({owner:{kind:'account',id}},1),/invalid-backup/);
  await b.service.signOut(); await assert.rejects(b.service.readBackup(),/signed-out/);
});
test('feedback has a stable submission id and bounded content; caller identity is never accepted',async()=>{
  const b=setup();
  await b.service.sendFeedback({id,category:'bug',message:'  說明看不懂  ',contact:'',context:'五十音',diagnostics:{courseId:'h-a'},challenge:'challenge',auth_user_id:other});
  assert.equal(b.sent().body.message,'說明看不懂');
  assert.equal(b.sent().body.contact,null);
  assert.equal(b.sent().body.submission_id,id);
  assert.equal(b.sent().body.auth_user_id,undefined);
  assert.equal(b.sent().timeout,15000);
  for (const message of ['', ' '.repeat(20), 'a'.repeat(601)]) assert.throws(()=>b.api.feedback({id,category:'bug',message}),/invalid-feedback/);
});
test('cloud backup uses revision compare-and-swap and exposes conflicts without blind retry',async()=>{
  const b=setup(), start=b.service.start();b.initial({id});await start;
  const payload={owner:{kind:'account',id}};
  await b.service.writeBackup(payload,1);
  assert.equal(b.sent().params.expected_revision,1);
  b.client.rpc=async()=>({error:{code:'40001'}});
  await assert.rejects(b.service.writeBackup(payload,1),/backup-conflict/);
});
