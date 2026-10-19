import { InquiryBoard } from "@/components/inquiry-board";
import { PageHero } from "@/components/page-hero";
import { listPublicInquiries } from "@/lib/inquiries";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "inquiry.title") };
}

export default async function InquiryPage() {
  const locale = await readLocale();
  const items = await listPublicInquiries();
  return (
    <>
      <PageHero kicker={t(locale, "inquiry.kicker")} title={t(locale, "inquiry.title")} />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <InquiryBoard initial={items} locale={locale} />
      </div>
    </>
  );
}
