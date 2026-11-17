import { PageHero, Prose } from "@/components/page-hero";
import { ConfirmNote } from "@/components/confirm-note";
import { KAKAO_CHANNEL } from "@/lib/facts";
import { SITE } from "@/lib/site";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "kakao.title") };
}

export default async function KakaoPage() {
  const locale = await readLocale();
  return (
    <>
      <PageHero kicker={t(locale, "kakao.kicker")} title={t(locale, "kakao.title")} lead={t(locale, "kakao.lead")} />
      <div className="site-container py-12">
        <div className="mx-auto max-w-3xl space-y-6">
        <ConfirmNote>{KAKAO_CHANNEL.note}</ConfirmNote>
        <Prose>
          <p>
            {t(locale, "kakao.url")}: {t(locale, "unconfirmed")}
          </p>
          <p>
            {t(locale, "kakao.until", { phone: SITE.phone })
              .split(SITE.phone)
              .map((part, i) =>
                i === 0 ? (
                  <span key="a">{part}</span>
                ) : (
                  <span key="b">
                    <a className="text-primary underline-offset-4 hover:underline" href={SITE.phoneTel}>
                      {SITE.phone}
                    </a>
                    {part}
                  </span>
                ),
              )}
          </p>
        </Prose>
        </div>
      </div>
    </>
  );
}
