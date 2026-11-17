import type { CSSProperties } from "react";

export const HOME_HERO_FONT_PRESETS = [
  "default",
  "gothic",
  "gothicBold",
  "myeongjo",
  "shinMyeongjo",
  "myeongjoBold",
  "gungsuh",
  "headlineM",
] as const;
export type HomeHeroFontPreset = (typeof HOME_HERO_FONT_PRESETS)[number];

const LEGACY_FONT_PRESET: Record<string, HomeHeroFontPreset> = {
  sans: "gothic",
  serif: "myeongjo",
  headline: "headlineM",
};

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
  { id: "default", label: "기본" },
  { id: "gothic", label: "고딕" },
  { id: "gothicBold", label: "견고딕" },
  { id: "myeongjo", label: "명조" },
  { id: "shinMyeongjo", label: "신명조" },
  { id: "myeongjoBold", label: "견명조" },
  { id: "gungsuh", label: "궁서" },
  { id: "headlineM", label: "헤드라인M" },
];

export const HOME_HERO_FONT_PREVIEW = "가나다 ABC";

export function defaultHomeHeroTextFont(): HomeHeroTextFont {
  return { kicker: "default", heroLine1: "default", heroLine2: "default", lead: "default" };
}

export function defaultHomeHeroTextColor(): HomeHeroTextColor {
  return { kicker: "", heroLine1: "", heroLine2: "", lead: "" };
}

/** CMS 글자 컬러 팔레트 (Carebase 스타일) — hex 저장, 빈 값 = 테마 기본 */
export const HOME_HERO_COLOR_PALETTE = [
  { id: "white", label: "흰색", hex: "#ffffff" },
  { id: "yellow", label: "노랑", hex: "#f5e642" },
  { id: "sky", label: "하늘", hex: "#5ec8e8" },
  { id: "blue", label: "청색", hex: "#3b82f6" },
  { id: "purple", label: "보라", hex: "#c026d3" },
  { id: "red", label: "빨강", hex: "#ef4444" },
  { id: "black", label: "검정", hex: "#1c1915" },
] as const;

export type HomeHeroColorId = (typeof HOME_HERO_COLOR_PALETTE)[number]["id"];

const HERO_SLOT_KEYS = ["kicker", "heroLine1", "heroLine2", "lead"] as const;

function isFontPreset(v: unknown): v is HomeHeroFontPreset {
  return typeof v === "string" && (HOME_HERO_FONT_PRESETS as readonly string[]).includes(v);
}

function coerceFontPreset(v: unknown): HomeHeroFontPreset {
  if (typeof v !== "string") return "default";
  if (LEGACY_FONT_PRESET[v]) return LEGACY_FONT_PRESET[v];
  if (isFontPreset(v)) return v;
  return "default";
}

