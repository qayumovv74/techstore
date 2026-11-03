import Image from "next/image";
import Link from "next/link";

/** Логотип: тёмная версия для светлой темы и серебряная для тёмной */
export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Link href="/" aria-label="TechStore — на главную" className="shrink-0">
      <Image src="/brand/logo-h-ink.png" alt="TechStore" width={734} height={128} priority className={`w-auto dark:hidden ${className}`} />
      <Image src="/brand/logo-h-silver.png" alt="TechStore" width={734} height={128} priority className={`hidden w-auto dark:block ${className}`} />
    </Link>
  );
}
