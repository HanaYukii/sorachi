"use strict";

const Account = (() => {
  const escape = text => String(text).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  function create(api) {
    let service=null, busy=false, message="", remote=null, revision=null, alive=true, initialized=false;
    const configured = () => Boolean(CloudConfig.url && CloudConfig.publishableKey);
    const user = () => service?.user() || null;
    const redraw = () => { if(location.hash === "#account") api.render(); };
    const errors = {
      "backup-conflict":"另一台裝置已更新雲端備份。請重新查看並帶入雲端備份，再儲存；這次沒有覆寫。",
      "backup-unavailable":"目前連不上雲端，這台裝置的紀錄仍保留，請稍後重試。",
      "login-failed":"登入沒有完成，請再試一次。",
      "logout-failed":"登出沒有完成，請確認連線後再試一次。",
      "account-changed":"帳號已切換，這次操作已取消。",
    };
    async function start() {
      if (!configured()) return;
      api.lock(true);
      try {
        const client=await Cloud.load(CloudConfig);
        service=Cloud.create({client,onUser:next=>{
          if(!alive) return;
          if(initialized) { api.lock(true); api.reload(); return; }
          api.owner(next?.id || null);
        }});
        let timeout;
        try { await Promise.race([service.start(),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(Error("session-unavailable")),12000);})]); }
        finally { clearTimeout(timeout); }
        initialized=true;
        Navigation.setAccountLabel(user()?"帳號":"登入");
      } catch {
        alive=false; service=null; api.owner(null);
        message="帳號目前無法載入。你仍可使用訪客進度，稍後重新整理再試。";
        Navigation.setAccountLabel("登入");
        api.notice(message);
      } finally { api.render(); api.lock(false); }
    }
    function render() {
      const who=user();
      const controls=who ? `<section class="account-panel"><h2>這台裝置的帳號進度</h2><p>目前使用 <strong>${escape(who.email || "已登入帳號")}</strong>。訪客的紀錄分開保留。</p><button class="text-button" data-action="account-claim"${busy?' disabled':''}>帶入這台裝置的訪客進度</button></section>
        <section class="account-panel"><h2>雲端備份</h2><p>把目前的進度、收藏與設定存一份到帳號。換裝置後，在這裡帶入；目前需要手動儲存。</p><div class="quiet-links"><button class="text-button" data-action="account-read"${busy?' disabled':''}>查看雲端備份</button>${remote ? `<button class="text-button" data-action="account-restore"${busy?' disabled':''}>帶入這份雲端備份</button>`:""}${revision !== null ? `<button class="primary" data-action="account-save"${busy?' disabled':''}>儲存目前進度到雲端</button>`:""}</div>${remote ? `<p class="record-note">備份時間：${escape(new Date(remote.updated_at).toLocaleString("zh-TW"))}。帶入前會先請你確認。</p>`:""}<p class="record-note">保留最近 ${DataStore.MAX_ATTEMPTS} 筆成績。原本的備份檔下載功能仍可使用。</p></section>
        <section class="account-panel"><h2>登出</h2><p>登出後回到訪客進度。帳號紀錄仍留在這台裝置；公用電腦請先儲存雲端備份，再選擇移除本機帳號紀錄。</p><div class="quiet-links"><button class="text-button" data-action="account-logout"${busy?' disabled':''}>登出，保留本機紀錄</button><button class="text-button" data-action="account-logout-remove"${busy?' disabled':''}>登出並移除本機帳號紀錄</button></div></section>`
        : `<section class="account-panel"><h2>用 Google 登入</h2><p>登入後可使用帳號進度和雲端備份。不登入也能上課、練習與回報問題。</p><button class="primary" data-action="account-login"${!service || busy?' disabled':''}>使用 Google 登入</button><p class="record-note">登入後不會自動帶入這台裝置的訪客紀錄。</p><p class="record-note"><a href="./privacy.html">隱私政策</a> · <a href="./terms.html">使用條款</a></p>${!configured()?'<p>登入服務正在設定中。</p>':!service?'<button class="text-button" data-action="reload">重新連線</button>':""}</section>`;
      return `<h1 class="focus-heading" tabindex="-1">${who?"我的帳號":"登入"}</h1>${controls}<p id="account-status" class="account-status" role="status" aria-live="polite">${escape(busy?"處理中…":message)}</p>`;
    }
    async function action(name) {
      if (busy || !service) return;
      busy=true; message=""; redraw();
      const owner=user()?.id;
      try {
        if(name==="account-login") { await service.signIn(`${location.origin}/#account`); return; }
        if(name==="account-logout" || name==="account-logout-remove") {
          const remove=name==="account-logout-remove";
          if(remove && !window.confirm("移除這台裝置上的帳號進度並登出？尚未存到雲端的進度會遺失。訪客紀錄與雲端備份不受影響。")) return;
          // Remove only this account and its recovery copies after successful logout.
          api.beforeLogout(remove?owner:null);
          try { await service.signOut(); } catch(error) { api.beforeLogout(null); throw error; }
          return;
        }
        if(name==="account-claim") {
          if(!window.confirm("把這台裝置的訪客進度帶入目前帳號？請確認這些是你的紀錄。原訪客紀錄會保留，不會自動傳到雲端。")) return;
          const result=api.importGuest();
          message=result.ok?"已帶入訪客進度。可以接著學習，或儲存到雲端。":api.importSummary(result);
        }
        if(name==="account-read") {
          remote=await service.readBackup(); revision=remote?null:0;
          message=remote?"找到雲端備份。先帶入這份備份，再儲存合併後的進度。":"雲端還沒有備份，可以儲存目前進度。";
        }
        if(name==="account-restore" && remote) {
          if(!window.confirm("把雲端備份合併到這台裝置？已完成課程與收藏會合併；曾清除的練習會依較新的清除時間處理。")) return;
          const result=api.importRemote(remote.payload);
          if(result.ok) revision=remote.revision;
          message=api.importSummary(result);
        }
        if(name==="account-save" && revision !== null) {
          const saved=await service.writeBackup(JSON.parse(api.export()),revision);
          revision=saved.revision; remote=null;
          message="已儲存到雲端。下次換裝置登入後，可以在這裡帶入。";
        }
      } catch(error) { message=errors[error.message] || "這次沒有完成，原本的資料仍保留。請稍後再試。"; }
      finally { busy=false; redraw(); }
    }
    return {start,render,action,user,service:()=>service,configured};
  }
  return {create};
})();
