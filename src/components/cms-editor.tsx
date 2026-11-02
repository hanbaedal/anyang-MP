"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { CmsPhotoItems } from "@/components/cms-photo-items";
import { ManageImagePicker } from "@/components/manage-image-picker";
import {
  CMS_GALLERY_LINK_ITEM_SLUGS,
  CMS_TEXT_ITEM_SLUGS,
  type CmsItem,
  type CmsPage,
  type CmsSlug,
} from "@/lib/cms-types";

const field =
  "h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";
const area =
  "min-h-32 w-full rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** 리모델링만 CMS에서 사진 격자 편집. 매장·평장·봉안은 갤러리 태그. */
const PHOTO_SLUGS: CmsSlug[] = ["remodeling"];
const GALLERY_DRIVEN_SLUGS: CmsSlug[] = ["burial", "lawn", "columbarium"];
const GALLERY_TAG_BY_SLUG: Partial<Record<CmsSlug, string>> = {
  burial: "매장묘",
  lawn: "평장묘",
  columbarium: "봉안묘",
};
const BODY_ONLY_SLUGS: CmsSlug[] = ["greeting", "fees"];

function emptyItem(slug: CmsSlug): CmsItem {
  const id = crypto.randomUUID();
  if (slug === "prices") return { id, title: "", won: "", remaining: "" };
  if (CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug)) return { id, title: "", text: "", image: "", galleryId: "" };
  if (CMS_TEXT_ITEM_SLUGS.includes(slug)) return { id, title: "", text: "" };
  return { id, title: "", text: "", image: "" };
}

