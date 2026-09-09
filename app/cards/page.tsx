"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Printer, Eye, EyeOff, Binary } from "lucide-react";
import Link from "next/link";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Category = "decimalToBase" | "baseToDecimal" | "baseToBase" | "oneAction" | "threeActions" | "fiveActions";
type BaseChoice = number | "any" | "common";
type PrintMode = "cards" | "answers";
type Task = { prompt: string; answer: string };
type Difficulty = 0 | 1 | 2;
const difficultyLabels = ["Простой", "Средний", "Сложный"];

const categories: { value: Category; label: string; note: string }[] = [
  { value: "decimalToBase", label: "Из десятичной в другую", note: "По умолчанию у каждого примера своё основание" },
  { value: "baseToDecimal", label: "Из другой в десятичную", note: "По умолчанию у каждого примера своё основание" },
  { value: "baseToBase", label: "Из другой в другую", note: "Исходное и конечное основания всегда различаются" },
  { value: "oneAction", label: "Арифметика — 1 действие", note: "Основания операндов и ответа различаются" },
  { value: "threeActions", label: "Арифметика — 3 действия", note: "Четыре операнда; разрядность зависит от сложности" },
  { value: "fiveActions", label: "Арифметика — 5 действий", note: "Шесть операндов; разрядность зависит от сложности" },
];

const bases = Array.from({ length: 15 }, (_, index) => index + 2);
const nonDecimalBases = bases.filter((base) => base !== 10);
const rnd = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const toBase = (value: number | bigint, base: number) => value.toString(base).toUpperCase();
const subscriptDigits = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
const subscriptBase = (base: number) => String(base).replace(/\d/g, (digit) => subscriptDigits[Number(digit)]);
const isBaseToBase = (category: Category) => category === "baseToBase";

function shuffledBases(count: number, candidates: number[] = bases) {
  const available = [...candidates];
  for (let index = available.length - 1; index > 0; index--) {
    const swapIndex = rnd(0, index);
    [available[index], available[swapIndex]] = [available[swapIndex], available[index]];
  }
  return available.slice(0, count);
}

function growNumber(value: number | bigint, base: number, difficulty: Difficulty): bigint {
  const extra = difficulty === 0 ? 0 : difficulty === 1 ? 1 : rnd(2, 3);
  const multiplier = base ** extra;
  return BigInt(value) * BigInt(multiplier) + BigInt(extra ? rnd(0, multiplier - 1) : 0);
}

function calculateExpression(values: bigint[], ops: string[]): bigint {
  let total = BigInt(0), term = values[0], sign = BigInt(1);
  ops.forEach((op, index) => {
    if (op === "×") term *= values[index + 1];
    else { total += sign * term; term = values[index + 1]; sign = op === "−" ? BigInt(-1) : BigInt(1); }
  });
  return total + sign * term;
}

function NumberText({ text }: { text: string }) {
  return <>{text.split(/([₀-₉]+)/).map((part, index) => /^[₀-₉]+$/.test(part)
    ? <sub className="number-base" key={index}>{[...part].map((digit) => subscriptDigits.indexOf(digit)).join("")}</sub>
    : part)}</>;
}

function arithmeticTask(actions: number, baseChoice: BaseChoice, difficulty: Difficulty = 0): Task {
  const ops = Array.from({ length: actions }, () => ["+", "−", "×"][rnd(0, 2)]);
  const operandBases = typeof baseChoice === "number"
    ? Array(actions + 1).fill(baseChoice)
    : shuffledBases(actions + 1);
  let values: bigint[] = operandBases.map((base) => BigInt(rnd(base, Math.min(base * base - 1, base + 35))));
  const answerBases = bases.filter((base) => !operandBases.includes(base));
  const answerBase = answerBases[rnd(0, answerBases.length - 1)];
  const calculate = () => calculateExpression(values, ops);
  let result = calculate();
  if (result < 0) {
    values[0] += -result + BigInt(rnd(2, 8));
    result = calculate();
  }
  values = values.map((value, index) => growNumber(value, operandBases[index], difficulty));
  result = calculate();
  if (result < BigInt(0)) {
    ops.forEach((op, index) => { if (op === "−") ops[index] = "+"; });
    result = calculate();
  }
  const prompt = values
    .map((value, index) => `${toBase(value, operandBases[index])}${subscriptBase(operandBases[index])}${index < ops.length ? ` ${ops[index]} ` : ""}`)
    .join("");
  return { prompt: `${prompt} = ?${subscriptBase(answerBase)}`, answer: `${toBase(result, answerBase)}${subscriptBase(answerBase)}` };
}

