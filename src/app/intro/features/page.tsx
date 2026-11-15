import { CmsPageHero } from "@/components/cms-page-hero";
import { CmsPageIntro } from "@/components/cms-page-intro";
import { PastelBox } from "@/components/pastel-box";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "features.title") };
}

export default async function FeaturesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("features", locale);
  const items = (cms.items?.length
    ? cms.items
    : FEATURES.map((feature) => ({
        id: feature.titleKey,
        title: t(locale, feature.titleKey),
        text: t(locale, feature.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <CmsPageHero kicker={hero.kicker} />
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <PastelBox className="p-5 md:p-6">
          <CmsPageIntro title={hero.title} lead={hero.lead} />
        </PastelBox>
        <FeaturesPhotoGrid items={items} />
      </div>
    </>
  );
}
