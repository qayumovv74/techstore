/**
 * Хеширование паролей.
 *
 * argon2id — то, что сейчас советует OWASP: медленный и требует 19 МБ памяти на одну проверку,
 * поэтому перебор на видеокартах выходит дорогим.
 *
 * Соль. argon2 сам берёт случайную соль для каждого хеша и хранит её внутри строки:
 *   $argon2id$v=19$m=19456,t=2,p=1$<соль>$<хеш>
 * Два одинаковых пароля дают разные хеши, готовые таблицы подбора бесполезны.
 *
 * Перец. PASSWORD_PEPPER — общий секрет из .env, он подмешивается в каждый хеш.
 * В базе его нет: если утечёт только дамп базы, пароли из него не подобрать.
 * Перец нельзя менять после запуска — все сохранённые пароли перестанут подходить.
 *
 * Старые хеши bcrypt ($2a$/$2b$, без перца) продолжают работать: после удачного входа
 * пароль перехешируется в argon2id (needsRehash), и через какое-то время bcrypt в базе не останется.
 *
 * Модуль без "server-only": им пользуются и сайт, и скрипты в scripts/.
 */
import { randomBytes } from "node:crypto";
import { hash, verify } from "@node-rs/argon2";
import bcrypt from "bcryptjs";

// минимальные параметры из OWASP Password Storage Cheat Sheet для argon2id
const PARAMS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const PREFIX = `$argon2id$v=19$m=${PARAMS.memoryCost},t=${PARAMS.timeCost},p=${PARAMS.parallelism}$`;

// Ключа в коде нет: перец только из окружения (.env на компьютере, .env.production на сервере)
function pepper() {
  const value = process.env.PASSWORD_PEPPER;
  if (!value || value.length < 32) throw new Error("PASSWORD_PEPPER не задан или короче 32 символов — добавьте его в .env");
  return Buffer.from(value);
}

export function hashPassword(password: string) {
  return hash(password, { ...PARAMS, secret: pepper() });
}

/** Хеш случайной строки: по нему нельзя войти. Для аккаунтов через Google и сброшенных паролей. */
export function unusablePasswordHash() {
  return hashPassword(randomBytes(32).toString("base64url"));
}

let dummy: Promise<string> | null = null;

/**
 * Проверка пароля. Если пользователя нет, сверяем с хешем-заглушкой —
 * ответ идёт столько же времени, и по нему не понять, зарегистрирован ли email.
 */
export async function verifyPassword(password: string, stored: string | null | undefined) {
  if (!stored) {
    dummy ??= unusablePasswordHash();
    await verify(await dummy, password, { secret: pepper() }).catch(() => false);
    return false;
  }
  try {
    if (stored.startsWith("$argon2")) return await verify(stored, password, { secret: pepper() });
    if (stored.startsWith("$2")) return await bcrypt.compare(password, stored);
  } catch {
    // битый хеш в базе — просто «неверный пароль»
  }
  return false;
}

/** true — хеш старый (bcrypt или другие параметры), после входа его стоит пересчитать */
export function needsRehash(stored: string) {
  return !stored.startsWith(PREFIX);
}
