import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { DirectionsPageBody } from "@/components/directions-page-body";
import { stripDirectionsAddressItems } from "@/lib/cms";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "dir.title") };
}

const TRANSIT_FALLBACK = [
  { titleKey: "dir.car", bodyKey: "dir.carBody" },
  { titleKey: "dir.bus", bodyKey: "dir.busBody" },
  { titleKey: "dir.taxi", bodyKey: "dir.taxiBody" },
] as const;

export default async function DirectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const { cms, displayLocale } = await loadCmsPageForView("directions", locale, cmsEdit);
  const rawItems = stripDirectionsAddressItems(cms.items ?? []);
  const items = (rawItems.length
    ? rawItems
    : TRANSIT_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(displayLocale, row.titleKey),
        text: t(displayLocale, row.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    // 공개 카드: 제목 미표시 · CMS 본문 전체(AMP-75)
    image: item.image?.trim() || undefined,
  }));

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container w-full space-y-6 py-8 md:space-y-8 md:py-10">
        <DirectionsPageBody
          items={items}
          cmsSlug="directions"
          cmsEditMarkers={cmsEdit}
          cmsTextStyles={cms.textStyles}
        />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