function makeTasks(category: Category, baseChoice: BaseChoice, difficulty: Difficulty = 0): Task[] {
  if (category === "baseToBase") {
    const allowedBases = baseChoice === "common" ? [2, 4, 8, 16] : bases;
    return Array.from({ length: 10 }, () => {
      const sourceBase = allowedBases[rnd(0, allowedBases.length - 1)];
      const targetCandidates = allowedBases.filter((base) => base !== sourceBase);
      const targetBase = targetCandidates[rnd(0, targetCandidates.length - 1)];
      const number = growNumber(rnd(18, 255), sourceBase, difficulty);
      return {
        prompt: `${toBase(number, sourceBase)}${subscriptBase(sourceBase)} → ?${subscriptBase(targetBase)}`,
        answer: `${toBase(number, targetBase)}${subscriptBase(targetBase)}`,
      };
    });
  }
  if (category === "oneAction" || category === "threeActions" || category === "fiveActions") {
    const actions = category === "oneAction" ? 1 : category === "threeActions" ? 3 : 5;
    return Array.from({ length: 10 }, () => arithmeticTask(actions, baseChoice, difficulty));
  }
  const taskBases = baseChoice === "any" || baseChoice === "common" || baseChoice === 10
    ? shuffledBases(10, nonDecimalBases)
    : Array(10).fill(baseChoice);
  return taskBases.map((base) => {
    if (category === "decimalToBase") {
      const number = growNumber(rnd(18, 255), 10, difficulty);
      return { prompt: `${number}${subscriptBase(10)} → ?${subscriptBase(base)}`, answer: `${toBase(number, base)}${subscriptBase(base)}` };
    }
    if (category === "baseToDecimal") {
      const number = growNumber(rnd(18, 255), base, difficulty);
      return { prompt: `${toBase(number, base)}${subscriptBase(base)} → ?${subscriptBase(10)}`, answer: `${number}${subscriptBase(10)}` };
    }
    return { prompt: "", answer: "" };
  });
}

function StudentCard({
  tasks,
  selectedLabel,
  baseChoice,
  number,
  compact = false,
}: {
  tasks: Task[];
  selectedLabel: string;
  baseChoice: BaseChoice;
  number: string;
  compact?: boolean;
}) {
  return (
    <article className={compact ? "print-card" : "paper task-paper"}>
      <div className="paper-head">
        <div><p>Карточка № {number}</p>{!compact && <h2>{selectedLabel}</h2>}</div>
        {!compact && <span>{baseChoice === "any" ? "Разные основания" : baseChoice === "common" ? "Основания: 2, 4, 8, 16" : `Основание: ${baseChoice}`}</span>}
      </div>
      <div className="student-line"><span>Фамилия, имя</span><i /><span>Класс</span><i className="short" /></div>
      <ol className="task-list">
        {tasks.map((task, index) => <li key={index}><span className="number-expression"><NumberText text={task.prompt} /></span><i /></li>)}
      </ol>
      {!compact && <footer>Системы счисления · 10 заданий</footer>}
    </article>
  );
}

function AnswerPanel({ tasks, number }: { tasks: Task[]; number: string }) {
  return (
    <article className="paper answer-paper">
      <div className="answer-head"><span>Ответы</span><small>Карточка № {number}</small></div>
      <ol className="answer-list">
        {tasks.map((task, index) => <li key={index}><span>{index + 1}</span><strong className="number-expression"><NumberText text={task.answer} /></strong></li>)}
      </ol>
      <p className="answer-note">Основание системы указано нижним индексом.</p>
    </article>
  );
}

function PrintAnswerCard({ tasks, number }: { tasks: Task[]; number: string }) {
  return (
    <article className="print-card print-answer-card">
      <div className="paper-head"><div><p>Контрольный экземпляр · № {number}</p></div><span>С ответами</span></div>
      <ol className="print-answer-list">
        {tasks.map((task, index) => <li key={index}><span className="number-expression">{index + 1}. <NumberText text={task.prompt} /></span><strong className="number-expression"><NumberText text={task.answer} /></strong></li>)}
      </ol>
    </article>
  );
}

