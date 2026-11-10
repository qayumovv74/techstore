import { formatPrice, statusLabel } from "@/lib/format";
import { appUrl } from "./index";

// Письма собраны таблицами и inline-стилями — так их одинаково показывают Gmail, Яндекс и Outlook
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function layout(title: string, body: string, footer = "Письмо отправлено автоматически, отвечать на него не нужно.") {
  return `<!doctype html><html lang="ru"><body style="margin:0;background:#f5f3fa;font-family:Arial,sans-serif;color:#02010a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f3fa;padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#02010a;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">TechStore</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#efeaf8;color:#4b3f6b;font-size:12px">${esc(footer)}</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#6b4fa3;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">${esc(label)}</a>`;

export function resetPasswordMail(name: string, link: string, minutes: number) {
  const subject = "Восстановление пароля";
  const html = layout(subject, `<p>${esc(name)}, кто-то запросил смену пароля для вашего аккаунта.</p>
<p>Ссылка действует ${minutes} минут:</p><p>${button(link, "Задать новый пароль")}</p>
<p style="color:#4b3f6b;font-size:13px">Если это были не вы — просто удалите письмо, пароль останется прежним.</p>`);
  const text = `${name}, чтобы задать новый пароль, откройте ссылку (действует ${minutes} минут): ${link}`;
  return { subject, html, text };
}

export function verifyEmailMail(name: string, link: string, hours: number) {
  const subject = "Подтвердите почту";
  const html = layout(subject, `<p>${esc(name)}, спасибо за регистрацию в TechStore!</p>
<p>Подтвердите, что это ваш адрес — после этого можно оформлять заказы. Ссылка действует ${hours} часа:</p>
<p>${button(link, "Подтвердить почту")}</p>
<p style="color:#4b3f6b;font-size:13px">Если вы не регистрировались — просто удалите письмо.</p>`);
  const text = `${name}, подтвердите почту для TechStore (ссылка действует ${hours} часа): ${link}`;
  return { subject, html, text };
}

type MailOrder = {
  id: string;
  number: number;
  total: number;
  items: { name: string; qty: number; price: number }[];
};

function itemsTable(o: MailOrder) {
  const rows = o.items
    .map((i) => `<tr><td style="padding:6px 0">${esc(i.name)} × ${i.qty}</td><td align="right">${formatPrice(i.price * i.qty)}</td></tr>`)
    .join("");
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #ddd5ee;border-bottom:1px solid #ddd5ee;margin:16px 0">${rows}
<tr><td style="padding:10px 0;font-weight:bold">Итого</td><td align="right" style="font-weight:bold">${formatPrice(o.total)}</td></tr></table>`;
}

export function orderCreatedMail(o: MailOrder) {
  const subject = `Заказ TS-${o.number} оформлен`;
  const link = `${appUrl()}/account/orders/${o.id}`;
  const html = layout(subject, `<p>Спасибо за заказ! Товары зарезервированы на 15 минут — оплатите заказ, чтобы мы начали сборку.</p>
${itemsTable(o)}<p>${button(link, "Перейти к заказу")}</p>`);
  return { subject, html, text: `Заказ TS-${o.number} на ${formatPrice(o.total)} оформлен. Оплатить: ${link}` };
}

export function orderPaidMail(o: MailOrder) {
  const subject = `Заказ TS-${o.number} оплачен`;
  const link = `${appUrl()}/account/orders/${o.id}`;
  const html = layout(subject, `<p>Оплата прошла. Начинаем собирать заказ — сообщим, когда передадим его курьеру.</p>
${itemsTable(o)}<p>${button(link, "Статус заказа")}</p>`);
  return { subject, html, text: `Заказ TS-${o.number} оплачен. Статус: ${link}` };
}

export function orderStatusMail(o: { id: string; number: number; status: keyof typeof statusLabel }) {
  const label = statusLabel[o.status];
  const subject = `Заказ TS-${o.number}: ${label.toLowerCase()}`;
  const link = `${appUrl()}/account/orders/${o.id}`;
  const html = layout(subject, `<p>Новый статус заказа: <b>${esc(label)}</b>.</p><p>${button(link, "Открыть заказ")}</p>`);
  return { subject, html, text: `Заказ TS-${o.number}: ${label}. ${link}` };
}

type MailTicket = { number: number; name: string; email: string; topic: string; orderNumber?: string | null; message: string; userId?: string | null };

/** Письмо команде о новом обращении. «Ответить» в почте сразу пишет клиенту (Reply-To). */
export function supportTeamMail(t: MailTicket) {
  const subject = `Обращение №${t.number} · ${t.topic} · ${t.name}`;
  const row = (k: string, v: string) =>
    `<tr><td style="padding:6px 12px 6px 0;color:#4b3f6b;white-space:nowrap;vertical-align:top">${esc(k)}</td><td style="padding:6px 0">${v}</td></tr>`;
  const html = layout(`Новое обращение №${t.number}`, `<table cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:16px">
${row("Тема", esc(t.topic))}
${row("Клиент", `${esc(t.name)} · <a href="mailto:${esc(t.email)}">${esc(t.email)}</a>${t.userId ? " · есть аккаунт" : " · гость"}`)}
${t.orderNumber ? row("Заказ", `TS-${esc(t.orderNumber)}`) : ""}
</table>
<div style="white-space:pre-wrap;background:#f5f3fa;border-radius:12px;padding:16px;font-size:14px;line-height:1.5">${esc(t.message)}</div>
<p style="margin-top:20px">${button(`${appUrl()}/admin/support`, "Открыть в админке")}</p>
<p style="color:#4b3f6b;font-size:13px">Нажмите «Ответить» в почте — письмо уйдёт клиенту на ${esc(t.email)}.</p>`, "Уведомление с сайта TechStore. Ответ на это письмо получит клиент.");
  const text = `Обращение №${t.number}\nТема: ${t.topic}\nКлиент: ${t.name} <${t.email}>${t.orderNumber ? `\nЗаказ: TS-${t.orderNumber}` : ""}\n\n${t.message}`;
  return { subject, html, text };
}

/** Подтверждение клиенту, что обращение получено */
export function supportReceivedMail(t: MailTicket) {
  const subject = `Обращение №${t.number} принято`;
  const html = layout(subject, `<p>${esc(t.name)}, мы получили ваше сообщение и ответим на эту почту в течение рабочего дня (Пн–Вс 9:00–21:00).</p>
<p style="color:#4b3f6b;font-size:13px">Тема: ${esc(t.topic)}${t.orderNumber ? ` · заказ TS-${esc(t.orderNumber)}` : ""}</p>
<div style="white-space:pre-wrap;background:#f5f3fa;border-radius:12px;padding:16px;font-size:14px;line-height:1.5;color:#4b3f6b">${esc(t.message)}</div>`, "Чтобы дополнить обращение, просто ответьте на это письмо.");
  const text = `${t.name}, мы получили обращение №${t.number} и ответим на эту почту в течение рабочего дня.`;
  return { subject, html, text };
}
