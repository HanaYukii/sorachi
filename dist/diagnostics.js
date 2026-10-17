"use strict";

// Public feedback includes only loaded build tokens and known content identifiers.
// Never serialize progress, storage envelopes, URLs, answers, or device metadata.
const Diagnostics = (() => {
  const id = value => typeof value === "string" && value.length <= 120 && /^[a-z0-9][a-z0-9/-]*$/.test(value);
  const version = value => typeof value === "string" && /^[a-f0-9]{10}$/i.test(value) ? value.toLowerCase() : null;
  const revision = value => typeof value === "string" && /^c1-[a-f0-9]{16}$/.test(value) ? value : null;
  const course = value => id(value) ? Content.getCourse(value) : null;
  const category = value => id(value) ? Content.phrasebook.find(item => item.id === value) : null;
  const integer = (value, length) => Number.isInteger(value) && value >= 0 && value < length;
  const permutation = (value, length) => Array.isArray(value) && value.length === length && new Set(value).size === length && value.every(index => integer(index, length));

  const assetVersions = {content:"contentVersion",app:"appVersion","kana-practice":"practiceAssetVersion","kana-hints":"hintsVersion",study:"studyVersion",storage:"storageVersion"};
  function loadedVersions(scripts) {
    const values = Object.fromEntries(Object.keys(assetVersions).map(name => [name,new Set()]));
    // document.scripts is live; copy only this small list of script sources.
    for (const script of Array.from(scripts || []).slice(0,64)) {
      try {
        const source = typeof script === "string" ? script : script?.src;
        if (typeof source !== "string" || source.length > 2048) continue;
        const match = source.match(/(?:^|\/)(content|app|kana-practice|kana-hints|study|storage)\.js\?([^#]*)(?:#.*)?$/);
        if (!match) continue;
        const tokens = [...match[2].matchAll(/(?:^|&)v=([^&]*)/g)];
        if (tokens.length !== 1) continue;
        const token = version(tokens[0][1]);
        if (token) values[match[1]].add(token);
      } catch { /* An unreadable tag contributes no diagnostic value. */ }
    }
    const result = {};
    for (const name of Object.keys(assetVersions)) if (values[name].size === 1) result[assetVersions[name]] = [...values[name]][0];
    return result;
  }

  function capture({hash = "",progress = {},scripts,attempt,practice,review} = {}) {
    const result = loadedVersions(scripts === undefined && typeof document !== "undefined" ? document.scripts : scripts);
    if(hash === "#drill") {
      const entry=Drill.pool(Content.grammar,DrillBank.questions).find(q=>q.id===review?.questionId && q.courseId===review?.courseId);
      return Object.freeze(entry ? {...result,courseId:entry.courseId,questionId:entry.id,drillRevision:entry.revision} : result);
    }
    const practiceCourse = course(practice?.courseId);
    const reviewCourse = hash === "#grammar-review" || hash === "#grammar-random" ? course(review?.courseId) : null;
    if (reviewCourse?.type === "grammar" && reviewCourse.questions.some(question => question.id === review.questionId)) {
      return Object.freeze({...result,courseId:reviewCourse.id,courseRevision:Content.courseRevision(reviewCourse.id),questionId:review.questionId});
    }
    // A random round is reported like a lesson or review round, so a reported question can be found again.
    if (practiceCourse?.type === "kana" && practice?.practiceVersion === 1 && ["character","reading"].includes(practice.direction) &&
        (["first","retry"].includes(practice.round) && (hash === "#kana-review" || hash === `#study/${practiceCourse.id}`) || practice.round === "random" && hash === "#kana-random") &&
        practiceCourse.questions.some(question => question.id === practice.questionId)) {
      return Object.freeze({...result,courseId:practiceCourse.id,courseRevision:Content.courseRevision(practiceCourse.id),
        questionId:practice.questionId,direction:practice.direction,practiceVersion:1,round:practice.round});
    }
    if (hash === "#lesson" || hash === "#done") {
      result.courseId = "intro";
      result.courseRevision = Content.courseRevision("intro");
      // Legacy positional progress is trustworthy only against its frozen baseline.
      const activeRevision = progress?.contentRevision ?? Content.legacyCourseRevision.intro;
      if (hash === "#lesson" && activeRevision === result.courseRevision) {
        const step = progress?.step;
        if (integer(step,Content.intro.lessons.length)) result.cardId = Content.intro.lessons[step].id;
        else if (step === 4 || step === 5) result.questionId = Content.intro.questions[step].id;
      }
      return Object.freeze(result);
    }
    const route = typeof hash === "string" && hash.length <= 100 ? hash.match(/^#(study|travel)\/([a-z0-9-]{1,80})$/) : null;
    if (!route) return Object.freeze(result);
    if (route[1] === "travel") {
      const item = category(route[2]);
      // A category displays several cards simultaneously; do not guess a current card.
      if (item) result.categoryId = item.id;
      return Object.freeze(result);
    }
    const current = course(route[2]);
    if (!current) return Object.freeze(result);
    result.courseId = current.id;
    result.courseRevision = Content.courseRevision(current.id);
    // A caller may supply a read-only draft snapshot before progress is persisted.
    const active = attempt === undefined ? progress?.study?.courses?.[current.id]?.active : attempt;
    if (!active || (active.courseRevision ?? Content.legacyCourseRevision[current.id]) !== result.courseRevision) return Object.freeze(result);
    const expectedIds = current.questions.map(question => question.id);
    if (active.questionIds !== undefined && (!Array.isArray(active.questionIds) || active.questionIds.length !== expectedIds.length || !active.questionIds.every((value,index) => value === expectedIds[index]))) return Object.freeze(result);
    if (active.phase === "cards") {
      const cards = current.type === "kana" ? current.cards : current.steps;
      if (integer(active.cursor,cards.length)) result.cardId = cards[active.cursor].id;
    } else if (active.phase === "quiz" && permutation(active.order,expectedIds.length) && integer(active.cursor,expectedIds.length)) {
      result.questionId = expectedIds[active.order[active.cursor]];
      if (current.type === "kana" && ["character","reading"].includes(active.direction)) result.direction = active.direction;
    }
    return Object.freeze(result);
  }

  function format(snapshot = {}) {
    if (!snapshot || typeof snapshot !== "object") return "";
    const lines = [];
    for (const name of Object.keys(assetVersions)) {
      const token = version(snapshot[assetVersions[name]]);
      if (token) lines.push(`${name}.js: ${token}`);
    }
    const current = snapshot.courseId === "intro" ? Content.intro : course(snapshot.courseId);
    if (current) {
      lines.push(`courseId: ${snapshot.courseId}`);
      const token = revision(snapshot.courseRevision);
      if (token === Content.courseRevision(snapshot.courseId)) lines.push(`courseRevision: ${token}`);
      const drill=Drill.pool(Content.grammar,DrillBank.questions).find(q=>q.id===snapshot.questionId && q.courseId===snapshot.courseId && q.revision===snapshot.drillRevision);
      if(drill) lines.push(`drillQuestionId: ${drill.id}`,`drillRevision: ${drill.revision}`);
      const questions = snapshot.courseId === "intro" ? Object.values(current.questions) : current.questions;
      const cards = snapshot.courseId === "intro" ? current.lessons : current.type === "kana" ? current.cards : current.steps;
      if (id(snapshot.questionId) && questions.some(question => question.id === snapshot.questionId)) lines.push(`questionId: ${snapshot.questionId}`);
      if (id(snapshot.cardId) && cards.some(card => card.id === snapshot.cardId)) lines.push(`cardId: ${snapshot.cardId}`);
      if (current.type === "kana" && id(snapshot.questionId) && questions.some(question => question.id === snapshot.questionId) && ["character","reading"].includes(snapshot.direction)) lines.push(`direction: ${snapshot.direction}`);
      if (current.type === "kana" && questions.some(question => question.id === snapshot.questionId) && snapshot.practiceVersion === 1 && ["first","retry","random"].includes(snapshot.round)) {
        lines.push("practiceVersion: 1",`round: ${snapshot.round}`);
      }
    }
    if (category(snapshot.categoryId)) lines.push(`categoryId: ${snapshot.categoryId}`);
    return lines.join("\n");
  }
  return Object.freeze({capture,format});
})();
