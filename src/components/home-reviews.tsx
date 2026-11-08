import Link from "next/link";
import { MessageSquareHeart } from "lucide-react";
import { getFeaturedReviews } from "@/lib/reviews";
import { TestimonialCarousel } from "./ui/profile-card-testimonial-carousel";
import { Reveal } from "./reveal";

/** Блок отзывов на главной: только настоящие отзывы покупателей из базы */
export async function HomeReviews() {
  const reviews = await getFeaturedReviews(8);

  return (
    <Reveal>
      <section aria-labelledby="home-reviews" className="mt-16">
        <h2 id="home-reviews" className="text-xl font-bold">Отзывы покупателей</h2>
        {reviews.length ? (
          <TestimonialCarousel
            className="mt-6"
            testimonials={reviews.map((r) => ({
              id: r.id,
              userName: r.userName,
              avatarUrl: r.avatarUrl,
              rating: r.rating,
              text: r.text,
              date: r.createdAt.toLocaleDateString("ru-RU", { day: "numeric", month: "long" }),
              productName: r.productName,
              productSlug: r.productSlug,
              productImage: r.productImage,
            }))}
          />
        ) : (
          <div className="mt-4 flex flex-col items-start gap-3 rounded-3xl border border-dashed border-white/15 bg-ink/55 p-6 backdrop-blur-md sm:flex-row sm:items-center">
            <MessageSquareHeart className="size-8 shrink-0 text-lilac" aria-hidden />
            <p className="text-sm text-muted">
              Здесь появятся отзывы покупателей. Купили у нас что-то? Оцените товар в{" "}
              <Link href="/account" className="font-semibold text-lilac hover:text-white">личном кабинете</Link> — отзывы оставляют только настоящие покупатели.
            </p>
          </div>
        )}
      </section>
    </Reveal>
  );
}
