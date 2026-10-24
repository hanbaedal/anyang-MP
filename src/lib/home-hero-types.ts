/** 홈 메인에 올릴 수 있는 영상·음악 세트 상한 */
export const HOME_HERO_MAX_SETS = 4;

/** 영상 업로드 상한 (바이트·표시 문구) */
export const HOME_HERO_VIDEO_MAX_BYTES = 50 * 1024 * 1024;
export const HOME_HERO_VIDEO_MAX_LABEL = "50MB";

/** 음악 업로드 상한 */
export const HOME_HERO_AUDIO_MAX_BYTES = 12 * 1024 * 1024;
export const HOME_HERO_AUDIO_MAX_LABEL = "12MB";

/** 공개 세트 없음(비공개) — 홈은 기본 배포 미디어 사용 */
export const HOME_HERO_UNPUBLISHED = "";

/** 영상(+선택 음악) 한 세트 */
export type HomeHeroSet = {
  id: string;
  /** 카드에 보이는 짧은 이름 */
  label: string;
  videoSrc: string;
  /** 공란이면 홈에서 영상 트랙 소리 사용 */
  audioSrc: string;
  videoLabel: string;
  audioLabel: string;
  createdAt: string;
};

export type HomeHeroSettings = {
  sets: HomeHeroSet[];
  /**
   * 홈에 공개 중인 세트 id.
   * 빈 문자열이면 비공개(홈은 기본 배포 영상·음악).
   */
  activeSetId: string;
  posterSrc: string;
  updatedAt: string;
  /** active 세트(또는 비공개 시 기본)에서 파생(홈·호환용) */
  videoSrc: string;
  audioSrc: string;
};
