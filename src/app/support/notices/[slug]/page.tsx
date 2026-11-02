import { notFound } from "next/navigation";
import Link from "next/link";
import { Prose } from "@/components/page-hero";
import { Paragraphs } from "@/components/paragraphs";
import { getNoticeLocalized } from "@/lib/notices";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await readLocale();
  const notice = await getNoticeLocalized(slug, locale);
  return { title: notice?.title ?? t(locale, "notices.title") };
}

export default async function NoticeDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const locale = await readLocale();
  const notice = await getNoticeLocalized(slug, locale);
  if (!notice) notFound();

  return (
    <article className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="font-serif text-2xl text-foreground md:text-3xl">{notice.title}</h1>
      <Prose className="mt-6">
        <Paragraphs text={notice.body} />
      </Prose>
      <p className="mt-8 text-sm">
        <Link href="/support/notices" className="text-primary underline-offset-4 hover:underline">
          {t(locale, "listBack")}
        </Link>
      </p>
    </article>
  );
}
