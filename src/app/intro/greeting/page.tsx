import Image from "next/image";
import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsPageHeroBand } from "@/components/cms-page-hero-band";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { getCmsPageLocalized, getCmsPageOrDefault } from "@/lib/cms";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { resolveCmsPageHero } from "@/lib/cms-page-hero";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { pageSlotBodyImage } from "@/lib/page-cms-slots";
import { uploadOriginalUrl } from "@/lib/media";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.greeting") };
}

export default async function GreetingPage({
  searchParams,
}: {
  searchParams: Promise<{ cmsEdit?: string }>;
}) {
  const locale = await readLocale();
  const cmsEdit = await readCmsEditEnabled(searchParams);
  const cms = cmsEdit
    ? await getCmsPageOrDefault("greeting")
    : await getCmsPageLocalized("greeting", locale);
  const bodyImage = cms.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? uploadOriginalUrl(bodyImage) : "";

  const hero = resolveCmsPageHero(locale, cms);

  return (
    <>
      <CmsPageHeroBand
        kicker={hero.kicker}
        title={hero.title}
        lead={hero.lead}
        heroImage={cms.heroImage}
        cmsSlug="greeting"
        cmsEditMarkers={cmsEdit}
        imageAlt={hero.title || t(locale, "nav.greeting")}
        large
      />
      <article className="mx-auto max-w-6xl px-4 py-8 md:py-10">
        <PastelBox>
          <div
            className={
              imageSrc
                ? "grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
                : undefined
            }
          >
            {imageSrc ? (
              <div
                {...(cmsEdit ? { "data-cms-key": pageSlotBodyImage("greeting") } : {})}
                className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg bg-black/5 md:mx-0 md:max-w-none"
              >
                <Image
                  src={imageSrc}
                  alt={cms.title || t(locale, "greeting.headline")}
                  fill
                  className="guest-photo-bright object-cover"
                  sizes="(max-width: 768px) 90vw, 22rem"
                  unoptimized
                />
              </div>
            ) : cmsEdit ? (
              <div
                data-cms-key={pageSlotBodyImage("greeting")}
                className="flex min-h-[12rem] items-center justify-center rounded-lg border border-dashed border-[color:var(--pastel-chrome-border)] text-sm text-muted-foreground"
              >
                본문 사진 (클릭하여 등록)
              </div>
            ) : null}
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              {cms.body ? (
                <CmsBodyMark cmsSlug="greeting" cmsEditMarkers={cmsEdit} text={cms.body} />
              ) : (
                <CmsBodyMark cmsSlug="greeting" cmsEditMarkers={cmsEdit}>
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
      </article>
      {cmsEdit ? <PageCmsEditBridge enabled /> : null}
    </>
  );
}