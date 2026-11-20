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
import { PastelBox } from "@/components/pastel-box";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

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

function DocTable({
  caption,
  captionField,
  hint,
  rows,
  docs,
  locale,
  labels,
  cmsEditMarkers = false,
  onOpen,
}: {
  caption: string;
  captionField: FuneralDocsKoField;
  hint: string;
  rows: FuneralDocRow[];
  docs: Partial<Record<FuneralDocId, FuneralDocFile>>;
  locale: Locale;
  labels: Record<FuneralDocsKoField, string>;
  cmsEditMarkers?: boolean;
  onOpen: (doc: PreviewDoc) => void;
}) {
  return (
    <PastelBox className="overflow-hidden p-0">
      <div className="space-y-1 border-b border-[color:var(--pastel-chrome-border)] px-4 py-3 md:px-5">
        <h2
          {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", captionField) } : {})}
          className="text-xl font-semibold text-[color:var(--pastel-chrome-fg)]"
        >
          {caption}
        </h2>
        <p
          {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "hint") } : {})}
          className="text-sm text-[color:var(--pastel-chrome-fg)]/75"
        >
          {hint}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="fun-docs-table w-full border-collapse text-left text-[15px]">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[color:var(--pastel-chrome-border)] bg-[color:color-mix(in_srgb,var(--pastel-chrome-bg)_55%,#fff)]">
              <th scope="col" className="px-4 py-2.5 font-semibold text-[color:var(--pastel-chrome-fg)] md:px-5">
                {t(locale, "fun.docColName")}
              </th>
              <th scope="col" className="px-4 py-2.5 font-semibold text-[color:var(--pastel-chrome-fg)] md:px-5">
                {t(locale, "fun.docColFile")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const zebra = index % 2 === 1 ? "bg-[color:color-mix(in_srgb,#fff_40%,transparent)]" : "";
              if (row.type === "text") {
                return (
                  <tr key={row.i18n} className={cn("border-b border-[color:var(--pastel-chrome-border)]/70", zebra)}>
                    <td
                      colSpan={2}
                      {...(cmsEditMarkers ? { "data-cms-key": pageSlotFuneralDocsField("funeral", "idLine") } : {})}
                      className="px-4 py-3 leading-7 text-[color:var(--pastel-chrome-fg)]/90 md:px-5"
                    >
                      {labels.idLine}
                    </td>
                  </tr>
                );
              }
              const field = DOC_ROW_LABEL_FIELD[row.docId];
              const label = labels[field];
              const file = docs[row.docId];
              const labelKey = cmsEditMarkers ? pageSlotFuneralDocsField("funeral", field) : undefined;
              return (
                <tr key={row.docId} className={cn("border-b border-[color:var(--pastel-chrome-border)]/70 last:border-b-0", zebra)}>
                  <th
                    scope="row"
                    {...(labelKey ? { "data-cms-key": labelKey } : {})}
                    className="px-4 py-3 font-medium leading-7 text-[color:var(--pastel-chrome-fg)] md:px-5"
                  >
                    {label}
                  </th>
                  <td className="px-4 py-3 md:px-5">
                    {file ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() =>
                            onOpen({
                              label,
                              href: mediaUrl(file.filePath),
                              fileName: file.fileName,
                            })
                          }
                          className="inline-flex items-center gap-1.5 text-primary underline-offset-4 hover:underline"
                        >
                          <FileText className="size-4 shrink-0 opacity-80" aria-hidden />
                          <span>{t(locale, "fun.docView")}</span>
                        </button>
                        <a
                          href={mediaUrl(file.filePath)}
                          download={file.fileName}
                          className="inline-flex items-center gap-1 text-sm text-[color:var(--pastel-chrome-fg)]/75 underline-offset-4 hover:underline"
                        >
                          <Download className="size-3.5 shrink-0" aria-hidden />
                          {t(locale, "fun.docDownload")}
                        </a>
                        {cmsEditMarkers ? <CmsFuneralDocPdfSlot docId={row.docId} /> : null}
                      </div>
                    ) : (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-sm text-muted-foreground">({t(locale, "fun.docPreparing")})</span>
                        {cmsEditMarkers ? <CmsFuneralDocPdfSlot docId={row.docId} /> : null}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PastelBox>
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
        <DocTable
          caption={labels.burialTitle}
          captionField="burialTitle"
          hint={labels.hint}
          rows={FUNERAL_BURIAL_ROWS}
          docs={docs}
          locale={locale}
          labels={labels}
          cmsEditMarkers={cmsEditMarkers}
          onOpen={setPreview}
        />
        <DocTable
          caption={labels.cremationTitle}
          captionField="cremationTitle"
          hint={labels.hint}
          rows={FUNERAL_CREMATION_ROWS}
          docs={docs}
          locale={locale}
          labels={labels}
          cmsEditMarkers={cmsEditMarkers}
          onOpen={setPreview}
        />
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
