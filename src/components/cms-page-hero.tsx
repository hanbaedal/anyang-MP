import { PageHero } from "@/components/page-hero";

/** CMS 제목·요약 — GNB 소메뉴 진입 시 상단 표시 */
export function CmsPageHero({
  kicker,
  title,
  lead,
  compact,
}: {
  kicker: string;
  title: string;
  lead?: string;
  compact?: boolean;
}) {
  const leadText = lead?.trim();
  return <PageHero kicker={kicker} title={title} lead={leadText || undefined} compact={compact} />;
}