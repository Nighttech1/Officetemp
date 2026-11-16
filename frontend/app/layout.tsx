import type { Metadata, Viewport } from "next";
import { LandingFooter } from "@/components/landing/LandingFooter";
import { LandingNav } from "@/components/landing/LandingNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "DocSaaS — документы без срыва вёрстки",
  description:
    "Генерация DOCX и PDF из шаблонов Word и таблиц Excel, Google и Яндекс. 152‑ФЗ.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="font-sans antialiased">
        <a href="#main" className="skip-link">
          Перейти к содержимому
        </a>
        <LandingNav />
        {children}
        <LandingFooter />
      </body>
    </html>
  );
}
