import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { PRICES, REMAINING, UNCONFIRMED } from "@/lib/facts";
import { getCmsPageLocalized } from "@/lib/cms";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "prices.title") };
}

function displayWon(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

export default async function PricesPage() {
  const locale = await readLocale();
  const cms = await getCmsPageLocalized("prices", locale);
  const unconfirmed = t(locale, "unconfirmed");
  const priceRows = cms.items?.filter((item) => item.won !== undefined) ?? [];
  const remainRows = cms.items?.filter((item) => item.remaining !== undefined) ?? [];
  const prices = priceRows.length
    ? priceRows.map((row) => ({ name: row.title, won: displayWon(row.won, unconfirmed) }))
    : PRICES.map((row) => ({ name: t(locale, row.nameKey), won: row.won === UNCONFIRMED ? unconfirmed : row.won }));
  const remaining = remainRows.length
    ? remainRows.map((row) => ({ name: row.title, seats: displayWon(row.remaining, unconfirmed) }))
    : REMAINING.map((row) => ({ name: t(locale, row.nameKey), seats: row.seats === UNCONFIRMED ? unconfirmed : row.seats }));

  return (
    <>
      <PageHero
        kicker={t(locale, "prices.kicker")}
        title={cms.title || t(locale, "prices.title")}
        lead={cms.lead || t(locale, "prices.lead")}
      />
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-12">
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">{t(locale, "prices.product")}</th>
                <th className="px-4 py-3">{t(locale, "prices.won")}</th>
              </tr>
            </thead>
            <tbody>
              {prices.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-medium text-amber-800">{row.won}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left">
              <tr>
                <th className="px-4 py-3">{t(locale, "prices.kind")}</th>
                <th className="px-4 py-3">{t(locale, "prices.remaining")}</th>
              </tr>
            </thead>
            <tbody>
              {remaining.map((row) => (
                <tr key={row.name} className="border-t">
                  <td className="px-4 py-3">{row.name}</td>
                  <td className="px-4 py-3 font-medium text-amber-800">{row.seats}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Prose>{cms.body ? <Paragraphs text={cms.body} /> : <p>{t(locale, "prices.deposit")}</p>}</Prose>
        <Button asChild>
          <Link href="/support/inquiry">{t(locale, "prices.ask")}</Link>
        </Button>
      </div>
    </>
  );
}
