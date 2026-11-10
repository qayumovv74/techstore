/**
 * Аккаунты сотрудников из терминала.
 *
 *   npm run staff -- list                                  список сотрудников
 *   npm run staff -- link admin@techstore.ru               одноразовая ссылка «задать пароль» (30 минут)
 *   npm run staff -- create manager2@techstore.ru MANAGER "Имя"   новый сотрудник + ссылка
 *   npm run staff -- rename admin@techstore.ru admin@мой-домен.ru сменить почту для входа
 *   npm run staff -- password admin@techstore.ru           задать пароль прямо здесь, в терминале
 *
 * По почте сотрудникам ссылки не уходят (их адрес может быть на чужом домене) —
 * пароль задаётся только так. Ссылку открывает сам сотрудник и дважды вводит пароль.
 *
 * На сервере то же самое внутри контейнера:
 *   docker compose -f docker-compose.prod.yml exec app node scripts/staff.mjs password <email>
 *
 * Обычный .mjs без TypeScript и drizzle — чтобы работал и в собранном образе.
 */
import { createInterface } from "node:readline";
import { createHash, randomBytes } from "node:crypto";
import pg from "pg";
import { hash } from "@node-rs/argon2";

// Те же параметры и перец, что в src/lib/password.ts. Меняешь там — поменяй и здесь.
const PARAMS = { memoryCost: 19456, timeCost: 2, parallelism: 1 };
const DEV_PEPPER = "techstore-dev-pepper-do-not-use-in-production";

function pepper() {
  const value = process.env.PASSWORD_PEPPER;
  if (value && value.length >= 32) return Buffer.from(value);
  if (process.env.NODE_ENV === "production") throw new Error("PASSWORD_PEPPER не задан или короче 32 символов");
  return Buffer.from(DEV_PEPPER);
}

const hashPassword = (password) => hash(password, { ...PARAMS, secret: pepper() });
const ROLES = ["ADMIN", "MANAGER"];

/** Вопрос в терминале; hidden — вводимые символы не печатаются */
function ask(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => {
        if (s.startsWith(question)) process.stdout.write(question);
      };
    }
    rl.question(question, (answer) => {
      rl.close();
      if (hidden) process.stdout.write("\n");
      resolve(answer);
    });
  });
}

function checkStaffPassword(password, email) {
  if (password.length < 12) return "минимум 12 символов";
  if (!/[a-zA-Zа-яА-Я]/.test(password) || !/[0-9]/.test(password)) return "нужны и буквы, и цифры";
  if (password.toLowerCase().includes(email.split("@")[0].split("+")[0].toLowerCase())) return "пароль не должен содержать почту";
  if (/^(demo|admin|manager|password|qwerty|techstore)/i.test(password)) return "слишком очевидный пароль";
  return null;
}

async function promptPassword(email) {
  for (;;) {
    const first = await ask("Новый пароль (не отображается): ", true);
    const problem = checkStaffPassword(first, email);
    if (problem) {
      console.log(`  ✗ ${problem}`);
      continue;
    }
    const second = await ask("Повторите пароль: ", true);
    if (first !== second) {
      console.log("  ✗ пароли не совпадают");
      continue;
    }
    return first;
  }
}

async function setPassword(db, email) {
  const { rows } = await db.query("select id, role from users where email = $1", [email]);
  if (!rows.length) throw new Error(`Нет пользователя ${email}`);
  const password = await promptPassword(email);
  // session_version + 1 — все старые сессии этого аккаунта закрываются
  await db.query(
    `update users set password_hash = $2, session_version = session_version + 1,
       email_verified_at = coalesce(email_verified_at, now()) where id = $1`,
    [rows[0].id, await hashPassword(password)],
  );
  console.log(`✓ Пароль для ${email} (${rows[0].role}) сохранён. Старые сессии этого аккаунта закрыты.`);
}

/** Ссылка на ту же страницу, что и «Забыли пароль?»: токен одноразовый, в базе только его хеш */
async function makeLink(db, email) {
  const { rows } = await db.query("select id, role from users where email = $1", [email]);
  if (!rows.length) throw new Error(`Нет пользователя ${email}`);
  const token = randomBytes(32).toString("base64url");
  await db.query(
    `insert into password_resets (user_id, token_hash, expires_at) values ($1, $2, now() + interval '30 minutes')`,
    [rows[0].id, createHash("sha256").update(token).digest("hex")],
  );
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  console.log(`Ссылка для ${email} (${rows[0].role}), действует 30 минут и срабатывает один раз:\n\n  ${base}/reset-password?token=${token}\n`);
  console.log("Откройте её в браузере, введите пароль два раза (от 12 символов, буквы и цифры) — и сразу окажетесь в аккаунте.");
}

async function main() {
  const [command, rawEmail, role, ...nameParts] = process.argv.slice(2);
  const email = rawEmail?.trim().toLowerCase();
  const db = new pg.Client({ connectionString: process.env.DATABASE_URL });
  await db.connect();
  try {
    if (command === "list") {
      const { rows } = await db.query(
        `select email, role, name, created_at from users where role in ('ADMIN', 'MANAGER') order by role, email`,
      );
      for (const r of rows) console.log(`${r.role.padEnd(8)} ${r.email}  ${r.name}`);
      if (!rows.length) console.log("Сотрудников нет");
    } else if (command === "password" && email) {
      await setPassword(db, email);
    } else if (command === "link" && email) {
      await makeLink(db, email);
    } else if (command === "rename" && email && role?.includes("@")) {
      // role здесь — второй аргумент, новая почта
      const next = role.trim().toLowerCase();
      const r = await db.query(
        `update users set email = $2, session_version = session_version + 1 where email = $1 and role in ('ADMIN', 'MANAGER')`,
        [email, next],
      );
      if (!r.rowCount) throw new Error(`Нет сотрудника ${email}`);
      console.log(`✓ ${email} → ${next}. Пароль прежний, войти нужно заново.`);
    } else if (command === "create" && email && ROLES.includes(role)) {
      const name = nameParts.join(" ").trim() || (role === "ADMIN" ? "Админ" : "Менеджер");
      // пока пароль не задан, войти нельзя: в базе хеш случайной строки
      await db.query(
        `insert into users (email, name, role, password_hash, email_verified_at) values ($1, $2, $3, $4, now())
         on conflict (email) do update set role = excluded.role, session_version = users.session_version + 1`,
        [email, name, role, await hashPassword(randomBytes(32).toString("base64url"))],
      );
      console.log(`✓ ${email} — ${role}`);
      await makeLink(db, email);
    } else {
      console.log(`Использование:
  npm run staff -- list
  npm run staff -- link <email>
  npm run staff -- create <email> <ADMIN|MANAGER> [имя]
  npm run staff -- rename <старая почта> <новая почта>
  npm run staff -- password <email>`);
      process.exitCode = 1;
    }
  } finally {
    await db.end();
  }
}

main().catch((e) => {
  console.error(`✗ ${e.message}`);
  process.exit(1);
});
