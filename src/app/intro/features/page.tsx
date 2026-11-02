import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { PageHero } from "@/components/page-hero";
import { FEATURES } from "@/lib/site";
import { getCmsPageLocalized } from "@/lib/cms";
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
        image: feature.image,
      }))
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  return (
    <>
      <PageHero
        kicker={t(locale, "features.kicker")}
        title={cms.title || t(locale, "features.title")}
        lead={cms.lead || t(locale, "features.lead")}
        image={{ src: "/images/park-overview.jpg", alt: t(locale, "features.title") }}
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <FeaturesPhotoGrid items={items} />
      </div>
    </>
  );
}
