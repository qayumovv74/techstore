import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource-variable/jetbrains-mono";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MobileTabbar } from "@/components/mobile-tabbar";
import { SilkBackground } from "@/components/ui/silk-background";
import { Assistant } from "@/components/assistant";

export const metadata: Metadata = {
  title: { default: "TechStore — техника с доставкой по Москве", template: "%s · TechStore" },
  description: "Смартфоны, ноутбуки, аудио и гаджеты с официальной гарантией.",
};

export const viewport: Viewport = {
  themeColor: "#02010a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col pb-24 md:pb-0">
        <SilkBackground />
        <SiteHeader />
        <Suspense>{children}</Suspense>
        <SiteFooter />
        <MobileTabbar />
        <Assistant />
      </body>
    </html>
  );
}
