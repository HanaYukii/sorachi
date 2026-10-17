"use strict";

// Pure continuous-practice engine. No DOM, storage, course completion or mistake queue.
const Drill = (() => {
  const VERSION = 1, LIMIT = 10000;
  const clone = value => JSON.parse(JSON.stringify(value));
  const object = v => v !== null && typeof v === 'object' && !Array.isArray(v);
  const text = v => typeof v === 'string' && v.length > 0 && v.length <= 200;
  const iso = v => typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v) && Number.isFinite(Date.parse(v)) && new Date(v).toISOString() === v;
  const integer = v => Number.isSafeInteger(v) && v >= 0;
  const blank = () => ({version:VERSION,clearedAt:null,session:null});
  const stamp = (...dates) => new Date(Math.min(Date.parse('9999-12-31T23:59:59.999Z'), Math.max(Date.now(), ...dates.filter(iso).map(v=>Date.parse(v)+1)))).toISOString();
  const hash = value => { let h=2166136261; for (const c of JSON.stringify(value)) h=Math.imul(h^c.charCodeAt(0),16777619); return (h>>>0).toString(16); };
  function pool(grammar, extra=[]) {
    const entries = [...grammar.flatMap(course=>course.questions.map(question=>({courseId:course.id,question}))), ...extra.map(question=>({courseId:question.courseId,question}))];
    return entries.map(({courseId,question})=>({id:question.id,courseId,revision:hash([courseId,question.prompt,question.options,question.answer,question.readings||null,question.promptReading||null,question.explanation]),question}));
  }
  const ref = entry => ({id:entry.id,revision:entry.revision,courseId:entry.courseId});
  const validRef = v => object(v) && text(v.id) && text(v.revision) && text(v.courseId);
  function inspect(value) {
    if (value === undefined) return null; // Older installations have no drill domain.
    if (object(value) && Number.isInteger(value.version) && value.version > VERSION) return 'newer';
    if (!object(value) || value.version !== VERSION || !(value.clearedAt === null || iso(value.clearedAt))) return 'invalid';
    const s=value.session;
    if (s === null) return null;
    if (!object(s) || !iso(s.startedAt) || !iso(s.updatedAt) || s.startedAt > s.updatedAt || (value.clearedAt && s.startedAt <= value.clearedAt) || s.cursor!==0 || typeof s.done!=='boolean' || !integer(s.answered) || !integer(s.correct) || s.correct>s.answered || ![undefined,true].includes(s.restarted)) return 'invalid';
    if (!Array.isArray(s.items) || s.items.length!==1 || !validRef(s.items[0]) || !Array.isArray(s.deck) || s.deck.length>=LIMIT || !s.deck.every(validRef)) return 'invalid';
    const ids=[s.items[0].id,...s.deck.map(q=>q.id)];
    if (new Set(ids).size!==ids.length) return 'invalid';
    const options=s.items[0].options;
    if (!Array.isArray(options) || options.length<2 || options.length>20 || new Set(options).size!==options.length || !options.every(v=>integer(v)&&v<options.length)) return 'invalid';
    if (!Array.isArray(s.answers) || s.answers.length>1 || (s.answers.length===1 && (!options.includes(s.answers[0]) || s.answered===0))) return 'invalid';
    return null;
  }
  function shuffle(list, random=Math.random) {
    const result=[...list];
    for(let i=result.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [result[i],result[j]]=[result[j],result[i]]; }
    return result;
  }
  function next(round, entries, random) {
    const previous=round.items[0]?.id;
    if (!round.deck.length) {
      round.deck=shuffle(entries.map(ref),random);
      const last=round.deck.length-1;
      if(last>0 && round.deck[last].id===previous) [round.deck[0],round.deck[last]]=[round.deck[last],round.deck[0]];
    }
    const entry=entries.find(q=>q.id===round.deck.at(-1).id);
    round.items=[{...round.deck.pop(),options:shuffle(entry.question.options.map((_,i)=>i),random)}];
    round.answers=[];
  }
  function start(value, entries, random=Math.random) {
    if(!entries.length || entries.length>LIMIT) throw Error('Invalid drill pool size');
    const data=clone(value), date=stamp(data.clearedAt,data.session?.updatedAt);
    data.session={startedAt:date,updatedAt:date,items:[],cursor:0,deck:[],answers:[],answered:0,correct:0,done:false};
    next(data.session,entries,random);return data;
  }
  function restore(value, entries) {
    if(inspect(value)) return blank(); // Storage rejects it before any writes; never overwrite the original bytes.
    const data=clone(value || blank()), s=data.session;
    if(!s) return data;
    const matches=q=>entries.some(e=>e.id===q.id && e.revision===q.revision && e.courseId===q.courseId);
    const current=entries.find(e=>e.id===s.items[0].id);
    if(![...s.items,...s.deck].every(matches) || s.items[0].options.length!==current?.question.options.length) {
      const restarted=start(data,entries); restarted.session.restarted=true; return restarted;
    }
    return data;
  }
  function act(value, entries, action, choice, random=Math.random) {
    const data=clone(value), s=data.session;
    if(!s) return null;
    if(action==='continue' && s.done) {s.done=false;if(s.answers.length) next(s,entries,random);}
    else if(s.done) return null;
    else if(action==='stop') s.done=true;
    else if(action==='answer' && !s.answers.length && s.items[0].options.includes(choice) && s.answered<Number.MAX_SAFE_INTEGER) {
      s.answers=[choice];s.answered++;
      if(choice===entries.find(e=>e.id===s.items[0].id).question.answer)s.correct++;
    } else if(action==='next' && s.answers.length) next(s,entries,random);
    else return null;
    delete s.restarted;
    s.updatedAt=stamp(data.clearedAt,s.updatedAt);return data;
  }
  function clear(value) { return {version:VERSION,clearedAt:stamp(value?.clearedAt,value?.session?.updatedAt),session:null}; }
  function merge(local, incoming) {
    const a=local||blank(), b=incoming||blank();
    const clearedAt=[a.clearedAt,b.clearedAt].filter(Boolean).sort().at(-1)||null;
    // Merge entire snapshots, never add counters or splice two shuffled passes.
    const sessions=[a.session,b.session].filter(s=>s && (!clearedAt || s.startedAt>clearedAt));
    sessions.sort((x,y)=>y.updatedAt.localeCompare(x.updatedAt)); // local wins a timestamp tie
    return clone({version:VERSION,clearedAt,session:sessions[0]||null});
  }
  return {VERSION,blank,pool,inspect,restore,start,act,clear,merge};
})();
