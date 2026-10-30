"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  FUNERAL_DOC_META,
  FUNERAL_MANAGE_DOC_IDS,
  type FuneralDocFile,
  type FuneralDocId,
} from "@/lib/funeral-docs-types";

function DocUploadRow({
  docId,
  current,
  busy,
  onUpload,
  onDelete,
}: {
  docId: FuneralDocId;
  current?: FuneralDocFile;
  busy: boolean;
  onUpload: (file: File) => void;
  onDelete: () => void;
}) {
  const inputId = useId();

  return (
    <li className="space-y-3 rounded-xl border bg-card p-4">
      <h3 className="font-medium">{FUNERAL_DOC_META[docId].manageLabel}</h3>
      {current ? (
        <p className="text-sm text-muted-foreground">
          등록됨: {current.fileName}
          <span className="ml-2 text-xs">({new Date(current.updatedAt).toLocaleString("ko-KR")})</span>
        </p>
      ) : (
        <p className="text-sm text-muted-foreground">등록된 PDF 없음 (공개 페이지: 준비 중)</p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" disabled={busy} asChild>
          <label htmlFor={inputId} className={busy ? "pointer-events-none opacity-50" : "cursor-pointer"}>
            {busy ? "올리는 중…" : current ? "PDF 교체" : "PDF 올리기"}
            <input
              id={inputId}
              type="file"
              accept="application/pdf,.pdf"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) onUpload(file);
              }}
            />
          </label>
        </Button>
        {current ? (
          <Button type="button" size="sm" variant="outline" disabled={busy} onClick={onDelete}>
            삭제
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function ManageFuneralDocs({ initial }: { initial: FuneralDocFile[] }) {
  const [items, setItems] = useState(initial);
  const [busyId, setBusyId] = useState<FuneralDocId | null>(null);
  const [message, setMessage] = useState("");

  const byId = Object.fromEntries(items.map((item) => [item.docId, item])) as Partial<
    Record<FuneralDocId, FuneralDocFile>
  >;

  async function refresh() {
    const res = await fetch("/api/manage/funeral-docs");
    const json = (await res.json()) as { items?: FuneralDocFile[] };
    if (json.items) setItems(json.items);
  }

  async function onUpload(docId: FuneralDocId, file: File) {
    setBusyId(docId);
    setMessage("");
    try {
      const form = new FormData();
      form.set("docId", docId);
      form.set("file", file);
      const res = await fetch("/api/manage/funeral-docs", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "업로드에 실패했습니다.");
        return;
      }
      setMessage("저장했습니다. 공개 이용절차의 매장·화장 서류 목록에 바로 반영됩니다.");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(docId: FuneralDocId) {
    if (!confirm("등록된 PDF를 지울까요? 공개 페이지에는 「준비 중」으로 보입니다.")) return;
    setBusyId(docId);
    setMessage("");
    try {
      const res = await fetch(`/api/manage/funeral-docs?docId=${encodeURIComponent(docId)}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "삭제에 실패했습니다.");
        return;
      }
      setMessage("삭제했습니다.");
      await refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        등록 서류는 아래 4종입니다. 한 번 올리면 공개 페이지의 「매장 시 서류」「화장 시 서류」에 각각 필요한 항목으로
        표시됩니다. PDF 올리기 버튼을 누르면 바로 파일을 고를 수 있습니다.
      </p>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      <ul className="space-y-3">
        {FUNERAL_MANAGE_DOC_IDS.map((docId) => (
          <DocUploadRow
            key={docId}
            docId={docId}
            current={byId[docId]}
            busy={busyId === docId}
            onUpload={(file) => void onUpload(docId, file)}
            onDelete={() => void onDelete(docId)}
          />
        ))}
      </ul>
    </div>
  );
}
