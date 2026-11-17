import Link from "next/link";
import { PageHero, Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { listPublicFaqLocalized } from "@/lib/faq";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "faq.title") };
}

export default async function FaqPage() {
  const locale = await readLocale();
  const items = await listPublicFaqLocalized(locale);
  return (
    <>
      <PageHero kicker={t(locale, "faq.kicker")} title={t(locale, "faq.title")} lead={t(locale, "faq.lead")} />
      <div className="site-container space-y-8 py-12">
        {items.length === 0 ? (
          <p className="text-muted-foreground">{t(locale, "faq.empty")}</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id} className="rounded-xl border bg-card p-5">
                <p className="font-medium">{item.question}</p>
                <div className="mt-2 space-y-2 text-sm leading-7 text-muted-foreground">
                  <Paragraphs text={item.answer || t(locale, "faq.pending")} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Prose>
          <p>{t(locale, "faq.askClosed")}</p>
          <p>
            <Link href="/support/inquiry" className="text-primary underline-offset-4 hover:underline">
              {t(locale, "nav.inquiry")}
            </Link>
          </p>
        </Prose>
      </div>
    </>
  );
}
