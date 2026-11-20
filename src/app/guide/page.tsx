import { CmsBodyMark } from "@/components/cms-body-mark";
import { FuneralDocList } from "@/components/funeral-doc-list";
import { NoticesList } from "@/components/notices-list";
import { MenuHubSection } from "@/components/menu-hub-section";
import { Prose } from "@/components/page-hero";
import { ProcedureNoteAside } from "@/components/procedure-note-aside";
import { SaleSteps } from "@/components/sale-steps";
import { FeesOrbitDiagram } from "@/components/fees-orbit-diagram";
import { FuneralAttachedOrbit } from "@/components/funeral-attached-orbit";
import { ServicesAttachedCards } from "@/components/services-attached-cards";
import { getCmsPageLocalized } from "@/lib/cms";
import { resolveFuneralDocsDisplay } from "@/lib/funeral-docs-cms";
import { funeralDocsById } from "@/lib/funeral-docs";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { listNoticesLocalized } from "@/lib/notices";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

const SERVICE_FALLBACK = [
  { titleKey: "svc.reloc.title", bodyKeys: ["svc.reloc.p1", "svc.reloc.p2"] },
  { titleKey: "svc.stone.title", bodyKeys: ["svc.stone.p1"] },
  { titleKey: "svc.turf.title", bodyKeys: ["svc.turf.p1"] },
  { titleKey: "svc.weed.title", bodyKeys: ["svc.weed.p1"] },
  { titleKey: "svc.design.title", bodyKeys: ["svc.design.p1"] },
] as const;

const FEE_FALLBACK = [
  { titleKey: "fees.c1.title", bodyKey: "fees.p1" },
  { titleKey: "fees.c2.title", bodyKey: "fees.p2" },
  { titleKey: "fees.c3.title", bodyKey: "fees.p3" },
  { titleKey: "fees.c4.title", bodyKey: "fees.p4" },
] as const;

const FUNERAL_FALLBACK = [
  { id: "1", titleKey: "fun.s1t", bodyKey: "fun.s1d" },
  { id: "2", titleKey: "fun.s2t", bodyKey: "fun.s2d" },
  { id: "3", titleKey: "fun.s3t", bodyKey: "fun.s3d" },
  { id: "4", titleKey: "fun.s4t", bodyKey: "fun.s4d" },
] as const;

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "nav.guide") };
}

export default async function GuideHubPage() {
  const locale = await readLocale();
  const [procedure, fees, services, funeral, docs, notices] = await Promise.all([
    getCmsPageLocalized("procedure", locale),
    getCmsPageLocalized("fees", locale),
    getCmsPageLocalized("services", locale),
    getCmsPageLocalized("funeral", locale),
    funeralDocsById(),
    listNoticesLocalized(locale),
  ]);

  const steps = (procedure.items ?? []).map((item, index) => ({
    n: String(index + 1),
    id: item.id,
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));
  const feeOrbitItems = (fees.items?.length
    ? fees.items
    : FEE_FALLBACK.map((row) => ({
        id: row.titleKey,
        title: t(locale, row.titleKey),
        text: t(locale, row.bodyKey),
        image: "",
      }))
  )
    .slice(0, 4)
    .map((item) => ({
      id: item.id || item.title,
      title: item.title,
      text: item.text ?? "",
    }));

  const serviceCards = (services.items?.length
    ? services.items
    : SERVICE_FALLBACK.map((service) => ({
        id: service.titleKey,
        title: t(locale, service.titleKey),
        text: service.bodyKeys.map((key) => t(locale, key)).join("\n\n"),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    image: item.image?.trim() || undefined,
  }));

  const docLabels = resolveFuneralDocsDisplay(locale, funeral.funeralDocs);

  const funeralCards = (funeral.items?.length
    ? funeral.items
    : FUNERAL_FALLBACK.map((row) => ({
        id: row.id,
        title: t(locale, row.titleKey),
        text:
          row.bodyKey === "fun.s1d"
            ? t(locale, row.bodyKey, { phone: SITE.phone })
            : t(locale, row.bodyKey),
        image: "",
      }))
  ).map((item) => ({
    ...item,
    id: item.id || item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));

  return (
    <div className="site-container pc-soft-card-fill space-y-16 py-12">
      <h1 className="sr-only">{t(locale, "nav.guide")}</h1>
      <MenuHubSection
        id="procedure"
        title={procedure.title || t(locale, "proc.title")}
        href="/guide/procedure"
        moreLabel={t(locale, "more.detail")}
      >
        <SaleSteps
          variant="orbs"
          steps={steps.length ? steps : undefined}
          aside={
            <ProcedureNoteAside locale={locale} body={procedure.body} textStyles={procedure.textStyles} />
          }
          cmsSlug="procedure"
          cmsTextStyles={procedure.textStyles}
        />
      </MenuHubSection>

      <MenuHubSection
        id="fees"
        title={fees.title || t(locale, "fees.title")}
        href="/guide/fees"
        moreLabel={t(locale, "more.detail")}
      >
        <FeesOrbitDiagram
          hubTitle={fees.title || t(locale, "fees.title")}
          items={feeOrbitItems}
          cmsTextStyles={fees.textStyles}
        />
      </MenuHubSection>

      <MenuHubSection
        id="services"
        title={services.title || t(locale, "svc.title")}
        href="/guide/services"
        moreLabel={t(locale, "more.detail")}
      >
        <ServicesAttachedCards
          items={serviceCards}
          cmsSlug="services"
          locale={locale}
          cmsTextStyles={services.textStyles}
        />
      </MenuHubSection>

      <MenuHubSection
        id="funeral"
        title={funeral.title || t(locale, "fun.title")}
        href="/guide/funeral"
        moreLabel={t(locale, "more.detail")}
      >
        <div className="space-y-10">
          <FuneralAttachedOrbit
            hubTitle={SITE.shortName}
            items={funeralCards.slice(0, 4).map((item) => ({
              id: item.id || item.title,
              title: item.title,
              text: item.text,
            }))}
            cmsTextStyles={funeral.textStyles}
          />
          <FuneralDocList locale={locale} docs={docs} labels={docLabels} />
          <Prose>
            {funeral.body?.trim() ? (
              <CmsBodyMark
                cmsSlug="funeral"
                locale={locale}
                textStyles={funeral.textStyles}
                text={funeral.body}
              />
            ) : (
              <CmsBodyMark cmsSlug="funeral" locale={locale} textStyles={funeral.textStyles}>
                <p className="break-keep">{t(locale, "fun.more")}</p>
              </CmsBodyMark>
            )}
            <p>
              <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
                {SITE.phone}
              </a>
            </p>
          </Prose>
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
    </div>
  );
}
