import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { mediaUrl, uploadOriginalUrl } from "@/lib/media";

/** 공개 메뉴 페이지 공통 제목(히어로) 배경 — 테라스 묘역 파노라마 */
export const PAGE_HERO_IMAGE = "/images/menu-hero.jpg";

export function PageHero({
  kicker,
  title,
  lead,
  image,
  compact = false,
  children,
}: {
  kicker: string;
  title: string;
  lead?: string;
  /** alt만 쓰입니다. 배경은 메뉴 공통 파노라마로 통일합니다. */
  image?: { src?: string; alt: string };
  compact?: boolean;
  children?: ReactNode;
}) {
  const alt = image?.alt || "안양공원묘원 테라스 묘역 전경";
  return (
    <section className="relative shrink-0 overflow-hidden border-b bg-[#0a3d66] text-primary-foreground">
      <Image
        src={mediaUrl(PAGE_HERO_IMAGE)}
        alt={alt}
        fill
        priority
        className="object-cover object-[center_28%] opacity-55"
        quality={90}
        sizes="100vw"
      />
      <div className={cn("relative mx-auto max-w-6xl px-4", compact ? "py-2 md:py-2.5" : "py-4 md:py-6")}>
        <p className="text-[10px] tracking-[0.16em] text-primary-foreground/80 uppercase md:text-xs md:tracking-[0.18em]">
          {kicker}
        </p>
        <h1 className="mt-1 font-serif text-xl text-primary-foreground md:mt-1.5 md:text-2xl">{title}</h1>
        {lead ? (
          <p className="mt-1.5 max-w-2xl text-sm leading-snug text-primary-foreground/95 md:mt-2 md:text-sm md:leading-6">
            {lead}
          </p>
        ) : null}
        {children ? (
          <div className="mt-1 max-w-2xl text-sm leading-snug text-primary-foreground/95 md:mt-1.5 md:text-sm md:leading-6">
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="현재 위치" className="text-sm text-muted-foreground">
      <ol className="flex flex-wrap gap-1">
        <li>
          <Link href="/" className="hover:text-primary">
            홈
          </Link>
        </li>
        {items.map((item) => (
          <li key={item.label} className="flex gap-1">
            <span aria-hidden>/</span>
            {item.href ? (
              <Link href={item.href} className="hover:text-primary">
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function Prose({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("max-w-3xl space-y-4 text-[15px] leading-7 text-foreground/90", className)}>{children}</div>;
}

export function Photo({
  src,
  alt,
  className,
  priority,
  sizes = "(max-width: 768px) 100vw, 50vw",
}: {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  sizes?: string;
}) {
  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-muted", className)}>
      <Image
        src={uploadOriginalUrl(src)}
        alt={alt}
        fill
        className="object-cover"
        sizes={sizes}
        quality={90}
        unoptimized
        priority={priority}
      />
    </div>
  );
}
