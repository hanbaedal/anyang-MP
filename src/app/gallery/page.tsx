import { GalleryGrid } from "@/components/gallery-grid";
import { listPublicGalleryLocalized } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "gallery.title") };
}

export default async function GalleryPage() {
  const locale = await readLocale();
  const items = await listPublicGalleryLocalized(locale);
  return (
    <div className="mx-auto w-full max-w-7xl min-w-0 overflow-x-hidden px-3 py-8 sm:px-4 sm:py-10">
      <h1 className="sr-only">{t(locale, "gallery.title")}</h1>
      <GalleryGrid items={items} />
    </div>
  );
}
