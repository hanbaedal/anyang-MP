/** 홈 전경 슬라이드 CMS 상한 */
export const HOME_INTRO_SLIDES_MAX = 12;

/** 등록 없을 때 공개 홈 폴백 (의견서: 현재 5번째 장) */
export const HOME_INTRO_SLIDE_FALLBACK_SRC = "/images/intro-slides/05.jpg";
export const HOME_INTRO_SLIDE_FALLBACK_ALT = "안양공원묘원 전경";

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
  updatedAt: string;
};