export function CmsEditor({ initial }: { initial: CmsPage }) {
  const [page, setPage] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error" | "busy">("idle");
  const [message, setMessage] = useState("");
  const pageRef = useRef(page);
  const galleryDriven = GALLERY_DRIVEN_SLUGS.includes(page.slug);
  const showItems = !BODY_ONLY_SLUGS.includes(page.slug) && !galleryDriven;
  const photoGrid = PHOTO_SLUGS.includes(page.slug);
  const showPrices = page.slug === "prices";
  const showBodyImage = page.slug === "greeting";
  const galleryLinkItems = CMS_GALLERY_LINK_ITEM_SLUGS.includes(page.slug);
  const galleryTag = GALLERY_TAG_BY_SLUG[page.slug];

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  function patchItem(id: string, patch: Partial<CmsItem>) {
    setPage((prev) => ({ ...prev, items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)) }));
  }

  const putPage = useCallback(async (snapshot: CmsPage) => {
    const res = await fetch("/api/manage/pages", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: snapshot.slug,
        title: snapshot.title,
        lead: snapshot.lead,
        body: snapshot.body,
        bodyImage: snapshot.bodyImage ?? "",
        items: snapshot.items ?? [],
      }),
    });
    const json = (await res.json()) as { ok?: boolean; error?: string; page?: CmsPage };
    if (!res.ok || !json.ok) {
      setStatus("error");
      setMessage(json.error || "저장에 실패했습니다.");
      return false;
    }
    if (json.page) {
      setPage(json.page);
      pageRef.current = json.page;
    }
    setStatus("ok");
    return true;
  }, []);

  const persistPage = useCallback(
    async (items: CmsItem[]) => {
      const snapshot = { ...pageRef.current, items };
      setPage(snapshot);
      pageRef.current = snapshot;
      return putPage(snapshot);
    },
    [putPage],
  );

  async function uploadBodyImage(file: File) {
    setStatus("busy");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch("/api/manage/upload-image", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; src?: string; error?: string };
      if (json.src) {
        setPage((prev) => ({ ...prev, bodyImage: json.src }));
        setMessage("본문 좌측 사진을 올렸습니다. 「페이지 저장」을 눌러야 공개에 반영됩니다.");
        setStatus("idle");
      } else {
        setStatus("error");
        setMessage(json.error || "업로드 실패");
      }
    } catch {
      setStatus("error");
      setMessage("네트워크 오류입니다.");
    }
  }

  async function onSave(event: React.FormEvent) {
    event.preventDefault();
    setStatus("saving");
    setMessage("");
    try {
      // Use render-state `page`, not a setState snapshot side-effect (that sent empty bodies).
      const ok = await putPage(page);
      if (ok) setMessage("저장했습니다. 공개 페이지에 바로 반영되며, 영어·중국어는 한글 기준으로 자동 번역됩니다.");
    } catch {
      setStatus("error");
      setMessage("네트워크 오류입니다.");
    }
  }

  const busy = status === "saving" || status === "busy";

  return (
    <form onSubmit={onSave} className="mx-auto max-w-6xl space-y-5 px-4 py-10">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="font-medium">제목</span>
          <input className={field} value={page.title} onChange={(e) => setPage({ ...page, title: e.target.value })} />
        </label>
        <label className="space-y-1 text-sm">
          <span className="font-medium">요약</span>
          <input className={field} value={page.lead} onChange={(e) => setPage({ ...page, lead: e.target.value })} />
        </label>
      </div>
      <label className="block space-y-1 text-sm">
        <span className="font-medium">본문 (Enter=줄바꿈, 빈 줄=문단)</span>
        <textarea className={area} value={page.body} onChange={(e) => setPage({ ...page, body: e.target.value })} />
      </label>
      {showBodyImage ? (
        <div className="space-y-2 rounded-xl border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-medium">본문 좌측 이미지</h2>
              <p className="text-xs text-muted-foreground">공개 인사말 본문 왼쪽에 표시됩니다. 없으면 텍스트만 보입니다.</p>
            </div>
            {page.bodyImage ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  setPage((prev) => {
                    const next = { ...prev };
                    delete next.bodyImage;
                    return next;
                  });
                  setMessage("이미지를 제거했습니다. 「페이지 저장」을 눌러 반영하세요.");
                }}
              >
                이미지 제거
              </Button>
            ) : null}
          </div>
          <ManageImagePicker
            src={page.bodyImage ?? ""}
            disabled={busy}
            enableLibrary
            label="이미지 업로드"
            onFile={uploadBodyImage}
            onPickSrc={(src) => {
              setPage((prev) => ({ ...prev, bodyImage: src }));
              setMessage("갤러리 사진을 골랐습니다. 「페이지 저장」을 눌러야 공개에 반영됩니다.");
            }}
          />
        </div>
      ) : null}
      {galleryDriven && galleryTag ? (
        <p className="rounded-md border border-dashed border-input bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
          이 페이지 사진은 갤러리에서 「{galleryTag}」 태그를 붙인 사진으로 표시됩니다. 제목·요약·본문만 여기서
          수정하세요.
        </p>
      ) : null}
      {showItems && photoGrid ? (
        <CmsPhotoItems
          slug={page.slug}
          items={page.items}
          onItemsChange={(items) => setPage((prev) => ({ ...prev, items }))}
          onPersist={persistPage}
        />
      ) : null}
      {showItems && !photoGrid ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium">항목</h2>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setPage({ ...page, items: [...page.items, emptyItem(page.slug)] })}
            >
              항목 추가
            </Button>
          </div>
          <ul className="space-y-3">
            {page.items.map((item, index) => (
              <li key={item.id} className="space-y-2 rounded-xl border bg-card p-4">
                <input
                  className={field}
                  placeholder="제목"
                  value={item.title}
                  onChange={(e) => patchItem(item.id, { title: e.target.value })}
                />
                {showPrices ? (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <input
                      className={field}
                      placeholder="분양가 (원, 비우면 확인 필요)"
                      value={item.won ?? ""}
                      onChange={(e) => patchItem(item.id, { won: e.target.value })}
                    />
                    <input
                      className={field}
                      placeholder="잔여 구좌 (비우면 확인 필요)"
                      value={item.remaining ?? ""}
                      onChange={(e) => patchItem(item.id, { remaining: e.target.value })}
                    />
                  </div>
                ) : (
                  <textarea
                    className={area}
                    placeholder="설명 (Enter=줄바꿈, 빈 줄=문단)"
                    value={item.text ?? ""}
                    onChange={(e) => patchItem(item.id, { text: e.target.value })}
                  />
                )}
                {galleryLinkItems ? (
                  <div className="space-y-2 rounded-lg border border-dashed border-input bg-muted/30 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-medium">
                          {page.slug === "procedure" ? `단계 사진 ${index + 1}` : `카드 사진 ${index + 1}`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          갤러리에서만 고릅니다. 새 파일 업로드는 없습니다. 연결하지 않으면 공개는 기본 공원 사진을
                          씁니다.
                        </p>
                      </div>
                      {item.image || item.galleryId ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={busy}
                          onClick={() => {
                            patchItem(item.id, { image: "", galleryId: "" });
                            setMessage("카드 사진 연결을 해제했습니다. 「페이지 저장」을 눌러 반영하세요.");
                          }}
                        >
                          연결 해제
                        </Button>
                      ) : null}
                    </div>
                    <ManageImagePicker
                      src={item.image ?? ""}
                      disabled={busy}
                      libraryOnly
                      label="갤러리에서 고르기"
                      onPickSrc={(src, photo) => {
                        patchItem(item.id, { image: src, galleryId: photo?.id ?? "" });
                        setMessage("갤러리 사진을 연결했습니다. 「페이지 저장」을 눌러야 공개에 반영됩니다.");
                      }}
                    />
                    {item.galleryId ? (
                      <p className="truncate text-[10px] text-muted-foreground">galleryId: {item.galleryId}</p>
                    ) : null}
                  </div>
                ) : null}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage({ ...page, items: page.items.filter((row) => row.id !== item.id) })}
                >
                  삭제
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      <Button type="submit" disabled={busy}>
        {status === "saving" ? "저장 중…" : "페이지 저장 (제목·본문·항목)"}
      </Button>
      {message ? <p className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message}</p> : null}
    </form>
  );
}
