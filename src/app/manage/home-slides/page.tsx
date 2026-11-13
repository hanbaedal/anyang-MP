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
        lead="홈 전경 슬라이드 사진을 올립니다. 등록이 없으면 홈에는 기존 5번째 이미지(05.jpg) 한 장이 보입니다."
      />
      <ManageHomeSlides initial={settings} />
    </>
  );
}
