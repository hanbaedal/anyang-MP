import { PageHero } from "@/components/page-hero";
import { ManageGallery } from "@/components/manage-gallery";
import { listGallery } from "@/lib/gallery";

export default async function ManageGalleryPage() {
  const items = await listGallery();
  return (
    <>
      <PageHero kicker="관리" title="갤러리" />
      <ManageGallery initial={items} />
    </>
  );
}
