import Image from "next/image";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { DirectionsPageBody } from "@/components/directions-page-body";
import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { MenuHubSection } from "@/components/menu-hub-section";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { getCmsPageLocalized, stripDirectionsAddressItems } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { uploadOriginalUrl } from "@/lib/media";
import { FEATURES } from "@/lib/site";

export const dynamic = "force-dynamic";

const TRANSIT_FALLBACK = [
  { titleKey: "dir.car", bodyKey: "dir.carBody" },
  { titleKey: "dir.bus", bodyKey: "dir.busBody" },
  { titleKey: "dir.taxi", bodyKey: "dir.taxiBody" },
] as const;

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.intro") };
}

export default async function IntroHubPage() {
  const locale = await readLocale();
  const [greeting, featuresCms, directions] = await Promise.all([
    getCmsPageLocalized("greeting", locale),
    getCmsPageLocalized("features", locale),
    getCmsPageLocalized("directions", locale),
  ]);
  const bodyImage = greeting.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? uploadOriginalUrl(bodyImage) : "";
  const featureItems = (featuresCms.items?.length
    ? featuresCms.items
    : FEATURES.map((feature) => ({
        id: feature.titleKey,
        title: t(locale, feature.titleKey),
        text: t(locale, feature.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const rawDirections = stripDirectionsAddressItems(directions.items ?? []);
  const directionItems = (rawDirections.length
    ? rawDirections
    : TRANSIT_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: t(locale, row.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  return (
    <div className="site-container space-y-16 py-12">
      <h1 className="sr-only">{t(locale, "nav.intro")}</h1>
      <MenuHubSection
        id="greeting"
        title={greeting.title || t(locale, "greeting.title")}
        href="/intro/greeting"
        moreLabel={t(locale, "more.detail")}
      >
        <PastelBox>
          <div
            className={
              imageSrc
                ? "grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
                : undefined
            }
          >
            {imageSrc ? (
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg bg-black/5 md:mx-0 md:max-w-none">
                <Image
                  src={imageSrc}
                  alt={greeting.title || t(locale, "greeting.title")}
                  fill
                  className="guest-photo-bright object-cover"
                  sizes="(max-width: 768px) 90vw, 22rem"
                  unoptimized
                />
              </div>
            ) : null}
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              {greeting.body ? (
                <CmsBodyMark
                  cmsSlug="greeting"
                  locale={locale}
                  textStyles={greeting.textStyles}
                  text={greeting.body}
                />
              ) : (
                <CmsBodyMark cmsSlug="greeting" locale={locale} textStyles={greeting.textStyles}>
                  <>
                    <p>{t(locale, "greeting.p1")}</p>
                    <p>{t(locale, "greeting.p2")}</p>
                    <p>{t(locale, "greeting.p3")}</p>
                    <p>{t(locale, "greeting.thanks")}</p>
                    <p className="font-medium">{t(locale, "greeting.sign")}</p>
                  </>
                </CmsBodyMark>
              )}
            </Prose>
          </div>
        </PastelBox>
      </MenuHubSection>

      <MenuHubSection
        id="features"
        title={featuresCms.title || t(locale, "features.title")}
        href="/intro/features"
        moreLabel={t(locale, "more.detail")}
      >
        <FeaturesPhotoGrid
          items={featureItems}
          featureRainbow
          cmsSlug="features"
          locale={locale}
          cmsTextStyles={featuresCms.textStyles}
        />
      </MenuHubSection>

      <MenuHubSection
        id="directions"
        title={directions.title || t(locale, "dir.title")}
        href="/intro/directions"
        moreLabel={t(locale, "more.detail")}
      >
        <DirectionsPageBody
          items={directionItems}
          cmsSlug="directions"
          cmsTextStyles={directions.textStyles}
        />
      </MenuHubSection>
    </div>
  );
}
