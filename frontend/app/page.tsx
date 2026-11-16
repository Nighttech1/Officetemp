import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "DocSaaS — документы без срыва вёрстки",
  description:
    "Генерация DOCX и PDF из шаблонов Word и таблиц Excel, Google и Яндекс. Очередь Celery, ZIP-архив, контур под 152‑ФЗ.",
};

export default function HomePage() {
  return <LandingPage />;
}
