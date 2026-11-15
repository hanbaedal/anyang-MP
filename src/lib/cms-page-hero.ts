import type { CmsPage, CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

/** GNB 1차 메뉴 — 소메뉴 페이지 히어로 kicker */
const PARENT_KICKER: Record<CmsSlug, string> = {
  greeting: "nav.intro",
  features: "nav.intro",
  directions: "nav.intro",
  burial: "nav.lots",
  lawn: "nav.lots",
  columbarium: "nav.lots",
  remodeling: "nav.lots",
  prices: "nav.lots",
  procedure: "nav.guide",
  fees: "nav.guide",
  services: "nav.guide",
  funeral: "nav.guide",
};

const TITLE_KEY: Record<CmsSlug, string> = {
  greeting: "greeting.title",
  features: "features.title",
  directions: "dir.title",
  burial: "burial.title",
  lawn: "lawn.title",
  columbarium: "col.title",
  remodeling: "remodel.title",
  prices: "prices.title",
  procedure: "proc.title",
  fees: "fees.title",
  services: "svc.title",
  funeral: "fun.title",
};

const LEAD_KEY: Record<CmsSlug, string> = {
  greeting: "greeting.lead",
  features: "features.lead",
  directions: "dir.lead",
  burial: "burial.lead",
  lawn: "lawn.lead",
  columbarium: "col.lead",
  remodeling: "remodel.lead",
  prices: "prices.lead",
  procedure: "proc.lead",
  fees: "fees.lead",
  services: "svc.lead",
  funeral: "fun.lead",
};

export function resolveCmsPageHero(locale: Locale, page: Pick<CmsPage, "slug" | "title" | "lead">) {
  const slug = page.slug;
  return {
    kicker: t(locale, PARENT_KICKER[slug]),
    title: page.title?.trim() || t(locale, TITLE_KEY[slug]),
    lead: page.lead?.trim() || t(locale, LEAD_KEY[slug]),
  };
}