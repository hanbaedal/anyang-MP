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
  return { title: t(locale, "burial.title") };
}

export default async function BurialPage() {
  const locale = await readLocale();
  const [cms, items] = await Promise.all([
    getCmsPageLocalized("burial", locale),
    listLotsPhotosFromGallery("burial", locale),
  ]);
  return (
    <>
      <PageHero
        kicker={t(locale, "burial.kicker")}
        title={cms.title || t(locale, "burial.title")}
        lead={cms.lead || t(locale, "burial.lead")}
        image={{ src: "/images/burial.jpg", alt: t(locale, "burial.title") }}
      />
      <div className="mx-auto w-full max-w-7xl px-4 py-12">
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "burial.body")}</p>}</Prose>
        <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
      </div>
    </>
  );
}
