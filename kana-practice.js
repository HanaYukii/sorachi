"use strict";

// Pure kana practice rules. Sessions store stable IDs and answers, never inferred scores.
const KanaPractice = (() => {
  const VERSION = 1;
  const entries = Object.values(Content.courses).filter(c => c.type === 'kana').flatMap(c => c.questions.map(q => ({id:q.id,courseId:c.id,script:c.script,character:q.character,reading:q.reading})));
  const registry = new Map(entries.map(item => [item.id,item]));
  const entry = id => registry.get(id) || null;
  // Four-digit years only: an extreme saved date (+275760-…) would make later +1ms arithmetic throw.
  const iso = value => { const text = typeof value === 'string' && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null; return text && /^\d{4}-/.test(text) ? text : null; };
  // Common confusions outrank looser look-alikes when only one learned row may contribute.
  const groups = ['ぬめ','ねれわ','はほ','るろ','あお','さき','さち','いり','うつ','まも','シツ','ソン','クケ','クタ','ウワ','スヌ','チテ','クフワ','コユ','ナメ'];
  const looseGroups = ['はま','きち','シン','ツソ','ウフ','フラ','コロ'];
  const shuffled = list => {
    const result = [...list];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  };
  function question(id,direction,pool) {
    const target=entry(id), seen=new Set([target.reading]);
    const shares=(list,candidate)=>list.some(group=>group.includes(target.character)&&group.includes(entry(candidate).character));
    // か／が／ぱ-style pairs differ only by the voicing mark, the most common confusion once both are learned.
    const base=character=>character.normalize('NFD')[0];
    // きゃ meets き, but a contracted sound does not crowd out the classic look-alikes of a single kana (き meets さ).
    const sameBase=candidate=>base(entry(candidate).character)===base(target.character);
    const longer=candidate=>[...entry(candidate).character].length>[...target.character].length;
    const similar=candidate=>shares(groups,candidate)||sameBase(candidate)&&!longer(candidate)?2:shares(looseGroups,candidate)||sameBase(candidate)?1:0;
    const peers=shuffled(pool.filter(candidate=>candidate!==id && entry(candidate).script===target.script)).sort((a,b)=>similar(b)-similar(a));
    const sameRow=peers.filter(candidate=>entry(candidate).courseId===target.courseId), otherRows=peers.filter(candidate=>entry(candidate).courseId!==target.courseId);
    const options=[id];
    const add=candidate=>{if(options.length>=4||options.includes(candidate)||seen.has(entry(candidate).reading))return false;options.push(candidate);seen.add(entry(candidate).reading);return true;};
    // Two same-row peers keep the row from revealing the answer; at most one learned row adds a cross-row contrast.
    sameRow.slice(0,2).forEach(add);
    otherRows.some(add);
    sameRow.forEach(add);
    return {id,direction,options:shuffled(options)};
  }
  function create(ids,{completedIds=[],mode='course'}={}) {
    const unique=[...new Set(ids.filter(id=>registry.has(id)))];
    const targets=(mode==='review'?unique:shuffled(unique)).slice(0,5);
    if(!targets.length)return null;
    const allowed=new Set([...targets.map(id=>entry(id).courseId),...completedIds]);
    const pool=entries.filter(item=>allowed.has(item.courseId)).map(item=>item.id);
    const start=Math.random()<0.5?0:1;
    const questions=targets.map((id,index)=>question(id,(index+start)%2?'reading':'character',pool));
    const revisions=Object.fromEntries([...allowed].filter(id=>Content.courses[id]?.type==='kana').map(id=>[id,Content.courseRevision(id)]));
    return {version:VERSION,mode,round:'first',questions,cursor:0,answers:questions.map(()=>null),retryQuestions:[],retryAnswers:[],pool,revisions};
  }
  const current = session => session?.round==='done' ? null : (session?.round==='retry'?session.retryQuestions:session?.questions)?.[session.cursor] || null;
  const currentAnswers = session => session.round==='retry'?session.retryAnswers:session.answers;
  const answered = session => Boolean(current(session)) && currentAnswers(session)[session.cursor] !== null;
  function answer(session,choice) {
    const q=current(session);
    if(!q || answered(session) || !Number.isInteger(choice) || choice<0 || choice>=q.options.length)return null;
    const correct=q.options[choice]===q.id;
    currentAnswers(session)[session.cursor]=choice;
    return {id:q.id,correct,round:session.round};
  }
  function next(session) {
    if(!answered(session))return false;
    const questions=session.round==='retry'?session.retryQuestions:session.questions;
    if(session.cursor+1<questions.length){session.cursor++;return true;}
    if(session.round==='first') {
      session.retryQuestions=session.questions.filter((q,index)=>q.options[session.answers[index]]!==q.id).map(q=>question(q.id,q.direction==='reading'?'character':'reading',session.pool));
      session.retryAnswers=session.retryQuestions.map(()=>null);
      if(session.retryQuestions.length){session.round='retry';session.cursor=0;return true;}
    }
    session.round='done';session.cursor=0;return true;
  }
  const firstCorrect = session => session.questions.filter((q,index)=>q.options[session.answers[index]]===q.id).length;
  function sanitize(raw,{allowedCourseIds=null}={}) {
    if(!raw || raw.version!==VERSION || !['course','review'].includes(raw.mode) || !['first','retry','done'].includes(raw.round))return null;
    if(!Array.isArray(raw.pool)||raw.pool.length>entries.length||new Set(raw.pool).size!==raw.pool.length||raw.pool.some(id=>!entry(id)))return null;
    if(allowedCourseIds && raw.pool.some(id=>!allowedCourseIds.includes(entry(id).courseId)))return null;
    const usedCourses=[...new Set(raw.pool.map(id=>entry(id).courseId))];
    if(!raw.revisions || usedCourses.some(id=>raw.revisions[id]!==Content.courseRevision(id)))return null;
    const validQuestion=q=>q && raw.pool.includes(q.id) && ['character','reading'].includes(q.direction) && Array.isArray(q.options) && q.options.length>=2 && q.options.length<=5 && new Set(q.options).size===q.options.length && q.options.includes(q.id) && q.options.every(id=>raw.pool.includes(id)&&entry(id).script===entry(q.id).script) && new Set(q.options.map(id=>entry(id).reading)).size===q.options.length;
    const questions=raw.questions;
    if(!Array.isArray(questions)||questions.length<1||questions.length>5||!questions.every(validQuestion)||new Set(questions.map(q=>q.id)).size!==questions.length)return null;
    if(questions.length>1&&new Set(questions.map(q=>q.direction)).size!==2)return null;
    const validAnswers=(answers,qs)=>Array.isArray(answers)&&answers.length===qs.length&&answers.every((a,i)=>a===null || (Number.isInteger(a)&&a>=0&&a<qs[i].options.length));
    if(!validAnswers(raw.answers,questions)||!Array.isArray(raw.retryQuestions)||raw.retryQuestions.length>5||!raw.retryQuestions.every(validQuestion)||!validAnswers(raw.retryAnswers,raw.retryQuestions))return null;
    const missed=questions.filter((q,i)=>raw.answers[i]!==null&&q.options[raw.answers[i]]!==q.id);
    if(!Number.isInteger(raw.cursor)||raw.cursor<0)return null;
    if(raw.round==='first'){
      if(raw.cursor>=questions.length||raw.retryQuestions.length||raw.retryAnswers.length)return null;
      if(raw.answers.some((a,i)=>i<raw.cursor?a===null:i>raw.cursor?a!==null:false))return null;
    }else{
      if(raw.answers.some(a=>a===null)||raw.retryQuestions.length!==missed.length)return null;
      if(raw.retryQuestions.some((q,i)=>q.id!==missed[i].id||q.direction===missed[i].direction))return null;
      if(raw.round==='retry'){
        if(!missed.length||raw.cursor>=missed.length||raw.retryAnswers.some((a,i)=>i<raw.cursor?a===null:i>raw.cursor?a!==null:false))return null;
      }else if(raw.cursor!==0||raw.retryAnswers.some(a=>a===null))return null;
    }
    return {version:VERSION,mode:raw.mode,round:raw.round,questions:questions.map(q=>({id:q.id,direction:q.direction,options:[...q.options]})),cursor:raw.cursor,answers:[...raw.answers],retryQuestions:raw.retryQuestions.map(q=>({id:q.id,direction:q.direction,options:[...q.options]})),retryAnswers:[...raw.retryAnswers],pool:[...raw.pool],revisions:Object.fromEntries(usedCourses.map(id=>[id,raw.revisions[id]]))};
  }
  function sanitizeReview(raw) {
    const result={};
    for(const item of entries){const value=raw?.[item.id],date=iso(value?.lastSeen);if(date && typeof value.wrong==='boolean')result[item.id]={lastSeen:date,wrong:value.wrong};}
    return result;
  }
  function seedReview(review,history,clearedAt) {
    for(const record of [...(Array.isArray(history)?history:[])].sort((a,b)=>Date.parse(b?.date)-Date.parse(a?.date))){
      const date=iso(record?.date),course=Content.courses[record?.courseId];
      if(!date||course?.type!=='kana'||!Number.isInteger(record.total)||record.total<1||record.total>5||(clearedAt&&date<=clearedAt)||!Array.isArray(record.questionIds)||record.questionIds.length!==record.total||new Set(record.questionIds).size!==record.questionIds.length||record.questionIds.some(id=>entry(id)?.courseId!==course.id)||!Array.isArray(record.retryQuestions)||new Set(record.retryQuestions).size!==record.retryQuestions.length||record.retryQuestions.some(n=>!Number.isInteger(n)||n<1||n>record.total))continue;
      for(let i=0;i<record.questionIds.length;i++){
        const id=record.questionIds[i];if(review[id])continue;
        review[id]={lastSeen:date,wrong:record.retryQuestions.includes(i+1)};
      }
    }
  }
  function selectReview(review,courses,limit=5) {
    const candidates=entries.filter(item=>review[item.id] || iso(courses[item.courseId]?.completedAt));
    const date=item=>review[item.id]?.lastSeen || iso(courses[item.courseId]?.completedAt);
    // Missed characters come first, longest-waiting first, so a miss repeated in review rotates behind the others.
    candidates.sort((a,b)=>Number(review[b.id]?.wrong===true)-Number(review[a.id]?.wrong===true) || date(a).localeCompare(date(b)) || a.id.localeCompare(b.id));
    return candidates.slice(0,Math.max(0,Math.min(5,limit))).map(item=>item.id);
  }
  return {VERSION,entries,entry,create,sanitize,current,answered,answer,next,firstCorrect,sanitizeReview,seedReview,selectReview};
})();
