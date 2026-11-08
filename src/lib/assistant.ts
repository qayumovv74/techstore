import "server-only";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { getCatalog, parseFilters, type CatalogFilters, type CatalogItem } from "@/lib/catalog";
import { catalogHref } from "@/app/catalog/url";
import { getCurrentUser } from "@/lib/auth";
import { getCity } from "@/lib/city";
import { deliveryInfo } from "@/data/cities";
import { formatPrice, pluralize, statusLabel } from "@/lib/format";

/*
  Помощник магазина без внешнего ИИ: понимает простые запросы по ключевым словам,
  ищет товары в настоящем каталоге (категория, бренд, бюджет) и подсказывает, куда идти.
  Если когда-нибудь подключите LLM — достаточно заменить answer(), интерфейс останется тем же.
*/

export type AssistantProduct = { slug: string; name: string; brand: string; price: string; image: string | null; inStock: boolean };
export type AssistantReply = {
  text: string;
  products?: AssistantProduct[];
  links?: { label: string; href: string }[];
  chips?: string[];
};

const START_CHIPS = ["Подобрать смартфон", "Ноутбук для учёбы", "Наушники до 10 000 ₽", "Где мой заказ?", "Доставка и оплата"];

const CATEGORIES: { slug: string; name: [string, string, string]; re: RegExp }[] = [
  { slug: "smartphones", name: ["смартфон", "смартфона", "смартфонов"], re: /смартфон|телефон(?!\s+(магазин|поддержк))|айфон|iphone|galaxy\s*[as]\d|pixel|пиксел|мобильн/ },
  { slug: "laptops", name: ["ноутбук", "ноутбука", "ноутбуков"], re: /ноутбук|ноут(?![а-я])|макбук|macbook|лэптоп|ультрабук/ },
  { slug: "tablets", name: ["планшет", "планшета", "планшетов"], re: /планшет|айпад|ipad|\bpad\b/ },
  { slug: "audio", name: ["аудиотовар", "аудиотовара", "аудиотоваров"], re: /наушник|колонк|airpods|эйрподс|\bbuds\b|гарнитур|для музыки/ },
  { slug: "wearables", name: ["гаджет", "гаджета", "гаджетов"], re: /смарт-?час|(?<![а-я])час(ы|ики)(?![а-я])|браслет|трекер|\bwatch\b|airtag|метк|пауэрбанк|повербанк|power\s*bank|внешн[а-я]* аккумулятор/ },
];

const BRAND_ALIASES: [RegExp, string][] = [
  [/apple|эпл|эппл|айфон|iphone|макбук|macbook|айпад|ipad|airpods|эйрподс/, "Apple"],
  [/samsung|самсунг|галакси|galaxy/, "Samsung"],
  [/xiaomi|сяоми|ксиаоми|редми|redmi/, "Xiaomi"],
  [/honor|хонор/, "Honor"],
  [/huawei|хуавей|хуавэй/, "Huawei"],
  [/lenovo|леново/, "Lenovo"],
  [/asus|асус|\brog\b/, "ASUS"],
  [/acer|эйсер|асер/, "Acer"],
  [/\bdell\b|делл/, "Dell"],
  [/\bhp\b|хьюлетт|эйч\s?пи/, "HP"],
  [/\bmsi\b|мси/, "MSI"],
  [/sony|сони/, "Sony"],
  [/\bjbl\b|джибиэль/, "JBL"],
  [/bose|бозе|боуз/, "Bose"],
  [/marshall|маршал/, "Marshall"],
  [/google|гугл|pixel|пиксел/, "Google"],
  [/garmin|гармин/, "Garmin"],
  [/anker|анкер/, "Anker"],
];

/** «до 50к», «дешевле 50 000», «за 30 тыс» → рубли */
function parseBudget(t: string) {
  const amount = (n: string, unit?: string) => {
    const v = Number(n.replace(/\s/g, "").replace(",", "."));
    return Math.round(unit && /^(к|k|тыс|т)/.test(unit) ? v * 1000 : v);
  };
  const num = String.raw`(\d[\d\s]*(?:[.,]\d+)?)\s*(к(?![а-я])|k\b|тыс[а-я]*|т\.?\s?р\.?)?`;
  const max = t.match(new RegExp(String.raw`(?:до|дешевле|не дороже|в пределах|максимум|бюджет|за)\s*` + num));
  const min = t.match(new RegExp(String.raw`(?:от|дороже|минимум)\s*` + num));
  return {
    max: max ? amount(max[1], max[2]) : undefined,
    min: min ? amount(min[1], min[2]) : undefined,
  };
}

