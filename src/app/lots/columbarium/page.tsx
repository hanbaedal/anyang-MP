import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "col.title") };
}

export default async function ColumbariumPage() {
  const locale = await readLocale();
  const [cms, items] = await Promise.all([
    getCmsPageLocalized("columbarium", locale),
    listLotsPhotosFromGallery("columbarium", locale),
  ]);
  return (
    <>
      <PageHero
        kicker={t(locale, "col.kicker")}
        title={cms.title || t(locale, "col.title")}
        lead={cms.lead || t(locale, "col.lead")}
        image={{ src: "/images/columbarium.jpg", alt: t(locale, "col.title") }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "col.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
      </div>
    </>
  );
}
