import type { HomeHeroTextColor, HomeHeroTextFont } from "@/lib/home-hero-text-style";
import type { SiteSocialLink } from "@/lib/site-social";

/** 홈 전경 슬라이드 CMS 상한 */
export const HOME_INTRO_SLIDES_MAX = 12;

/** 등록 없을 때 공개 홈 폴백 (의견서: 현재 5번째 장) */
export const HOME_INTRO_SLIDE_FALLBACK_SRC = "/images/intro-slides/05.jpg";
export const HOME_INTRO_SLIDE_FALLBACK_ALT = "안양공원묘원 전경";

/**
 * AMP-157: 홈 전경 슬라이드로 저장·선택 가능한 src.
 * 갤러리 업로드(`/uploads`·`/api/uploads`)와 시드/정적(`/images`)을 허용.
 */
export function isPersistableHomeIntroSlideSrc(src: string): boolean {
  if (!src || typeof src !== "string") return false;
  const s = src.trim();
  if (!s.startsWith("/") || s.includes("..") || s.includes("://") || s.includes("\\")) return false;
  return s.startsWith("/uploads/") || s.startsWith("/api/uploads/") || s.startsWith("/images/");
}

export const HOME_INTRO_SLIDE_SRC_REJECT_MSG =
  "이 사진은 홈 배경으로 쓸 수 없습니다. 갤러리 업로드(/uploads) 또는 /images 경로만 가능합니다.";

export type HomeIntroSlide = {
  id: string;
  src: string;
  alt: string;
  sort: number;
  createdAt: string;
};

/** 홈 전경 위에 겹치는 카피(한국어). 비우면 i18n 기본값 */
export type HomeIntroHeroCopy = {
  kicker: string;
  heroLine1: string;
  heroLine2: string;
  lead: string;
};

export const HOME_INTRO_HERO_COPY_LIMITS = {
  kicker: 80,
  heroLine1: 60,
  heroLine2: 60,
  lead: 240,
} as const;

export type HomeHeroTextScale = {
  kicker: number;
  heroLine1: number;
  heroLine2: number;
  lead: number;
};

export const HOME_HERO_TEXT_SCALE_MIN = 50;
export const HOME_HERO_TEXT_SCALE_MAX = 300;

export function defaultHomeHeroTextScale(): HomeHeroTextScale {
  return { kicker: 100, heroLine1: 100, heroLine2: 100, lead: 100 };
}

export function defaultHomeIntroHeroCopy(): HomeIntroHeroCopy {
  return {
    kicker: "수도권 최상 · 최선 · 최고 · 최대",
    heroLine1: "접근성이 뛰어난 명당자리",
    heroLine2: "(재)안양공원묘원",
    lead: "매장·평장·봉안과 이미 모신 자리의 관리까지, 전화 한 통과 방문으로 안내합니다.",
  };
}

export type HomeIntroSlidesSettings = {
  slides: HomeIntroSlide[];
  heroCopy: HomeIntroHeroCopy;
  /** 히어로 문구 글자 크기(%) — 100이 기본 */
  heroTextScale?: HomeHeroTextScale;
  /** 히어로 문구 폰트(슬롯별) */
  heroTextFont?: HomeHeroTextFont;
  /** 히어로 문구 색(#hex, 빈 값은 기본) */
  heroTextColor?: HomeHeroTextColor;
  /** 우측 고정 SNS 아이콘 링크 */
  socialLinks?: SiteSocialLink[];
  updatedAt: string;
};
