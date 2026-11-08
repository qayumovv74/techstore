"use client";

import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Lock } from "lucide-react";
import { detectBrand, formatCardNumber, luhn, maxLength } from "@/lib/card-brand";
import { Button } from "./button";
import { cn } from "@/lib/cn";

/*
  Форма карты с живой карточкой (credit-card-form с 21st.dev), переделанная под сайт:
  — платёжная система определяется по первым цифрам (МИР, Visa, Mastercard, UnionPay, JCB, Amex…);
    длина номера, группировка цифр, длина CVC и цвет «колец» на карте — под неё;
  — номер проверяется по алгоритму Луна, срок — что карта не просрочена;
  — вместо логотипов платёжных систем — их названия;
  — подсветка поля на карте считается по реальным размерам, а не зашитыми пикселями;
  — поля с name="card|exp|cvc|holder" — форму можно отправлять в Server Action.
*/

export type CardState = { number: string; holder: string; month: string; year: string; cvv: string };
export type CardValidity = { number: boolean; holder: boolean; month: boolean; year: boolean; cvv: boolean; allValid: boolean };

type Field = "number" | "holder" | "expire" | "cvv";

type Props = {
  defaultNumber?: string;
  defaultHolder?: string;
  defaultMonth?: string;
  defaultYear?: string;
  defaultCVV?: string;
  /** скрывать средние цифры номера на карте */
  maskMiddle?: boolean;
  showSubmit?: boolean;
  submitLabel?: string;
  onChange?: (state: CardState, validity: CardValidity) => void;
  onSubmit?: (state: CardState, validity: CardValidity) => void;
  /** Server Action: тогда форма отправляется обычным action, onSubmit не нужен */
  action?: (fd: FormData) => void;
  pending?: boolean;
  error?: string;
  className?: string;
};

const digitsOnly = (v: string, max: number) => v.replace(/\D/g, "").slice(0, max);
const MONTHS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));

/** Сдвиг элемента относительно предка по offset* — не зависит от поворота карты */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement) {
  let top = 0;
  let left = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    top += node.offsetTop;
    left += node.offsetLeft;
    node = node.offsetParent as HTMLElement | null;
  }
  return { top, left, width: el.offsetWidth, height: el.offsetHeight };
}

