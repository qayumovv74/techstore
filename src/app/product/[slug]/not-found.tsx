import Link from "next/link";
import { CompassIcon, HomeIcon } from "lucide-react";
import { NotFound } from "@/components/ui/not-found-2";
import { buttonVariants } from "@/components/ui/button-variants";

export default function ProductNotFound() {
  return (
    <NotFound
      title="Такого товара нет"
      description="Возможно, его сняли с продажи или ссылка устарела."
      actions={
        <>
          <Link href="/catalog" className={buttonVariants({ className: "font-semibold" })}>
            <CompassIcon aria-hidden /> В каталог
          </Link>
          <Link href="/" className={buttonVariants({ variant: "outline", className: "font-semibold" })}>
            <HomeIcon aria-hidden /> На главную
          </Link>
        </>
      }
    />
  );
}
