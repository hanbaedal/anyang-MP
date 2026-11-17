import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "fees.title") };
}

const FEE_FALLBACK = [
  { titleKey: "fees.c1.title", bodyKey: "fees.p1" },
  { titleKey: "fees.c2.title", bodyKey: "fees.p2" },
  { titleKey: "fees.c3.title", bodyKey: "fees.p3" },
  { titleKey: "fees.c4.title", bodyKey: "fees.p4" },
] as const;

export default async function FeesPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const { cms, displayLocale } = await loadCmsPageForView("fees", locale, cmsEdit);
  const items = (cms.items?.length
    ? cms.items
    : FEE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(displayLocale, row.titleKey),
        text: t(displayLocale, row.bodyKey),
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
          cmsSlug="fees"
          cmsEditMarkers={cmsEdit}
          locale={displayLocale}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
