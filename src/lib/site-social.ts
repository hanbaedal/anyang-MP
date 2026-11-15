import { randomUUID } from "node:crypto";
import { SOCIAL_URLS } from "@/lib/site";

export const SITE_SOCIAL_ICONS = ["facebook", "instagram", "youtube", "blog"] as const;
export type SiteSocialIcon = (typeof SITE_SOCIAL_ICONS)[number];

export const SITE_SOCIAL_MAX = 8;

export type SiteSocialLink = {
  id: string;
  icon: SiteSocialIcon;
  href: string;
  label: string;
  sort: number;
};

export const SITE_SOCIAL_ICON_LABELS: Record<SiteSocialIcon, string> = {
  facebook: "페이스북",
  instagram: "인스타그램",
  youtube: "유튜브",
  blog: "네이버 블로그",
};

export function homeSocialSlotKey(id: string) {
  return `home.social.${id}`;
}

export const HOME_SOCIAL_ADD_SLOT = "home.social.add";

export function isHomeSocialSlotKey(key: string) {
  return key === HOME_SOCIAL_ADD_SLOT || key.startsWith("home.social.");
}

export function socialIdFromHomeSlotKey(key: string | null) {
  if (!key || key === HOME_SOCIAL_ADD_SLOT || !key.startsWith("home.social.")) return null;
  return key.slice("home.social.".length);
}

export function defaultHrefForSocialIcon(icon: SiteSocialIcon): string {
  return defaultSiteSocialLinks().find((row) => row.icon === icon)?.href ?? "";
}

export function defaultSiteSocialLinks(): SiteSocialLink[] {
  return [
    { id: "facebook", icon: "facebook", href: SOCIAL_URLS.FACEBOOK, label: "페이스북", sort: 0 },
    { id: "instagram", icon: "instagram", href: SOCIAL_URLS.INSTAGRAM, label: "인스타그램", sort: 1 },
    { id: "youtube", icon: "youtube", href: SOCIAL_URLS.YOUTUBE, label: "유튜브", sort: 2 },
    { id: "blog", icon: "blog", href: SOCIAL_URLS.BLOG, label: "네이버 블로그", sort: 3 },
  ];
}

function isSafeSocialHref(href: string): boolean {
  const t = href.trim();
  if (!t) return false;
  if (t.startsWith("tel:")) return t.length > 4;
  try {
    const u = new URL(t);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function isSocialIcon(value: unknown): value is SiteSocialIcon {
  return typeof value === "string" && (SITE_SOCIAL_ICONS as readonly string[]).includes(value);
}

export function normalizeSiteSocialLinks(raw: unknown): SiteSocialLink[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultSiteSocialLinks();
  const out: SiteSocialLink[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const rec = row as Record<string, unknown>;
    const href = String(rec.href ?? "").trim();
    if (!isSafeSocialHref(href)) continue;
    const icon = isSocialIcon(rec.icon) ? rec.icon : "facebook";
    const label = String(rec.label ?? "").trim().slice(0, 40) || SITE_SOCIAL_ICON_LABELS[icon];
    out.push({
      id: String(rec.id || randomUUID()),
      icon,
      href,
      label,
      sort: typeof rec.sort === "number" && Number.isFinite(rec.sort) ? rec.sort : out.length,
    });
    if (out.length >= SITE_SOCIAL_MAX) break;
  }
  return out.length ? out.sort((a, b) => a.sort - b.sort).map((s, i) => ({ ...s, sort: i })) : defaultSiteSocialLinks();
}