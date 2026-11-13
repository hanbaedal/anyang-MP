import { preload } from "react-dom";
import { HomeIntro } from "@/components/home-intro";
import { SiteAnnouncements } from "@/components/site-announcements";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { getHomeIntroSlidesForPublic } from "@/lib/home-intro-slides";

export default async function HomePage() {
  const [heroMedia, viewPhotos] = await Promise.all([
    getHomeHeroSettings(),
    getHomeIntroSlidesForPublic(),
  ]);

  for (const slide of viewPhotos) {
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
        viewPhotos={viewPhotos}
      />
    </>
  );
}
