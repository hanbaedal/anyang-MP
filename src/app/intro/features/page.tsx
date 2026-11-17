import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { FEATURES } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

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
  const { cms, displayLocale } = await loadCmsPageForView("features", locale, cmsEdit);
  const items = (cms.items?.length
    ? cms.items
    : FEATURES.map((feature) => ({
        id: feature.titleKey,
        title: t(displayLocale, feature.titleKey),
        text: t(displayLocale, feature.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="pc-soft-card-fill mx-auto space-y-8 px-4 py-8 md:py-10">
        <FeaturesPhotoGrid
          items={items}
          cmsSlug="features"
          cmsEditMarkers={cmsEdit}
          locale={displayLocale}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