export function CreditCardForm({
  defaultNumber = "",
  defaultHolder = "",
  defaultMonth = "",
  defaultYear = "",
  defaultCVV = "",
  maskMiddle = true,
  showSubmit = true,
  submitLabel = "Оплатить",
  onChange,
  onSubmit,
  action,
  pending = false,
  error,
  className,
}: Props) {
  const [number, setNumber] = useState(digitsOnly(defaultNumber, 19));
  const [holder, setHolder] = useState(defaultHolder.toUpperCase());
  const [month, setMonth] = useState(defaultMonth);
  const [year, setYear] = useState(defaultYear);
  const [cvv, setCVV] = useState(digitsOnly(defaultCVV, 4));
  const [focusField, setFocusField] = useState<Field | null>(null);
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});

  const brand = useMemo(() => detectBrand(number), [number]);
  const flip = focusField === "cvv";
  const years = useMemo(() => {
    const start = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => String(start + i));
  }, []);

  const validity: CardValidity = useMemo(() => {
    const now = new Date();
    const numberValid = brand.lengths.includes(number.length) && luhn(number);
    const holderValid = holder.trim().length >= 2;
    const monthValid = !!month && +month >= 1 && +month <= 12;
    const yearValid = !!year && (+year > now.getFullYear() || (+year === now.getFullYear() && (!month || +month >= now.getMonth() + 1)));
    const cvvValid = cvv.length === brand.cvc;
    return { number: numberValid, holder: holderValid, month: monthValid, year: yearValid, cvv: cvvValid, allValid: numberValid && holderValid && monthValid && yearValid && cvvValid };
  }, [number, holder, month, year, cvv, brand]);

  const update = (patch: Partial<CardState>) => {
    if (patch.number !== undefined) setNumber(patch.number);
    if (patch.holder !== undefined) setHolder(patch.holder);
    if (patch.month !== undefined) setMonth(patch.month);
    if (patch.year !== undefined) setYear(patch.year);
    if (patch.cvv !== undefined) setCVV(patch.cvv);
  };

  // сообщаем родителю о каждом изменении (как в исходном компоненте)
  useEffect(() => {
    onChange?.({ number, holder, month, year, cvv }, validity);
  }, [number, holder, month, year, cvv, validity, onChange]);

  // ─── цифры на карте: «#» уезжает вверх, когда цифра введена ───
  const slotsCount = Math.max(Math.min(maxLength(brand), 16), number.length);
  const slots = Array.from({ length: slotsCount }, (_, i) => {
    const d = number[i];
    const masked = maskMiddle && d !== undefined && i >= 4 && i < number.length - 4;
    return { text: d === undefined ? "#" : masked ? "•" : d, filled: d !== undefined, gap: brand.gaps.includes(i + 1) && i + 1 < slotsCount };
  });

  // ─── рамка-подсветка поля на карте ───
  const frontRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontHl = useRef<HTMLDivElement>(null);
  const backHl = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const holderRef = useRef<HTMLDivElement>(null);
  const expireRef = useRef<HTMLDivElement>(null);
  const cvvRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const targets = { number: numberRef, holder: holderRef, expire: expireRef, cvv: cvvRef };
    const place = () => {
      for (const [hl, face, isBack] of [[frontHl.current, frontRef.current, false], [backHl.current, backRef.current, true]] as const) {
        if (!hl || !face) continue;
        const el = focusField && (focusField === "cvv") === isBack ? targets[focusField].current : null;
        if (!el) {
          hl.style.opacity = "0";
          continue;
        }
        const r = offsetWithin(el, face);
        Object.assign(hl.style, { opacity: "1", top: `${r.top - 6}px`, left: `${r.left - 8}px`, width: `${r.width + 16}px`, height: `${r.height + 12}px` });
      }
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [focusField, slotsCount]);

  const focus = (f: Field) => ({
    onFocus: () => setFocusField(f),
    onBlur: () => {
      setFocusField(null);
      setTouched((t) => ({ ...t, [f]: true }));
    },
  });
  const ringStyle = { "--ring1": brand.rings[0], "--ring2": brand.rings[1] } as React.CSSProperties;

  const numberHint = !touched.number || validity.number ? null : number.length < Math.min(...brand.lengths) ? "Номер карты неполный" : "Проверьте номер — в нём опечатка";
  const expireHint = touched.expire && month && year && !validity.year ? "Срок действия карты истёк" : null;

  return (
    <section className={cn("ccp grid items-center gap-8 lg:grid-cols-2", className)}>
      <style>{CSS}</style>

      {/* ─── карта ─── */}
      <div className={cn("ccp-card", flip && "is-flipped")} aria-hidden>
        <div className="ccp-inner">
          <div ref={frontRef} className="ccp-face ccp-front" style={ringStyle}>
            <div ref={frontHl} className="ccp-hl" />
            <div className="ccp-header">
              <span className="ccp-chip" />
              <span key={brand.id} className="ccp-brand">{brand.name || "TechStore Pay"}</span>
            </div>
            <div ref={numberRef} className="ccp-number">
              {slots.map((s, i) => (
                <span key={i} className={cn("ccp-slot", s.gap && "ccp-gap")}>
                  <span className={cn("ccp-digit", s.filled && "is-filled")}>
                    <span>#</span>
                    <span>{s.text}</span>
                  </span>
                </span>
              ))}
            </div>
            <div className="ccp-footer">
              <div ref={holderRef} className="ccp-holder">
                <div className="ccp-caption">Владелец</div>
                <div className="ccp-value">{holder || "ИМЯ НА КАРТЕ"}</div>
              </div>
              <div ref={expireRef} className="ccp-expires">
                <div className="ccp-caption">Срок</div>
                <div className="ccp-value">{month || "ММ"}/{year ? year.slice(-2) : "ГГ"}</div>
              </div>
            </div>
          </div>

          <div ref={backRef} className="ccp-face ccp-back" style={ringStyle}>
            <div ref={backHl} className="ccp-hl" />
            <div className="ccp-stripe" />
            <div ref={cvvRef} className="ccp-cvv">
              <span className="ccp-caption">{brand.cvc === 4 ? "CID" : "CVC / CVV"}</span>
              <div className="ccp-cvv-field">{"•".repeat(cvv.length)}</div>
            </div>
            <div className="ccp-back-brand">{brand.name}</div>
          </div>
        </div>
      </div>

      {/* ─── форма ─── */}
      <form
        action={action}
        onSubmit={
          action
            ? undefined
            : (e) => {
                e.preventDefault();
                onSubmit?.({ number, holder, month, year, cvv }, validity);
              }
        }
        noValidate
        className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-ink/60 p-5 backdrop-blur-xl sm:p-6"
      >
        <input type="hidden" name="card" value={number} />
        <input type="hidden" name="exp" value={month && year ? `${month}/${year.slice(-2)}` : ""} />

        <div className="flex flex-col gap-1.5 text-sm">
          <label htmlFor="cc-number" className="flex items-center justify-between font-medium text-muted">
            Номер карты
            {brand.name ? (
              <span key={brand.id} className="ccp-pop rounded-full border border-white/15 px-2.5 py-0.5 text-xs font-semibold text-text" style={{ borderColor: brand.rings[0] }}>
                {brand.name}
              </span>
            ) : null}
          </label>
          <input
            id="cc-number"
            inputMode="numeric"
            autoComplete="cc-number"
            placeholder="0000 0000 0000 0000"
            value={formatCardNumber(number, brand)}
            onChange={(e) => update({ number: digitsOnly(e.target.value, maxLength(detectBrand(digitsOnly(e.target.value, 19)))) })}
            aria-invalid={numberHint ? true : undefined}
            className={cn(fieldClass, "tabular-nums tracking-wider", numberHint && "border-danger")}
            {...focus("number")}
          />
          {numberHint ? <span className="text-danger">{numberHint}</span> : null}
        </div>

        <div className="flex flex-col gap-1.5 text-sm">
          <label htmlFor="cc-holder" className="font-medium text-muted">Имя на карте</label>
          <input
            id="cc-holder"
            name="holder"
            autoComplete="cc-name"
            placeholder="IVAN PETROV"
            value={holder}
            onChange={(e) => update({ holder: e.target.value.toUpperCase().slice(0, 26) })}
            className={fieldClass}
            {...focus("holder")}
          />
        </div>

        <div className="grid grid-cols-[2fr_1fr] gap-3 max-[420px]:grid-cols-1">
          <fieldset className="flex flex-col gap-1.5 text-sm">
            <legend className="mb-1.5 font-medium text-muted">Срок действия</legend>
            <div className="grid grid-cols-2 gap-2">
              <select aria-label="Месяц" value={month} onChange={(e) => update({ month: e.target.value })} className={fieldClass} {...focus("expire")}>
                <option value="" disabled>Месяц</option>
                {MONTHS.map((m) => <option key={m} value={m} className="bg-surface">{m}</option>)}
              </select>
              <select aria-label="Год" value={year} onChange={(e) => update({ year: e.target.value })} className={fieldClass} {...focus("expire")}>
                <option value="" disabled>Год</option>
                {years.map((y) => <option key={y} value={y} className="bg-surface">{y}</option>)}
              </select>
            </div>
            {expireHint ? <span className="text-danger">{expireHint}</span> : null}
          </fieldset>
          <div className="flex flex-col gap-1.5 text-sm">
            <label htmlFor="cc-cvc" className="font-medium text-muted">CVC</label>
            <input
              id="cc-cvc"
              name="cvc"
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              placeholder={"•".repeat(brand.cvc)}
              value={cvv}
              onChange={(e) => update({ cvv: digitsOnly(e.target.value, brand.cvc) })}
              className={cn(fieldClass, "tracking-[0.3em]")}
              {...focus("cvv")}
            />
          </div>
        </div>

        {error ? <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}

        {showSubmit ? (
          <Button type="submit" size="lg" loading={pending} disabled={!validity.allValid} leftIcon={<Lock aria-hidden />} className="mt-1 h-12 w-full rounded-2xl font-semibold">
            {pending ? "Проводим платёж…" : validity.allValid ? submitLabel : "Заполните данные карты"}
          </Button>
        ) : null}
      </form>
    </section>
  );
}

