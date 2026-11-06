/** Разрешаем только внутренние пути, чтобы ?next= нельзя было увести на чужой сайт */
export function safeNext(value: FormDataEntryValue | string | null | undefined, fallback: string) {
  const next = typeof value === "string" ? value : "";
  return next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\") ? next : fallback;
}
