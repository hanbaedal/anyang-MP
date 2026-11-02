import { LotsPhotoGrid } from "@/components/lots-photo-grid";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { listLotsPhotosFromGallery } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "lawn.title") };
}

export default async function LawnPage() {
  const locale = await readLocale();
  const [cms, items] = await Promise.all([
    getCmsPageLocalized("lawn", locale),
    listLotsPhotosFromGallery("lawn", locale),
  ]);
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12">
      <h1 className="sr-only">{cms.title || t(locale, "lawn.title")}</h1>
      <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "lawn.body")}</p>}</Prose>
      <LotsPhotoGrid items={items} layout="detail" emptyLabel={t(locale, "lots.galleryEmpty")} />
    </div>
  );
}