const toProduct = (p: CatalogItem): AssistantProduct => ({
  slug: p.slug,
  name: p.name,
  brand: p.brand,
  price: formatPrice(p.price),
  image: p.image,
  inStock: Number(p.available) > 0,
});

const has = (t: string, re: RegExp) => re.test(t);

export async function answer(input: string): Promise<AssistantReply> {
  const t = input.toLowerCase().replace(/ё/g, "е").trim();
  if (!t) return { text: "Напишите, что ищете — например «наушники до 10 000 ₽».", chips: START_CHIPS };

  // ─── разговор и навигация ───
  if (has(t, /^(привет|здравствуй|добрый|хай|hello|hi|салам|ассалам)/) && t.length < 30) {
    return {
      text: "Привет! Я помогу подобрать технику и подскажу, где что на сайте. Напишите, что ищете и в какой бюджет.",
      chips: START_CHIPS,
    };
  }
  if (has(t, /спасибо|благодар/)) return { text: "Пожалуйста! Если что-то ещё нужно — пишите.", chips: START_CHIPS };

  if (has(t, /поддержк|жалоб|оператор|живой|человек|менеджер|недовол|проблем|сломал|брак|не работает|не пришел|не пришл|претензи/)) {
    return {
      text: "Сочувствую, что что-то пошло не так. Напишите в поддержку — обращение придёт команде, ответим на вашу почту в течение рабочего дня.",
      links: [{ label: "Написать в поддержку", href: "/support" }],
    };
  }
  if (has(t, /возврат|вернуть|обмен|гаранти/)) {
    return {
      text: "На всю технику — официальная гарантия 12 месяцев. Для возврата или обмена оставьте обращение с номером заказа — подскажем, как оформить.",
      links: [{ label: "Возврат и гарантия", href: "/support?topic=RETURN" }],
    };
  }
  if (has(t, /где.*заказ|мой заказ|статус|отследит|трек|когда привезут/)) {
    const user = await getCurrentUser();
    if (!user) {
      return {
        text: "Статус заказа виден в личном кабинете — он обновляется в реальном времени. Войдите, и я покажу последний заказ.",
        links: [{ label: "Войти", href: "/login?next=/account/orders" }],
      };
    }
    const [last] = await db
      .select({ id: schema.orders.id, number: schema.orders.number, status: schema.orders.status, total: schema.orders.total })
      .from(schema.orders)
      .where(eq(schema.orders.userId, user.id))
      .orderBy(desc(schema.orders.createdAt))
      .limit(1);
    if (!last) return { text: "Заказов у вас пока нет. Подобрать что-нибудь?", chips: START_CHIPS.slice(0, 3) };
    return {
      text: `Последний заказ TS-${last.number} на ${formatPrice(last.total)} — «${statusLabel[last.status]}».`,
      links: [{ label: "Открыть заказ", href: `/account/orders/${last.id}` }, { label: "Все заказы", href: "/account/orders" }],
    };
  }
  if (has(t, /доставк|курьер|самовывоз|пункт выдач|привез/)) {
    const city = await getCity();
    const d = deliveryInfo(city);
    return {
      text: `${city}: курьером — ${d.courier}${d.courierPrice ? `, ${formatPrice(d.courierPrice)}` : ", бесплатно"}; самовывоз — ${d.pickup}, бесплатно. Город можно сменить в шапке сайта.`,
      links: [{ label: "Условия доставки", href: "/delivery" }],
    };
  }
  if (has(t, /рассрочк|кредит|частями|оплат|сбп|картой|наличн/)) {
    return {
      text: "Оплатить можно картой онлайн при оформлении. Есть рассрочка 0-0-12: без первого взноса и переплаты, платёж делится на 12 месяцев.",
      links: [{ label: "Про рассрочку", href: "/installment" }],
    };
  }
  if (has(t, /контакт|режим работы|часы работы|адрес магазин|телефон (магазин|поддержк)/)) {
    return { text: "Поддержка работает Пн–Вс 9:00–21:00, интернет-магазин — круглосуточно.", links: [{ label: "Контакты", href: "/contacts" }, { label: "Поддержка", href: "/support" }] };
  }
  if (has(t, /парол|не могу войти|регистрац|аккаунт/)) {
    return {
      text: "Войти можно по почте и паролю или через Google. Забыли пароль — пришлём ссылку на почту.",
      links: [{ label: "Вход", href: "/login" }, { label: "Восстановить пароль", href: "/forgot-password" }],
    };
  }
  if (has(t, /корзин/)) return { text: "Корзина — справа в шапке. Товары в ней сохраняются и после входа в аккаунт.", links: [{ label: "Открыть корзину", href: "/cart" }] };
  if (has(t, /избранн/)) return { text: "Сердечко на карточке добавляет товар в избранное.", links: [{ label: "Избранное", href: "/account/favorites" }] };

  // ─── подбор товаров ───
  const category = CATEGORIES.find((c) => c.re.test(t));
  const brands = [...new Set(BRAND_ALIASES.filter(([re]) => re.test(t)).map(([, b]) => b))];
  const { min, max } = parseBudget(t);
  const cheap = has(t, /дешев|бюджетн|недорог|подешевле|эконом/);
  const top = has(t, /лучш|топ|флагман|мощн|самый дорог|премиум|для игр|игров/);

  const base: CatalogFilters = { ...parseFilters({}), inStock: true };
  let filters: CatalogFilters | null = null;
  if (category || brands.length || min || max) {
    filters = { ...base, category: category?.slug, brands, min, max, sort: cheap || max ? "price_asc" : top ? "price_desc" : "popular" };
  }

  if (filters) {
    const data = await getCatalog(filters);
    const what = category ? category.name : (["товар", "товара", "товаров"] as [string, string, string]);
    const budget = max ? ` до ${max.toLocaleString("ru-RU")} ₽` : min ? ` от ${min.toLocaleString("ru-RU")} ₽` : "";
    const brandTxt = brands.length ? ` ${brands.join(", ")}` : "";

    if (!data.total) {
      // бюджет слишком мал — покажем самое доступное в этой категории
      if (max) {
        const cheaper = await getCatalog({ ...filters, max: undefined, sort: "price_asc" });
        if (cheaper.total) {
          return {
            text: `${brandTxt ? `${brandTxt.trim()} ` : ""}${what[2]}${budget} в наличии нет. Самые доступные варианты:`,
            products: cheaper.products.slice(0, 3).map(toProduct),
            links: [{ label: "Смотреть в каталоге", href: catalogHref({ ...filters, max: undefined, sort: "price_asc" }) }],
          };
        }
      }
      return { text: "Ничего подходящего в наличии не нашлось. Попробуйте другой бренд или бюджет.", chips: START_CHIPS.slice(0, 3) };
    }

    const purpose = has(t, /учеб|учёб|студент|работ|офис/) ? " Для учёбы и работы хватит любой модели из списка — смотрите на вес и время работы." : "";
    return {
      text: `Нашёл ${data.total} ${pluralize(data.total, what)}${brandTxt}${budget} в наличии. ${cheap || max ? "Начну с доступных" : top ? "Начну с самых мощных" : "Вот популярные"}:${purpose}`,
      products: data.products.slice(0, 3).map(toProduct),
      links: [{ label: `Все ${data.total} в каталоге`, href: catalogHref(filters) }],
    };
  }

  // ─── поиск по названию: «airpods 4», «zenbook» ───
  // \b в JS не работает с кириллицей, поэтому границы слов — через пробелы
  const q = ` ${t.replace(/[^\p{L}\p{N}\s-]/gu, " ")} `
    .replace(/\s(хочу|нужен|нужна|нужно|купить|подбери|подобрать|покажи|есть|ли|у|вас|пожалуйста|какой|какие|посоветуй)(?=\s)/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (q.length >= 2) {
    const data = await getCatalog({ ...base, q, inStock: false });
    if (data.total) {
      return {
        text: `По запросу «${q}» нашёл ${data.total} ${pluralize(data.total, ["товар", "товара", "товаров"])}:`,
        products: data.products.slice(0, 3).map(toProduct),
        links: [{ label: "Открыть в каталоге", href: catalogHref({ ...base, q, inStock: false }) }],
      };
    }
  }

  return {
    text: "Пока я понимаю простые запросы: что ищете, бренд и бюджет — например «смартфон Samsung до 60 000». Ещё подскажу про доставку, оплату и заказы. А если вопрос сложный — передам его в поддержку.",
    chips: START_CHIPS,
    links: [{ label: "Написать в поддержку", href: "/support" }],
  };
}

export { START_CHIPS };
