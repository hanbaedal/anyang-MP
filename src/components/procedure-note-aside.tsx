import { CmsBodyMark } from "@/components/cms-body-mark";
import { Prose } from "@/components/page-hero";
import { t, type Locale } from "@/lib/i18n";
import type { PageCmsTextStyles } from "@/lib/page-cms-text-style";

const ASIDE_PROSE =
  "max-w-none space-y-3 text-center text-[15px] leading-7 text-[color:var(--pastel-chrome-fg)] md:space-y-[0.65em] md:text-[length:inherit] md:leading-[inherit]";

/** AMP-148: 분양절차 하단 안내 — CmsBodyMark + page.procedure.body textStyles */
export function ProcedureNoteAside({
  locale,
  body,
  textStyles,
  cmsEdit = false,
}: {
  locale: Locale;
  body?: string;
  textStyles?: PageCmsTextStyles;
  cmsEdit?: boolean;
}) {
  const trimmed = body?.trim() ?? "";
  return (
    <div className="pc-procedure-note procedure-orbs-aside-text w-full">
      <Prose className={ASIDE_PROSE}>
        {trimmed ? (
          <CmsBodyMark
            cmsSlug="procedure"
            locale={locale}
            textStyles={textStyles}
            cmsEditMarkers={cmsEdit}
            text={trimmed}
          />
        ) : (
          <CmsBodyMark cmsSlug="procedure" locale={locale} textStyles={textStyles} cmsEditMarkers={cmsEdit}>
            <>
              <p>{t(locale, "proc.account")}</p>
              <p>{t(locale, "proc.twoDays")}</p>
            </>
          </CmsBodyMark>
        )}
      </Prose>
    </div>
  );
}
