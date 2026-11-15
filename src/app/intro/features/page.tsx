import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsPageIntro } from "@/components/cms-page-intro";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { PastelBox } from "@/components/pastel-box";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { getCmsPageLocalized, getCmsPageOrDefault } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "features.title") };
}

export default async function FeaturesPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const cms = cmsEdit
    ? await getCmsPageOrDefault("features")
    : await getCmsPageLocalized("features", locale);
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
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <PastelBox className="p-5 md:p-6">
          <CmsPageIntro
            title={hero.title}
            lead={hero.lead}
            cmsSlug="features"
            cmsEditMarkers={cmsEdit}
          />
        </PastelBox>
        <FeaturesPhotoGrid items={items} cmsSlug="features" cmsEditMarkers={cmsEdit} />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
