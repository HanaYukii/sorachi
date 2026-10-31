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
  const MAX_BACKUP_CHARS = 2000000;
  const time = (v) => typeof v === "string" && Number.isFinite(Date.parse(v)) ? Date.parse(v) : null;
  const later = (x, y) => (time(x) ?? -Infinity) >= (time(y) ?? -Infinity) ? x : y;
  const realProgress = (active) => object(active) && (active.phase !== "cards" || (Number.isInteger(active.cursor) && active.cursor > 0));
  // completedAt records the most recent completion, so the later side also supplies lastResult.
  // Kana course ids (h-*, k-*; validate() reserves these prefixes): a records clear ends their unfinished rounds, nothing else.
  const kanaCourse = (id) => /^[hk]-[a-z]+$/.test(id);
  function mergeCourse(local, incoming, clearWinner) {
    if (!object(incoming)) return clearWinner === "incoming" && object(local) ? {...local, active: null} : local;
    if (!object(local)) return clearWinner === "local" ? {...incoming, active: null} : incoming;
    const newer = later(local.completedAt, incoming.completedAt) === local.completedAt ? local : incoming;
    // Without a start time for each round, the side that cleared later decides which rounds survive.
    const active = clearWinner === "local" ? local.active ?? null
      : clearWinner === "incoming" ? incoming.active ?? null
      : realProgress(local.active) ? local.active : incoming.active ?? local.active ?? null;
    return {...incoming,...local,
      completedAt: time(newer.completedAt) === null ? null : newer.completedAt,
      attempts: Math.max(Number.isInteger(local.attempts) ? local.attempts : 0, Number.isInteger(incoming.attempts) ? incoming.attempts : 0),
      lastResult: newer.lastResult ?? null,
      active};
  }
  function mergePhotoWalk(local,incoming) {
    const ids=new Set(['cat','flower','tree','dog','bird']);
    const valid=x=>x && x.version===1;
    if(!valid(local))return valid(incoming)?incoming:null;
    if(!valid(incoming))return local;
    return {...local,photos:[...new Set([...(Array.isArray(local.photos)?local.photos:[]),...(Array.isArray(incoming.photos)?incoming.photos:[])].filter(id=>ids.has(id)))]};
  }
  function mergeStudy(local, incoming) {
    // A clear on either side wins: mistakes seen before the later clear are dropped, and review sessions and
    // unfinished kana rounds come only from the side that cleared later, even rounds the other side began after
    // that clear, because rounds carry no start time. Completion, results and grammar progress still merge.
    const localClear = time(local.reviewClearedAt) ?? -Infinity, incomingClear = time(incoming.reviewClearedAt) ?? -Infinity;
    const clearWinner = localClear > incomingClear ? "local" : incomingClear > localClear ? "incoming" : null;
    const courses = {...(incoming.courses || {})};
    for (const id of new Set([...Object.keys(local.courses || {}), ...Object.keys(incoming.courses || {})])) {
      courses[id] = mergeCourse(local.courses?.[id], incoming.courses?.[id], kanaCourse(id) ? clearWinner : null);
    }
    const cleared = later(local.reviewClearedAt, incoming.reviewClearedAt);
    const clearedAt = time(cleared) === null ? null : cleared;
    const fresh = (item) => clearedAt === null || (time(item?.lastSeen) ?? -Infinity) > time(clearedAt);
    const review = {};
    for (const source of [incoming.kanaReview, local.kanaReview]) for (const [id, item] of Object.entries(object(source) ? source : {})) if (fresh(item) && later(item?.lastSeen, review[id]?.lastSeen) === item?.lastSeen) review[id] = item;
    const learned = Object.values(local.courses || {}).some((course) => object(course) && (time(course.completedAt) !== null || realProgress(course.active)));
    const reviewSession = clearWinner === "local" ? local.reviewSession ?? null
      : clearWinner === "incoming" ? incoming.reviewSession ?? null
      : local.reviewSession ?? incoming.reviewSession ?? null;
    const grammarReview = {};
    for (const source of [incoming.grammarReview, local.grammarReview]) for (const [id,item] of Object.entries(object(source) ? source : {})) if (fresh(item) && later(item?.lastSeen, grammarReview[id]?.lastSeen) === item?.lastSeen) grammarReview[id] = item;
    const grammarReviewSession = clearWinner === "local" ? local.grammarReviewSession ?? null
      : clearWinner === "incoming" ? incoming.grammarReviewSession ?? null
      : local.grammarReviewSession ?? incoming.grammarReviewSession ?? null;
    return {...incoming,...local,drill:Drill.merge(local.drill,incoming.drill),photoWalk:mergePhotoWalk(local.photoWalk,incoming.photoWalk),suitcase:local.suitcase ?? incoming.suitcase ?? null,cafe:local.cafe ?? incoming.cafe ?? null,crossword:local.crossword ?? incoming.crossword ?? null,script:learned ? local.script : incoming.script ?? local.script,courses,kanaReview:review,reviewSession,grammarReview,grammarReviewSession,lastGrammarId:local.lastGrammarId ?? incoming.lastGrammarId ?? null,
      ...(clearedAt ? {reviewClearedAt:clearedAt} : {})};
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
  function favoriteChanges(v) {
    if (!object(v)) return {};
    return Object.fromEntries(Object.entries(v).filter(([id,item]) => text(id) && object(item) && typeof item.saved === "boolean" && time(item.updatedAt) !== null).map(([id,item]) => [id,{saved:item.saved,updatedAt:new Date(item.updatedAt).toISOString()}]));
  }
  function mergeFavorites(local,incoming) {
    const changes = favoriteChanges(incoming.favoriteChanges);
    for (const [id,item] of Object.entries(favoriteChanges(local.favoriteChanges))) {
      const old = changes[id];
      if (!old || time(item.updatedAt) > time(old.updatedAt) || time(item.updatedAt) === time(old.updatedAt) && !item.saved) changes[id] = item;
    }
    // Explicit removals beat legacy backup lists that have no per-item change information.
    const ids = favorites([...local.favorites,...incoming.favorites,...Object.keys(changes)]).filter(id => changes[id] ? changes[id].saved : true);
    return {favorites:ids,favoriteChanges:changes};
  }
  function preferences(v) {
    const result = {};
    if (object(v) && typeof v.ttsRate === "number" && v.ttsRate >= 0.5 && v.ttsRate <= 1.5) result.ttsRate = v.ttsRate;
    if (object(v?.kanaHints)) result.kanaHints = Object.fromEntries(Object.entries(v.kanaHints).filter(([key,value]) => /^[ぁ-ゖァ-ヺ]{1,3}$/u.test(key) && Number.isInteger(value) && value >= 0 && value <= 1));
    return result;
  }
  function mergePreferences(local,incoming) {
    const result = {...incoming,...local};
    if (local.kanaHints || incoming.kanaHints) result.kanaHints = {...incoming.kanaHints,...local.kanaHints};
    return preferences(result);
  }
  const accountIdValid = value => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  function removeAccountData(storage, accountId) {
    if (!accountIdValid(accountId)) throw Error("Invalid account ID");
    const ACCOUNT_PREFIX = "sorachi:acct:";
    const accountKey = `${ACCOUNT_PREFIX}${accountId}:v1`;
    // Snapshot the matching keys before deletion changes Storage's indexes.
    const suffixes = [""];
    for (let i = 0; i < storage.length; i++) {
      const key = storage.key(i);
      if (typeof key === "string" && key.startsWith(`${accountKey}:quarantine:`)) suffixes.push(key.slice(accountKey.length));
    }
    let failed = false;
    for (const suffix of suffixes) {
      const scopedKey = `${ACCOUNT_PREFIX}${accountId}:v1${suffix}`;
      try {
        storage.removeItem(scopedKey);
        if (storage.getItem(scopedKey) !== null) failed = true;
      } catch { failed = true; }
    }
    if (failed) throw Error("Account data removal failed");
  }
  function validSnapshot(v) {
    return object(v) && v.schemaVersion === 2 && object(v.owner) && (v.owner.kind === "guest" && text(v.owner.id) || v.owner.kind === "account" && accountIdValid(v.owner.id)) && object(v.learning) && object(v.learning.intro) && object(v.learning.study) && Array.isArray(v.attempts) && Array.isArray(v.favorites) && object(v.preferences);
  }
  function create({storage,metadata = () => null,supportedCourseIds,accountId = null} = {}) {
    if (accountId !== null && !accountIdValid(accountId)) throw Error("Invalid account ID");
    const ACCOUNT_PREFIX = "sorachi:acct:";
    const KEY = accountId ? `${ACCOUNT_PREFIX}${accountId}:v1` : "sorachi:data:v2";
    const owner = () => accountId ? {kind:"account",id:accountId} : {kind:"guest",id:uid()};
    const ownSnapshot = value => accountId ? value.owner.kind === "account" && value.owner.id === accountId : value.owner.kind === "guest";
    const supported = supportedCourseIds === undefined ? null : new Set(supportedCourseIds);
    // lockReason explains protectedData: "newer" (a later app wrote it), "invalid" (damaged or incomplete), "unreadable" (storage threw).
    let writable = true, protectedData = false, conflict = false, baselineRaw = null, lockReason = null;
    let snapshot = {schemaVersion:2,owner:owner(),updatedAt:new Date().toISOString(),learning:learning(null),attempts:[],favorites:[],preferences:{}};
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
      } catch { protectedData = true; lockReason ||= "unreadable"; writable = false; return false; }
    }
    function commit(next) {
      if (!checkForUpdates() || Drill.inspect(next.learning?.study?.drill)) return false;
      const candidate = {...next,updatedAt:new Date().toISOString()};
      try {
        const raw = JSON.stringify(candidate);
        storage.setItem(KEY,raw);
        snapshot = candidate; baselineRaw = raw; writable = true; return true;
      } catch { writable = false; return false; }
    }
    // Restores a backup into this browser. Records merge by id (newest 200 kept);
    // each course keeps the latest completion with its result and the larger attempt
    // count, and an in-progress round only fills in where this browser has none.
    // When one side cleared records later, that clear decides mistakes, review sessions
    // and unfinished kana rounds (see mergeStudy). This is a local backup primitive, not cloud sync.
    function importBackupDetailed(raw) {
      if (typeof raw !== "string" || raw.length > MAX_BACKUP_CHARS) return {ok:false,reason:"too-large"};
      let parsed;
      try { parsed = JSON.parse(raw); } catch { return {ok:false,reason:"invalid"}; }
      if (!validSnapshot(parsed) || Drill.inspect(parsed.learning?.study?.drill) || normalizeAttempts(parsed.attempts,metadata).length !== parsed.attempts.length) return {ok:false,reason:"invalid"};
      if (parsed.owner.kind === "account" && (!accountId || parsed.owner.id !== accountId)) return {ok:false,reason:"owner"};
      const incoming = clean(parsed), current = snapshot.learning;
      const localIds = new Set(snapshot.attempts.map((item) => item.id));
      // Count from the whole file (clean() keeps only the newest 200), each id once.
      const all = normalizeAttempts(parsed.attempts,metadata), incomingIds = new Set(all.map((item) => item.id));
      const attempts = mergeAttempts(snapshot.attempts,all).slice(-MAX_ATTEMPTS);
      const keptIds = new Set(attempts.map((item) => item.id));
      const fresh = [...incomingIds].filter((id) => !localIds.has(id));
      const report = {added:fresh.filter((id) => keptIds.has(id)).length,existing:incomingIds.size - fresh.length,skipped:fresh.filter((id) => !keptIds.has(id)).length,dropped:[...localIds].filter((id) => !keptIds.has(id)).length,
        clearApplied:(time(current.study.reviewClearedAt) ?? -Infinity) !== (time(incoming.learning.study.reviewClearedAt) ?? -Infinity)};
      const introStarted = current.intro.completed || current.intro.inProgress || current.intro.step > 0;
      const intro = introStarted ? {...current.intro,completed:current.intro.completed || incoming.learning.intro.completed} : incoming.learning.intro;
      const study = mergeStudy(current.study,incoming.learning.study);
      const ok = commit({...snapshot,learning:{intro,study},attempts,...mergeFavorites(snapshot,incoming),preferences:mergePreferences(snapshot.preferences,incoming.preferences)});
      return ok ? {ok,...report} : {ok,reason:"write"};
    }
    function clean(v) { return {...v,learning:learning({...v.learning.intro,study:v.learning.study}),attempts:normalizeAttempts(v.attempts,metadata).slice(-MAX_ATTEMPTS),favorites:favorites(v.favorites).filter(id => favoriteChanges(v.favoriteChanges)[id]?.saved !== false),...(v.favoriteChanges ? {favoriteChanges:favoriteChanges(v.favoriteChanges)} : {}),preferences:preferences(v.preferences)}; }
    try {
      const raw = storage?.getItem(KEY) ?? null;
      baselineRaw = raw;
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (object(parsed) && typeof parsed.schemaVersion === "number" && parsed.schemaVersion > 2) { lockReason = "newer"; throw Error("Newer data"); }
          if (!validSnapshot(parsed) || !ownSnapshot(parsed) || normalizeAttempts(parsed.attempts,metadata).length !== parsed.attempts.length) throw Error("Unsupported data");
          const drillProblem = Drill.inspect(parsed.learning.study.drill);
          if (drillProblem) { lockReason = drillProblem; throw Error("Unsupported drill data"); }
          snapshot = clean(parsed);
        }
        catch { protectedData = true; lockReason ||= "invalid"; writable = false; }
      } else {
        const legacyRaw = accountId ? null : storage?.getItem(LEGACY_KEY);
        let legacy = null;
        try { legacy = JSON.parse(legacyRaw || "null"); } catch { /* Keep original malformed legacy bytes intact. */ }
        if (object(legacy)) snapshot = {...snapshot,learning:learning(legacy),attempts:normalizeAttempts(legacy.history,metadata).slice(-MAX_ATTEMPTS)};
        commit(snapshot);
      }
    } catch { writable = false; protectedData = true; lockReason = "unreadable"; }
    return {
      key: KEY,
      readProgress: () => clone({...snapshot.learning.intro,study:snapshot.learning.study,history:snapshot.attempts}),
      readSnapshot: () => clone(snapshot), canPersist: () => writable, isProtected: () => protectedData,
      isConflict: () => conflict, checkForUpdates, lockReason: () => protectedData ? lockReason : null,
      // The untouched stored text behind a lock, for the learner to download.
      rawData: () => protectedData && lockReason !== "unreadable" ? baselineRaw : null,
      // Keep the locked text under a quarantine key, then start a fresh v2 snapshot.
      // Writing v2 (instead of removing it) keeps the v1 copy from being migrated again.
      restartProtected(now = new Date()) {
        if (!protectedData || lockReason === "unreadable" || conflict || baselineRaw === null) return false;
        try {
          if ((storage.getItem(KEY) ?? null) !== baselineRaw) { conflict = true; return false; }
          var quarantineKey = `${KEY}:quarantine:${now.toISOString()}`;
          storage.setItem(quarantineKey, baselineRaw);
        } catch { return false; }
        const fresh = {schemaVersion:2,owner:owner(),updatedAt:now.toISOString(),learning:learning(null),attempts:[],favorites:[],preferences:{}};
        protectedData = false; writable = true;
        if (commit(fresh)) { lockReason = null; return true; }
        // Drop only the copy made just now (the original key is untouched) so retries do not pile up copies.
        protectedData = true; writable = false;
        try { storage.removeItem(quarantineKey); } catch { /* The extra copy is harmless; the original stays intact. */ }
        return false;
      },
      // After an intentional clear, the v1 copy must not be migrated back if v2 later disappears.
      forgetLegacy() { if (accountId) return true; if (!writable || !checkForUpdates()) return false; try { storage.removeItem(LEGACY_KEY); return true; } catch { return false; } },
      writeProgress(flat) {
        const nextLearning = learning(flat);
        if (supported) {
          // A smaller/older course catalog must not erase opaque future courses
          // (or retired ones such as the old t-* travel quizzes).
          // Known courses come only from the caller, so an intentional reset stays reset.
          const unknown = Object.fromEntries(Object.entries(snapshot.learning.study.courses || {}).filter(([id]) => !supported.has(id)));
          nextLearning.study.courses = {...unknown,...nextLearning.study.courses};
        }
        return commit({...snapshot,learning:nextLearning,attempts:normalizeAttempts(flat.history,metadata).slice(-MAX_ATTEMPTS)});
      },
      saveFavorites(ids) {
        const next = favorites(ids), changes = favoriteChanges(snapshot.favoriteChanges);
        for (const id of new Set([...snapshot.favorites,...next])) if (snapshot.favorites.includes(id) !== next.includes(id)) changes[id] = {saved:next.includes(id),updatedAt:new Date(Math.max(Date.now(),(time(changes[id]?.updatedAt) ?? -1)+1)).toISOString()};
        return commit({...snapshot,favorites:next,favoriteChanges:changes});
      },
      savePreferences: (value) => commit({...snapshot,preferences:preferences(value)}),
      exportBackup() {
        if (!checkForUpdates()) throw Error("Backup unavailable: stored data changed or could not be read safely; reload before exporting.");
        return JSON.stringify(snapshot,null,2);
      },
      importBackup: (raw) => importBackupDetailed(raw).ok,
      importBackupDetailed,
    };
  }
  return {KEY,MAX_ATTEMPTS,MAX_BACKUP_CHARS,create,removeAccountData,normalizeAttempts,makeAttempt,mergeAttempts};
})();
