import { GalleryGrid } from "@/components/gallery-grid";
import { PageHero } from "@/components/page-hero";
import { listGalleryLocalized } from "@/lib/gallery";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "gallery.title") };
}

export default async function GalleryPage() {
  const locale = await readLocale();
  const items = await listGalleryLocalized(locale);
  return (
    <>
      <PageHero
        kicker={t(locale, "gallery.kicker")}
        title={t(locale, "gallery.title")}
        image={{ src: "/images/park-overview.jpg", alt: t(locale, "gallery.title") }}
      />
      <div className="mx-auto w-full max-w-6xl min-w-0 overflow-x-hidden px-4 py-12">
        <GalleryGrid items={items} />
      </div>
    </>
  );
}
