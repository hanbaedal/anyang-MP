import { CmsPageHero } from "@/components/cms-page-hero";
import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "burial.title") };
}

export default async function BurialPage() {
  const locale = await readLocale();
  const [cms, items] = await Promise.all([
    getCmsPageLocalized("burial", locale),
    listLotsPhotosFromGallery("burial", locale),
  ]);
  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <CmsPageHero {...hero} />
      <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:py-10">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "burial.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
      </div>
    </>
  );
}
