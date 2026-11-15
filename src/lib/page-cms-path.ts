import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";

/** 소메뉴 CMS iframe — 공개 URL (한국어 미리보기) */
export const PAGE_CMS_PUBLIC_PATH: Record<ManageVisualCmsSlug, string> = {
  greeting: "/intro/greeting",
  features: "/intro/features",
  directions: "/intro/directions",
  burial: "/lots/burial",
  lawn: "/lots/lawn",
  columbarium: "/lots/columbarium",
  procedure: "/guide/procedure",
  fees: "/guide/fees",
  services: "/guide/services",
  funeral: "/guide/funeral",
};