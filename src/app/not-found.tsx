import type { Metadata } from "next";
import { NotFound } from "@/components/ui/not-found-2";

export const metadata: Metadata = { title: "Страница не найдена" };

export default function NotFoundPage() {
  return <NotFound />;
}
