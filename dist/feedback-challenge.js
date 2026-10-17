"use strict";

const FeedbackChallenge = (() => {
  let loader=null, widget=null, token="", generation=0;
  function dispose() {
    generation++; token="";
    if(widget !== null) { globalThis.turnstile?.remove(widget); widget=null; }
  }
  async function mount(sitekey, onError) {
    dispose(); const current=generation;
    try {
      if(!globalThis.turnstile) {
        loader ||= new Promise((resolve,reject)=>{
          const script=document.createElement("script");
          script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
          const timeout=setTimeout(()=>{loader=null;script.remove();reject(Error("challenge-unavailable"));},12000);
          script.onload=()=>{clearTimeout(timeout);resolve();}; script.onerror=()=>{clearTimeout(timeout);loader=null;script.remove();reject(Error("challenge-unavailable"));};
          document.head.append(script);
        });
        await loader;
      }
      if(current!==generation) return;
      const target=document.querySelector("#feedback-challenge");
      if(!target) return;
      widget=globalThis.turnstile.render(target,{sitekey,action:"feedback",size:"flexible",callback:value=>{token=value;},"expired-callback":()=>{token="";},"error-callback":()=>{token="";onError();}});
    } catch { if(current===generation) onError(); }
  }
  return {mount,dispose,token:()=>token};
})();
