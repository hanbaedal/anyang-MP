import { PageHero } from "@/components/page-hero";
import { ManageGallery } from "@/components/manage-gallery";
import { getGalleryPageSettings } from "@/lib/gallery-page";
import { listGallery } from "@/lib/gallery";

export default async function ManageGalleryPage() {
  const [items, page] = await Promise.all([listGallery(), getGalleryPageSettings()]);
  return (
    <>
      <PageHero kicker="관리" title="갤러리" />
      <ManageGallery initial={items} initialPage={page} />
    </>
  );
}
