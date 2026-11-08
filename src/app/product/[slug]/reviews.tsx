import Link from "next/link";
import { MessageSquareText, ShieldCheck, Trash2 } from "lucide-react";
import { getCurrentUser, STAFF_ROLES } from "@/lib/auth";
import { getMyReview, getProductReviews, purchaseOf } from "@/lib/reviews";
import { pluralize } from "@/lib/format";
import { deleteReview } from "@/app/review-actions";
import { UserAvatar } from "@/components/ui/avatar";
import { Stars } from "@/components/stars";
import { ReviewForm } from "./review-form";

const date = (d: Date) => d.toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });

/** Отзывы о товаре: оценка, форма для купивших и список */
export async function ProductReviews({ productId, slug }: { productId: string; slug: string }) {
  const user = await getCurrentUser();
  const [{ items, count, avg }, bought, mine] = await Promise.all([
    getProductReviews(productId),
    user ? purchaseOf(user.id, productId) : null,
    user ? getMyReview(user.id, productId) : undefined,
  ]);
  const staff = Boolean(user && STAFF_ROLES.includes(user.role));

  return (
    <section id="reviews" aria-labelledby="reviews-title" className="mt-14 scroll-mt-32">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="reviews-title" className="text-xl font-bold">Отзывы покупателей</h2>
          {count ? (
            <p className="mt-2 flex items-center gap-3 text-sm text-muted">
              <Stars value={avg} />
              <span className="font-semibold text-text">{avg.toFixed(1)}</span>
              {count} {pluralize(count, ["отзыв", "отзыва", "отзывов"])}
            </p>
          ) : (
            <p className="mt-1 text-sm text-text/75">Пока никто не написал. Отзыв могут оставить только те, кто купил товар.</p>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-6 lg:grid-cols-[1fr_380px]">
        <ul className="flex flex-col gap-3">
          {items.length ? (
            items.map((r) => (
              <li key={r.id} className="rounded-3xl border border-white/10 bg-glass p-5 backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <UserAvatar name={r.userName} src={r.avatarUrl} className="size-10" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="font-semibold">{r.userName}</p>
                      <span className="inline-flex items-center gap-1 text-xs text-lilac">
                        <ShieldCheck className="size-3.5" aria-hidden /> Купил(а) в TechStore
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                      <Stars value={r.rating} size="size-3.5" /> {date(r.createdAt)}
                    </div>
                  </div>
                  {user && (user.id === r.userId || staff) ? (
                    <form action={deleteReview}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted transition-colors hover:text-danger"
                        aria-label={user.id === r.userId ? "Удалить мой отзыв" : `Скрыть отзыв ${r.userName}`}
                      >
                        <Trash2 className="size-3.5" aria-hidden /> {user.id === r.userId ? "Удалить" : "Скрыть"}
                      </button>
                    </form>
                  ) : null}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text/90">{r.text}</p>
              </li>
            ))
          ) : (
            <li className="flex items-center gap-3 rounded-3xl border border-dashed border-white/15 bg-ink/55 p-6 text-sm text-muted backdrop-blur-md">
              <MessageSquareText className="size-5 shrink-0 text-lilac" aria-hidden />
              Здесь появятся отзывы тех, кто уже купил этот товар.
            </li>
          )}
        </ul>

        <aside className="h-fit rounded-3xl border border-white/10 bg-ink/60 p-5 backdrop-blur-xl lg:sticky lg:top-32">
          {!user ? (
            <p className="text-sm text-muted">
              <Link href={`/login?next=${encodeURIComponent(`/product/${slug}#reviews`)}`} className="font-semibold text-lilac hover:text-white">
                Войдите
              </Link>
              , чтобы оставить отзыв о покупке.
            </p>
          ) : bought ? (
            <>
              <h3 className="font-semibold">{mine ? "Ваш отзыв" : "Поделитесь впечатлением"}</h3>
              {mine?.hidden ? <p className="mt-1 text-xs text-danger">Отзыв скрыт модератором. Можно отредактировать и отправить снова.</p> : null}
              <div className="mt-4">
                <ReviewForm productId={productId} initial={mine ? { rating: mine.rating, text: mine.text } : undefined} />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted">Отзыв можно оставить после покупки — так все отзывы здесь от настоящих покупателей.</p>
          )}
        </aside>
      </div>
    </section>
  );
}
