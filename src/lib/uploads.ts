import "server-only";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

// Файлы, загруженные через админку, живут вне public/: next start отдаёт public только из сборки.
// На сервере папка монтируется volume'ом, чтобы фото пережили пересборку контейнера.
// turbopackIgnore: без него сборщик видит путь от корня проекта, начинает следить за всеми файлами
// (dev перезагружается от любой записи на диск) и тащит весь проект в standalone-сборку
export const UPLOAD_DIR = path.resolve(/* turbopackIgnore: true */ process.cwd(), process.env.UPLOAD_DIR ?? "uploads");

export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export class UploadError extends Error {}

/** Фото товара → квадрат 1000×1000 WebP. EXIF (в т.ч. геометка с телефона) при этом выкидывается. */
export async function saveProductImage(file: File) {
  if (!ACCEPTED.includes(file.type)) throw new UploadError(`«${file.name}»: нужен JPG, PNG или WebP`);
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError(`«${file.name}» больше 8 МБ`);

  const input = Buffer.from(await file.arrayBuffer());
  let output: Buffer;
  try {
    output = await sharp(input)
      .rotate() // по EXIF-ориентации
      .resize(1000, 1000, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 82 })
      .toBuffer();
  } catch {
    throw new UploadError(`«${file.name}» не похож на изображение`);
  }

  const name = `${randomUUID()}.webp`;
  await mkdir(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "products"), { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "products", name), output);
  return `/uploads/products/${name}`;
}

/** Аватар → квадрат 320×320 WebP по центру кадра, без EXIF */
export async function saveAvatar(file: File) {
  if (!ACCEPTED.includes(file.type)) throw new UploadError("Нужна картинка JPG, PNG или WebP");
  if (file.size > MAX_UPLOAD_BYTES) throw new UploadError("Файл больше 8 МБ");

  let output: Buffer;
  try {
    output = await sharp(Buffer.from(await file.arrayBuffer()))
      .rotate()
      .resize(320, 320, { fit: "cover", position: "attention" })
      .webp({ quality: 84 })
      .toBuffer();
  } catch {
    throw new UploadError("Файл не похож на изображение");
  }

  const name = `${randomUUID()}.webp`;
  await mkdir(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "avatars"), { recursive: true });
  await writeFile(path.join(/* turbopackIgnore: true */ UPLOAD_DIR, "avatars", name), output);
  return `/uploads/avatars/${name}`;
}

/** Удаляет файл, загруженный через сайт (/uploads/…). Чужие пути и ошибки молча игнорируем. */
export async function removeUpload(url: string | null | undefined) {
  if (!url?.startsWith("/uploads/")) return;
  const file = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR, ...url.slice("/uploads/".length).split("/"));
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return;
  await unlink(file).catch(() => {});
}
