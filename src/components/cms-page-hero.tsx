import { PageHero } from "@/components/page-hero";

/** GNB 1차 메뉴 kicker만 파노라마 배너 — 제목·요약은 본문 `CmsPageIntro` */
export function CmsPageHero({ kicker, compact }: { kicker: string; compact?: boolean }) {
  return <PageHero kicker={kicker} compact={compact} />;
}