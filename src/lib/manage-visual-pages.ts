import type { CmsSlug } from "@/lib/cms-types";

/** 갤러리·공지 제외 — 공개 레이아웃 미러 편집 대상 CMS */
export const MANAGE_VISUAL_CMS_SLUGS = [
  "greeting",
  "features",
  "directions",
  "lawn",
  "burial",
  "columbarium",
  "procedure",
  "fees",
  "services",
  "funeral",
] as const satisfies readonly CmsSlug[];

export type ManageVisualCmsSlug = (typeof MANAGE_VISUAL_CMS_SLUGS)[number];

export function isManageVisualCmsSlug(slug: string): slug is ManageVisualCmsSlug {
  return (MANAGE_VISUAL_CMS_SLUGS as readonly string[]).includes(slug);
}