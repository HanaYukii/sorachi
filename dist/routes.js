"use strict";

// Keep stable lesson/feedback IDs separate from the public address.
const Routes = (() => {
  const origin = "https://sorachi.app";
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
    "#account": ["我的帳號", null, "utility"],
    "#feedback": ["問題與建議", null, "utility"],
  };
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
  const privateIds = new Set(["done", "kana-random", "grammar-random", "kana-review", "grammar-review", "history", "settings", "account", "feedback", "travel/favorites"]);
  const registered = new Set([...Object.keys(pages), ...Object.keys(Content.courses).map(id => `#study/${id}`), ...Content.phrasebook.map(item => `#travel/${item.id}`)]);
  const ids = () => [...registered];
  const known = id => registered.has(id);
  const path = id => id === "#home" ? "/" : /^#[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(id) ? `/${id.slice(1)}/` : "/404.html";
  function fromPath(pathname) {
    const clean = (pathname || "/").replace(/\/index\.html$/, "/").replace(/\/$/, "");
    if (!clean || clean === "/home") return "#home";
    if (/^\/[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(clean)) return `#${clean.slice(1)}`;
    return "#not-found";
  }
  function current(where = globalThis.location || {pathname:"/"}) {
    // The OAuth SDK owns provider fragments until it consumes them.
    if (/^#(?:access_token=|error=)/.test(where.hash || "")) return "#account";
    if (/^#[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(where.hash || "") && where.hash !== "#main") return where.hash;
    return fromPath(where.pathname);
  }
  function normalize() {
    if (location.hash && !/^#[a-z0-9-]+(?:\/[a-z0-9-]+)?$/.test(location.hash)) return;
    const id = current();
    if (!known(id)) return;
    const target = path(id) + (location.search || "");
    if (target !== (location.pathname || "/") + (location.search || "") + (location.hash || "")) window.history.replaceState(window.history.state, "", target);
  }
  function links(html) {
    return html.replace(/href="(#[a-z0-9-]+(?:\/[a-z0-9-]+)?)"/g, (all, id) => known(id) ? `href="${path(id)}"` : all);
  }
  function metadata(id) {
    const titles = {home:"SoraChi｜五十音、基礎句型與旅遊日語｜零基礎也能學",kana:"五十音表：平假名、片假名與讀音｜SoraChi",grammar:"基礎句型：日文文法與例句｜SoraChi",travel:"旅遊常用語：關鍵字、讀音與例句｜SoraChi",drill:"基礎刷題：日文單字、助詞與句型｜SoraChi",lesson:"日文的三種文字｜SoraChi",about:"關於 SoraChi｜SoraChi"};
    const descriptions = {home:"SoraChi 日文入門：從五十音與基本句型開始，配合中文、讀音與練習；旅行時依情境查常用關鍵字。零基礎也可以用。",kana:"平假名、片假名、濁音、半濁音與拗音分組學習，附羅馬字、讀音與基本單字，幫助日文新手認字。",grammar:"從我是學生、疑問句與否定句開始，按順序學日文基本句子架構。例句附漢字假名、羅馬字與中文解說。",travel:"日本旅行常用日文：點餐、付款、交通、飯店與購物。先記關鍵字，搭配中文、羅馬字、讀音與完整說法。",drill:"混合練習本站教過的日文單字、助詞與句型，看中文解答，可作為 N5、N4 的基礎準備；不是完整模擬考。",lesson:"認識平假名、片假名與漢字，透過簡單例子了解三種日文寫法的用途。",about:"SoraChi 的緣起、雲朵吉祥物與作者花雪 HanaYukii 的介紹。為零基礎日文學習和日本旅遊整理的入門網站。"};
    const name = id.slice(1), course = id.startsWith("#study/") ? Content.getCourse(id.slice(7)) : null, category = id.startsWith("#travel/") ? Content.phrasebook.find(item => item.id === id.slice(8)) : null;
    const publicPage = known(id) && !privateIds.has(name);
    let title = titles[name] || `${page(id).title}｜SoraChi`;
    let description = descriptions[name] || "SoraChi 的學習工具；進度與個人設定依目前使用者顯示。";
    if (course) { title = `${course.title}｜SoraChi`; description = `${Content.displayTitle(course.id)}。${course.type === "kana" ? `認識 ${course.letters.join("、")}，配合讀音、記憶提示與小練習。` : "日文例句搭配假名讀音、羅馬字與中文，先看說明，再練習本課句型。"}`; }
    if (category) { title = `${category.title}｜旅遊日文｜SoraChi`; description = `${category.title}常用日文：${category.subtitle}。先記關鍵字與中文意思，需要時再看完整例句和讀音。`; }
    if (!known(id)) { title = "找不到頁面｜SoraChi"; description = "這個頁面不存在，請回到首頁選擇學習內容。"; }
    return {id, path:path(id), title, description, canonical:origin + path(id), robots:publicPage ? "index,follow" : "noindex,follow"};
  }
  function updateMeta(id = current()) {
    const meta = metadata(id);
    document.title = meta.title;
    const update = (selector, attribute, value) => document.querySelector(selector)?.setAttribute(attribute, value);
    update('link[rel="canonical"]', "href", meta.canonical);
    for (const [selector, value] of [["name=description",meta.description],["name=robots",meta.robots],["property=og:title",meta.title],["property=og:description",meta.description],["property=og:url",meta.canonical],["name=twitter:title",meta.title],["name=twitter:description",meta.description]]) {
      const [attribute,key] = selector.split("="); update(`meta[${attribute}="${key}"]`, "content", value);
    }
  }
  return Object.freeze({origin, page, ids, known, path, fromPath, current, normalize, links, metadata, updateMeta});
})();
