import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import sharp from "sharp";

// Файлы, загруженные через админку, живут вне public/: next start отдаёт public только из сборки.
// На сервере папка монтируется volume'ом, чтобы фото пережили пересборку контейнера.
export const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "uploads");

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
  await mkdir(path.join(UPLOAD_DIR, "products"), { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, "products", name), output);
  return `/uploads/products/${name}`;
}