export default function Home() {
  const [category, setCategory] = useState<Category>("decimalToBase");
  const [baseChoice, setBaseChoice] = useState<BaseChoice>("any");
  const [difficulty, setDifficulty] = useState<Difficulty>(0);
  const [seed, setSeed] = useState(0);
  const [answersVisible, setAnswersVisible] = useState(true);
  const [printMode, setPrintMode] = useState<PrintMode>("cards");
  const [tasks, setTasks] = useState<Task[]>([]);
  useEffect(() => { setTasks(makeTasks(category, baseChoice, difficulty)); }, [category, baseChoice, difficulty, seed]);
  const selected = categories.find((item) => item.value === category)!;
  const cardNumber = String(seed + 1).padStart(2, "0");

  const changeCategory = (value: Category) => {
    setCategory(value);
    setBaseChoice("any");
  };

  const runPrint = (mode: PrintMode) => {
    setPrintMode(mode);
    setTimeout(() => globalThis.print(), 0);
  };

  return (
    <main className={`min-h-screen print-mode-${printMode}`}>
      <header className="site-header screen-only"><div className="shell header-inner"><Link href="/" className="brand"><span className="brand-mark"><Binary size={22} /></span><span>Методическая мастерская</span></Link><span className="project-label">Проект 01</span></div></header>
      <div className="shell page-grid screen-only">
        <aside className="control-panel">
          <div><p className="eyebrow">Конструктор заданий</p><h1>Системы счисления</h1><p className="intro">Создайте готовую карточку для самостоятельной или проверочной работы.</p></div>
          <div className="field">
            <label>Тип заданий</label>
            <Select value={category} onValueChange={(value) => changeCategory(value as Category)}>
              <SelectTrigger className="select-control"><SelectValue /></SelectTrigger>
              <SelectContent>{categories.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent>
            </Select>
            <p className="field-note">{selected.note}</p>
          </div>
          <div className="field">
            <label>{category === "decimalToBase" ? "Система результата" : category === "baseToDecimal" ? "Исходная система" : category === "baseToBase" ? "Режим перевода" : "Основания операндов"}</label>
            <Select value={String(baseChoice)} onValueChange={(value) => setBaseChoice(value === "any" || value === "common" ? value : Number(value))}>
              <SelectTrigger className="select-control"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{isBaseToBase(category) ? "Любая → любая" : "Любая — разные основания"}</SelectItem>
                {isBaseToBase(category)
                  ? <SelectItem value="common">Только 2, 4, 8 и 16</SelectItem>
                  : (category === "decimalToBase" || category === "baseToDecimal" ? nonDecimalBases : bases).map((base) => <SelectItem key={base} value={String(base)}>{base}-ричная</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="field difficulty-field">
            <label id="difficulty-label">Сложность: {difficultyLabels[difficulty]}</label>
            <Slider aria-labelledby="difficulty-label" min={0} max={2} step={1} value={[difficulty]} onValueChange={(value) => setDifficulty(value[0] as Difficulty)} />
            <div className="difficulty-labels" aria-hidden="true">{difficultyLabels.map((label, index) => <span key={label} className={index === difficulty ? "active" : ""}>{label}</span>)}</div>
            <p className="field-note">{difficulty === 0 ? "Исходный уровень сложности." : difficulty === 1 ? "К каждому исходному числу добавлен один разряд в его системе счисления." : "К каждому исходному числу добавлены два или три разряда в его системе счисления."}</p>
          </div>
          <Button className="generate-button" onClick={() => setSeed((value) => value + 1)}><RefreshCw size={18} /> Сгенерировать заново</Button>
          <p className="tip">Каждое нажатие создаёт новый вариант из 10 заданий.</p>
        </aside>
        <section className="workspace">
          <div className="workspace-toolbar">
            <div><span className="status-dot" /> Карточка готова</div>
            <div className="toolbar-actions">
              <Button variant="outline" onClick={() => setAnswersVisible((value) => !value)}>{answersVisible ? <EyeOff size={17} /> : <Eye size={17} />} {answersVisible ? "Скрыть ответы" : "Показать ответы"}</Button>
              <Button variant="outline" onClick={() => runPrint("cards")}><Printer size={17} /> Печать 4 карточек</Button>
              <Button variant="outline" onClick={() => runPrint("answers")}><Printer size={17} /> Печать карточки с ответами</Button>
            </div>
          </div>
          <div className={`papers ${answersVisible ? "with-answers" : ""}`}>
            <StudentCard tasks={tasks} selectedLabel={selected.label} baseChoice={baseChoice} number={cardNumber} />
            {answersVisible && <AnswerPanel tasks={tasks} number={cardNumber} />}
          </div>
        </section>
      </div>

      <section className="print-sheet print-cards-sheet" aria-hidden="true">
        {[1, 2, 3, 4].map((copy) => <StudentCard key={copy} tasks={tasks} selectedLabel={selected.label} baseChoice={baseChoice} number={cardNumber} compact />)}
      </section>
      <section className="print-answer-sheet" aria-hidden="true">
        <PrintAnswerCard tasks={tasks} number={cardNumber} />
      </section>
    </main>
  );
}
