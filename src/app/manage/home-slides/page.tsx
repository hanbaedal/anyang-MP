import { PageHero } from "@/components/page-hero";
import { ManageHomeSlides } from "@/components/manage-home-slides";
import { getHomeIntroSlidesSettingsForWrite } from "@/lib/home-intro-slides";

export default async function ManageHomeSlidesPage() {
  const settings = await getHomeIntroSlidesSettingsForWrite();
  return (
    <>
      <PageHero
        kicker="관리"
        title="메인 이미지 등록"
        lead="갤러리 사진을 클릭한 순서로 홈 전경 슬라이드에 올립니다. 선택이 없으면 05.jpg 한 장이 보입니다."
      />
      <ManageHomeSlides initial={settings} />
    </>
  );
}
