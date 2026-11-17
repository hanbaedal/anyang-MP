import type { CSSProperties } from "react";
import {
  buildHomeHeroSlotStyle,
  normalizeHeroTextColorValue,
  normalizeHomeHeroTextFont,
  type HomeHeroFontPreset,
} from "@/lib/home-hero-text-style";
import { HOME_HERO_TEXT_SCALE_MAX, HOME_HERO_TEXT_SCALE_MIN } from "@/lib/home-intro-slides-types";
import type { Locale } from "@/lib/i18n";

export type PageCmsTextStyle = {
  scale: number;
  font: HomeHeroFontPreset;
  color: string;
};

export type PageCmsTextStyles = Record<string, PageCmsTextStyle>;

const DEFAULT_STYLE: PageCmsTextStyle = {
  scale: 100,
  font: "default",
  color: "",
};

function clampScale(n: number) {
  return Math.min(HOME_HERO_TEXT_SCALE_MAX, Math.max(HOME_HERO_TEXT_SCALE_MIN, Math.round(n / 10) * 10));
}

export function defaultPageCmsTextStyle(): PageCmsTextStyle {
  return { ...DEFAULT_STYLE };
}

export function normalizePageCmsTextStyle(raw: unknown): PageCmsTextStyle {
  if (!raw || typeof raw !== "object") return defaultPageCmsTextStyle();
  const row = raw as Record<string, unknown>;
  const fonts = normalizeHomeHeroTextFont({
    kicker: row.font,
    heroLine1: row.font,
    heroLine2: row.font,
    lead: row.font,
  });
  const font = fonts.kicker;
  const scale = clampScale(Number(row.scale ?? row.scalePct ?? DEFAULT_STYLE.scale));
  const color = normalizeHeroTextColorValue(row.color);
  return { scale, font, color };
}

export function normalizePageCmsTextStyles(raw: unknown): PageCmsTextStyles | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const next: PageCmsTextStyles = {};
  for (const [key, value] of Object.entries(row)) {
    if (!key.startsWith("page.")) continue;
    const style = normalizePageCmsTextStyle(value);
    const isDefault =
      style.scale === 100 && style.font === "default" && !style.color;
    if (!isDefault) next[key] = style;
  }
  return Object.keys(next).length ? next : undefined;
}

export function pageCmsTextStyle(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  locale: Locale,
): CSSProperties | undefined {
  if (locale !== "ko" || !styles?.[slotKey]) return undefined;
  const { scale, font, color } = styles[slotKey];
  return buildHomeHeroSlotStyle({ scalePct: scale, font, color });
}

export function pageCmsTextStyleColorized(styles: PageCmsTextStyles | undefined, slotKey: string, locale: Locale) {
  if (locale !== "ko") return false;
  return Boolean(normalizeHeroTextColorValue(styles?.[slotKey]?.color));
}

/** 슬롯별 style props — 공개·CMS 마커 공통 */
export function pageCmsTextStyleProps(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  locale: Locale,
): { style?: CSSProperties; className?: string } {
  const style = pageCmsTextStyle(styles, slotKey, locale);
  if (!style) return {};
  const colorized = pageCmsTextStyleColorized(styles, slotKey, locale);
  return {
    style,
    className: colorized ? "hero-cms-slot-color" : undefined,
  };
}

export function mergePageCmsTextStyle(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  patch: Partial<PageCmsTextStyle>,
): PageCmsTextStyles {
  const base = styles?.[slotKey] ?? defaultPageCmsTextStyle();
  const next: PageCmsTextStyle = {
    scale: patch.scale !== undefined ? clampScale(patch.scale) : base.scale,
    font: patch.font !== undefined ? patch.font : base.font,
    color: patch.color !== undefined ? normalizeHeroTextColorValue(patch.color) : base.color,
  };
  const out: PageCmsTextStyles = { ...(styles ?? {}) };
  const isDefault = next.scale === 100 && next.font === "default" && !next.color;
  if (isDefault) {
    delete out[slotKey];
  } else {
    out[slotKey] = next;
  }
  return Object.keys(out).length ? out : {};
}
