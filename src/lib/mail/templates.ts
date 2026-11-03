import { formatPrice, statusLabel } from "@/lib/format";
import { appUrl } from "./index";

// Письма собраны таблицами и inline-стилями — так их одинаково показывают Gmail, Яндекс и Outlook
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

function layout(title: string, body: string) {
  return `<!doctype html><html lang="ru"><body style="margin:0;background:#f3f8f9;font-family:Arial,sans-serif;color:#05161a">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f8f9;padding:24px 0"><tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:#05161a;padding:20px 28px;color:#ffffff;font-size:20px;font-weight:bold">TechStore</td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-size:20px">${esc(title)}</h1>
${body}
</td></tr>
<tr><td style="padding:16px 28px;background:#e6f0f2;color:#294d61;font-size:12px">Письмо отправлено автоматически, отвечать на него не нужно.</td></tr>
</table></td></tr></table></body></html>`;
}

const button = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#0c7075;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold">${esc(label)}</a>`;

export function resetPasswordMail(name: string, link: string, minutes: number) {
  const subject = "Восстановление пароля";
  const html = layout(subject, `<p>${esc(name)}, кто-то запросил смену пароля для вашего аккаунта.</p>
<p>Ссылка действует ${minutes} минут:</p><p>${button(link, "Задать новый пароль")}</p>
<p style="color:#294d61;font-size:13px">Если это были не вы — просто удалите письмо, пароль останется прежним.</p>`);
  const text = `${name}, чтобы задать новый пароль, откройте ссылку (действует ${minutes} минут): ${link}`;
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
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;border-top:1px solid #c9dde3;border-bottom:1px solid #c9dde3;margin:16px 0">${rows}
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
