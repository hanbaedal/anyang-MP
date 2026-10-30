import Image from "next/image";
import { DirectionsMap } from "@/components/directions-map";
import { MenuHubSection } from "@/components/menu-hub-section";
import { NoticesList } from "@/components/notices-list";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { PastelBox } from "@/components/pastel-box";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { isUploadMediaPath, mediaUrl, thumbUrl } from "@/lib/media";
import { listNoticesLocalized } from "@/lib/notices";
import { FEATURES, SITE, pastelCardClass } from "@/lib/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.intro") };
}

export default async function IntroHubPage() {
  const locale = await readLocale();
  const [greeting, featuresCms, notices] = await Promise.all([
    getCmsPageLocalized("greeting", locale),
    getCmsPageLocalized("features", locale),
    listNoticesLocalized(locale),
  ]);
  const bodyImage = greeting.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? (isUploadMediaPath(bodyImage) ? thumbUrl(bodyImage) : mediaUrl(bodyImage)) : "";
  const featureItems = featuresCms.items?.length
    ? featuresCms.items
    : FEATURES.map((feature) => ({
        id: feature.titleKey,
        title: t(locale, feature.titleKey),
        text: t(locale, feature.bodyKey),
      }));

  return (
    <>
      <PageHero
        kicker={t(locale, "nav.intro")}
        title={t(locale, "nav.intro")}
        lead={t(locale, "hub.intro.lead")}
        image={{ src: "/images/park-overview.jpg", alt: t(locale, "nav.intro") }}
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
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
                    className="object-cover"
                    sizes="(max-width: 768px) 90vw, 22rem"
                    unoptimized={isUploadMediaPath(bodyImage)}
                  />
                </div>
              ) : null}
              <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
                {greeting.body ? (
                  <Paragraphs text={greeting.body} />
                ) : (
                  <>
                    <p>{t(locale, "greeting.p1")}</p>
                    <p>{t(locale, "greeting.p2")}</p>
                    <p>{t(locale, "greeting.p3")}</p>
                    <p>{t(locale, "greeting.thanks")}</p>
                    <p className="font-medium">{t(locale, "greeting.sign")}</p>
                  </>
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
          <div className="grid gap-5 md:grid-cols-2">
            {featureItems.map((item, index) => (
              <article
                key={item.id || item.title}
                className={cn("rounded-xl border p-6 shadow-sm", pastelCardClass(index))}
              >
                <h3 className="text-xl">{item.title}</h3>
                {item.text ? (
                  <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">
                    <Paragraphs text={item.text} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </MenuHubSection>

        <MenuHubSection
          id="notices"
          title={t(locale, "notices.title")}
          href="/support/notices"
          moreLabel={t(locale, "more.detail")}
        >
          <NoticesList items={notices} empty={t(locale, "notices.empty", { phone: SITE.phone })} />
        </MenuHubSection>

        <MenuHubSection
          id="directions"
          title={t(locale, "dir.title")}
          href="/intro/directions"
          moreLabel={t(locale, "more.detail")}
        >
          <p className="mb-4 text-sm text-muted-foreground">{SITE.address}</p>
          <DirectionsMap />
        </MenuHubSection>
      </div>
    </>
  );
}
