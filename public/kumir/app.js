const CATEGORIES = KumirConfig.categories;
const W=(a,b)=>[a,b].sort().join(':');
const tasks=[];
const DEFAULT=`использовать Робот\nалг\nнач\n  | напишите команды здесь\nкон`;
let currentCat=localStorage.getItem('kumir-cat')||'linear';
let currentIndex=+(localStorage.getItem('kumir-index-'+currentCat)||0);
let completed=new Set(JSON.parse(localStorage.getItem('kumir-completed')||'[]'));
let failedAttempts=new Set(JSON.parse(localStorage.getItem('kumir-failed')||'[]'));
let state=null,running=false,shownVariant=0,runtimeTask=null;
const $=s=>document.querySelector(s);

function catTasks(){return tasks.filter(t=>t.cat===currentCat)}
function task(){return catTasks()[currentIndex]}
function field(){
  if(runtimeTask)return runtimeTask;
  const t=task();
  return t.variants?t.variants[shownVariant]:t;
}
function key(t=task()){return `${t.cat}-${t.id}-${t.revision}`}
function save(){localStorage.setItem('kumir-cat',currentCat);localStorage.setItem('kumir-index-'+currentCat,currentIndex);localStorage.setItem('kumir-completed',JSON.stringify([...completed]));localStorage.setItem('kumir-failed',JSON.stringify([...failedAttempts]))}
function renderCategories(){ $('#categories').innerHTML=CATEGORIES.map(c=>{const list=tasks.filter(t=>t.cat===c.id),done=list.filter(t=>completed.has(key(t))).length;return `<button class="category ${c.id===currentCat?'active':''} ${done===list.length?'done':''}" data-cat="${c.id}"><span>${c.icon} · ${done}/${list.length}</span>${c.name}</button>`}).join('');document.querySelectorAll('.category').forEach(b=>b.onclick=()=>{if(running)return;currentCat=b.dataset.cat;currentIndex=Math.min(+(localStorage.getItem('kumir-index-'+currentCat)||0),catTasks().length-1);save();render()})}
function renderTaskDots(){const list=catTasks();$('#taskDots').innerHTML=list.map((t,i)=>`<button class="task-dot ${i===currentIndex?'current':''} ${completed.has(key(t))?'success':failedAttempts.has(key(t))?'failed':''}" data-index="${i}" aria-label="Задание ${i+1}">${i+1}</button>`).join('');document.querySelectorAll('.task-dot').forEach(b=>b.onclick=()=>{if(running)return;currentIndex=+b.dataset.index;save();render()})}
function updateProgress(){const done=[...completed].filter(k=>tasks.some(t=>key(t)===k)).length;$('#progressLabel').textContent=`${done} из ${tasks.length} заданий`;$('#progressBar').style.width=`${done/tasks.length*100}%`}
function render(){const t=task(),cat=CATEGORIES.find(c=>c.id===currentCat),count=catTasks().length;shownVariant=0;renderCategories();renderTaskDots();$('#categoryLabel').textContent=cat.name;$('#taskTitle').textContent=t.title;$('#taskDescription').textContent=t.description;$('#taskCount').textContent=`${t.n} / ${count}`;$('#difficulty').textContent=t.n<Math.ceil(count/3)?'начальный':t.n<Math.ceil(count*2/3)?'средний':'сложный';$('#prevBtn').disabled=currentIndex===0;$('#nextBtn').disabled=currentIndex===count-1;const saved=localStorage.getItem('kumir-code-'+key());$('#code').value=saved||t.solution||DEFAULT;updateLines();resetBoard();updateProgress();hideMessage()}
function hasWall(t,r,c,dir){const nr=r+(dir==='down'?1:dir==='up'?-1:0),nc=c+(dir==='right'?1:dir==='left'?-1:0);if(nr<0||nr>=t.rows||nc<0||nc>=t.cols)return true;return t.walls.includes(W(`${r},${c}`,`${nr},${nc}`))}
let displayStates=[];
function freshState(t){return {r:t.start[0],c:t.start[1],paint:new Set(t.painted)}}
function resetBoard(){const t=task(),fields=t.variants||[t];displayStates=fields.map(freshState);drawBoards(fields,displayStates)}
function drawBoards(fields,states){const wrap=$('#boardWrap');wrap.classList.toggle('multi',fields.length>1);wrap.innerHTML='';fields.forEach((t,i)=>{const box=document.createElement('div');box.className='board-case';if(fields.length>1){const label=document.createElement('div');label.className='board-case-label';label.textContent=`Поле ${String(i+1)}`;box.append(label)}const b=document.createElement('div');b.className='board';b.setAttribute('aria-label',fields.length>1?`Поле Робота ${String(i+1)}`:'Поле Робота');b.style.gridTemplateColumns=`repeat(${t.cols},auto)`;const s=states[i];for(let r=0;r<t.rows;r++)for(let c=0;c<t.cols;c++){const k=`${r},${c}`,d=document.createElement('div');d.className='cell';if(s.paint.has(k))d.classList.add('paint');if(t.targets.includes(k))d.classList.add('target');if(hasWall(t,r,c,'up'))d.classList.add('wall-t');if(hasWall(t,r,c,'right'))d.classList.add('wall-r');if(hasWall(t,r,c,'down'))d.classList.add('wall-b');if(hasWall(t,r,c,'left'))d.classList.add('wall-l');if(s.r===r&&s.c===c)d.innerHTML='<div class="robot"></div>';b.append(d)}box.append(b);wrap.append(box)})}

