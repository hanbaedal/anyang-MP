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
        {notices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t(locale, "notices.empty", { phone: SITE.phone })}
          </p>
        ) : (
          <ul className="space-y-3">
            {notices.map((notice) => (
              <li key={notice.slug} className="rounded-xl border bg-card p-4">
                <Link href={`/support/notices/${notice.slug}`} className="block space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="min-w-0 text-sm font-medium">
                      {notice.pinned ? (
                        <span className="mr-2 text-xs font-normal text-ring">{t(locale, "pinned")}</span>
                      ) : null}
                      {notice.title}
                    </p>
                    <time
                      className="shrink-0 text-xs text-muted-foreground"
                      dateTime={notice.publishedAt}
                    >
                      {formatDate(notice.publishedAt, locale)}
                    </time>
                  </div>
                  <p className="line-clamp-4 text-sm whitespace-pre-wrap text-muted-foreground">
                    {notice.body}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
