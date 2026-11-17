import type { CSSProperties } from "react";

export const HOME_HERO_FONT_PRESETS = ["default", "sans", "serif", "headline"] as const;
export type HomeHeroFontPreset = (typeof HOME_HERO_FONT_PRESETS)[number];

export type HomeHeroTextFont = {
  kicker: HomeHeroFontPreset;
  heroLine1: HomeHeroFontPreset;
  heroLine2: HomeHeroFontPreset;
  lead: HomeHeroFontPreset;
};

export type HomeHeroTextColor = {
  kicker: string;
  heroLine1: string;
  heroLine2: string;
  lead: string;
};

export const HOME_HERO_FONT_OPTIONS: { id: HomeHeroFontPreset; label: string }[] = [
  { id: "default", label: "기본 (디자인 기본값)" },
  { id: "sans", label: "고딕 (Noto Sans KR)" },
  { id: "serif", label: "명조 (Noto Serif KR)" },
  { id: "headline", label: "헤드라인 (명조·강조)" },
];

export function defaultHomeHeroTextFont(): HomeHeroTextFont {
  return { kicker: "default", heroLine1: "default", heroLine2: "default", lead: "default" };
}

export function defaultHomeHeroTextColor(): HomeHeroTextColor {
  return { kicker: "", heroLine1: "", heroLine2: "", lead: "" };
}

const HERO_SLOT_KEYS = ["kicker", "heroLine1", "heroLine2", "lead"] as const;

function isFontPreset(v: unknown): v is HomeHeroFontPreset {
  return typeof v === "string" && (HOME_HERO_FONT_PRESETS as readonly string[]).includes(v);
}

/** #rgb / #rrggbb 만 허용. 빈 문자열 = 테마 기본색 */
export function normalizeHeroTextColorValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  if (!s || s === "default") return "";
  const hex = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  return "";
}

export function normalizeHomeHeroTextFont(raw: unknown): HomeHeroTextFont {
  const base = defaultHomeHeroTextFont();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const next = { ...base };
  for (const key of HERO_SLOT_KEYS) {
    const v = row[key];
    if (isFontPreset(v)) next[key] = v;
  }
  return next;
}

export function normalizeHomeHeroTextColor(raw: unknown): HomeHeroTextColor {
  const base = defaultHomeHeroTextColor();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  return {
    kicker: normalizeHeroTextColorValue(row.kicker),
    heroLine1: normalizeHeroTextColorValue(row.heroLine1),
    heroLine2: normalizeHeroTextColorValue(row.heroLine2),
    lead: normalizeHeroTextColorValue(row.lead),
  };
}

export function homeHeroFontPresetCss(preset: HomeHeroFontPreset): Pick<CSSProperties, "fontFamily" | "fontWeight"> {
  switch (preset) {
    case "sans":
      return { fontFamily: 'var(--font-sans), "Noto Sans KR", sans-serif' };
    case "serif":
      return { fontFamily: 'var(--font-serif), "Noto Serif KR", serif' };
    case "headline":
      return {
        fontFamily: 'var(--font-serif), "Noto Serif KR", serif',
        fontWeight: 600,
      };
    default:
      return {};
  }
}

export function buildHomeHeroSlotStyle(opts: {
  scalePct?: number;
  font?: HomeHeroFontPreset;
  color?: string;
}): CSSProperties | undefined {
  const style: CSSProperties = {};
  if (opts.scalePct && opts.scalePct !== 100) style.fontSize = `${opts.scalePct}%`;
  if (opts.font && opts.font !== "default") Object.assign(style, homeHeroFontPresetCss(opts.font));
  const color = normalizeHeroTextColorValue(opts.color);
  if (color) style.color = color;
  return Object.keys(style).length ? style : undefined;
}

/** iframe CMS 실시간 패치용 */
export function applyHomeHeroSlotStyleToElement(
  el: HTMLElement,
  opts: { scalePct?: number; font?: HomeHeroFontPreset; color?: string },
) {
  if (typeof opts.scalePct === "number") {
    el.style.fontSize = opts.scalePct === 100 ? "" : `${opts.scalePct}%`;
  }
  if (opts.font !== undefined) {
    if (opts.font === "default") {
      el.style.fontFamily = "";
      el.style.fontWeight = "";
    } else {
      const css = homeHeroFontPresetCss(opts.font);
      el.style.fontFamily = css.fontFamily ?? "";
      el.style.fontWeight = css.fontWeight != null ? String(css.fontWeight) : "";
    }
  }
  if (opts.color !== undefined) {
    const c = normalizeHeroTextColorValue(opts.color);
    el.style.color = c || "";
  }
}