function normalize(s){return s.toLowerCase().replace(/ё/g,'е').replace(/\s+/g,' ').trim()}
function condition(raw){let s=normalize(raw).replace(/[()]/g,'').trim();if(s.includes(' или '))return s.split(' или ').some(condition);if(s.includes(' и '))return s.split(' и ').every(condition);let neg=false;if(s.startsWith('не ')){neg=true;s=s.slice(3)}let v=false,t=field();const map={сверху:'up',снизу:'down',слева:'left',справа:'right'};for(const [ru,en] of Object.entries(map)){if(s===`${ru} свободно`)v=!hasWall(t,state.r,state.c,en);if(s===`${ru} стена`||s===`стена ${ru}`)v=hasWall(t,state.r,state.c,en)}if(s==='клетка закрашена')v=state.paint.has(`${state.r},${state.c}`);return neg?!v:v}
function parse(source){const lines=source.split(/\r?\n/).map((text,i)=>({text:normalize(text.replace(/\|.*$/,'')),line:i+1})).filter(x=>x.text&&!['использовать робот','алг','нач','кон'].includes(x.text));let p=0;function block(stops=[]){const out=[];while(p<lines.length&&!stops.includes(lines[p].text)){const x=lines[p++],s=x.text;if(['вверх','вниз','влево','вправо','закрасить'].includes(s))out.push({type:'cmd',value:s,line:x.line});else if(s.startsWith('если ')){const cond=s.replace(/^если /,'').replace(/ то$/,'');const yes=block(['иначе','все']);let no=[];if(lines[p]?.text==='иначе'){p++;no=block(['все'])}if(lines[p]?.text!=='все')throw new Error(`Строка ${x.line}: для «если» не найдено «все»`);p++;out.push({type:'if',cond,yes,no,line:x.line})}else if(s.startsWith('нц пока ')){const cond=s.slice(8),body=block(['кц']);if(lines[p]?.text!=='кц')throw new Error(`Строка ${x.line}: для цикла не найдено «кц»`);p++;out.push({type:'while',cond,body,line:x.line})}else if(/^нц \d+ раз$/.test(s)){const n=+s.match(/\d+/)[0],body=block(['кц']);if(lines[p]?.text!=='кц')throw new Error(`Строка ${x.line}: для цикла не найдено «кц»`);p++;out.push({type:'repeat',n,body,line:x.line})}else if(['иначе','все','кц'].includes(s)){p--;break}else throw new Error(`Строка ${x.line}: неизвестная команда «${x.text}»`)}return out}return block()}
const dirs={вверх:[-1,0,'up'],вниз:[1,0,'down'],влево:[0,-1,'left'],вправо:[0,1,'right']};
function flatten(ast){
  const out=[];let budget=0;
  function fail(message){const e=new Error(message);e.trace=out.slice();throw e}
  function go(nodes){for(const n of nodes){
    if(++budget>1500)fail('Программа выполняет слишком много команд. Проверьте условие цикла.');
    if(n.type==='cmd'){
      if(n.value==='закрасить'){out.push(n);state.paint.add(`${state.r},${state.c}`)}
      else{const [dr,dc,dir]=dirs[n.value];if(hasWall(field(),state.r,state.c,dir))fail(`Строка ${n.line}: Робот столкнулся со стеной`);out.push(n);state.r+=dr;state.c+=dc}
    }
    if(n.type==='if')go(condition(n.cond)?n.yes:n.no);
    if(n.type==='repeat')for(let i=0;i<n.n;i++)go(n.body);
    if(n.type==='while'){let guard=0;while(condition(n.cond)){if(++guard>300)fail(`Строка ${n.line}: цикл не заканчивается`);go(n.body)}}
  }}
  go(ast);return out
}
async function run(){
  if(running)return;hideMessage();const t=task(),runKey=key(t),fields=t.variants||[t];let ast;
  try{ast=parse($('#code').value)}catch(e){failedAttempts.add(runKey);save();renderTaskDots();showMessage(e.message,'error');return}
  const traces=[];
  for(const f of fields){runtimeTask=f;state=freshState(f);try{traces.push({commands:flatten(ast),error:null})}catch(e){traces.push({commands:e.trace||[],error:e.message})}}
  runtimeTask=null;displayStates=fields.map(freshState);drawBoards(fields,displayStates);running=true;setNavigationDisabled(true);
  try{
    const steps=Math.max(...traces.map(x=>x.commands.length),0),delay=500-+$('#speed').value;
    for(let step=0;step<steps;step++){
      traces.forEach((trace,i)=>{const cmd=trace.commands[step];if(!cmd)return;const s=displayStates[i];if(cmd.value==='закрасить')s.paint.add(`${s.r},${s.c}`);else{const [dr,dc]=dirs[cmd.value];s.r+=dr;s.c+=dc}});
      drawBoards(fields,displayStates);if(delay)await new Promise(r=>setTimeout(r,delay));
    }
    const crashes=traces.map((x,i)=>x.error?`Поле ${String(i+1)}: ${x.error}`:'').filter(Boolean);
    if(crashes.length){failedAttempts.add(runKey);save();renderTaskDots();showMessage(crashes.join(' · '),'error');return}
    const wrong=[];fields.forEach((f,i)=>{const s=displayStates[i],paintOK=f.targets.every(x=>s.paint.has(x))&&[...s.paint].every(x=>f.targets.includes(x)||f.painted.includes(x));if(!paintOK)wrong.push(fields.length>1?(String(i+1)):'текущем')});
    if(wrong.length){failedAttempts.add(runKey);save();renderTaskDots();showMessage(`Алгоритм завершён, но задание выполнено неточно на поле ${wrong.join(' и ')}: проверьте пропущенные и лишние клетки.`,'error');return}
    completed.add(runKey);failedAttempts.delete(runKey);save();showMessage(fields.length>1?`Задание выполнено точно на всех полях (${fields.length})!`:'Задание выполнено точно!','success');renderCategories();renderTaskDots();updateProgress();
  }finally{running=false;setNavigationDisabled(false)}
}
function showMessage(text,type){const m=$('#message');m.textContent=text;m.className=`message show ${type}`}
function hideMessage(){$('#message').className='message'}
function escapeHTML(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function highlightLine(line){
  const cut=line.indexOf('|'),code=cut<0?line:line.slice(0,cut),comment=cut<0?'':line.slice(cut),keywords=new Set(['использовать','алг','нач','кон','нц','пока','кц','если','то','иначе','все']),commands=new Set(['вверх','вниз','влево','вправо','закрасить','сверху','снизу','слева','справа','свободно','стена','не','и','или']);
  const colored=code.split(/([А-Яа-яЁё]+)/).map(part=>{const word=part.toLowerCase().replace(/ё/g,'е');if(word==='робот')return `<span class="syn-robot">${escapeHTML(part)}</span>`;if(keywords.has(word))return `<span class="syn-keyword">${escapeHTML(part)}</span>`;if(commands.has(word))return `<span class="syn-command">${escapeHTML(part)}</span>`;return escapeHTML(part)}).join('');
  return colored+(comment?`<span class="syn-comment">${escapeHTML(comment)}</span>`:'');
}
function updateLines(){const source=$('#code').value,n=source.split('\n').length;$('#lineNumbers').textContent=Array.from({length:n},(_,i)=>i+1).join('\n');$('#highlightedCode').innerHTML=source.split('\n').map(highlightLine).join('\n')+'\n'}
$('#code').addEventListener('scroll',()=>{$('#highlightedCode').scrollTop=$('#code').scrollTop;$('#highlightedCode').scrollLeft=$('#code').scrollLeft;$('#lineNumbers').scrollTop=$('#code').scrollTop});
$('#code').addEventListener('input',()=>{updateLines();localStorage.setItem('kumir-code-'+key(),$('#code').value)});$('#code').addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();const a=e.target.selectionStart;e.target.setRangeText('  ',a,e.target.selectionEnd,'end');updateLines()}});$('#runBtn').onclick=run;$('#resetBtn').onclick=resetBoard;$('#templateBtn').onclick=()=>{localStorage.removeItem('kumir-code-'+key());$('#code').value=task().solution||DEFAULT;updateLines()};$('#prevBtn').onclick=()=>{if(currentIndex){currentIndex--;save();render()}};$('#nextBtn').onclick=()=>{if(currentIndex<catTasks().length-1){currentIndex++;save();render()}};$('#helpBtn').onclick=()=>$('#helpDialog').showModal();$('#closeHelp').onclick=()=>$('#helpDialog').close();loadTasks();

