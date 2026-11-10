import type { NextConfig } from "next";
import { lanAddresses } from "./src/lib/lan";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy: браузер выполняет только наши скрипты и ходит только на наш сервер.
 * 'unsafe-inline' для скриптов нужен самому Next.js (данные страницы вшиты в HTML);
 * nonce-вариант несовместим со статическими оболочками страниц (cacheComponents).
 * 'unsafe-eval' и ws: — только в разработке, для горячей перезагрузки.
 */
const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self'${isDev ? " ws: wss:" : ""}`,
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  // сайт нельзя встроить в чужой iframe — защита от кликджекинга
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), usb=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // после первого визита браузер год ходит на сайт только по https
  ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]),
];

const nextConfig: NextConfig = {
  // не сообщаем, на чём сделан сайт
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  // Тесты поднимают второй сервер на своей базе — ему нужна своя папка сборки
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // разрешаем открывать dev-сервер с телефона по адресу компьютера в домашней сети
  allowedDevOrigins: lanAddresses(),
  // В Docker собираем автономный сервер: в образ попадает только нужное из node_modules
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  // роут /uploads читает файлы по динамическому пути, и трассировка тянет в сборку весь проект — исходники там не нужны
  outputFileTracingExcludes: { "*": ["e2e/**", "src/**", "scripts/**", "deploy/**", "uploads/**", "test-results/**"] },
  experimental: {
    // загрузка фото товаров из админки: до 10 файлов по 8 МБ, с запасом на multipart
    serverActions: { bodySizeLimit: "40mb" },
    proxyClientMaxBodySize: "40mb",
  },
  // откуда next/image может брать локальные картинки (у фото товаров в адресе ?v=<хеш> — версия файла)
  images: { localPatterns: [{ pathname: "/products/**" }, { pathname: "/uploads/**" }, { pathname: "/brand/**" }] },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
