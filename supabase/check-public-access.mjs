// Public-key acceptance check only. No login tokens, secrets, or stored user data are read.
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const ctx=vm.createContext({});
vm.runInContext(readFileSync(new URL('../dist/cloud-config.js',import.meta.url),'utf8')+';globalThis.config=CloudConfig;',ctx);
const {url,publishableKey}=ctx.config;
const headers={apikey:publishableKey,'Content-Type':'application/json'};
for(const table of ['sorachi_backups','sorachi_feedback']) {
  const response=await fetch(`${url}/rest/v1/${table}?select=*&limit=0`,{headers,signal:AbortSignal.timeout(15000)});
  assert.ok([401,403].includes(response.status),`${table} public access must be denied, received ${response.status}`);
  console.log(`PASS anonymous ${table} read denied (${response.status})`);
}
const save=await fetch(`${url}/rest/v1/rpc/sorachi_save_backup`,{method:'POST',headers,body:JSON.stringify({expected_revision:0,snapshot:{}}),signal:AbortSignal.timeout(15000)});
assert.ok([401,403].includes(save.status));console.log(`PASS anonymous backup write denied (${save.status})`);
const blocked=await fetch(`${url}/functions/v1/sorachi-feedback`,{method:'POST',headers:{...headers,origin:'https://untrusted.example'},body:'{}',signal:AbortSignal.timeout(15000)});
assert.equal(blocked.status,403);console.log('PASS feedback rejects other origins');
const invalid=await fetch(`${url}/functions/v1/sorachi-feedback`,{method:'POST',headers:{...headers,origin:'https://sorachi.app'},body:'{}',signal:AbortSignal.timeout(15000)});
assert.equal(invalid.status,400);console.log('PASS feedback handler is reachable and rejects invalid payloads');
