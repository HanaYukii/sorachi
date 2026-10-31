"use strict";

// Header presentation only. Route metadata, history and study state stay in their own modules.
const Navigation = (() => {
  const sections = [["#kana", "五十音"], ["#grammar", "基礎句型"], ["#travel", "旅遊常用語"], ["#drill", "基礎刷題"], ["#games", "小遊戲"]];
  const escape = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  const page = Routes.page;
  let accountLabel = null;
  const setAccountLabel = label => { accountLabel = label; };
  const accountLink = () => accountLabel ? `<a class="header-account" href="#account">${escape(accountLabel)}</a>` : "";
  const feedbackLink = () => `<button class="header-feedback" data-action="feedback">問題與建議</button>`;
  function header(hash, destination = "#home", label = "回首頁", action = null) {
    const info = page(hash);
    const back = action === "feedback-back"
      ? `<button class="exit" data-action="feedback-back">← ${escape(label)}</button>`
      : `<a class="exit" href="${escape(destination)}">← ${escape(label)}</a>`;
    const links = info.kind === "overview" ? `<nav class="section-nav" aria-label="學習與旅遊">${sections.map(([url, title]) => `<a href="${url}"${url === info.section ? ' aria-current="page"' : ""}>${title}</a>`).join("")}</nav>` : "";
    return `<header class="lesson-header${links ? " overview-header" : ""}">${back}<div class="header-tools"><span class="lesson-name">SoraChi · 日文入門</span>${accountLink()}${hash === "#feedback" ? "" : feedbackLink()}</div>${links}</header>`;
  }
  return Object.freeze({ page, header, feedbackLink, accountLink, setAccountLabel });
})();
