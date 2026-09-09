import Link from "next/link";
import { ArrowUpRight, Binary } from "lucide-react";

export default function HomePage() {
  return (
    <main className="home-page">
      <header className="home-nav shell">
        <div className="home-brand"><Binary size={20} /><span>Методическая мастерская</span></div>
        <span className="home-nav-note">Информатика</span>
      </header>

      <section className="home-hero shell">
        <img
          className="home-logo"
          src="/informatics-logo.png"
          alt="Компьютер над открытой книгой с карандашом и линейкой"
          width="1254"
          height="1254"
        />
        <p className="eyebrow">Цифровая коллекция педагога</p>
        <h1 className="home-title">Разработки для уроков информатики</h1>
        <p className="home-description">
          Практические инструменты, которые помогают готовить задания и проводить уроки.
        </p>
      </section>

      <section className="projects-section shell" aria-labelledby="projects-title">
        <div className="projects-heading">
          <p className="eyebrow">Проекты</p>
          <h2 id="projects-title">Выберите разработку</h2>
        </div>

        <Link href="/cards" className="project-card">
          <span className="project-number">01</span>
          <div className="project-content">
            <h3>Генератор карточек</h3>
            <p>Задания по системам счисления, ответы и готовые листы для печати.</p>
          </div>
          <span className="project-open" aria-hidden="true"><ArrowUpRight size={24} /></span>
        </Link>
        <a href="/kumir/index.html" className="project-card">
          <span className="project-number">02</span>
          <div className="project-content">
            <h3>Симулятор КуМир</h3>
            <p>Робот, линейные алгоритмы, ветвления, циклы и подготовка к ОГЭ. Конструктор собственных заданий.</p>
          </div>
          <span className="project-open" aria-hidden="true"><ArrowUpRight size={24} /></span>
        </a>
        <a href="/complexity/index.html" className="project-card">
          <span className="project-number">03</span>
          <div className="project-content">
            <h3>Симулятор сложности алгоритмов</h3>
            <p>Пошаговая работа алгоритмов, сравнение числа операций, графики роста и примеры на Python.</p>
          </div>
          <span className="project-open" aria-hidden="true"><ArrowUpRight size={24} /></span>
        </a>
      </section>
    </main>
  );
}
