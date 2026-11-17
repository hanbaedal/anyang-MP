import { readSession } from "@/lib/auth";
import { SitemapSections } from "@/components/sitemap-sections";
import { buildSitemapSections } from "@/lib/sitemap-sections";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "sitemap.title") };
}

export default async function SitemapPage() {
  const locale = await readLocale();
  const session = await readSession();
  const sections = buildSitemapSections(session?.role, session?.username);

  return (
  <>
    <h1 className="sr-only">{t(locale, "sitemap.title")}</h1>
    <SitemapSections sections={sections} locale={locale} />
  </>
  );
}