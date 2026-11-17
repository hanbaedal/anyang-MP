import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import type { SitemapSection } from "@/lib/sitemap-sections";
import { cn } from "@/lib/utils";

function SitemapColumnGrid({
  columns,
  locale,
  className,
}: {
  columns: SitemapSection["columns"];
  locale: Locale;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {columns.map((col) => (
        <li
          key={col.titleI18n}
          className="flex min-w-0 flex-col overflow-hidden rounded-lg border border-border/90 bg-card shadow-sm"
        >
          {col.href ? (
            <Link
              href={col.href}
              className="block bg-primary px-3 py-2.5 text-center text-sm font-semibold tracking-tight text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t(locale, col.titleI18n)}
            </Link>
          ) : (
            <p className="bg-primary px-3 py-2.5 text-center text-sm font-semibold tracking-tight text-primary-foreground">
              {t(locale, col.titleI18n)}
            </p>
          )}
          {col.children.length ? (
            <ul className="divide-y divide-border/70 bg-[#fffcf7]">
              {col.children.map((child) => (
                <li key={child.href}>
                  <Link
                    href={child.href}
                    className="block px-4 py-2.5 text-sm text-foreground/90 transition-colors hover:bg-[#f5f0e8] hover:text-primary"
                  >
                    {t(locale, child.i18n)}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function SitemapSections({ sections, locale }: { sections: SitemapSection[]; locale: Locale }) {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-3 py-5 pb-8 sm:px-4 sm:py-6">
      {sections.map((section) => (
        <section key={section.titleI18n} aria-labelledby={`sitemap-${section.titleI18n}`}>
          <h2
            id={`sitemap-${section.titleI18n}`}
            className="mb-3 text-base font-bold text-primary sm:text-lg"
          >
            {t(locale, section.titleI18n)}
          </h2>
          {section.wrapped ? (
            <div className="overflow-hidden rounded-xl border border-border/90 bg-card shadow-sm">
              {section.innerBannerI18n ? (
                <Link
                  href={section.innerBannerHref ?? "#"}
                  className="block border-b border-primary/20 bg-primary py-2.5 text-center text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  {t(locale, section.innerBannerI18n)}
                </Link>
              ) : null}
              <SitemapColumnGrid columns={section.columns} locale={locale} className="p-3 sm:p-4" />
            </div>
          ) : (
            <SitemapColumnGrid columns={section.columns} locale={locale} />
          )}
        </section>
      ))}
    </div>
  );
}