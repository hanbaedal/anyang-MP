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

/**
 * AMP-144: 페이지 CMS textStyles는 로케일과 무관하게 적용.
 * (이전 ko-only 게이트는 게스트 en/zh·표시 로케일 불일치 시 명조가 고딕으로 떨어짐)
 */
export function pageCmsTextStyle(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  _locale?: Locale,
): CSSProperties | undefined {
  if (!slotKey || !styles?.[slotKey]) return undefined;
  const { scale, font, color } = styles[slotKey];
  return buildHomeHeroSlotStyle({ scalePct: scale, font, color });
}

export function pageCmsTextStyleColorized(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  _locale?: Locale,
) {
  if (!slotKey) return false;
  return Boolean(normalizeHeroTextColorValue(styles?.[slotKey]?.color));
}

/**
 * item id가 바뀌어 저장된 textStyles 키와 어긋날 때 —
 * 같은 slug·field의 삽입 순서(index)로 donor 키를 찾는다.
 */
export function resolvePageCmsItemStyleKey(
  styles: PageCmsTextStyles | undefined,
  slug: string,
  itemId: string,
  field: "title" | "text",
  itemIndex: number,
): string {
  const exact = `page.${slug}.item.${itemId}.${field}`;
  if (!styles) return exact;
  if (styles[exact]) return exact;

  const aliases = [
    `page.${slug}.item.step-${itemIndex + 1}.${field}`,
    `page.${slug}.item.item-${itemIndex}.${field}`,
    `page.${slug}.item.${itemIndex + 1}.${field}`,
  ];
  for (const key of aliases) {
    if (styles[key]) return key;
  }

  const escaped = slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`^page\\.${escaped}\\.item\\.(.+)\\.${field}$`);
  const ordered = Object.keys(styles).filter((key) => re.test(key));
  return ordered[itemIndex] ?? exact;
}

/** 읽기 시 item id와 textStyles 키를 index로 맞춤(렌더용, 디스크 미변경) */
export function alignPageCmsItemTextStyles(
  styles: PageCmsTextStyles | undefined,
  slug: string,
  itemIds: string[],
): PageCmsTextStyles | undefined {
  if (!styles || !itemIds.length) return styles;
  let changed = false;
  const next: PageCmsTextStyles = { ...styles };
  for (const field of ["title", "text"] as const) {
    for (let i = 0; i < itemIds.length; i++) {
      const id = itemIds[i]?.trim();
      if (!id) continue;
      const exact = `page.${slug}.item.${id}.${field}`;
      if (next[exact]) continue;
      const donor = resolvePageCmsItemStyleKey(styles, slug, id, field, i);
      if (donor !== exact && styles[donor]) {
        next[exact] = styles[donor]!;
        changed = true;
      }
    }
  }
  return changed ? next : styles;
}

/** 슬롯별 style props — 공개·CMS 마커 공통 */
export function pageCmsTextStyleProps(
  styles: PageCmsTextStyles | undefined,
  slotKey: string,
  locale?: Locale,
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
