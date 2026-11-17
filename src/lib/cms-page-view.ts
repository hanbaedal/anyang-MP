import { getCmsPageLocalized, getCmsPageOrDefault } from "@/lib/cms";
import type { CmsPage, CmsSlug } from "@/lib/cms-types";
import type { Locale } from "@/lib/i18n";

/** CMS iframe 미리보기 — 한국어 CMS 필드·textStyles와 공개(ko)와 동일하게 */
export function cmsPageDisplayLocale(locale: Locale, cmsEdit: boolean): Locale {
  return cmsEdit ? "ko" : locale;
}

export async function loadCmsPageForView(
  slug: CmsSlug,
  locale: Locale,
  cmsEdit: boolean,
): Promise<{ cms: CmsPage; displayLocale: Locale }> {
  const displayLocale = cmsPageDisplayLocale(locale, cmsEdit);
  const cms = cmsEdit
    ? await getCmsPageOrDefault(slug)
    : await getCmsPageLocalized(slug, displayLocale);
  return { cms, displayLocale };
}