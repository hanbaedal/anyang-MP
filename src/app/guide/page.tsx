import { FeaturesPhotoGrid } from "@/components/features-photo-grid";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { MenuHubSection } from "@/components/menu-hub-section";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { PastelBox } from "@/components/pastel-box";
import { SaleSteps } from "@/components/sale-steps";
import { getCmsPageLocalized } from "@/lib/cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { FEATURES, SITE, pastelCardClass } from "@/lib/site";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const SERVICE_FALLBACK = [
  { title: "svc.reloc.title", bodies: ["svc.reloc.p1", "svc.reloc.p2"] },
  { title: "svc.stone.title", bodies: ["svc.stone.p1"] },
  { title: "svc.turf.title", bodies: ["svc.turf.p1"] },
  { title: "svc.weed.title", bodies: ["svc.weed.p1"] },
  { title: "svc.design.title", bodies: ["svc.design.p1"] },
] as const;

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.guide") };
}

export default async function GuideHubPage() {
  const locale = await readLocale();
  const [procedure, fees, services, funeral, docs] = await Promise.all([
    getCmsPageLocalized("procedure", locale),
    getCmsPageLocalized("fees", locale),
    getCmsPageLocalized("services", locale),
    getCmsPageLocalized("funeral", locale),
    funeralDocsById(),
  ]);

  const steps = (procedure.items ?? []).map((item, index) => ({
    n: String(index + 1),
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));
  /** AMP-81: 5번 옆 칸 — CMS body 끝 2블록 · 기본 계좌·2일 전 */
  const procedureNoteParts = procedure.body?.trim()
    ? procedure.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .slice(-2)
    : [t(locale, "proc.account"), t(locale, "proc.twoDays")];
  const procedureNoteAside = (
    <PastelBox className="pc-procedure-note flex h-full min-h-0 flex-col justify-center gap-3 overflow-auto p-4 md:p-5">
      {procedureNoteParts.map((block) => (
        <Prose
          key={block.slice(0, 48)}
          className="max-w-none space-y-3 text-[15px] leading-7 text-[color:var(--pastel-chrome-fg)] md:space-y-[0.65em] md:text-[length:inherit] md:leading-[inherit]"
        >
          <Paragraphs text={block} />
        </Prose>
      ))}
    </PastelBox>
  );

  const feeCardFallback = [
    { titleKey: "fees.c1.title", bodyKey: "fees.p1" },
    { titleKey: "fees.c2.title", bodyKey: "fees.p2" },
    { titleKey: "fees.c3.title", bodyKey: "fees.p3" },
    { titleKey: "fees.c4.title", bodyKey: "fees.p4" },
  ] as const;
  const feeCards = (fees.items?.length
    ? fees.items
    : feeCardFallback.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: t(locale, row.bodyKey),
        image: "",
      }))
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  const serviceCards = (services.items?.length
    ? services.items
    : SERVICE_FALLBACK.map((service) => ({
        id: service.title,
        title: t(locale, service.title),
        text: service.bodies.map((key) => t(locale, key)).join("\n"),
        image: "",
      }))
  ).map((item, index) => ({
    ...item,
    image: item.image?.trim() || FEATURES[index % FEATURES.length]?.image,
  }));

  const funeralSteps = funeral.items?.length
    ? funeral.items
    : [
        { id: "1", title: t(locale, "fun.s1t"), text: t(locale, "fun.s1d", { phone: SITE.phone }) },
        { id: "2", title: t(locale, "fun.s2t"), text: t(locale, "fun.s2d") },
        { id: "3", title: t(locale, "fun.s3t"), text: t(locale, "fun.s3d") },
        { id: "4", title: t(locale, "fun.s4t"), text: t(locale, "fun.s4d") },
      ];

  return (
    <div className="pc-soft-card-fill mx-auto space-y-16 px-4 py-12">
      <h1 className="sr-only">{t(locale, "nav.guide")}</h1>
        <MenuHubSection
          id="procedure"
          title={procedure.title || t(locale, "proc.title")}
          href="/guide/procedure"
          moreLabel={t(locale, "more.detail")}
        >
          <SaleSteps steps={steps.length ? steps : undefined} aside={procedureNoteAside} />
        </MenuHubSection>

        <MenuHubSection
          id="fees"
          title={fees.title || t(locale, "fees.title")}
          href="/guide/fees"
          moreLabel={t(locale, "more.detail")}
        >
          <FeaturesPhotoGrid items={feeCards} />
        </MenuHubSection>

        <MenuHubSection
          id="services"
          title={services.title || t(locale, "svc.title")}
          href="/guide/services"
          moreLabel={t(locale, "more.detail")}
        >
          <FeaturesPhotoGrid items={serviceCards} />
        </MenuHubSection>

        <MenuHubSection
          id="funeral"
          title={funeral.title || t(locale, "fun.title")}
          href="/guide/funeral"
          moreLabel={t(locale, "more.detail")}
        >
          <div className="space-y-10">
            <ul className="grid gap-4 md:grid-cols-4">
              {funeralSteps.map((step, index) => (
                <li key={step.id || step.title} className={cn("rounded-xl border p-4 shadow-sm", pastelCardClass(index))}>
                  <h3 className="text-lg">{step.title}</h3>
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
              {funeral.body?.trim() ? <Paragraphs text={funeral.body} /> : <p className="break-keep">{t(locale, "fun.more")}</p>}
              <p>
                <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
                  {SITE.phone}
                </a>
              </p>
            </Prose>
          </div>
        </MenuHubSection>
    </div>
  );
}
