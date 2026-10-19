"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type ReactNode, type TouchEvent } from "react";
import { INTRO_PAGES } from "@/lib/site";
import { useT } from "@/components/locale-provider";

function siblings(pathname: string) {
  const index = INTRO_PAGES.findIndex((page) => pathname === page.href || pathname.endsWith(page.href));
  if (index < 0) return { prev: null, next: null };
  return {
    prev: INTRO_PAGES[index - 1] ?? null,
    next: INTRO_PAGES[index + 1] ?? null,
  };
}

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

export function IntroSwipe({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { prev, next } = siblings(pathname);
  const start = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(event: TouchEvent) {
    if (isDesktop()) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    start.current = { x: touch.clientX, y: touch.clientY };
  }

  function onTouchEnd(event: TouchEvent) {
    if (isDesktop() || !start.current) return;
    const touch = event.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - start.current.x;
    const dy = touch.clientY - start.current.y;
    start.current = null;
    if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0 && next) router.push(next.href);
    if (dx > 0 && prev) router.push(prev.href);
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {children}
      <nav
        aria-label="공원소개 이전·다음"
        className="flex items-center justify-between gap-3 px-4 py-2 text-xs text-muted-foreground md:hidden"
      >
        {prev ? (
          <Link href={prev.href} className="text-primary underline-offset-4 hover:underline">
            ← {t(prev.i18n)}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={next.href} className="text-primary underline-offset-4 hover:underline">
            {t(next.i18n)} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}
