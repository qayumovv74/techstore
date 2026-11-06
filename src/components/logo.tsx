import Image from "next/image";
import Link from "next/link";

/** Логотип: серебряная версия — сайт всегда тёмный */
export function Logo({ className = "h-8" }: { className?: string }) {
  return (
    <Link href="/" aria-label="TechStore — на главную" className="shrink-0">
      <Image src="/brand/logo-h-silver.png" alt="TechStore" width={734} height={128} priority className={`w-auto ${className}`} />
    </Link>
  );
}
