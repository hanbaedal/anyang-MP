"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CmsFuneralDocPdfSlot } from "@/components/cms-edit/cms-funeral-doc-pdf-slot";
import { pageSlotFuneralDocsField } from "@/lib/funeral-docs-cms";
import type { FuneralDocsKoField } from "@/lib/cms-types";
import {
  FUNERAL_BURIAL_ROWS,
  FUNERAL_CREMATION_ROWS,
  type FuneralDocFile,
  type FuneralDocId,
  type FuneralDocRow,
} from "@/lib/funeral-docs-types";
import { mediaUrl } from "@/lib/media";
import { Prose } from "@/components/page-hero";
import { PastelBox } from "@/components/pastel-box";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

type PreviewDoc = {
  label: string;
  href: string;
  fileName: string;
};

const DOC_ROW_LABEL_FIELD: Record<FuneralDocId, FuneralDocsKoField> = {
  death: "death",
  family: "family",
  police: "police",
  cremation: "cremation",
};

function DocItems({
  rows,
  docs,
  locale,
  labels,
  cmsEditMarkers = false,
  onOpen,
}: {
  rows: FuneralDocRow[];
  docs: Partial<Record<FuneralDocId, FuneralDocFile>>;
  locale: Locale;
  labels: Record<FuneralDocsKoField, string>;
  cmsEditMarkers?: boolean;
  onOpen: (doc: PreviewDoc) => void;
}) {
  return (
    <ul className="list-none space-y-2 pl-0">
      {rows.map((row) => {
        if (row.type === "text") {
          return (
            <li
              key={row.i18n}
              {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "idLine") } : {})}
              className="text-[15px] leading-7 text-foreground/90"
            >
              {labels.idLine}
            </li>
          );
        }
        const field = DOC_ROW_LABEL_FIELD[row.docId];
        const label = labels[field];
        const file = docs[row.docId];
        const labelKey = cmsEditMarkers ? pageSlotFuneralDocsField("funeral", field) : undefined;
        if (file) {
          const href = mediaUrl(file.filePath);
          return (
            <li key={row.docId} className="flex flex-wrap items-center gap-0.5">
              <button
                type="button"
                onClick={() => onOpen({ label, href, fileName: file.fileName })}
                className="inline-flex flex-wrap items-center gap-1.5 text-left text-[15px] text-primary underline-offset-4 hover:underline"
              >
                <span {...(labelKey ? { "data-cms-key": labelKey } : {})}>{label}</span>
                <FileText className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="sr-only">{t(locale, "fun.docView")}</span>
              </button>
              {cmsEditMarkers ? <CmsFuneralDocPdfSlot docId={row.docId} /> : null}
            </li>
          );
        }
        return (
          <li key={row.docId} className="flex flex-wrap items-center gap-0.5 text-[15px] leading-7">
            <span {...(labelKey ? { "data-cms-key": labelKey } : {})} className="text-foreground/90">
              {label}
            </span>
            <span className="ml-1 text-sm text-muted-foreground">({t(locale, "fun.docPreparing")})</span>
            {cmsEditMarkers ? <CmsFuneralDocPdfSlot docId={row.docId} /> : null}
          </li>
        );
      })}
    </ul>
  );
}

export function FuneralDocList({
  locale,
  docs,
  labels,
  cmsEditMarkers = false,
}: {
  locale: Locale;
  docs: Partial<Record<FuneralDocId, FuneralDocFile>>;
  labels: Record<FuneralDocsKoField, string>;
  cmsEditMarkers?: boolean;
}) {
  const [preview, setPreview] = useState<PreviewDoc | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <PastelBox>
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <h2
              {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "burialTitle") } : {})}
              className="text-xl text-[color:var(--pastel-chrome-fg)]"
            >
              {labels.burialTitle}
            </h2>
            <p
              {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "hint") } : {})}
              className="text-sm text-[color:var(--pastel-chrome-fg)]/75"
            >
              {labels.hint}
            </p>
            <DocItems
              rows={FUNERAL_BURIAL_ROWS}
              docs={docs}
              locale={locale}
              labels={labels}
              cmsEditMarkers={cmsEditMarkers}
              onOpen={setPreview}
            />
          </Prose>
        </PastelBox>
        <PastelBox>
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <h2
              {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "cremationTitle") } : {})}
              className="text-xl text-[color:var(--pastel-chrome-fg)]"
            >
              {labels.cremationTitle}
            </h2>
            <p
              {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "hint") } : {})}
              className="text-sm text-[color:var(--pastel-chrome-fg)]/75"
            >
              {labels.hint}
            </p>
            <DocItems
              rows={FUNERAL_CREMATION_ROWS}
              docs={docs}
              locale={locale}
              labels={labels}
              cmsEditMarkers={cmsEditMarkers}
              onOpen={setPreview}
            />
          </Prose>
        </PastelBox>
      </div>

      <Dialog open={Boolean(preview)} onOpenChange={(open) => !open && setPreview(null)}>
        <DialogContent className="flex h-[min(90vh,880px)] w-full max-w-4xl flex-col gap-3 p-4 sm:max-w-4xl">
          <DialogHeader className="pr-8">
            <DialogTitle>{preview?.label ?? t(locale, "fun.docView")}</DialogTitle>
            <DialogDescription className="truncate">{preview?.fileName}</DialogDescription>
          </DialogHeader>
          {preview ? (
            <iframe
              title={preview.label}
              src={preview.href}
              className="min-h-0 w-full flex-1 rounded-md border bg-muted"
            />
          ) : null}
          <DialogFooter className="sm:justify-between">
            {preview ? (
              <Button type="button" variant="outline" asChild>
                <a href={preview.href} download={preview.fileName}>
                  <Download className="size-4" aria-hidden />
                  {t(locale, "fun.docDownload")}
                </a>
              </Button>
            ) : (
              <span />
            )}
            <Button type="button" variant="secondary" onClick={() => setPreview(null)}>
              {t(locale, "fun.docClose")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
