import Link from "next/link";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { MenuHubSection } from "@/components/menu-hub-section";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { PastelBox } from "@/components/pastel-box";
import { SaleSteps } from "@/components/sale-steps";
import { getCmsPageLocalized } from "@/lib/cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { SITE, pastelCardClass } from "@/lib/site";
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
  }));
  const noteBoxes = procedure.body?.trim()
    ? procedure.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
        .map((block) => (
          <PastelBox key={block.slice(0, 48)}>
            <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
              <Paragraphs text={block} />
            </Prose>
          </PastelBox>
        ))
    : [
        <PastelBox key="consult">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>
              {t(locale, "proc.consult")}{" "}
              <Link href="/support/inquiry" className="underline-offset-4 hover:underline">
                {t(locale, "proc.form")}
              </Link>
              {t(locale, "proc.consultEnd")}
            </p>
          </Prose>
        </PastelBox>,
        <PastelBox key="account">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.account")}</p>
          </Prose>
        </PastelBox>,
        <PastelBox key="use-date">
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <p>{t(locale, "proc.twoDays")}</p>
          </Prose>
        </PastelBox>,
      ];

  const feeSections = fees.body?.trim()
    ? fees.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [t(locale, "fees.p1"), t(locale, "fees.p2"), t(locale, "fees.p3"), t(locale, "fees.p4")];

  const serviceItems = services.items?.length
    ? services.items.map((item) => ({ id: item.id, title: item.title, text: item.text || "" }))
    : SERVICE_FALLBACK.map((service) => ({
        id: service.title,
        title: t(locale, service.title),
        text: service.bodies.map((key) => t(locale, key)).join("\n"),
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
    <>
      <PageHero
        kicker={t(locale, "nav.guide")}
        title={t(locale, "nav.guide")}
        lead={t(locale, "hub.guide.lead")}
        image={{ src: "/images/lawn.jpg", alt: t(locale, "nav.guide") }}
      />
      <div className="mx-auto max-w-6xl space-y-16 px-4 py-12">
        <MenuHubSection
          id="procedure"
          title={procedure.title || t(locale, "proc.title")}
          href="/guide/procedure"
          moreLabel={t(locale, "more.detail")}
        >
          <div className="space-y-10">
            <SaleSteps steps={steps.length ? steps : undefined} />
            <div className="grid gap-4 sm:grid-cols-2">{noteBoxes}</div>
          </div>
        </MenuHubSection>

        <MenuHubSection
          id="fees"
          title={fees.title || t(locale, "fees.title")}
          href="/guide/fees"
          moreLabel={t(locale, "more.detail")}
        >
          <div className="grid gap-4 md:grid-cols-2">
            {feeSections.map((section) => (
              <PastelBox key={section.slice(0, 48)}>
                <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
                  <Paragraphs text={section} />
                </Prose>
              </PastelBox>
            ))}
          </div>
        </MenuHubSection>

        <MenuHubSection
          id="services"
          title={services.title || t(locale, "svc.title")}
          href="/guide/services"
          moreLabel={t(locale, "more.detail")}
        >
          <div className="space-y-6">
            {serviceItems.map((service, index) => (
              <article
                key={service.id || service.title}
                className={cn("rounded-xl border p-6 shadow-sm", pastelCardClass(index))}
              >
                <h3 className="text-xl">{service.title}</h3>
                {service.text ? (
                  <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">
                    <Paragraphs text={service.text} />
                  </div>
                ) : null}
              </article>
            ))}
          </div>
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
    </>
  );
}
