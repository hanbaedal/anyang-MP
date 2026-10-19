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
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="mb-6 text-sm text-muted-foreground">
          {t(locale, "notices.consult", { phone: SITE.phone })}{" "}
          <Link href="/support/inquiry" className="font-medium text-primary underline-offset-4 hover:underline">
            {t(locale, "nav.inquiry")}
          </Link>
        </p>
        {notices.length === 0 ? (
          <p className="text-muted-foreground">{t(locale, "notices.empty", { phone: SITE.phone })}</p>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {notices.map((notice) => (
              <li key={notice.slug}>
                <Link href={`/support/notices/${notice.slug}`} className="flex flex-col gap-1 px-4 py-4 hover:bg-accent md:flex-row md:items-center md:justify-between">
                  <span className="font-medium text-primary">
                    {notice.pinned ? <span className="mr-2 text-xs text-ring">{t(locale, "pinned")}</span> : null}
                    {notice.title}
                  </span>
                  <time className="text-sm text-muted-foreground" dateTime={notice.publishedAt}>
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
