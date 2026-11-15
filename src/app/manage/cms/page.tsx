import { ManageCmsShell } from "@/components/manage/manage-cms-shell";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { getHomeIntroSlidesSettingsForWrite } from "@/lib/home-intro-slides";

export default async function ManageCmsPage() {
  const [homeInitial, hero] = await Promise.all([getHomeIntroSlidesSettingsForWrite(), getHomeHeroSettings()]);
  return (
    <ManageCmsShell
      homeInitial={homeInitial}
      heroMedia={{ videoSrc: hero.videoSrc, audioSrc: hero.audioSrc, posterSrc: hero.posterSrc }}
    />
  );
}