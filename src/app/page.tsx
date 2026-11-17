import { preload } from "react-dom";
import { HomeCmsEditBridge } from "@/components/cms-edit/home-cms-edit-bridge";
import { HomeIntro } from "@/components/home-intro";
import { SiteAnnouncements } from "@/components/site-announcements";
import { readSession } from "@/lib/auth";
import { isCmsStaff } from "@/lib/auth-types";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { getHomeIntroSlidesForPublic, getHomeIntroSlidesSettings } from "@/lib/home-intro-slides";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const sp = await searchParams;
  const session = await readSession();
  const cmsEdit = sp.cmsEdit === "1" && Boolean(session && isCmsStaff(session.role));

  const [heroMedia, viewPhotos, introSettings] = await Promise.all([
    getHomeHeroSettings(),
    getHomeIntroSlidesForPublic(),
    getHomeIntroSlidesSettings(),
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
        heroCopy={introSettings.heroCopy}
        heroTextScale={introSettings.heroTextScale}
        heroTextFont={introSettings.heroTextFont}
        heroTextColor={introSettings.heroTextColor}
        cmsEditMarkers={cmsEdit}
      />
      {cmsEdit ? <HomeCmsEditBridge enabled /> : null}
    </>
  );
}
