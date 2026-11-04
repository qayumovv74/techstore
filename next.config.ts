import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Тесты поднимают второй сервер на своей базе — ему нужна своя папка сборки
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
  // Фото товаров, загруженные через админку, отдаём как есть
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
