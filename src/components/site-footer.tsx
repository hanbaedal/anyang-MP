import { SocialActions } from "@/components/hero-actions";
import { SITE } from "@/lib/site";
import { isGuestLocalePath, t } from "@/lib/i18n";
import { readLocale } from "@/lib/i18n-server";
import { headers } from "next/headers";

export async function SiteFooter() {
  const locale = await readLocale();
  const pathname = (await headers()).get("x-pathname") ?? "/";
  const uiLocale = isGuestLocalePath(pathname) ? locale : "ko";
  const phone = (
    <a className="underline-offset-4 hover:underline" href={SITE.phoneTel}>
      {SITE.phone}
    </a>
  );
  return (
    <footer className="border-t border-primary-foreground/20 bg-primary text-xs leading-snug text-primary-foreground md:text-sm md:leading-6">
      <div className="flex items-center justify-between gap-2 px-3 py-1 sm:px-5 md:items-end md:gap-8 md:px-5 md:py-3">
        <div className="min-w-0 text-left">
          <p className="font-serif text-sm leading-tight md:text-base">{t(uiLocale, "site.legalName")}</p>
          <p className="mt-0.5 text-[11px] text-primary-foreground/85 md:hidden">{phone}</p>
          <p className="mt-1.5 hidden text-primary-foreground/85 md:block">{t(uiLocale, "site.address")}</p>
          <p className="mt-1.5 hidden text-primary-foreground/85 md:block">{phone}</p>
        </div>
        <div className="flex shrink-0 justify-end">
          <SocialActions compact />
        </div>
      </div>
    </footer>
  );
}
