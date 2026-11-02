import { PageHero } from "@/components/page-hero";
import { ManageGallery } from "@/components/manage-gallery";
import { listGallery } from "@/lib/gallery";

export default async function ManageGalleryPage() {
  const items = await listGallery();
  return (
    <>
      <PageHero
        kicker="관리"
        title="갤러리"
        lead="일반·전경·종류별 사진을 올립니다. 「매장묘·평장묘·봉안묘」 태그가 분양안내 사진을 구동합니다. 제목·설명은 한글 저장 시 영어·중국어가 자동 번역됩니다."
      />
      <ManageGallery initial={items} />
    </>
  );
}
