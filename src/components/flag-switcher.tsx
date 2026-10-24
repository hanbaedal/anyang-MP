"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { FLAGS, type Locale, LOCALE_LABEL } from "@/lib/i18n";
import { useLocale, useT } from "@/components/locale-provider";

const FLAG_SRC: Record<"KR" | "US" | "CN", string> = {
  KR: "/flags/kr.svg",
  US: "/flags/us.svg",
  CN: "/flags/cn.svg",
};

function FlagImage({ code }: { code: "KR" | "US" | "CN" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 국기 자산(PC·모바일 동일)
    <img
      src={FLAG_SRC[code]}
      alt=""
      width={24}
      height={16}
      className="h-3 w-[1.125rem] rounded-[2px] object-cover ring-1 ring-black/10 lg:h-4 lg:w-6"
      aria-hidden
      draggable={false}
    />
  );
}

export function FlagSwitcher() {
  const current = useLocale();
  const t = useT();
  const [pending, start] = useTransition();

  function choose(locale: Locale) {
    start(async () => {
      await fetch("/api/locale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ locale }),
      });
      window.location.reload();
    });
  }

  return (
    <div className="flex items-center gap-0" role="group" aria-label={t("lang")} aria-busy={pending}>
      {FLAGS.map(({ locale, code }) => {
        const selected = current === locale;
        return (
          <button
            key={locale}
            type="button"
            disabled={pending}
            onClick={() => choose(locale)}
            aria-label={LOCALE_LABEL[locale]}
            aria-pressed={selected}
            title={LOCALE_LABEL[locale]}
            className={cn(
              "inline-flex size-6 items-center justify-center rounded-md hover:bg-accent lg:size-9",
              selected && "ring-2 ring-primary lg:ring-offset-1",
            )}
          >
            <FlagImage code={code} />
            <span className="sr-only">{LOCALE_LABEL[locale]}</span>
          </button>
        );
      })}
    </div>
  );
}