/** 팔레트 hex / #rgb / #rrggbb. 빈 문자열 = 테마 기본색 */
export function normalizeHeroTextColorValue(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  const s = String(raw).trim();
  if (!s || s === "default") return "";
  const fromId = HOME_HERO_COLOR_PALETTE.find((p) => p.id === s);
  if (fromId) return fromId.hex;
  const hex = s.startsWith("#") ? s : `#${s}`;
  if (/^#[0-9a-fA-F]{3}$/.test(hex)) return hex.toLowerCase();
  if (/^#[0-9a-fA-F]{6}$/.test(hex)) return hex.toLowerCase();
  const fromHex = HOME_HERO_COLOR_PALETTE.find((p) => p.hex.toLowerCase() === hex.toLowerCase());
  if (fromHex) return fromHex.hex;
  return "";
}

export function heroTextColorIsActive(saved: string, hex: string) {
  const norm = normalizeHeroTextColorValue(saved);
  if (!hex) return !norm;
  return norm === hex;
}

export function normalizeHomeHeroTextFont(raw: unknown): HomeHeroTextFont {
  const base = defaultHomeHeroTextFont();
  if (!raw || typeof raw !== "object") return base;
  const row = raw as Record<string, unknown>;
  const next = { ...base };
  for (const key of HERO_SLOT_KEYS) {
    next[key] = coerceFontPreset(row[key]);
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

const SANS_STACK = 'var(--font-sans), "Noto Sans KR", sans-serif';
const SERIF_STACK = 'var(--font-serif), "Noto Serif KR", serif';

export function homeHeroFontPresetCss(
  preset: HomeHeroFontPreset,
): Pick<CSSProperties, "fontFamily" | "fontWeight" | "letterSpacing"> {
  switch (preset) {
    case "gothic":
      return { fontFamily: SANS_STACK, fontWeight: 400 };
    case "gothicBold":
      return { fontFamily: SANS_STACK, fontWeight: 700 };
    case "myeongjo":
      return { fontFamily: SERIF_STACK, fontWeight: 400 };
    case "shinMyeongjo":
      return {
        fontFamily: `"Nanum Myeongjo", ${SERIF_STACK}`,
        fontWeight: 400,
      };
    case "myeongjoBold":
      return { fontFamily: SERIF_STACK, fontWeight: 700 };
    case "gungsuh":
      return {
        fontFamily: 'Gungsuh, "Batang", "궁서", serif',
        fontWeight: 400,
      };
    case "headlineM":
      return {
        fontFamily: SANS_STACK,
        fontWeight: 800,
        letterSpacing: "-0.02em",
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
function heroCopyTextEl(root: HTMLElement, key: string): HTMLElement | null {
  if (key === "home.kicker" || key === "home.lead") return root.querySelector("p");
  if (key === "home.heroLine1" || key === "home.heroLine2") return root.querySelector("span");
  return null;
}

function syncHeroColorInheritance(root: HTMLElement, color: string) {
  const c = normalizeHeroTextColorValue(color);
  const paints = [root, ...Array.from(root.querySelectorAll<HTMLElement>("p, span"))];
  if (!c) {
    for (const node of paints) node.style.color = "";
    root.removeAttribute("data-hero-custom-color");
    return;
  }
  root.setAttribute("data-hero-custom-color", "1");
  root.style.color = c;
  for (const node of paints) {
    if (node !== root) node.style.color = "inherit";
  }
}

export function applyHomeHeroSlotStyleToElement(
  el: HTMLElement,
  opts: { scalePct?: number; font?: HomeHeroFontPreset; color?: string },
) {
  const key = el.getAttribute("data-cms-key") ?? "";
  const textEl = key.startsWith("home.") ? heroCopyTextEl(el, key) : null;

  if (typeof opts.scalePct === "number") {
    const target = textEl ?? el;
    target.style.fontSize = opts.scalePct === 100 ? "" : `${opts.scalePct}%`;
  }
  if (opts.font !== undefined) {
    const target = textEl ?? el;
    if (opts.font === "default") {
      target.style.fontFamily = "";
      target.style.fontWeight = "";
      target.style.letterSpacing = "";
    } else {
      const css = homeHeroFontPresetCss(opts.font);
      target.style.fontFamily = css.fontFamily ?? "";
      target.style.fontWeight = css.fontWeight != null ? String(css.fontWeight) : "";
      target.style.letterSpacing =
        css.letterSpacing != null && css.letterSpacing !== "" ? String(css.letterSpacing) : "";
    }
  }
  if (opts.color !== undefined) {
    syncHeroColorInheritance(el, opts.color);
  }
}

/** iframe 텍스트 패치 — wrapper가 아닌 내부 p/span만 갱신 */
export function patchHomeHeroCopyText(root: HTMLElement, key: string, text: string, leadHtml: string) {
  const inner = heroCopyTextEl(root, key);
  if (!inner) {
    root.textContent = text;
    return;
  }
  if (key === "home.lead") {
    inner.innerHTML = leadHtml;
    return;
  }
  inner.textContent = text;
}