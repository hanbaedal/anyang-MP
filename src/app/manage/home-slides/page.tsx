import { ManageHomeSlides } from "@/components/manage-home-slides";
import { getHomeHeroSettings } from "@/lib/home-hero";
import { getHomeIntroSlidesSettingsForWrite } from "@/lib/home-intro-slides";

export default async function ManageHomeSlidesPage() {
  const [settings, hero] = await Promise.all([getHomeIntroSlidesSettingsForWrite(), getHomeHeroSettings()]);
  return (
    <ManageHomeSlides
      initial={settings}
      heroMedia={{ videoSrc: hero.videoSrc, audioSrc: hero.audioSrc, posterSrc: hero.posterSrc }}
    />
  );
}
