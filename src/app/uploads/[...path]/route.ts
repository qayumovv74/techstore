import { readFile } from "node:fs/promises";
import path from "node:path";
import { UPLOAD_DIR } from "@/lib/uploads";

const TYPES: Record<string, string> = { ".webp": "image/webp", ".jpg": "image/jpeg", ".png": "image/png" };

export async function GET(_req: Request, ctx: RouteContext<"/uploads/[...path]">) {
  const parts = (await ctx.params).path;
  const file = path.resolve(/* turbopackIgnore: true */ UPLOAD_DIR, ...parts);
  // защита от ../../etc/passwd
  if (!file.startsWith(UPLOAD_DIR + path.sep)) return new Response("not found", { status: 404 });
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("not found", { status: 404 });
  try {
    const body = await readFile(file);
    return new Response(body, {
      headers: { "Content-Type": type, "Cache-Control": "public, max-age=31536000, immutable" },
    });
  } catch {
    return new Response("not found", { status: 404 });
  }
}
