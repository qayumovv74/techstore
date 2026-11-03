import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-5xl font-bold text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold">Такого товара нет</h1>
      <p className="mt-1 text-sm text-muted">Возможно, его сняли с продажи.</p>
      <Link href="/catalog" className="mt-6 font-semibold text-primary hover:text-primary-hover">В каталог →</Link>
    </main>
  );
}
