import {createClient} from "npm:@supabase/supabase-js@2.108.2";

const origins = new Set(["https://sorachi.app"]);
const headers = {"Access-Control-Allow-Origin":"https://sorachi.app", "Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods":"POST, OPTIONS", "Vary":"Origin"};
const reply = (status, ok) => new Response(JSON.stringify({ok}),{status,headers:{...headers,"Content-Type":"application/json"}});
const canonical = value => JSON.stringify(value, (_key, item) => item && typeof item === "object" && !Array.isArray(item)
  ? Object.fromEntries(Object.keys(item).sort().map(key => [key,item[key]])) : item);
const matches = (existing, row) => ["user_id","message","category","contact","context"].every(key => existing[key] === row[key]) && canonical(existing.diagnostics) === canonical(row.diagnostics);

Deno.serve(async request => {
  if (!origins.has(request.headers.get("origin") || "")) return reply(403,false);
  if (request.method === "OPTIONS") return new Response(null,{status:204,headers});
  if (request.method !== "POST") return reply(405,false);
  try {
    // Bound the stream as well as Content-Length; never trust an omitted or forged length.
    const reader=request.body?.getReader(); if (!reader) return reply(400,false);
    const chunks=[]; let size=0;
    while (true) { const {done,value}=await reader.read(); if(done) break; size+=value.length; if(size>16000){await reader.cancel();return reply(413,false);} chunks.push(value); }
    const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
    const input=JSON.parse(new TextDecoder().decode(bytes));
    const {submission_id,category,message,contact,context,diagnostics,challenge}=input;
    if (typeof submission_id!=="string" || !/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(submission_id)
      || !["bug","wish","other"].includes(category) || typeof message!=="string" || !message.trim() || message.length>600
      || !(contact===null || typeof contact==="string" && contact.length<=200) || typeof context!=="string" || context.length>200
      || !diagnostics || typeof diagnostics!=="object" || Array.isArray(diagnostics) || JSON.stringify(diagnostics).length>4000
      || typeof challenge!=="string" || challenge.length>2048) return reply(400,false);
    const admin=createClient(Deno.env.get("SUPABASE_URL"),Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false,autoRefreshToken:false}});
    let user_id=null;
    const bearer=request.headers.get("authorization")?.replace(/^Bearer /i,"");
    // The SDK uses the public key for guests. Invalid user sessions must not silently become guests.
    if(bearer && !bearer.startsWith("sb_publishable_")) {
      const {data,error}=await admin.auth.getUser(bearer);
      if(error || !data.user) return reply(401,false);
      user_id=data.user.id;
    }
    const row={submission_id,category,message:message.trim(),contact,context,diagnostics,user_id};
    // A retry after a lost response is safe, even after the single-use challenge expires.
    const {data:existing,error:lookupError}=await admin.from("sorachi_feedback").select("category,message,contact,context,diagnostics,user_id").eq("submission_id",submission_id).maybeSingle();
    if(lookupError) return reply(503,false);
    if(existing) return reply(matches(existing,row)?200:409,matches(existing,row));
    if(!Deno.env.get("TURNSTILE_SECRET_KEY")) return reply(503,false);
    const verified=await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({secret:Deno.env.get("TURNSTILE_SECRET_KEY"),response:challenge}),signal:AbortSignal.timeout(10000)}).then(r=>r.json());
    if(!verified.success || verified.hostname!=="sorachi.app" || verified.action!=="feedback") return reply(403,false);
    const {error}=await admin.from("sorachi_feedback").insert(row);
    if(error?.code==="23505") {
      const {data,error:retryError}=await admin.from("sorachi_feedback").select("category,message,contact,context,diagnostics,user_id").eq("submission_id",submission_id).maybeSingle();
      return reply(!retryError && data && matches(data,row)?200:409,!retryError && Boolean(data) && matches(data,row));
    }
    return reply(error?503:200,!error);
  } catch { return reply(503,false); }
});
