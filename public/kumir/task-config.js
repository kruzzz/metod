(function () {
  'use strict';
  const categories = [
    {id:'linear',name:'Линейный алгоритм',icon:'01'},
    {id:'branch',name:'Алгоритм с ветвлением',icon:'02'},
    {id:'while',name:'Цикл ПОКА',icon:'03'},
    {id:'repeat',name:'Цикл РАЗ',icon:'04'},
    {id:'oge',name:'Задания ОГЭ',icon:'05'}
  ];
  const edge = (a,b) => [a.join(','),b.join(',')].sort().join(':');
  function validate(value, expectedCategory) {
    const fail = message => { throw new Error(message); };
    const object = x => x && typeof x==='object' && !Array.isArray(x);
    if(!object(value)||value.version!==1)fail('Требуется файл формата version: 1.');
    if(!categories.some(c=>c.id===value.category)||expectedCategory&&value.category!==expectedCategory)fail('Категория файла не соответствует выбранному разделу.');
    if(!Array.isArray(value.tasks)||value.tasks.length<1||value.tasks.length>100)fail('В категории должно быть от 1 до 100 заданий.');
    const ids=new Set();
    const result={version:1,category:value.category,tasks:value.tasks.map((t,i)=>{
      const prefix=`Задание ${i+1}: `;
      if(!object(t)||typeof t.id!=='string'||! /^[a-zA-Z0-9_-]{1,80}$/.test(t.id)||ids.has(t.id))fail(prefix+'нужен уникальный id (буквы, цифры, дефис).');
      ids.add(t.id);
      for(const [key,max] of [['title',160],['description',5000]])if(typeof t[key]!=='string'||!t[key].trim()||t[key].length>max)fail(prefix+`заполните ${key}, не более ${max} символов.`);
      if(t.starterCode!==undefined&&(typeof t.starterCode!=='string'||t.starterCode.length>20000))fail(prefix+'слишком длинный начальный код.');
      if(!Array.isArray(t.fields)||t.fields.length<1||t.fields.length>8||t.fieldCount!==t.fields.length)fail(prefix+'fieldCount должен совпадать с числом полей (от 1 до 8).');
      const fields=t.fields.map((f,j)=>{
        const p=prefix+`поле ${j+1}: `;
        if(!object(f)||![f.rows,f.cols].every(n=>Number.isInteger(n)&&n>=1&&n<=30))fail(p+'размеры должны быть целыми числами от 1 до 30.');
        const cell=(x,label)=>{if(!Array.isArray(x)||x.length!==2||!x.every(Number.isInteger)||x[0]<0||x[0]>=f.rows||x[1]<0||x[1]>=f.cols)fail(p+label+' находится за границами поля.');return [...x];};
        const cells=(list,label)=>{if(!Array.isArray(list)||list.length>900)fail(p+label+' должен быть списком клеток.');const seen=new Set();return list.map(x=>cell(x,label)).filter(x=>{const k=x.join(',');if(seen.has(k))return false;seen.add(k);return true;});};
        if(!Array.isArray(f.walls)||f.walls.length>1800)fail(p+'walls должен быть списком стен.');
        const seen=new Set();
        const walls=f.walls.map(w=>{if(!Array.isArray(w)||w.length!==2)fail(p+'стена задаётся двумя соседними клетками.');const a=cell(w[0],'Стена'),b=cell(w[1],'Стена');if(Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])!==1)fail(p+'стена должна разделять соседние клетки.');return [a,b];}).filter(w=>{const k=edge(...w);if(seen.has(k))return false;seen.add(k);return true;});
        return {rows:f.rows,cols:f.cols,robot:cell(f.robot,'Робот'),targets:cells(f.targets,'targets'),painted:cells(f.painted??[],'painted'),walls,...(f.end!==undefined?{end:cell(f.end,'Финиш')}:{})};
      });
      return {id:t.id,title:t.title.trim(),description:t.description.trim(),starterCode:t.starterCode??'',fieldCount:fields.length,fields};
    })};
    return result;
  }
  function signature(value){let h=2166136261;for(const c of JSON.stringify(value)){h=Math.imul(h^c.charCodeAt(0),16777619);}return (h>>>0).toString(16);}
  function toRuntime(value){const config=validate(value);return config.tasks.map((t,i)=>{
    const fields=t.fields.map(f=>({rows:f.rows,cols:f.cols,start:f.robot,targets:f.targets.map(x=>x.join(',')),painted:f.painted.map(x=>x.join(',')),walls:f.walls.map(w=>edge(...w)),...(f.end?{end:f.end}:{})}));
    return {...fields[0],cat:config.category,n:i+1,id:t.id,revision:signature(t.fields),title:t.title,description:t.description,solution:t.starterCode,variants:fields};
  });}
  globalThis.KumirConfig={categories,validate,toRuntime,edge};
})();
