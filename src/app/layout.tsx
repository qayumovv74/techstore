import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";

export const metadata: Metadata = {
  title: { default: "TechStore — техника с доставкой по Москве", template: "%s · TechStore" },
  description: "Смартфоны, ноутбуки, аудио и гаджеты с официальной гарантией.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <SiteHeader />
        <Suspense>{children}</Suspense>
        <footer className="border-t border-border py-6 text-center text-xs text-muted">
          TechStore · учебный проект для портфолио
        </footer>
      </body>
    </html>
  );
}
