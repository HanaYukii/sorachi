"use strict";

// Presentation metadata only. History/source tracking and study state stay in their existing owners.
const Navigation = (() => {
  const sections = [["#kana", "五十音"], ["#grammar", "基礎句型"], ["#travel", "旅遊常用語"], ["#drill", "基礎刷題"]];
  const pages = {
    "#home": ["日文入門", null, "home"],
    "#kana": ["五十音表", "#kana", "overview"],
    "#grammar": ["基礎句型", "#grammar", "overview"],
    "#travel": ["旅遊常用語", "#travel", "overview"],
    "#travel/favorites": ["我的常用語", "#travel", "overview"],
    "#kana-random": ["五十音隨機練習", "#kana", "practice"],
    "#drill": ["基礎刷題", "#drill", "practice"],
    "#grammar-random": ["句型隨機練習", "#grammar", "practice"],
    "#kana-review": ["五十音複習", "#kana", "practice"],
    "#grammar-review": ["句型小複習", "#grammar", "practice"],
    "#lesson": ["日文的三種文字", "#kana", "lesson"],
    "#done": ["完成日文的三種文字", "#kana", "lesson"],
    "#history": ["學習紀錄", null, "utility"],
    "#settings": ["學習設定", null, "utility"],
    "#about": ["關於 SoraChi", null, "utility"],
    "#feedback": ["問題與建議", null, "utility"],
  };
  const escape = text => String(text).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  function page(hash) {
    let item = Object.hasOwn(pages, hash) ? pages[hash] : null;
    if (!item && hash.startsWith("#study/")) {
      const course = Content.getCourse(hash.slice(7));
      if (course) item = [Content.displayTitle(course.id), course.type === "kana" || course.home === "kana" ? "#kana" : "#grammar", "lesson"];
    }
    if (!item && hash.startsWith("#travel/")) {
      const category = Content.phrasebook.find(c => c.id === hash.slice(8));
      if (category) item = [category.title, "#travel", "detail"];
    }
    const [title, section, kind] = item || ["找不到頁面", null, "unknown"];
    return {title, section, kind};
  }
  function header(hash, destination = "#home", label = "回首頁", action = null) {
    const info = page(hash);
    const back = action === "feedback-back"
      ? `<button class="exit" data-action="feedback-back">← ${escape(label)}</button>`
      : `<a class="exit" href="${escape(destination)}">← ${escape(label)}</a>`;
    const links = info.kind === "overview" ? `<nav class="section-nav" aria-label="學習與旅遊">${sections.map(([url, title]) => `<a href="${url}"${url === info.section ? ' aria-current="page"' : ""}>${title}</a>`).join("")}</nav>` : "";
    return `<header class="lesson-header${links ? " overview-header" : ""}">${back}<span class="lesson-name">SoraChi · 日文入門</span>${links}</header>`;
  }
  return Object.freeze({ page, header });
})();