function setNavigationDisabled(disabled){
  document.querySelectorAll('#categories button,#taskDots button,#runBtn,#resetBtn,#templateBtn,#prevBtn,#nextBtn').forEach(b=>b.disabled=disabled);
  if(!disabled){$('#prevBtn').disabled=currentIndex===0;$('#nextBtn').disabled=currentIndex===catTasks().length-1;}
}
async function loadTasks(){
  setNavigationDisabled(true);
  $('#simulatorContent').hidden=true;
  $('#loadStatus').hidden=false;
  $('#loadStatus').textContent='Загрузка заданий…';
  try{
    const groups=await Promise.all(CATEGORIES.map(async c=>{
      const path=`tasks/${c.id}.json`;
      try{
        const response=await fetch(path,{cache:'no-store'});
        if(!response.ok)throw new Error(`HTTP ${response.status}`);
        const config=KumirConfig.validate(await response.json(),c.id);
        return KumirConfig.toRuntime(config);
      }catch(e){throw new Error(`${path}: ${e.message}`);}
    }));
    tasks.splice(0,tasks.length,...groups.flat());
    if(!CATEGORIES.some(c=>c.id===currentCat))currentCat=CATEGORIES[0].id;
    currentIndex=Number.isInteger(currentIndex)?Math.max(0,Math.min(currentIndex,catTasks().length-1)):0;
    $('#simulatorContent').hidden=false;$('#loadStatus').hidden=true;
    render();setNavigationDisabled(false);
  }catch(e){
    $('#loadStatus').textContent='Не удалось загрузить задания. '+e.message+' Проверьте файл на сайте и обновите страницу. Для локального запуска используйте сервер, а не открытие HTML-файла.';
  }
}
