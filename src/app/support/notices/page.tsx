import Link from "next/link";
import { PageHero } from "@/components/page-hero";
import { listNoticesLocalized } from "@/lib/notices";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "notices.title") };
}

function formatDate(value: string, locale: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const tag = locale === "zh" ? "zh-CN" : locale;
  return new Intl.DateTimeFormat(tag, { dateStyle: "medium" }).format(date);
}

export default async function NoticesPage() {
  const locale = await readLocale();
  const notices = await listNoticesLocalized(locale);

  return (
    <>
      <PageHero kicker={t(locale, "notices.kicker")} title={t(locale, "notices.title")} />
      <div className="mx-auto max-w-6xl px-4 py-10 md:py-12">
        <p className="mb-6 text-base text-muted-foreground md:mb-8 md:text-lg">
          {t(locale, "notices.consult", { phone: SITE.phone })}{" "}
          <Link href="/support/inquiry" className="font-medium text-primary underline-offset-4 hover:underline">
            {t(locale, "nav.inquiry")}
          </Link>
        </p>
        {notices.length === 0 ? (
          <p className="text-base text-muted-foreground md:text-lg">
            {t(locale, "notices.empty", { phone: SITE.phone })}
          </p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {notices.map((notice) => (
              <li key={notice.slug}>
                <Link
                  href={`/support/notices/${notice.slug}`}
                  className="flex flex-col gap-2 px-5 py-5 hover:bg-accent sm:px-6 sm:py-6 md:flex-row md:items-center md:justify-between md:gap-4 md:px-8 md:py-7"
                >
                  <span className="text-base font-medium leading-snug text-primary md:text-lg md:leading-relaxed">
                    {notice.pinned ? (
                      <span className="mr-2 text-sm text-ring md:text-base">{t(locale, "pinned")}</span>
                    ) : null}
                    {notice.title}
                  </span>
                  <time
                    className="shrink-0 text-sm text-muted-foreground md:text-base"
                    dateTime={notice.publishedAt}
                  >
                    {formatDate(notice.publishedAt, locale)}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
