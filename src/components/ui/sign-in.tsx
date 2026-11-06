import type { ReactNode } from "react";
import { CreditCard, ShieldCheck, Truck, type LucideIcon } from "lucide-react";
import { Hero3D } from "./hero-3d";
import { cn } from "@/lib/cn";

/*
  Оформление страниц входа и регистрации по мотивам шаблона sign-in (21st.dev):
  слева форма, справа витрина. Вместо стокового фото — 3D-сцена, вместо выдуманных
  отзывов — карточки с настоящими условиями магазина.
*/

export const GoogleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 48 48" aria-hidden>
    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s12-5.373 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-2.641-.21-5.236-.611-7.743z" />
    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l6.19 5.238C42.022 35.026 44 30.038 44 24c0-2.641-.21-5.236-.611-7.743z" />
  </svg>
);

/** Кнопка «через Google» — обычная ссылка: вход идёт через переходы на сайт Google и обратно */
export function GoogleButton({ next, label, className }: { next?: string; label: string; className?: string }) {
  const href = next ? `/api/auth/google?next=${encodeURIComponent(next)}` : "/api/auth/google";
  return (
    <a
      href={href}
      className={cn(
        "flex h-12 w-full items-center justify-center gap-3 rounded-2xl border border-border bg-text/5 text-sm font-medium transition-colors hover:border-violet/60 hover:bg-violet/10",
        className,
      )}
    >
      <GoogleIcon />
      {label}
    </a>
  );
}

export function OrDivider({ className, children = "или" }: { className?: string; children?: ReactNode }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <span className="w-full border-t border-border" />
      <span className="absolute rounded-full bg-[#0a0920] px-4 text-sm text-muted">{children}</span>
    </div>
  );
}

type Perk = { icon: LucideIcon; title: string; text: string };

const PERKS: Perk[] = [
  { icon: Truck, title: "Доставка завтра", text: "Курьером по Москве, из пункта выдачи — уже сегодня." },
  { icon: ShieldCheck, title: "Официальная гарантия", text: "Чек и гарантийный талон к каждому заказу." },
  { icon: CreditCard, title: "Рассрочка 0-0-12", text: "Без первого взноса и переплаты на год." },
];

function PerkCard({ perk, delay }: { perk: Perk; delay: string }) {
  const Icon = perk.icon;
  return (
    <div className={`animate-testimonial ${delay} flex w-64 items-start gap-3 rounded-3xl border border-white/10 bg-ink/45 p-5 backdrop-blur-xl`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-violet/20 text-lilac">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="text-sm leading-snug">
        <p className="font-semibold">{perk.title}</p>
        <p className="mt-1 text-muted">{perk.text}</p>
      </div>
    </div>
  );
}

/** Правая колонка: 3D-витрина и условия магазина (только на широких экранах) */
function AuthAside() {
  return (
    <section className="relative hidden flex-1 p-4 md:block" aria-hidden>
      <div className="animate-slide-right animate-delay-300 absolute inset-4 overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(120%_80%_at_70%_20%,rgb(61_44_141/0.55),rgb(4_5_46/0.5)_55%,rgb(2_1_10/0.7))]">
        <Hero3D variant="auth" className="absolute inset-x-0 top-0 bottom-28" />
      </div>
      <div className="absolute bottom-8 left-1/2 flex w-full -translate-x-1/2 justify-center gap-4 px-8">
        <PerkCard perk={PERKS[0]} delay="animate-delay-1000" />
        <div className="hidden xl:flex"><PerkCard perk={PERKS[1]} delay="animate-delay-1200" /></div>
        <div className="hidden 2xl:flex"><PerkCard perk={PERKS[2]} delay="animate-delay-1400" /></div>
      </div>
    </section>
  );
}

/** Каркас страницы: форма слева, витрина справа */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-[1400px] flex-1 flex-col md:min-h-[calc(100dvh-7rem)] md:flex-row">
      <section className="flex flex-1 items-center justify-center px-5 py-10 md:p-8">
        <div className="w-full max-w-md rounded-[2rem] border border-white/10 bg-ink/60 p-6 shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9)] backdrop-blur-xl sm:p-8">{children}</div>
      </section>
      <AuthAside />
    </main>
  );
}
