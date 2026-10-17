"use strict";

// Optional infrastructure. Learning remains available when the service is absent or offline.
const Cloud = (() => {
  const AUTH_KEY = "sorachi:auth:v1";
  const uuid = value => typeof value === "string" && /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(value);
  function feedback(input) {
    const message = String(input.message || "").trim(), contact = String(input.contact || "").trim();
    if (!uuid(input.id) || !["bug", "wish", "other"].includes(input.category) || !message || message.length > 600 || contact.length > 200) throw Error("invalid-feedback");
    const diagnostics = input.diagnostics || {};
    if (JSON.stringify(diagnostics).length > 4000) throw Error("invalid-feedback");
    return {submission_id:input.id, category:input.category, message, contact:contact || null, context:String(input.context || "").slice(0,200), diagnostics};
  }
  function create({client, onUser = () => {}}) {
    let user = null, generation = 0, authEvents = 0;
    const identity = value => value && uuid(value.id) ? {id:value.id, email:typeof value.email === "string" ? value.email : ""} : null;
    function change(value) {
      const next = identity(value);
      if (next?.id !== user?.id) { generation++; user = next; onUser(user); }
      else user = next;
    }
    function guard() {
      if (!user) throw Error("signed-out");
      const id = user.id, token = generation;
      return {id, check:() => { if (generation !== token || user?.id !== id) throw Error("account-changed"); }};
    }
    return {
      user: () => user,
      async start() {
        const subscription = client.auth.onAuthStateChange((_event, session) => { authEvents++; change(session?.user); });
        const before = authEvents;
        const {data, error} = await client.auth.getSession();
        if (error) throw Error("session-unavailable");
        if (authEvents === before) change(data.session?.user);
        return () => subscription.data.subscription.unsubscribe();
      },
      async signIn(redirectTo) {
        const {error} = await client.auth.signInWithOAuth({provider:"google",options:{redirectTo}});
        if (error) throw Error("login-failed");
      },
      async signOut() {
        const {error} = await client.auth.signOut({scope:"local"});
        if (error) throw Error("logout-failed");
        change(null);
      },
      async sendFeedback(input) {
        const payload = feedback(input);
        // The Edge Function verifies Turnstile and derives the account from the JWT.
        const {data, error} = await client.functions.invoke("sorachi-feedback", {body:{...payload, challenge:input.challenge},timeout:15000});
        if (error || data?.ok !== true) throw Error("feedback-failed");
        return data;
      },
      async readBackup() {
        const owner = guard();
        const {data,error} = await client.from("sorachi_backups").select("revision,payload,updated_at").eq("user_id",owner.id).maybeSingle();
        owner.check();
        if (error) throw Error("backup-unavailable");
        return data;
      },
      async writeBackup(payload, revision) {
        const owner = guard();
        if (payload?.owner?.kind !== "account" || payload.owner.id !== owner.id || !Number.isSafeInteger(revision) || revision < 0) throw Error("invalid-backup");
        const {data,error} = await client.rpc("sorachi_save_backup", {expected_revision:revision, snapshot:payload});
        owner.check();
        if (error) throw Error(error.code === "40001" ? "backup-conflict" : "backup-unavailable");
        return data;
      },
    };
  }
  async function load(config) {
    if (!config?.url || !config?.publishableKey) return null;
    const endpoint = new URL(config.url);
    if (endpoint.protocol !== "https:" || !endpoint.hostname.endsWith(".supabase.co") || endpoint.pathname !== "/") throw Error("invalid-service-config");
    if (!config.publishableKey.startsWith("sb_publishable_")) throw Error("Use a public publishable key");
    if (!globalThis.supabase) await new Promise((resolve,reject) => {
      const script = document.createElement("script");
      script.src = "./vendor/supabase-2.108.2.js";
      const timeout=setTimeout(()=>{script.remove();reject(Error("sdk-unavailable"));},12000);
      script.onload = () => {clearTimeout(timeout);resolve();}; script.onerror = () => {clearTimeout(timeout);script.remove();reject(Error("sdk-unavailable"));};
      document.head.append(script);
    });
    return globalThis.supabase.createClient(config.url,config.publishableKey,{auth:{storageKey:AUTH_KEY,flowType:"pkce",persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
  }
  return {create,load,feedback};
})();
