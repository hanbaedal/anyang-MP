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

export type HomeIntroSlidesSettings = {
  slides: HomeIntroSlide[];
  updatedAt: string;
};
