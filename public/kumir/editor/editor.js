'use strict';
const $=s=>document.querySelector(s), C=KumirConfig;
const draftKey='kumir-constructor-v1';
let category='linear', taskIndex=0, fieldIndex=0, tool='robot', configs={};
const clone=x=>JSON.parse(JSON.stringify(x));
const newField=()=>({rows:5,cols:6,robot:[2,1],targets:[],painted:[],walls:[]});
const newTask=()=>({id:'task-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),title:'Новое задание',description:'Закрасьте отмеченные клетки.',starterCode:'',fieldCount:1,fields:[newField()]});
const current=()=>configs[category].tasks[taskIndex];
const field=()=>current().fields[fieldIndex];
const same=(a,b)=>!!a&&!!b&&a[0]===b[0]&&a[1]===b[1];
const contains=(list,cell)=>list.some(x=>same(x,cell));
const tools=[['robot','◆ Робот','Нажмите клетку, в которой Робот должен находиться в начале.'],['target','● Закрасить','Нажмите клетку, которую ученик должен закрасить. Повторное нажатие снимает отметку.'],['painted','▨ Уже закрашена','Начальная закраска: клетка будет закрашена до запуска программы.'],['up','Стена сверху','Нажмите клетку, чтобы поставить или убрать стену по её верхнему краю.'],['right','Стена справа','Нажмите клетку, чтобы поставить или убрать стену по её правому краю.'],['down','Стена снизу','Нажмите клетку, чтобы поставить или убрать стену по её нижнему краю.'],['left','Стена слева','Нажмите клетку, чтобы поставить или убрать стену по её левому краю.']];
const directions={up:[-1,0],right:[0,1],down:[1,0],left:[0,-1]};
function status(message,error=false){$('#status').textContent=message;$('#status').className=error?'error':'';}
function persist(){try{localStorage.setItem(draftKey,JSON.stringify(configs));return true;}catch{status('Не удалось сохранить черновик в браузере. Скачайте JSON, чтобы не потерять работу.',true);return false;}}
function button(text,action,active=false){const b=document.createElement('button');b.textContent=text;b.onclick=action;if(active)b.className='active';return b;}
function renderTaskList(){
  const list=$('#taskList');list.replaceChildren();
  configs[category].tasks.forEach((t,i)=>list.append(button(`${i+1}. ${t.title||'Без названия'}`,()=>{taskIndex=i;fieldIndex=0;render();},i===taskIndex)));
  $('#taskTotal').textContent=`(${configs[category].tasks.length})`;
  $('#deleteTask').disabled=configs[category].tasks.length===1;
  $('#addTask').disabled=$('#cloneTask').disabled=configs[category].tasks.length>=100;
}
function renderFields(){
  const t=current(),tabs=$('#fieldTabs');tabs.replaceChildren();
  t.fields.forEach((_,i)=>tabs.append(button(String(i+1),()=>{fieldIndex=i;renderFields();renderGrid();},i===fieldIndex)));
  $('#fieldTotal').textContent=`(${t.fields.length})`;
  $('#deleteField').disabled=t.fields.length===1;$('#addField').disabled=t.fields.length>=8;
  $('#rows').value=field().rows;$('#cols').value=field().cols;
}
function renderTools(){
  const container=$('#tools');container.replaceChildren();
  tools.forEach(([id,name])=>{const b=button(name,()=>{tool=id;renderTools();},id===tool);b.setAttribute('aria-pressed',String(id===tool));container.append(b);});
  $('#toolHint').textContent=tools.find(x=>x[0]===tool)[2];
}
function renderGrid(){
  const f=field(),grid=$('#grid');grid.replaceChildren();grid.style.gridTemplateColumns=`repeat(${f.cols},40px)`;
  for(let r=0;r<f.rows;r++)for(let c=0;c<f.cols;c++){
    const cell=[r,c],b=button('',()=>editCell(cell));b.className='cell';
    const labels=[`Строка ${r+1}, столбец ${c+1}`];
    for(const [dir,[dr,dc]] of Object.entries(directions)){
      const next=[r+dr,c+dc];
      if(next[0]<0||next[0]>=f.rows||next[1]<0||next[1]>=f.cols||f.walls.some(w=>C.edge(...w)===C.edge(cell,next))){b.classList.add('wall-'+dir);}
    }
    if(contains(f.painted,cell)){b.classList.add('painted');labels.push('уже закрашена');}
    const mark=(text,cls)=>{const s=document.createElement('span');s.textContent=text;s.className=cls;b.append(s);};
    if(same(f.robot,cell)){mark('◆','robot');labels.push('робот');}
    if(contains(f.targets,cell)){mark('●','target');labels.push('нужно закрасить');}
    b.setAttribute('aria-label',labels.join(', '));b.title=labels.join(', ');grid.append(b);
  }
  $('#fieldSummary').textContent=`Поле ${fieldIndex+1}: ${f.rows} × ${f.cols}. Робот: строка ${f.robot[0]+1}, столбец ${f.robot[1]+1}. Стен внутри: ${f.walls.length}. Клеток для закрашивания: ${f.targets.length}.`;
}
function editCell(cell){
  const f=field();
  if(tool==='robot')f[tool]=cell;
  else if(tool==='target'||tool==='painted'){
    const key=tool==='target'?'targets':'painted',index=f[key].findIndex(x=>same(x,cell));
    if(index<0)f[key].push(cell);else f[key].splice(index,1);
  }else{
    const [dr,dc]=directions[tool],next=[cell[0]+dr,cell[1]+dc];
    if(next[0]<0||next[0]>=f.rows||next[1]<0||next[1]>=f.cols){status('Внешняя граница всегда закрыта. Стены можно менять между клетками поля.');return;}
    const index=f.walls.findIndex(w=>C.edge(...w)===C.edge(cell,next));
    if(index<0)f.walls.push([cell,next]);else f.walls.splice(index,1);
  }
  persist();renderGrid();
  const selected=$('#grid').children[cell[0]*f.cols+cell[1]];selected?.focus({preventScroll:true});
}
function render(){
  $('#category').value=category;
  $('#destination').textContent=`public/kumir/tasks/${category}.json`;
  const t=current();$('#title').value=t.title;$('#description').value=t.description;$('#starterCode').value=t.starterCode;
  renderTaskList();renderFields();renderTools();renderGrid();
}
for(const c of C.categories){const option=document.createElement('option');option.value=c.id;option.textContent=`${c.icon} · ${c.name}`;$('#category').append(option);}
$('#category').onchange=()=>{category=$('#category').value;taskIndex=0;fieldIndex=0;render();};
for(const id of ['title','description','starterCode'])$('#'+id).oninput=()=>{current()[id]=$('#'+id).value;persist();if(id==='title')renderTaskList();};
$('#addTask').onclick=()=>{configs[category].tasks.push(newTask());taskIndex=configs[category].tasks.length-1;fieldIndex=0;persist();render();};
$('#cloneTask').onclick=()=>{const t=clone(current());t.id=newTask().id;t.title=(t.title+' — копия').slice(0,160);configs[category].tasks.splice(taskIndex+1,0,t);taskIndex++;fieldIndex=0;persist();render();};
$('#deleteTask').onclick=()=>{if(configs[category].tasks.length<=1)return;if(!confirm('Удалить выбранное задание из черновика?'))return;configs[category].tasks.splice(taskIndex,1);taskIndex=Math.min(taskIndex,configs[category].tasks.length-1);fieldIndex=0;persist();render();};
$('#addField').onclick=()=>{const t=current();if(t.fields.length>=8)return;t.fields.push(newField());t.fieldCount=t.fields.length;fieldIndex=t.fields.length-1;persist();renderFields();renderGrid();};
$('#deleteField').onclick=()=>{const t=current();if(t.fields.length<=1)return;if(!confirm('Удалить выбранное поле из задания?'))return;t.fields.splice(fieldIndex,1);t.fieldCount=t.fields.length;fieldIndex=Math.min(fieldIndex,t.fields.length-1);persist();renderFields();renderGrid();};
$('#resize').onclick=()=>{
  const rows=Number($('#rows').value),cols=Number($('#cols').value);
  if(![rows,cols].every(n=>Number.isInteger(n)&&n>=1&&n<=30)){status('Размер поля: от 1 до 30 строк и столбцов.',true);return;}
  const f=field(),inside=x=>x[0]<rows&&x[1]<cols;
  if((rows<f.rows||cols<f.cols)&&!confirm('Уменьшить поле? Объекты за новыми границами будут удалены, Робот переместится внутрь поля.'))return;
  f.rows=rows;f.cols=cols;f.robot=[Math.min(f.robot[0],rows-1),Math.min(f.robot[1],cols-1)];
  f.targets=f.targets.filter(inside);f.painted=f.painted.filter(inside);f.walls=f.walls.filter(w=>w.every(inside));if(f.end&&!inside(f.end))delete f.end;
  persist();renderGrid();status('Размер поля изменён.');
};
$('#importButton').onclick=()=>$('#importFile').click();
$('#importFile').onchange=async()=>{
  const file=$('#importFile').files[0];if(!file)return;
  try{
    if(file.size>5*1024*1024)throw new Error('Файл должен быть не больше 5 МБ.');
    const config=C.validate(JSON.parse(await file.text()));
    if(!confirm(`Заменить черновик категории «${C.categories.find(c=>c.id===config.category).name}» заданиями из файла?`))return;
    configs[config.category]=config;category=config.category;taskIndex=0;fieldIndex=0;const saved=persist();render();if(saved)status(`Открыт ${file.name}. Заданий: ${config.tasks.length}.`);
  }catch(e){status('Файл не открыт: '+e.message,true);}finally{$('#importFile').value='';}
};
$('#exportButton').onclick=()=>{
  try{
    const value=C.validate(configs[category],category);value.tasks.forEach(t=>t.fields.forEach(f=>delete f.end));const blob=new Blob([JSON.stringify(value,null,2)+'\n'],{type:'application/json'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=category+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    status(`Скачан ${category}.json. Замените им public/kumir/tasks/${category}.json и опубликуйте сайт заново.`);
  }catch(e){status('Исправьте файл перед скачиванием: '+e.message,true);}
};
async function init(){
  let draft={};try{const raw=JSON.parse(localStorage.getItem(draftKey)||'{}');if(raw&&typeof raw==='object'&&!Array.isArray(raw))draft=raw;}catch{}
  let fallback=false;
  await Promise.all(C.categories.map(async c=>{
    if(draft[c.id]){try{const candidate=clone(draft[c.id]);for(const t of candidate.tasks){if(t.title==='')t.title='Новое задание';if(t.description==='')t.description='Условие';}C.validate(candidate,c.id);configs[c.id]=draft[c.id];return;}catch{}}
    try{const response=await fetch(`../tasks/${c.id}.json`,{cache:'no-store'});if(!response.ok)throw new Error();configs[c.id]=C.validate(await response.json(),c.id);}
    catch{configs[c.id]={version:1,category:c.id,tasks:[newTask()]};fallback=true;}
  }));
  $('#editor').disabled=false;render();
  status(fallback?'Для недоступных категорий создан пустой черновик. Чтобы сохранить прежние задания, сначала откройте их JSON.':'Готово. Изменения сохраняются в черновике этого браузера.');
}
init();
