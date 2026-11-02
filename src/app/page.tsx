import { preload } from "react-dom";
import { HomeIntro } from "@/components/home-intro";
import { SiteAnnouncements } from "@/components/site-announcements";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { INTRO_VIEW_SLIDES } from "@/lib/intro-slides";

export default async function HomePage() {
  const heroMedia = await getHomeHeroSettings();

  for (const slide of INTRO_VIEW_SLIDES) {
    preload(slide.src, { as: "image" });
  }

  return (
    <>
      <SiteAnnouncements />
      {/* 헤더·푸터 사이 스크롤 영역을 채우고, 카피는 하단 가장자리에만 둔다 */}
      <HomeIntro
        videoSrc={heroMedia.videoSrc}
        audioSrc={heroMedia.audioSrc}
        posterSrc={heroMedia.posterSrc}
        viewPhotos={INTRO_VIEW_SLIDES}
      />
    </>
  );
}
