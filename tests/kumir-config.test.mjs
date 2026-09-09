import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
const root=new URL('../public/kumir/',import.meta.url);
vm.runInThisContext(readFileSync(new URL('task-config.js',root),'utf8'));
const C=globalThis.KumirConfig;
const config=id=>JSON.parse(readFileSync(new URL(`tasks/${id}.json`,root),'utf8'));
test('all 60 existing tasks load from the five category files',()=>{
  for(const [id,total] of [['linear',10],['branch',10],['while',10],['repeat',10],['oge',20]]){
    const value=C.validate(config(id),id);assert.equal(value.tasks.length,total);
    const runtime=C.toRuntime(value);assert.equal(runtime.length,total);
    runtime.forEach((t,i)=>{assert.equal(t.n,i+1);assert.equal(t.variants.length,value.tasks[i].fieldCount);});
  }
});
test('rejects invalid counts, coordinates, walls, duplicate IDs and wrong category',()=>{
  let value=config('linear');value.tasks[0].fieldCount=2;assert.throws(()=>C.validate(value),/fieldCount/);
  value=config('linear');value.tasks[0].fields[0].robot=[-1,0];assert.throws(()=>C.validate(value),/границами/);
  value=config('linear');value.tasks[0].fields[0].walls=[[[0,0],[1,1]]];assert.throws(()=>C.validate(value),/соседние/);
  value=config('linear');value.tasks[1].id=value.tasks[0].id;assert.throws(()=>C.validate(value),/уникальный/);
  assert.throws(()=>C.validate(config('linear'),'oge'),/Категория/);
});
test('supports more than two fields and invalidates completion after field changes',()=>{
  const value=config('linear');const t=value.tasks[0];
  t.fields.push(structuredClone(t.fields[0]),structuredClone(t.fields[0]));t.fieldCount=3;
  let result=C.toRuntime(value)[0];assert.equal(result.variants.length,3);
  const revision=result.revision;t.fields[2].robot=[0,0];result=C.toRuntime(value)[0];assert.notEqual(revision,result.revision);
});
test('normalizes duplicate walls and retains initial paint and required finish',()=>{
  const value=config('linear'),f=value.tasks[0].fields[0];f.walls=[[[0,0],[0,1]],[[0,1],[0,0]]];f.painted=[[0,0]];f.end=[0,1];
  const result=C.toRuntime(value)[0];assert.equal(result.walls.length,1);assert.deepEqual(result.painted,['0,0']);assert.deepEqual(result.end,[0,1]);
});
test('a saved and reopened category has identical task geometry',()=>{
  for(const c of C.categories){const value=C.validate(config(c.id));assert.deepEqual(C.validate(JSON.parse(JSON.stringify(value))),value);}
});
