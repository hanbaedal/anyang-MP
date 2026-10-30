import type { ReactNode } from "react";
import Link from "next/link";

/** 상위 메뉴 통합 페이지의 소메뉴 구간 — 제목 아래 분리선, 제목·자세히는 해당 페이지로 */
export function MenuHubSection({
  id,
  title,
  href,
  moreLabel,
  children,
}: {
  id: string;
  title: string;
  href: string;
  moreLabel: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-16">
      <header className="mb-6 flex items-baseline justify-between gap-4 border-b-2 border-[#c4a574] pb-3">
        <h2 className="font-serif text-xl text-primary md:text-2xl">
          <Link href={href} className="underline-offset-4 hover:underline">
            {title}
          </Link>
        </h2>
        <Link
          href={href}
          className="shrink-0 text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          {moreLabel}
        </Link>
      </header>
      {children}
    </section>
  );
}
