import { PageHero, Prose } from "@/components/page-hero";
import { ConfirmNote } from "@/components/confirm-note";
import { BANK } from "@/lib/facts";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";

export async function generateMetadata() {
  const locale = await readLocale();
  return { title: t(locale, "pay.title") };
}

export default async function PayPage() {
  const locale = await readLocale();
  return (
    <>
      <PageHero kicker={t(locale, "pay.kicker")} title={t(locale, "pay.title")} lead={t(locale, "pay.lead")} />
      <div className="site-container py-12">
        <div className="mx-auto max-w-3xl space-y-6">
        <ConfirmNote>{BANK.note}</ConfirmNote>
        <div className="rounded-xl border bg-card p-5 text-sm">
          <p>
            {t(locale, "pay.bank")}: {t(locale, "unconfirmed")}
          </p>
          <p className="mt-1">
            {t(locale, "pay.account")}: {t(locale, "unconfirmed")}
          </p>
          <p className="mt-1">
            {t(locale, "pay.holder")}: {BANK.holder}
          </p>
        </div>
        <Prose>
          <p>{t(locale, "pay.card")}</p>
          <p>
            {t(locale, "pay.callBefore", { phone: SITE.phone })
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
        <Button asChild>
          <a href={SITE.phoneTel}>{t(locale, "pay.cta")}</a>
        </Button>
        </div>
      </div>
    </>
  );
}
