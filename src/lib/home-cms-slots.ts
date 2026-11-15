import { HOME_INTRO_HERO_COPY_LIMITS } from "@/lib/home-intro-slides-types";

export type HomeCmsSlotKey = "home.kicker" | "home.heroLine1" | "home.heroLine2" | "home.lead" | "home.slides";

export const HOME_CMS_SLOT_META: Record<
  HomeCmsSlotKey,
  { label: string; field: keyof typeof HOME_INTRO_HERO_COPY_LIMITS | "slides" }
> = {
  "home.kicker": { label: "히어로 상단 문구", field: "kicker" },
  "home.heroLine1": { label: "메인 제목 1줄", field: "heroLine1" },
  "home.heroLine2": { label: "메인 제목 2줄", field: "heroLine2" },
  "home.lead": { label: "히어로 설명", field: "lead" },
  "home.slides": { label: "메인 전경 슬라이드", field: "slides" },
};