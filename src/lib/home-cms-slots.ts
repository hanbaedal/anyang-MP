import { HOME_INTRO_HERO_COPY_LIMITS } from "@/lib/home-intro-slides-types";

export type HomeCmsSlotKey = "home.kicker" | "home.heroLine1" | "home.heroLine2" | "home.lead" | "home.slides";

export const HOME_CMS_SLOT_META: Record<
  HomeCmsSlotKey,
  { label: string; field: keyof typeof HOME_INTRO_HERO_COPY_LIMITS | "slides" }
> = {
  "home.kicker": { label: "상단 한 줄", field: "kicker" },
  "home.heroLine1": { label: "제목 1줄", field: "heroLine1" },
  "home.heroLine2": { label: "제목 2줄", field: "heroLine2" },
  "home.lead": { label: "아래 설명", field: "lead" },
  "home.slides": { label: "메인 전경 슬라이드", field: "slides" },
};