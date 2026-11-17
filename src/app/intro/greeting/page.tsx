import Image from "next/image";
import { PageCmsEditBridge } from "@/components/cms-edit/page-cms-edit-bridge";
import { CmsBodyMark } from "@/components/cms-body-mark";
import { CmsManagedPageHero } from "@/components/cms-managed-page-hero";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { loadCmsPageForView } from "@/lib/cms-page-view";
import { readCmsEditEnabled } from "@/lib/cms-edit-server";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { pageSlotBodyImage } from "@/lib/page-cms-slots";
import { uploadOriginalUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

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
  const { cms, displayLocale } = await loadCmsPageForView("greeting", locale, cmsEdit);
  const bodyImage = cms.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? uploadOriginalUrl(bodyImage) : "";

  return (
    <>
      <CmsManagedPageHero locale={displayLocale} cms={cms} cmsEdit={cmsEdit} />
      <article className="site-container py-8 md:py-10">
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
                <CmsBodyMark
                  cmsSlug="greeting"
                  locale={displayLocale}
                  textStyles={cms.textStyles}
                  cmsEditMarkers={cmsEdit}
                  text={cms.body}
                />
              ) : (
                <CmsBodyMark cmsSlug="greeting" locale={displayLocale} textStyles={cms.textStyles} cmsEditMarkers={cmsEdit}>
                  <>
                    <p>{t(displayLocale, "greeting.p1")}</p>
                    <p>{t(displayLocale, "greeting.p2")}</p>
                    <p>{t(displayLocale, "greeting.p3")}</p>
                    <p>{t(displayLocale, "greeting.thanks")}</p>
                    <p className="font-medium">{t(displayLocale, "greeting.sign")}</p>
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