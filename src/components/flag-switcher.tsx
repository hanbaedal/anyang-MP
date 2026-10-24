"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { FLAGS, type Locale, LOCALE_LABEL } from "@/lib/i18n";
import { useLocale, useT } from "@/components/locale-provider";

/** 헤더 언어 전환 — 보이는 UI는 국기 이미지만 (한글/영어/중문·KOR/ENG/CHN 라벨 없음) */
const FLAG_SRC: Record<"KR" | "US" | "CN", string> = {
  KR: "/flags/kr.svg",
  US: "/flags/us.svg",
  CN: "/flags/cn.svg",
};

function FlagImage({ code }: { code: "KR" | "US" | "CN" }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- 정적 SVG 국기 (PC·모바일)
    <img
      src={FLAG_SRC[code]}
      alt=""
      width={28}
      height={19}
      className="h-3.5 w-[1.35rem] rounded-[2px] object-cover ring-1 ring-black/15 lg:h-5 lg:w-[1.875rem]"
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
    <div className="flex items-center gap-0.5" role="group" aria-label={t("lang")} aria-busy={pending}>
      {FLAGS.map(({ locale, code }) => {
        const selected = current === locale;
        const name = LOCALE_LABEL[locale];
        return (
          <button
            key={locale}
            type="button"
            disabled={pending}
            onClick={() => choose(locale)}
            aria-label={name}
            aria-pressed={selected}
            title={name}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-md hover:bg-accent lg:size-9",
              selected && "ring-2 ring-primary lg:ring-offset-1",
            )}
          >
            <FlagImage code={code} />
            <span className="sr-only">{name}</span>
          </button>
        );
      })}
    </div>
  );
}
