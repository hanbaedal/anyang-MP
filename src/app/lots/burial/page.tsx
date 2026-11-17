import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { Prose } from "@/components/page-hero";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "burial.title") };
}

export default async function BurialPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const [{ cms, displayLocale }, items] = await Promise.all([
    loadCmsPageForView("burial", locale, cmsEdit),
    listLotsPhotosFromGallery("burial", locale),
  ]);
  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <div className="site-container w-full space-y-8 py-8 md:py-10">
        <Prose className="max-w-none">
          {cms.body ? (
            <CmsBodyMark cmsSlug="burial" locale={displayLocale} textStyles={cms.textStyles} cmsEditMarkers={cmsEdit} text={cms.body} />
          ) : (
            <CmsBodyMark cmsSlug="burial" locale={displayLocale} textStyles={cms.textStyles} cmsEditMarkers={cmsEdit}>
              <p>{t(displayLocale, "burial.body")}</p>
            </CmsBodyMark>
          )}
        </Prose>
        <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
      </div>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}
