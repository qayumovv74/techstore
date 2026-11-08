/**
 * Платёжная система по первым цифрам номера (BIN) и правила для неё:
 * допустимая длина номера, длина CVC, как группировать цифры, цвета «колец» на карте.
 * Используется и в форме (подсказка на лету), и на сервере шлюза (проверка).
 */
export type CardBrand = {
  id: string;
  name: string;
  lengths: number[];
  cvc: number;
  /** позиции пробелов: [4, 8, 12] → 0000 0000 0000 0000 */
  gaps: number[];
  rings: [string, string];
};

const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const G16 = [4, 8, 12, 16];

const BRANDS: (CardBrand & { re: RegExp })[] = [
  { id: "mir", name: "МИР", re: /^220[0-4]/, lengths: range(16, 19), cvc: 3, gaps: G16, rings: ["#1fb05a", "#0f75bc"] },
  { id: "amex", name: "American Express", re: /^3[47]/, lengths: [15], cvc: 4, gaps: [4, 10], rings: ["#2e77bb", "#8fd0ff"] },
  { id: "diners", name: "Diners Club", re: /^3(0[0-5]|[689])/, lengths: range(14, 19), cvc: 3, gaps: [4, 10], rings: ["#0079be", "#c9c9c9"] },
  { id: "jcb", name: "JCB", re: /^35(2[89]|[3-8]\d)/, lengths: range(16, 19), cvc: 3, gaps: G16, rings: ["#0e4c96", "#e60012"] },
  { id: "unionpay", name: "UnionPay", re: /^62/, lengths: range(16, 19), cvc: 3, gaps: G16, rings: ["#e21836", "#01798a"] },
  { id: "maestro", name: "Maestro", re: /^(5018|5020|5038|5893|6304|6759|676[1-3])/, lengths: range(12, 19), cvc: 3, gaps: G16, rings: ["#0099df", "#eb001b"] },
  { id: "mastercard", name: "Mastercard", re: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d\d|27[01]\d|2720)/, lengths: [16], cvc: 3, gaps: G16, rings: ["#eb001b", "#f79e1b"] },
  { id: "visa", name: "Visa", re: /^4/, lengths: [13, 16, 19], cvc: 3, gaps: G16, rings: ["#1a1f71", "#f7b600"] },
  { id: "discover", name: "Discover", re: /^(6011|64[4-9]|65)/, lengths: range(16, 19), cvc: 3, gaps: G16, rings: ["#ff6000", "#ffd9b8"] },
  { id: "uzcard", name: "Uzcard", re: /^8600/, lengths: [16], cvc: 3, gaps: G16, rings: ["#00a0e3", "#1b3f8f"] },
  { id: "humo", name: "Humo", re: /^9860/, lengths: [16], cvc: 3, gaps: G16, rings: ["#00a651", "#f7941d"] },
];

export const UNKNOWN_BRAND: CardBrand = { id: "unknown", name: "", lengths: range(13, 19), cvc: 3, gaps: G16, rings: ["#916bbf", "#3d2c8d"] };

export function detectBrand(digits: string): CardBrand {
  const d = digits.replace(/\D/g, "");
  return BRANDS.find((b) => b.re.test(d)) ?? UNKNOWN_BRAND;
}

/** Контрольная сумма по алгоритму Луна — ловит опечатку в одной цифре */
export function luhn(digits: string) {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let n = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
  }
  return digits.length > 0 && sum % 10 === 0;
}

/** 4242424242424242 → «4242 4242 4242 4242» по группам платёжной системы */
export function formatCardNumber(digits: string, brand = detectBrand(digits)) {
  let out = "";
  for (let i = 0; i < digits.length; i++) {
    if (i > 0 && (brand.gaps.includes(i) || (i >= 16 && i % 4 === 0))) out += " ";
    out += digits[i];
  }
  return out;
}

export function maxLength(brand: CardBrand) {
  return Math.max(...brand.lengths);
}
