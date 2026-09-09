import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../public/kumir/',import.meta.url);
const text=p=>readFileSync(new URL(p,root),'utf8');
function harness(overrides={}){
  const elements=new Map(),storage=new Map();
  function element(){return {value:'',textContent:'',className:'',innerHTML:'',children:[],style:{},dataset:{},classList:{toggle(){},add(){}},append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},setAttribute(){},addEventListener(){},focus(){},click(){this.onclick?.();}};}
  const get=id=>{if(!elements.has(id))elements.set(id,element());return elements.get(id);};
  const context=vm.createContext({console,setTimeout,Blob,URL,document:{querySelector:get,querySelectorAll:()=>[],createElement:element},localStorage:{getItem:k=>storage.get(k)??null,setItem:(k,v)=>storage.set(k,String(v)),removeItem:k=>storage.delete(k)},fetch:async path=>({ok:true,json:async()=>JSON.parse(text(path.replace('../','')))}),confirm:()=>true,...overrides});
  vm.runInContext(text('task-config.js'),context);
  return {context,get,storage,run:s=>vm.runInContext(s,context)};
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,10));
test('OGE corridor accepts the screenshot program without returning to start',async()=>{
  const h=harness();h.run(text('app.js'));await settle();
  h.run("currentCat='oge';currentIndex=catTasks().findIndex(t=>t.id==='oge-16');render();");
  h.get('#speed').value='500';
  h.get('#code').value='использовать Робот\nалг\nнач\nнц пока снизу свободно\nзакрасить\nвниз\nкц\nзакрасить\nкон';
  await h.run('run()');
  assert.equal(h.run('completed.has(key())'),true);
  assert.equal(h.run('displayStates.every((s,i)=>s.r!==task().variants[i].start[0])'),true);
  assert.match(h.get('#message').textContent,/всех полях/);
});
test('simulator loads files and checks every field, including the third',async()=>{
  const h=harness();h.run(text('app.js'));await settle();
  assert.equal(h.run('tasks.length'),60);assert.equal(h.get('#simulatorContent').hidden,false);
  h.run(`const custom={version:1,category:'linear',tasks:[{id:'three',title:'Три поля',description:'Шаг вправо',fieldCount:3,fields:Array.from({length:3},()=>({rows:2,cols:3,robot:[0,0],targets:[[0,1]],walls:[],painted:[]}))}]};tasks.splice(0,tasks.length,...KumirConfig.toRuntime(custom));currentCat='linear';currentIndex=0;render();`);
  h.get('#speed').value='500';h.get('#code').value='вправо\nзакрасить';
  await h.run('run()');assert.equal(h.run('completed.size'),1);assert.match(h.get('#message').textContent,/всех полях \(3\)/);
  h.run(`completed.clear();tasks[0].variants[2].walls=['0,0:0,1'];`);
  await h.run('run()');assert.equal(h.run('completed.size'),0);assert.match(h.get('#message').textContent,/Поле 3.*стеной/);
});
test('missing category shows its filename and prevents running an empty simulator',async()=>{
  const h=harness({fetch:async()=>({ok:false,status:404})});h.run(text('app.js'));await settle();
  assert.equal(h.get('#simulatorContent').hidden,true);assert.match(h.get('#loadStatus').textContent,/tasks\/linear.json.*404/);
});
test('constructor edits, exports and reimports a category with three fields',async()=>{
  let exported;
  const h=harness({URL:{createObjectURL:blob=>{exported=blob;return 'blob:test';},revokeObjectURL(){}},setTimeout:()=>0});
  h.run(text('editor/editor.js'));await settle();
  assert.equal(h.run('configs.linear.tasks.length'),10);
  h.get('#addField').onclick();h.get('#addField').onclick();
  h.run(`tool='robot';editCell([1,2]);tool='target';editCell([1,3]);tool='right';editCell([0,0]);`);
  h.get('#exportButton').onclick();
  const output=JSON.parse(await exported.text());assert.equal(output.tasks[0].fieldCount,3);
  assert.deepEqual(output.tasks[0].fields[2].robot,[1,2]);assert.deepEqual(output.tasks[0].fields[2].targets,[[1,3]]);assert.equal(output.tasks[0].fields[2].walls.length,1);
  h.get('#importFile').files=[{size:100,name:'linear.json',text:()=>exported.text()}];await h.get('#importFile').onchange();
  assert.equal(h.run('configs.linear.tasks[0].fields.length'),3);
  assert.equal(h.run('configs.branch.tasks.length'),10);
});
