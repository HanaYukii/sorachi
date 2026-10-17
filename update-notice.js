"use strict";

// Compare against the version of the page actually loaded, even if the first check is after a deploy.
const UpdateNotice = (() => {
  const valid = value => /^[a-f0-9]{64}$/.test(value || "");
  function start({ beforeReload = () => true } = {}) {
    const loaded = document.querySelector('meta[name="sorachi-version"]')?.content;
    const notice = document.querySelector("#update-notice");
    if (!valid(loaded) || !notice || typeof fetch !== "function") return;
    let busy = false, lastCheck = -Infinity, pending = false, reloading = false;
    const url = new URL("./index.html", document.baseURI);
    async function check() {
      if (document.hidden || busy || reloading || Date.now() - lastCheck < 60000) return;
      busy = true; lastCheck = Date.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      try {
        url.searchParams.set("check", String(lastCheck));
        const response = await fetch(url.href, { cache: "no-store", signal: controller.signal });
        if (!response.ok || response.redirected) return;
        const html = await response.text();
        const remote = html.match(/<meta name="sorachi-version" content="([a-f0-9]{64})" \/>/)?.[1];
        if (!valid(remote)) return;
        pending = remote !== loaded;
        if (pending && notice.hidden) {
          const button = document.createElement("button");
          button.type = "button";
          button.textContent = "有新版本，點此更新";
          button.addEventListener("click", () => {
            if (!pending || reloading || !beforeReload()) return;
            reloading = true; button.disabled = true;
            location.reload();
          });
          notice.replaceChildren(button);
        }
        notice.hidden = !pending;
      } catch { /* Offline or a failed check must not interrupt a lesson. */ }
      finally { clearTimeout(timeout); busy = false; }
    }
    void check();
    setInterval(() => { void check(); }, 5 * 60 * 1000);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) void check(); });
    window.addEventListener("online", () => { void check(); });
    return { check };
  }
  return Object.freeze({ start });
})();
