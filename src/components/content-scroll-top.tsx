"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/** 본문 스크롤 영역 — 메뉴·자세히 보기 이동 후 맨 위로 */
export function ContentScrollTop() {
  const pathname = usePathname();

  useEffect(() => {
    const scroller =
      (document.getElementById("content-scroll") as HTMLElement | null) ??
      (document.getElementById("content")?.firstElementChild as HTMLElement | null);
    scroller?.scrollTo(0, 0);
  }, [pathname]);

  return null;
}