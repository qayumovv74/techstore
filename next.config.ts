import type { NextConfig } from "next";
import { lanAddresses } from "./src/lib/lan";

const nextConfig: NextConfig = {
  // Тесты поднимают второй сервер на своей базе — ему нужна своя папка сборки
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // разрешаем открывать dev-сервер с телефона по адресу компьютера в домашней сети
  allowedDevOrigins: lanAddresses(),
  // В Docker собираем автономный сервер: в образ попадает только нужное из node_modules
  output: process.env.BUILD_STANDALONE ? "standalone" : undefined,
  // роут /uploads читает файлы по динамическому пути, и трассировка тянет в сборку весь проект — исходники там не нужны
  outputFileTracingExcludes: { "*": ["e2e/**", "src/**", "scripts/**", "deploy/**", ".photos-cache/**", "uploads/**", "test-results/**"] },
  experimental: {
    // загрузка фото товаров из админки: до 10 файлов по 8 МБ, с запасом на multipart
    serverActions: { bodySizeLimit: "40mb" },
    proxyClientMaxBodySize: "40mb",
  },
  // откуда next/image может брать локальные картинки
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
