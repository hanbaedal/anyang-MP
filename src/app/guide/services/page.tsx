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
  return { title: t(locale, "svc.title") };
}

const SERVICE_FALLBACK = [
  { titleKey: "svc.reloc.title", bodyKeys: ["svc.reloc.p1", "svc.reloc.p2"] },
  { titleKey: "svc.stone.title", bodyKeys: ["svc.stone.p1"] },
  { titleKey: "svc.turf.title", bodyKeys: ["svc.turf.p1"] },
  { titleKey: "svc.weed.title", bodyKeys: ["svc.weed.p1"] },
  { titleKey: "svc.design.title", bodyKeys: ["svc.design.p1"] },
] as const;

export default async function ServicesPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const { cms, displayLocale } = await loadCmsPageForView("services", locale, cmsEdit);
  const items = (cms.items?.length
    ? cms.items
    : SERVICE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(displayLocale, row.titleKey),
        text: row.bodyKeys.map((key) => t(displayLocale, key)).join("\n\n"),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container pc-soft-card-fill space-y-8 py-8 md:py-10">
        <FeaturesPhotoGrid
          items={items}
          cmsSlug="services"
          cmsEditMarkers={cmsEdit}
          locale={displayLocale}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
