import type { Locale } from "@/lib/i18n";

/** Locale narration for the static trimmed intro (BGM + spoken close). */
export const HOME_HERO_NARRATION: Record<Locale, string> = {
  ko: "/audio/home-hero/ko.m4a",
  en: "/audio/home-hero/en.m4a",
  zh: "/audio/home-hero/zh.m4a",
};

export function homeHeroNarrationSrc(locale: Locale) {
  return HOME_HERO_NARRATION[locale] || HOME_HERO_NARRATION.ko;
}
