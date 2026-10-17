import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../supabase/functions/sorachi-feedback/index.ts',import.meta.url),'utf8').replace(/^import .*;\n/, '');
const id='11111111-1111-4111-8111-111111111111';
const payload={submission_id:id,category:'bug',message:'測試回報',contact:null,context:'五十音',diagnostics:{course:'h-a',build:'abc'},challenge:'test-token'};
function setup({existing=null,valid=true,authError=false,race=false}={}) {
  let handler,inserted=null,verifications=0,authCalls=0;
  const admin={auth:{async getUser(){authCalls++;return authError?{error:{},data:{user:null}}:{data:{user:{id}}};}},from(){return {
    select(){return this;},eq(){return this;},async maybeSingle(){return {data:existing};},
    async insert(row){inserted=row;if(race){existing=row;return {error:{code:'23505'}};}return {};}
  };}};
  vm.runInNewContext(source,{
    Deno:{env:{get:()=> 'test-only'},serve:fn=>{handler=fn;}},createClient:()=>admin,
    Response,TextDecoder,Uint8Array,AbortSignal,
    fetch:async()=>{verifications++;return {json:async()=>({success:valid,hostname:'sorachi.app',action:'feedback'})};}
  });
  const send=(body=payload,headers={})=>handler(new Request('https://example.test/feedback',{method:'POST',headers:{origin:'https://sorachi.app',authorization:'Bearer sb_publishable_test',...headers},body:JSON.stringify(body)}));
  return {send,inserted:()=>inserted,verifications:()=>verifications,authCalls:()=>authCalls};
}
test('anonymous feedback is verified, bounded and private; caller cannot choose account',async()=>{
  const b=setup();const response=await b.send({...payload,user_id:id});
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
  assert.equal(b.inserted().user_id,null);assert.equal(b.authCalls(),0);assert.equal(b.verifications(),1);
  for(const bad of [{message:' '},{message:'x'.repeat(601)},{diagnostics:[]},{submission_id:'x'},{contact:'x'.repeat(201)}]) {
    assert.equal((await setup().send({...payload,...bad})).status,400);
  }
  assert.equal((await setup().send({...payload,message:'x'.repeat(17000)})).status,413);
});
test('feedback requires allowed origin, valid challenge and valid user identity when supplied',async()=>{
  const b=setup();assert.equal((await b.send(payload,{origin:'https://evil.test'})).status,403);assert.equal(b.inserted(),null);
  const failed=setup({valid:false});assert.equal((await failed.send()).status,403);assert.equal(failed.inserted(),null);
  const stale=setup({authError:true});assert.equal((await stale.send(payload,{authorization:'Bearer stale.jwt.token'})).status,401);assert.equal(stale.inserted(),null);
  const signed=setup();assert.equal((await signed.send(payload,{authorization:'Bearer valid.jwt.token'})).status,200);assert.equal(signed.inserted().user_id,id);
});
test('retry remains idempotent after JSONB key reordering and never returns stored content',async()=>{
  const existing={...payload,user_id:null,diagnostics:{build:'abc',course:'h-a'}};
  const b=setup({existing});const response=await b.send();
  assert.equal(response.status,200);assert.deepEqual(await response.json(),{ok:true});
  assert.equal(b.verifications(),0);assert.equal(b.inserted(),null);
  const conflict=await b.send({...payload,message:'changed'});
  assert.equal(conflict.status,409);assert.deepEqual(await conflict.json(),{ok:false});
});
test('simultaneous duplicate submissions have a successful idempotent response',async()=>{
  const b=setup({race:true});assert.equal((await b.send()).status,200);
});
