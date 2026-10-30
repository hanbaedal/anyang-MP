import Image from "next/image";
import { PageHero, Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { uploadOriginalUrl } from "@/lib/media";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "greeting.title") };
}

export default async function GreetingPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("greeting", locale);
  const bodyImage = cms.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? uploadOriginalUrl(bodyImage) : "";

  return (
    <>
      <PageHero
        kicker={t(locale, "greeting.kicker")}
        title={cms.title || t(locale, "greeting.title")}
        lead={cms.lead || t(locale, "greeting.lead")}
        image={{ src: "/images/hero.jpg", alt: t(locale, "greeting.title") }}
      />
      <article className="mx-auto max-w-6xl px-4 py-12">
        <PastelBox>
          <div className={imageSrc ? "grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]" : undefined}>
            {imageSrc ? (
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg bg-black/5 md:mx-0 md:max-w-none">
                <Image
                  src={imageSrc}
                  alt={cms.title || t(locale, "greeting.title")}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 90vw, 22rem"
                  unoptimized
                />
              </div>
            ) : null}
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              {cms.body ? (
                <Paragraphs text={cms.body} />
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
      </article>
    </>
  );
}
