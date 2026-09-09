import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Методическая мастерская — разработки для уроков информатики",
  description: "Практические цифровые инструменты и учебные проекты для проведения уроков информатики.",
  icons: {
    icon: "/metod/favicon.svg",
    shortcut: "/metod/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased">{children}</body>
    </html>
  );
}
