import { NoticesList } from "@/components/notices-list";
import { listNoticesLocalized } from "@/lib/notices";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "notices.title") };
}

export default async function NoticesPage() {
  const locale = await readLocale();
  const notices = await listNoticesLocalized(locale);

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="sr-only">{t(locale, "notices.title")}</h1>
      <NoticesList items={notices} empty={t(locale, "notices.empty", { phone: SITE.phone })} />
    </div>
  );
}
