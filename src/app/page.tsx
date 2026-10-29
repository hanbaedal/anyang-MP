import { HomeIntro } from "@/components/home-intro";
import { SiteAnnouncements } from "@/components/site-announcements";
import { listGalleryLocalized } from "@/lib/gallery";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { readLocale } from "@/lib/i18n-server";

export default async function HomePage() {
  const locale = await readLocale();
  const [heroMedia, gallery] = await Promise.all([getHomeHeroSettings(), listGalleryLocalized(locale)]);
  const viewPhotos = gallery
    .filter((item) => item.tags.includes("전경") && item.src)
    .map((item) => ({ src: item.src, alt: item.alt }));

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
