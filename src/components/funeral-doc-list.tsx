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
import {
  FUNERAL_BURIAL_ROWS,
  FUNERAL_CREMATION_ROWS,
  FUNERAL_DOC_META,
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

function DocItems({
  rows,
  docs,
  locale,
  onOpen,
}: {
  rows: FuneralDocRow[];
  docs: Partial<Record<FuneralDocId, FuneralDocFile>>;
  locale: Locale;
  onOpen: (doc: PreviewDoc) => void;
}) {
  return (
    <ul className="list-none space-y-2 pl-0">
      {rows.map((row) => {
        if (row.type === "text") {
          return (
            <li key={row.i18n} className="text-[15px] leading-7 text-foreground/90">
              {t(locale, row.i18n)}
            </li>
          );
        }
        const label = t(locale, FUNERAL_DOC_META[row.docId].i18n);
        const file = docs[row.docId];
        if (file) {
          const href = mediaUrl(file.filePath);
          return (
            <li key={row.docId}>
              <button
                type="button"
                onClick={() => onOpen({ label, href, fileName: file.fileName })}
                className="inline-flex flex-wrap items-center gap-1.5 text-left text-[15px] text-primary underline-offset-4 hover:underline"
              >
                <span>{label}</span>
                <FileText className="size-4 shrink-0 opacity-80" aria-hidden />
                <span className="sr-only">{t(locale, "fun.docView")}</span>
              </button>
            </li>
          );
        }
        return (
          <li key={row.docId} className="text-[15px] leading-7">
            <span className="text-foreground/90">{label}</span>
            <span className="ml-2 text-sm text-muted-foreground">({t(locale, "fun.docPreparing")})</span>
          </li>
        );
      })}
    </ul>
  );
}

export function FuneralDocList({
  locale,
  docs,
}: {
  locale: Locale;
  docs: Partial<Record<FuneralDocId, FuneralDocFile>>;
}) {
  const [preview, setPreview] = useState<PreviewDoc | null>(null);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 md:gap-6">
        <PastelBox>
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <h2 className="text-xl text-[color:var(--pastel-chrome-fg)]">{t(locale, "fun.burialDocs")}</h2>
            <p className="text-sm text-[color:var(--pastel-chrome-fg)]/75">{t(locale, "fun.docsPublicHint")}</p>
            <DocItems rows={FUNERAL_BURIAL_ROWS} docs={docs} locale={locale} onOpen={setPreview} />
          </Prose>
        </PastelBox>
        <PastelBox>
          <Prose className="max-w-none text-[color:var(--pastel-chrome-fg)]">
            <h2 className="text-xl text-[color:var(--pastel-chrome-fg)]">{t(locale, "fun.cremationDocs")}</h2>
            <p className="text-sm text-[color:var(--pastel-chrome-fg)]/75">{t(locale, "fun.docsPublicHint")}</p>
            <DocItems rows={FUNERAL_CREMATION_ROWS} docs={docs} locale={locale} onOpen={setPreview} />
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
