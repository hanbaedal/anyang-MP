"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRef, type ReactNode, type TouchEvent } from "react";
import { PUBLIC_SWIPE_PAGES } from "@/lib/site";
import { useT } from "@/components/locale-provider";

function pageIndex(pathname: string) {
  let best = -1;
  let bestLen = -1;
  for (let i = 0; i < PUBLIC_SWIPE_PAGES.length; i++) {
    const href = PUBLIC_SWIPE_PAGES[i]!.href;
    if (pathname === href || pathname.startsWith(`${href}/`)) {
      if (href.length > bestLen) {
        best = i;
        bestLen = href.length;
      }
    }
  }
  return best;
}

function siblings(pathname: string) {
  const index = pageIndex(pathname);
  if (index < 0) return { prev: null, next: null };
  return {
    prev: PUBLIC_SWIPE_PAGES[index - 1] ?? null,
    next: PUBLIC_SWIPE_PAGES[index + 1] ?? null,
  };
}

function isDesktop() {
  return typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches;
}

/** 모바일만: 공개 메뉴(공원소개~갤러리) 가로 스와이프로 이전·다음. 데스크톱 무반응. */
export function NavSwipe({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useT();
  const { prev, next } = siblings(pathname);
  const start = useRef<{ x: number; y: number } | null>(null);

  function onTouchStart(event: TouchEvent) {
    if (isDesktop() || (!prev && !next)) return;
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
    // 가로 제스처만 — 세로 스크롤과 구분
    if (Math.abs(dx) < 72 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
    if (dx < 0 && next) router.push(next.href);
    if (dx > 0 && prev) router.push(prev.href);
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="flex min-h-0 flex-1 flex-col">
      {children}
      {prev || next ? (
        <nav
          aria-label="메뉴 이전·다음"
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
      ) : null}
    </div>
  );
}
