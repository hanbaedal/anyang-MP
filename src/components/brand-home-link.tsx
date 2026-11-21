"use client";

import { useCallback, type MouseEvent, type ReactNode } from "react";

/**
 * AMP-154: 헤더·모바일 시트 브랜드 → 홈.
 * App Router `<Link href="/">` soft nav가 일부 모바일 WebView에서 무반응처럼 보여
 * 항상 document 이동(또는 홈이면 스크롤 리셋)으로 처리.
 */
export function BrandHomeLink({
  className,
  children,
  "aria-label": ariaLabel,
  onNavigate,
}: {
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
  onNavigate?: () => void;
}) {
  const goHome = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      onNavigate?.();
      if (typeof window === "undefined") return;

      const atHome =
        window.location.pathname === "/" && !window.location.search && !window.location.hash;

      event.preventDefault();
      event.stopPropagation();

      if (atHome) {
        const scroller = document.getElementById("content-scroll");
        scroller?.scrollTo({ top: 0, behavior: "smooth" });
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      window.location.assign("/");
    },
    [onNavigate],
  );

  return (
    <a href="/" aria-label={ariaLabel} className={className} onClick={goHome}>
      {children}
    </a>
  );
}
