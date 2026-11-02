import { Paragraphs } from "@/components/paragraphs";
import { getCmsPageLocalized } from "@/lib/cms";
import { pastelCardClass } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

const SERVICE_FALLBACK = [
  { title: "svc.reloc.title", bodies: ["svc.reloc.p1", "svc.reloc.p2"] },
  { title: "svc.stone.title", bodies: ["svc.stone.p1"] },
  { title: "svc.turf.title", bodies: ["svc.turf.p1"] },
  { title: "svc.weed.title", bodies: ["svc.weed.p1"] },
  { title: "svc.design.title", bodies: ["svc.design.p1"] },
] as const;

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "svc.title") };
}

export default async function ServicesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("services", locale);
  const items = cms.items?.length
    ? cms.items.map((item) => ({
        id: item.id,
        title: item.title,
        text: item.text || "",
      }))
    : SERVICE_FALLBACK.map((service) => ({
        id: service.title,
        title: t(locale, service.title),
        text: service.bodies.map((key) => t(locale, key)).join("\n"),
      }));

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-12">
      <h1 className="sr-only">{cms.title || t(locale, "svc.title")}</h1>
      {items.map((service, index) => (
        <article key={service.id || service.title} className={cn("rounded-xl border p-6 shadow-sm", pastelCardClass(index))}>
          <h2 className="text-xl">{service.title}</h2>
          {service.text ? (
            <div className="mt-3 space-y-3 text-[15px] leading-7 text-muted-foreground">
              <Paragraphs text={service.text} />
            </div>
          ) : null}
        </article>
      ))}
    </div>
  );
}
