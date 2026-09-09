import test from 'node:test';
import assert from 'node:assert/strict';
import {run,makeData} from '../public/complexity/algorithms.js';
function finish(topic,v,n,data=[],trace=false){const g=run(topic,v,n,data,trace);let s=g.next();while(!s.done)s=g.next();return s.value;}
test('divisor pairs include a square root only once and agree with full enumeration',()=>{for(const n of [1,2,36,97,100]){const a=finish('divisors',0,n),b=finish('divisors',1,n);assert.deepEqual(a.found,b.found);assert.equal(a.ops,n);assert.equal(b.ops,Math.floor(Math.sqrt(n)));assert.equal(new Set(b.found).size,b.found.length);}});
test('sorting variants sort identical inputs and tracing preserves counts',()=>{for(const kind of ['random','sorted','reverse','duplicates'])for(const v of [0,1]){const a=makeData(24,kind);const result=finish('sort',v,24,a);assert.deepEqual(result.data,[...a].sort((x,y)=>x-y));assert.deepEqual(finish('sort',v,24,a,true),result);}assert.equal(finish('sort',1,24,makeData(24,'sorted')).ops,24*23/2);});
test('binary search and linear search find the same last element',()=>{for(const n of [1,2,32,1000]){const a=finish('search',0,n),b=finish('search',1,n);assert.deepEqual(a.active,b.active);assert.equal(a.ops,n);assert.ok(b.ops<=Math.floor(Math.log2(n))+1);}});
test('Fibonacci recurrence and iterative values agree',()=>{for(let n=0;n<=15;n++)assert.equal(finish('fib',0,n).value,finish('fib',1,n).value);assert.equal(finish('fib',0,10).value,55);});
