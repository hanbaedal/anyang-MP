import type { FuneralDocsKo, FuneralDocsKoField } from "@/lib/cms-types";
import type { FuneralDocId } from "@/lib/funeral-docs-types";
import { type Locale, t } from "@/lib/i18n";

export const FUNERAL_DOCS_KO_FIELDS = [
  "burialTitle",
  "cremationTitle",
  "hint",
  "death",
  "family",
  "idLine",
  "police",
  "cremation",
] as const satisfies readonly FuneralDocsKoField[];

export const FUNERAL_DOCS_I18N: Record<FuneralDocsKoField, string> = {
  burialTitle: "fun.burialDocs",
  cremationTitle: "fun.cremationDocs",
  hint: "fun.docsPublicHint",
  death: "fun.docDeath",
  family: "fun.docFamily",
  idLine: "fun.docId",
  police: "fun.docPolice",
  cremation: "fun.docCremation",
};

export const FUNERAL_DOCS_SLOT_LABELS: Record<FuneralDocsKoField, string> = {
  burialTitle: "매장 시 서류 제목",
  cremationTitle: "화장 시 서류 제목",
  hint: "서류 안내 문구",
  death: "사망진단서 문구",
  family: "가족관계증명서 문구",
  idLine: "연고자 신분증 문구",
  police: "검사지휘서 문구",
  cremation: "화장증명서 문구",
};

export function pageSlotFuneralDocsField(slug: string, field: FuneralDocsKoField) {
  return `page.${slug}.docs.${field}`;
}

export function pageSlotFuneralDocPdf(docId: FuneralDocId) {
  return `page.funeral.docs.pdf.${docId}`;
}

export function resolveFuneralDocsDisplay(locale: Locale, ko?: FuneralDocsKo) {
  const out = {} as Record<FuneralDocsKoField, string>;
  for (const field of FUNERAL_DOCS_KO_FIELDS) {
    const custom = ko?.[field]?.trim();
    out[field] = locale === "ko" && custom ? custom : t(locale, FUNERAL_DOCS_I18N[field]);
  }
  return out;
}

export function normalizeFuneralDocsKo(raw?: FuneralDocsKo | null): FuneralDocsKo | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const next: FuneralDocsKo = {};
  let any = false;
  for (const field of FUNERAL_DOCS_KO_FIELDS) {
    const v = raw[field];
    if (v != null && String(v).trim()) {
      next[field] = String(v).trim();
      any = true;
    }
  }
  return any ? next : undefined;
}