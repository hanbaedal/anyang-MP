"use client";

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { FUNERAL_DOC_META, type FuneralDocFile, type FuneralDocId } from "@/lib/funeral-docs-types";

export function ManageFuneralDocPdfPanel({
  docId,
  disabled,
  onChanged,
}: {
  docId: FuneralDocId;
  disabled?: boolean;
  onChanged?: () => void;
}) {
  const inputId = useId();
  const [current, setCurrent] = useState<FuneralDocFile | undefined>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch("/api/manage/funeral-docs");
      const json = (await res.json()) as { items?: FuneralDocFile[] };
      if (cancelled || !json.items) return;
      setCurrent(json.items.find((row) => row.docId === docId));
    })();
    return () => {
      cancelled = true;
    };
  }, [docId]);

  async function upload(file: File) {
    setBusy(true);
    setMessage("");
    const form = new FormData();
    form.set("docId", docId);
    form.set("file", file);
    try {
      const res = await fetch("/api/manage/funeral-docs", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; error?: string; item?: FuneralDocFile };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "업로드 실패");
        return;
      }
      if (json.item) setCurrent(json.item);
      setMessage("PDF를 등록했습니다. 미리보기가 갱신됩니다.");
      onChanged?.();
    } catch {
      setMessage("네트워크 오류입니다.");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch(`/api/manage/funeral-docs?docId=${encodeURIComponent(docId)}`, { method: "DELETE" });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "삭제 실패");
        return;
      }
      setCurrent(undefined);
      setMessage("PDF를 삭제했습니다.");
      onChanged?.();
    } catch {
      setMessage("네트워크 오류입니다.");
    } finally {
      setBusy(false);
    }
  }

  const meta = FUNERAL_DOC_META[docId];

  return (
    <div className="space-y-3 text-sm">
      <p className="font-medium text-foreground">{meta.manageLabel}</p>
      <p className="text-xs text-muted-foreground">목록에서 「PDF」를 눌렀을 때 여기서 파일을 올립니다.</p>
      {current ? (
        <p className="text-muted-foreground">
          등록됨: {current.fileName}
          <span className="ml-1 text-xs">({new Date(current.updatedAt).toLocaleString("ko-KR")})</span>
        </p>
      ) : (
        <p className="text-muted-foreground">등록된 PDF 없음 (공개: 준비 중)</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={disabled || busy} asChild>
          <label htmlFor={inputId} className={busy ? "pointer-events-none opacity-50" : "cursor-pointer"}>
            {busy ? "처리 중…" : current ? "PDF 교체" : "PDF 올리기"}
            <input
              id={inputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={disabled || busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) void upload(file);
              }}
            />
          </label>
        </Button>
        {current ? (
          <Button type="button" size="sm" variant="outline" disabled={disabled || busy} onClick={() => void remove()}>
            삭제
          </Button>
        ) : null}
      </div>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </div>
  );
}