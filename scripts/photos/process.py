"""Готовит скачанные фото для сайта: квадрат 1000×1000, WebP.

Почти квадратные снимки просто обрезаем по центру. Вытянутые (телефон снят
вертикально) так обрезать нельзя — срежется сам товар. Их вписываем целиком,
а поля заполняем размытым увеличенным фоном этого же снимка.

python3 scripts/photos/process.py
"""
import json
import os

from PIL import Image, ImageFilter, ImageOps, ImageEnhance

RAW = ".photos-cache"
DST = "public/products"
SIZE = 1000


def square(im: Image.Image) -> Image.Image:
    w, h = im.size
    ratio = max(w, h) / min(w, h)
    if ratio <= 1.25:
        s = min(w, h)
        left, top = (w - s) // 2, (h - s) // 2
        return im.crop((left, top, left + s, top + s)).resize((SIZE, SIZE), Image.LANCZOS)

    bg = ImageOps.fit(im, (SIZE, SIZE), Image.LANCZOS).filter(ImageFilter.GaussianBlur(40))
    bg = ImageEnhance.Brightness(bg).enhance(0.85)
    fg = im.copy()
    fg.thumbnail((SIZE, SIZE), Image.LANCZOS)
    bg.paste(fg, ((SIZE - fg.width) // 2, (SIZE - fg.height) // 2))
    return bg


for slug in sorted(os.listdir(RAW)):
    os.makedirs(f"{DST}/{slug}", exist_ok=True)
    with open(f"{RAW}/{slug}/credits.json", encoding="utf-8") as f:
        credits = json.load(f)
    for c in credits:
        n = c["file"].split(".")[0]
        im = ImageOps.exif_transpose(Image.open(f"{RAW}/{slug}/{n}.jpg")).convert("RGB")
        square(im).save(f"{DST}/{slug}/{c['file']}", "WEBP", quality=80, method=6)
    with open(f"{DST}/{slug}/credits.json", "w", encoding="utf-8") as f:
        json.dump(credits, f, ensure_ascii=False, indent=2)
    print(slug, len(credits))
