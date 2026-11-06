import "server-only";
import nodemailer, { type Transporter } from "nodemailer";
import { lanAddresses } from "@/lib/lan";

/**
 * Почта.
 * - Заданы SMTP_* в .env → письма уходят по-настоящему (Gmail, Яндекс, Mail.ru, любой SMTP).
 * - Не заданы → в разработке письма уходят в тестовый ящик Ethereal, ссылка на просмотр — в консоли.
 */
type Sent = { ok: boolean; previewUrl?: string; error?: string };

let transporter: Transporter | null = null;
let isTest = false;

async function getTransport() {
  if (transporter) return transporter;

  // Автотесты: письмо собирается, но никуда не уходит
  if (process.env.MAIL_TRANSPORT === "json") {
    transporter = nodemailer.createTransport({ jsonTransport: true });
    return transporter;
  }

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    const port = Number(process.env.SMTP_PORT ?? 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    return transporter;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMTP не настроен: задайте SMTP_HOST, SMTP_USER, SMTP_PASS в .env");
  }
  const account = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: account.smtp.host,
    port: account.smtp.port,
    secure: account.smtp.secure,
    auth: { user: account.user, pass: account.pass },
  });
  isTest = true;
  return transporter;
}

export const mailIsReal = () =>
  process.env.MAIL_TRANSPORT !== "json" && Boolean(process.env.SMTP_HOST && process.env.SMTP_USER);

export async function sendMail(to: string, subject: string, html: string, text: string): Promise<Sent> {
  try {
    const t = await getTransport();
    const from = process.env.MAIL_FROM ?? `TechStore <${process.env.SMTP_USER ?? "no-reply@techstore.local"}>`;
    const info = await t.sendMail({ from, to, subject, html, text });
    const previewUrl = isTest ? nodemailer.getTestMessageUrl(info) || undefined : undefined;
    console.log(`[mail] «${subject}» → ${to}${previewUrl ? ` · просмотр: ${previewUrl}` : ""}`);
    return { ok: true, previewUrl };
  } catch (e) {
    // Письмо не должно ронять оформление заказа или вход — логируем и идём дальше
    console.error("[mail] не отправилось:", e);
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

/**
 * Адрес сайта для ссылок в письмах. В проде — APP_URL (домен).
 * В разработке localhost с телефона не откроется, поэтому подставляем адрес компьютера
 * в домашней сети: ссылка из письма откроется на любом устройстве в том же Wi-Fi.
 */
export function appUrl() {
  const url = new URL(process.env.APP_URL ?? "http://localhost:3000");
  if (process.env.NODE_ENV !== "production" && process.env.LAN_LINKS !== "0" && ["localhost", "127.0.0.1"].includes(url.hostname)) {
    const [ip] = lanAddresses();
    if (ip) url.hostname = ip;
  }
  return url.origin;
}
