import { CmsPageHeroBand } from "@/components/cms-page-hero-band";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import type { CmsPage } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";

/** CMS 소메뉴 상단 배너 — 제목·요약·배경 편집 슬롯 */
export function CmsManagedPageHero({
  locale,
  cms,
  cmsEdit,
}: {
  locale: Locale;
  cms: Pick<CmsPage, "slug" | "title" | "lead" | "heroImage" | "textStyles">;
  cmsEdit: boolean;
}) {
  const hero = resolveCmsPageHero(locale, cms);
  return (
    <CmsPageHeroBand
      kicker={hero.kicker}
      title={hero.title}
      lead={hero.lead}
      heroImage={cms.heroImage}
      cmsSlug={cms.slug}
      cmsEditMarkers={cmsEdit}
      locale={locale}
      textStyles={cms.textStyles}
      imageAlt={hero.title}
      large
    />
  );
}