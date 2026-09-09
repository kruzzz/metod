import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';
import React from 'react';
import {renderToStaticMarkup} from 'react-dom/server';

const source=readFileSync(new URL('../app/cards/page.tsx',import.meta.url),'utf8');
const helpers=source.slice(source.indexOf('type Category'),source.indexOf('export default function Home'));
const js=ts.transpileModule(helpers+'\nglobalThis.subject = {makeTasks, growNumber, calculateExpression, NumberText, StudentCard, PrintAnswerCard};', {compilerOptions:{jsx:ts.JsxEmit.React,module:ts.ModuleKind.None,target:ts.ScriptTarget.ES2022}}).outputText;
const context=vm.createContext({React});
vm.runInContext(js,context);
const {makeTasks,StudentCard,PrintAnswerCard}=context.subject;
const digits='₀₁₂₃₄₅₆₇₈₉';
const base=s=>Number([...s].map(c=>digits.indexOf(c)).join(''));
test('conversion bases differ and answers retain the same value across all modes',()=>{
 for(const category of ['decimalToBase','baseToDecimal','baseToBase'])
 for(const choice of ['any','common',...Array.from({length:15},(_,i)=>i+2)])
 for(let trial=0;trial<50;trial++){
  const tasks=makeTasks(category,choice);assert.equal(tasks.length,10);
  for(const task of tasks){
   const match=task.prompt.match(/^([0-9A-F]+)([₀-₉]+) → \?([₀-₉]+)$/);assert.ok(match);
   const from=base(match[2]),to=base(match[3]);assert.notEqual(from,to);
   if(category==='decimalToBase')assert.equal(from,10);
   if(category==='baseToDecimal')assert.equal(to,10);
   const answer=task.answer.match(/^([0-9A-F]+)([₀-₉]+)$/);assert.equal(base(answer[2]),to);
   assert.equal(parseInt(match[1],from),parseInt(answer[1],to));
  }
 }
});
test('printed student and answer cards omit category labels but retain task bases',()=>{
 const tasks=[{prompt:'18₁₀ → ?₂',answer:'10010₂'}];
 const props={tasks,selectedLabel:'Из десятичной в другую',baseChoice:2,number:'01'};
 for(const html of [renderToStaticMarkup(React.createElement(StudentCard,{...props,compact:true})),renderToStaticMarkup(React.createElement(PrintAnswerCard,props))]){
  assert.doesNotMatch(html,/Из десятичной|Основание:|Разные основания/);
  assert.match(html,/18<sub class="number-base">10<\/sub>/);assert.match(html,/\?<sub class="number-base">2<\/sub>/);
 }
 const screen=renderToStaticMarkup(React.createElement(StudentCard,props));
 assert.match(screen,/Из десятичной в другую/);assert.match(screen,/Основание: 2/);
});
test('difficulty adds exactly the requested digits in each source base',()=>{
 for(let base=2;base<=16;base++)for(const value of [base,base*base-1,18,255])for(let attempt=0;attempt<30;attempt++){
  const original=value.toString(base).length;
  assert.equal(context.subject.growNumber(value,base,0),BigInt(value));
  assert.equal(context.subject.growNumber(value,base,1).toString(base).length,original+1);
  assert.ok([original+2,original+3].includes(context.subject.growNumber(value,base,2).toString(base).length));
 }
});
const parseBig=(str,radix)=>[...str].reduce((value,digit)=>value*BigInt(radix)+BigInt(parseInt(digit,radix)),0n);
test('all arithmetic levels produce exact answers, including beyond Number precision',()=>{
 let large=false;
 for(const category of ['oneAction','threeActions','fiveActions'])for(const difficulty of [0,1,2])for(const choice of ['any',2,16])for(let attempt=0;attempt<20;attempt++){
  for(const task of makeTasks(category,choice,difficulty)){
   const [expression]=task.prompt.split(' = ');
   const tokens=[...expression.matchAll(/([0-9A-F]+)([₀-₉]+)/g)];
   const values=tokens.map(m=>parseBig(m[1],base(m[2])));
   const ops=expression.match(/[+−×]/g)||[];
   const answer=task.answer.match(/^([0-9A-F]+)([₀-₉]+)$/);
   assert.ok(answer);
   const result=Function('return '+values.map((v,i)=>`${v}n${i<ops.length?ops[i].replace('×','*').replace('−','-'):''}`).join(''))();
   assert.equal(parseBig(answer[1],base(answer[2])),result);
   assert.ok(result>=0n);
   if(result>BigInt(Number.MAX_SAFE_INTEGER))large=true;
  }
 }
 assert.ok(large,'hard arithmetic exercises values beyond safe Number precision');
});
