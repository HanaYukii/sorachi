"use strict";

// One atomic envelope; separate domains can acquire remote adapters later.
const DataStore = (() => {
  const MAX_ATTEMPTS = 200;
  const KEY = "sorachi:data:v2", LEGACY_KEY = "sorachi:first-lesson:v1";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const object = (v) => v && typeof v === "object" && !Array.isArray(v);
  const text = (v) => typeof v === "string" && v.length > 0 && v.length <= 200;
  let sequence = 0;
  const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${++sequence}`;
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0).toString(16); };
  function normalizeAttempts(entries, metadata = () => null) {
    if (!Array.isArray(entries)) return [];
    const occurrences = new Map();
    return entries.flatMap((item) => {
      if (!object(item) || typeof item.date !== "string" || !Number.isFinite(Date.parse(item.date))) return [];
      const courseId = text(item.courseId) ? item.courseId : null;
      const total = item.total ?? (courseId ? null : 2);
      if (!Number.isInteger(total) || total < 1 || total > 10000 || !(item.firstCorrect === null || Number.isInteger(item.firstCorrect) && item.firstCorrect >= 0 && item.firstCorrect <= total)) return [];
      if (!Array.isArray(item.retryQuestions) || !item.retryQuestions.every(q => Number.isInteger(q) && (courseId ? q >= 1 && q <= total : q === 4 || q === 5))) return [];
      const meta = metadata(courseId || "intro");
      const record = {
        date: new Date(item.date).toISOString(), ...(courseId ? {courseId} : {}),
        courseTitle: text(item.courseTitle) ? item.courseTitle : meta?.title || (courseId || "日文的三種文字"),
        courseRevision: text(item.courseRevision) ? item.courseRevision : meta?.legacyRevision || "unknown",
        total, firstCorrect: item.firstCorrect, retryQuestions: [...new Set(item.retryQuestions)],
      };
      if (Array.isArray(item.questionIds) && item.questionIds.length === total && item.questionIds.every(text) && new Set(item.questionIds).size === total) record.questionIds = [...item.questionIds];
      const signature = JSON.stringify(record);
      const occurrence = occurrences.get(signature) || 0; occurrences.set(signature, occurrence + 1);
      record.id = text(item.id) ? item.id : `legacy-${hash(signature)}-${occurrence}`;
      return [record];
    });
  }
  const makeAttempt = (entry) => ({...entry, id: uid()});
  function mergeAttempts(a, b) {
    const byId = new Map();
    for (const item of normalizeAttempts([...a, ...b])) if (!byId.has(item.id)) byId.set(item.id, item);
    return [...byId.values()].sort((a,b) => a.date.localeCompare(b.date));
  }
  const emptyIntro = () => ({step:0,completed:false,inProgress:false,answers:{},firstAnswers:{}});
  function learning(flat) {
    const intro = {...emptyIntro()};
    intro.step = Number.isInteger(flat?.step) ? Math.max(0,Math.min(5,flat.step)) : 0;
    intro.completed = flat?.completed === true;
    intro.inProgress = flat?.inProgress === true || (flat?.inProgress === undefined && intro.step > 0 && !intro.completed);
    for (const q of [4,5]) {
      if (typeof flat?.answers?.[q] === "boolean") intro.answers[q] = flat.answers[q];
      if (typeof flat?.firstAnswers?.[q] === "boolean") intro.firstAnswers[q] = flat.firstAnswers[q];
    }
    if (intro.step === 5 && !intro.answers[4]) intro.step = 4;
    if (text(flat?.contentRevision)) intro.contentRevision = flat.contentRevision;
    return {intro, study: object(flat?.study) ? clone(flat.study) : {script:"h",courses:{}}};
  }
  const favorites = (v) => Array.isArray(v) ? [...new Set(v.filter(text))] : [];
  function preferences(v) {
    const result = {};
    if (object(v) && typeof v.ttsRate === "number" && v.ttsRate >= 0.5 && v.ttsRate <= 1.5) result.ttsRate = v.ttsRate;
    return result;
  }
  function validSnapshot(v) {
    return object(v) && v.schemaVersion === 2 && object(v.owner) && v.owner.kind === "guest" && text(v.owner.id) && object(v.learning) && object(v.learning.intro) && object(v.learning.study) && Array.isArray(v.attempts) && Array.isArray(v.favorites) && object(v.preferences);
  }
  function create({storage,metadata = () => null,supportedCourseIds} = {}) {
    const supported = supportedCourseIds === undefined ? null : new Set(supportedCourseIds);
    let writable = true, protectedData = false, conflict = false, baselineRaw = null;
    let snapshot = {schemaVersion:2,owner:{kind:"guest",id:uid()},updatedAt:new Date().toISOString(),learning:learning(null),attempts:[],favorites:[],preferences:{}};
    // Reject an observed stale snapshot. This synchronous read/write check is
    // not a cross-tab transaction and does not claim to serialize concurrent writes.
    function checkForUpdates() {
      if (protectedData || conflict) return false;
      if (!storage) { writable = false; return false; }
      try {
        if ((storage.getItem(KEY) ?? null) !== baselineRaw) {
          conflict = true; writable = false; return false;
        }
        return true;
      } catch { protectedData = true; writable = false; return false; }
    }
    function commit(next) {
      if (!checkForUpdates()) return false;
      const candidate = {...next,updatedAt:new Date().toISOString()};
      try {
        const raw = JSON.stringify(candidate);
        storage.setItem(KEY,raw);
        snapshot = candidate; baselineRaw = raw; writable = true; return true;
      } catch { writable = false; return false; }
    }
    function clean(v) { return {...v,learning:learning({...v.learning.intro,study:v.learning.study}),attempts:normalizeAttempts(v.attempts,metadata).slice(-MAX_ATTEMPTS),favorites:favorites(v.favorites),preferences:preferences(v.preferences)}; }
    try {
      const raw = storage?.getItem(KEY) ?? null;
      baselineRaw = raw;
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (!validSnapshot(parsed) || normalizeAttempts(parsed.attempts,metadata).length !== parsed.attempts.length) throw Error("Unsupported data");
          snapshot = clean(parsed);
        }
        catch { protectedData = true; writable = false; }
      } else {
        const legacyRaw = storage?.getItem(LEGACY_KEY);
        let legacy = null;
        try { legacy = JSON.parse(legacyRaw || "null"); } catch { /* Keep original malformed legacy bytes intact. */ }
        if (object(legacy)) snapshot = {...snapshot,learning:learning(legacy),attempts:normalizeAttempts(legacy.history,metadata).slice(-MAX_ATTEMPTS)};
        commit(snapshot);
      }
    } catch { writable = false; protectedData = true; }
    return {
      readProgress: () => clone({...snapshot.learning.intro,study:snapshot.learning.study,history:snapshot.attempts}),
      readSnapshot: () => clone(snapshot), canPersist: () => writable, isProtected: () => protectedData,
      isConflict: () => conflict, checkForUpdates,
      // After an intentional clear, the v1 copy must not be migrated back if v2 later disappears.
      forgetLegacy() { if (!writable || !checkForUpdates()) return false; try { storage.removeItem(LEGACY_KEY); return true; } catch { return false; } },
      writeProgress(flat) {
        const nextLearning = learning(flat);
        if (supported) {
          // A smaller/older course catalog must not erase opaque future courses.
          // Known courses come only from the caller, so an intentional reset stays reset.
          const unknown = Object.fromEntries(Object.entries(snapshot.learning.study.courses || {}).filter(([id]) => !supported.has(id)));
          nextLearning.study.courses = {...unknown,...nextLearning.study.courses};
        }
        return commit({...snapshot,learning:nextLearning,attempts:normalizeAttempts(flat.history,metadata).slice(-MAX_ATTEMPTS)});
      },
      saveFavorites: (ids) => commit({...snapshot,favorites:favorites(ids)}),
      savePreferences: (value) => commit({...snapshot,preferences:preferences(value)}),
      exportBackup() {
        if (!checkForUpdates()) throw Error("Backup unavailable: stored data changed or could not be read safely; reload before exporting.");
        return JSON.stringify(snapshot,null,2);
      },
      // Import merges records and favorites; restores imported course progress only
      // where this browser has none. This is a local backup primitive, not cloud sync.
      importBackup(raw) {
        try {
          const parsed = JSON.parse(raw); if (!validSnapshot(parsed) || normalizeAttempts(parsed.attempts,metadata).length !== parsed.attempts.length) return false;
          const incoming = clean(parsed), current = snapshot.learning;
          const introStarted = current.intro.completed || current.intro.inProgress || current.intro.step > 0;
          const studyStarted = Object.keys(current.study.courses || {}).length > 0 || current.study.script === "k";
          return commit({...snapshot,learning:{intro:introStarted ? current.intro : incoming.learning.intro,study:{...incoming.learning.study,...(studyStarted ? current.study : {}),courses:{...incoming.learning.study.courses,...current.study.courses}}},attempts:mergeAttempts(snapshot.attempts,incoming.attempts).slice(-MAX_ATTEMPTS),favorites:favorites([...snapshot.favorites,...incoming.favorites]),preferences:{...incoming.preferences,...snapshot.preferences}});
        } catch { return false; }
      },
    };
  }
  return {KEY,MAX_ATTEMPTS,create,normalizeAttempts,makeAttempt,mergeAttempts};
})();