const fieldClass =
  "h-12 w-full rounded-2xl border border-border bg-text/5 px-4 text-base outline-none backdrop-blur-sm transition-colors placeholder:text-muted/60 focus:border-violet/70 focus:bg-violet/10";

const CSS = `
.ccp-card { width: 100%; max-width: 420px; margin: 0 auto; perspective: 1200px; container-type: inline-size; }
.ccp-inner { position: relative; aspect-ratio: 1.586; transform-style: preserve-3d; transition: transform .8s cubic-bezier(.3,.9,.3,1); }
.ccp-card.is-flipped .ccp-inner { transform: rotateY(180deg); }
.ccp-face {
  position: absolute; inset: 0; overflow: hidden; border-radius: 6cqw; padding: 6cqw 7cqw;
  background: linear-gradient(135deg, #241a5c 0%, #0b0a2a 55%, #05061a 100%);
  box-shadow: 0 30px 60px -20px rgb(0 0 0 / .85), inset 0 0 0 1px rgb(255 255 255 / .08);
  color: #fff; backface-visibility: hidden; -webkit-backface-visibility: hidden;
  display: flex; flex-direction: column; font-family: inherit;
}
.ccp-face::before, .ccp-face::after {
  content: ""; position: absolute; border-radius: 100%; filter: blur(14px); transition: border-color .6s; pointer-events: none;
}
.ccp-face::before { border: 16px solid var(--ring1); left: -18%; top: -22%; width: 72%; aspect-ratio: 1; }
.ccp-face::after { border: 16px solid var(--ring2); left: -48%; top: 52%; width: 72%; aspect-ratio: 1; }
.ccp-back { transform: rotateY(180deg); padding: 6cqw 0 0; }
.ccp-hl {
  position: absolute; z-index: 3; border: 1px solid rgb(255 255 255 / .9); border-radius: 12px; box-shadow: 0 0 10px rgb(196 181 232 / .8);
  opacity: 0; transition: top .3s, left .3s, width .3s, height .3s, opacity .2s; pointer-events: none;
}
.ccp-header { position: relative; z-index: 2; display: flex; align-items: center; justify-content: space-between; }
.ccp-chip {
  width: 12cqw; aspect-ratio: 1.3; border-radius: 1.6cqw;
  background: linear-gradient(135deg, #f3e3b0, #c9a456 45%, #f6e7b9 70%, #b88f3e);
  box-shadow: inset 0 0 0 1px rgb(0 0 0 / .25);
}
.ccp-brand { font-weight: 700; font-size: clamp(12px, 4.4cqw, 18px); letter-spacing: .04em; animation: ccpPop .35s cubic-bezier(.3,1.6,.5,1); text-shadow: 0 1px 6px rgb(0 0 0 / .5); }
.ccp-number {
  position: relative; z-index: 2; margin-top: auto; margin-bottom: 4cqw; display: flex; width: fit-content;
  height: 1.5em; line-height: 1.5em; overflow: hidden; font-size: clamp(15px, 5.6cqw, 24px); font-variant-numeric: tabular-nums;
}
.ccp-slot { display: inline-flex; }
.ccp-gap { margin-right: .45em; }
.ccp-digit { display: flex; flex-direction: column; transition: transform .2s; }
.ccp-digit > span { height: 1.5em; display: block; }
.ccp-digit.is-filled { transform: translateY(-1.5em); }
.ccp-footer { position: relative; z-index: 2; display: flex; align-items: flex-end; justify-content: space-between; gap: 4cqw; }
.ccp-holder { min-width: 0; }
.ccp-caption { font-size: clamp(9px, 2.6cqw, 12px); letter-spacing: .14em; text-transform: uppercase; opacity: .65; }
.ccp-value { font-size: clamp(12px, 3.8cqw, 16px); font-weight: 600; text-transform: uppercase; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ccp-expires { text-align: right; flex: none; }
.ccp-stripe { position: relative; z-index: 2; height: 15%; background: #0a0a12; }
.ccp-cvv { position: relative; z-index: 2; margin: 6cqw 7cqw 0; display: flex; flex-direction: column; align-items: flex-end; gap: 1.5cqw; }
.ccp-cvv-field {
  width: 100%; height: 11cqw; border-radius: 2.6cqw; background: repeating-linear-gradient(-45deg, #f4f1fb 0 6px, #e6e0f3 6px 12px);
  color: #0b0820; display: flex; align-items: center; justify-content: flex-end; padding: 0 3cqw; font-size: clamp(16px, 6cqw, 26px); letter-spacing: .2em;
}
.ccp-back-brand { position: relative; z-index: 2; margin: auto 7cqw 5cqw auto; font-weight: 700; opacity: .8; font-size: clamp(11px, 3.6cqw, 15px); }
.ccp-pop { animation: ccpPop .35s cubic-bezier(.3,1.6,.5,1); }
@keyframes ccpPop { from { transform: scale(.6); opacity: 0; } to { transform: none; opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .ccp-inner, .ccp-digit, .ccp-hl { transition: none; }
  .ccp-brand, .ccp-pop { animation: none; }
}
`;
