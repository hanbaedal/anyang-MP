import type { GalleryTag } from "./content";

export type GalleryPhoto = {
  id: string;
  src: string;
  alt: string;
  /** 분양안내 카드 본문·캡션. 비우면 제목(alt)만 표시. */
  description?: string;
  tags: GalleryTag[];
  /** 손님용 영어·중국어. 한글 alt·description은 위 필드. */
  i18n?: Partial<Record<"en" | "zh", { alt: string; description?: string }>>;
};

export const GALLERY_TAGS: GalleryTag[] = ["일반", "전경", "매장묘", "평장묘", "봉안묘", "리모델링"];

/** 분양안내 상세 slug → 갤러리 분류 태그 (기존 GALLERY_TAGS 문자열과 동일). */
export const LOTS_GALLERY_TAG = {
  burial: "매장묘",
  lawn: "평장묘",
  columbarium: "봉안묘",
} as const satisfies Record<"burial" | "lawn" | "columbarium", GalleryTag>;

export type LotsGallerySlug = keyof typeof LOTS_GALLERY_TAG;
