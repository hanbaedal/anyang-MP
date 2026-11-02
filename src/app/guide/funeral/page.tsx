import { FuneralDocList } from "@/components/funeral-doc-list";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { SITE, pastelCardClass } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "fun.title") };
}

export default async function FuneralPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("funeral", locale);
  const docs = await funeralDocsById();
  const steps = cms.items?.length
    ? cms.items
    : [
        { id: "1", title: t(locale, "fun.s1t"), text: t(locale, "fun.s1d", { phone: SITE.phone }) },
        { id: "2", title: t(locale, "fun.s2t"), text: t(locale, "fun.s2d") },
        { id: "3", title: t(locale, "fun.s3t"), text: t(locale, "fun.s3d") },
        { id: "4", title: t(locale, "fun.s4t"), text: t(locale, "fun.s4d") },
      ];

  return (
    <div className="mx-auto max-w-6xl space-y-10 px-4 py-12">
      <h1 className="sr-only">{cms.title || t(locale, "fun.title")}</h1>
        <ul className="grid gap-4 md:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.id || step.title} className={cn("rounded-xl border p-4 shadow-sm", pastelCardClass(index))}>
              <h2 className="text-lg">{step.title}</h2>
              {step.text ? (
                <div className="mt-2 space-y-2 text-sm text-muted-foreground">
                  <Paragraphs text={step.text} />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        <FuneralDocList locale={locale} docs={docs} />
        <Prose>
          {cms.body?.trim() ? <Paragraphs text={cms.body} /> : <p className="break-keep">{t(locale, "fun.more")}</p>}
          <p>
            <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
              {SITE.phone}
            </a>
          </p>
        </Prose>
    </div>
  );
}
