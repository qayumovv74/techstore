// Магазин работает по московскому времени — так и показываем в админке
const fmt = new Intl.DateTimeFormat("ru-RU", {
  timeZone: "Europe/Moscow",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const msk = (d: Date | null | undefined) => (d ? `${fmt.format(d)} МСК` : "—");
