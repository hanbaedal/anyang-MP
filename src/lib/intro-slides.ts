import type { ViewSlide } from "@/components/home-view-slides";
import {
  HOME_INTRO_SLIDE_FALLBACK_ALT,
  HOME_INTRO_SLIDE_FALLBACK_SRC,
} from "@/lib/home-intro-slides-types";

/**
 * 홈 인트로 슬라이드 폴백 — CMS 등록이 없을 때만 사용.
 * 게시 목록은 getHomeIntroSlidesForPublic() 참고.
 */
export const INTRO_VIEW_SLIDE_FALLBACK: ViewSlide = {
  src: HOME_INTRO_SLIDE_FALLBACK_SRC,
  alt: HOME_INTRO_SLIDE_FALLBACK_ALT,
};

/** @deprecated 레거시 이름 — 폴백 1장 배열 */
export const INTRO_VIEW_SLIDES: ViewSlide[] = [INTRO_VIEW_SLIDE_FALLBACK];
