"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CmsFieldKo, CmsSlotPanel } from "@/components/manage/cms-slot-panel";
import { ManageImagePicker } from "@/components/manage-image-picker";
import { Button } from "@/components/ui/button";
import type { CmsPage } from "@/lib/cms-types";
import { CMS_GALLERY_LINK_ITEM_SLUGS } from "@/lib/cms-types";
import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import {
  buildPageCmsSlotMeta,
  parsePageCmsSlotKey,
  pageSlotBodyImage,
  pageSlotItemImage,
  pageSlotItemText,
  pageSlotItemTitle,
  type PageCmsSlotMeta,
} from "@/lib/page-cms-slots";
import { PAGE_CMS_PUBLIC_PATH } from "@/lib/page-cms-path";
import { uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

const GALLERY_TAG: Partial<Record<ManageVisualCmsSlug, string>> = {
  burial: "매장묘",
  lawn: "평장묘",
  columbarium: "봉안묘",
};

export function ManagePageCms({ initial, slug }: { initial: CmsPage; slug: ManageVisualCmsSlug }) {
  const [page, setPage] = useState(initial);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [frameRev, setFrameRev] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const busy = status === "busy";

  const slotMetaMap = useMemo(() => buildPageCmsSlotMeta(page), [page]);
  const publicPath = PAGE_CMS_PUBLIC_PATH[slug];
  const iframeSrc = useMemo(
    () => `${publicPath}?cmsEdit=1&_v=${frameRev}`,
    [publicPath, frameRev],
  );

  const postToFrame = useCallback((payload: object) => {
    const win = iframeRef.current?.contentWindow;
    if (!win) return;
    win.postMessage(payload, window.location.origin);
  }, []);

  useEffect(() => {
    postToFrame({ type: "anyang-cms-active", key: activeKey, active: Boolean(activeKey) });
  }, [activeKey, postToFrame]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; key?: string };
      if (data?.type === "anyang-cms-select" && data.key) {
        if (data.key in slotMetaMap || data.key.startsWith("page.")) {
          setActiveKey(data.key);
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slotMetaMap]);

  function markDirty() {
    setDirty(true);
    setStatus("idle");
  }

  function patchText(key: string, text: string) {
    const parsed = parsePageCmsSlotKey(key);
    if (!parsed) return;
    setPage((prev) => {
      const next = { ...prev };
      if (parsed.kind === "title") next.title = text;
      else if (parsed.kind === "lead") next.lead = text;
      else if (parsed.kind === "body") next.body = text;
      else if (parsed.itemId) {
        next.items = prev.items.map((item) => {
          if (item.id !== parsed.itemId) return item;
          if (parsed.kind === "itemTitle") return { ...item, title: text };
          if (parsed.kind === "itemText") return { ...item, text };
          return item;
        });
      }
      return next;
    });
    markDirty();
    postToFrame({ type: "anyang-cms-patch", key, text });
  }

  function patchBodyImage(src: string) {
    setPage((prev) => ({ ...prev, bodyImage: src }));
    markDirty();
    setMessage("사진을 골랐습니다. 저장을 눌러 반영하세요.");
    if (src) {
      postToFrame({ type: "anyang-cms-patch", key: pageSlotBodyImage(slug), imageSrc: uploadOriginalUrl(src) });
    }
  }

  function patchItemImage(itemId: string, src: string, galleryId?: string) {
    setPage((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, image: src, galleryId: galleryId ?? item.galleryId } : item,
      ),
    }));
    markDirty();
    setMessage("사진을 연결했습니다. 저장을 눌러 반영하세요.");
    const key = pageSlotItemImage(slug, itemId);
    if (src) {
      postToFrame({ type: "anyang-cms-patch", key, imageSrc: uploadOriginalUrl(src) });
    }
  }

  async function uploadBodyImage(file: File) {
    setStatus("busy");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch("/api/manage/upload-image", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; src?: string; error?: string };
      if (json.src) {
        patchBodyImage(json.src);
        setMessage("사진을 올렸습니다. 저장을 눌러 반영하세요.");
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

  async function save() {
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/pages", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: page.slug,
          title: page.title,
          lead: page.lead,
          body: page.body,
          bodyImage: page.bodyImage ?? "",
          items: page.items ?? [],
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; page?: CmsPage };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "저장에 실패했습니다.");
        setStatus("error");
        return;
      }
      if (json.page) setPage(json.page);
      setDirty(false);
      setMessage("저장했습니다. 공개 페이지에 반영됩니다.");
      setStatus("ok");
      setFrameRev((n) => n + 1);
    } catch {
      setMessage("네트워크 오류입니다.");
      setStatus("error");
    }
  }

  const activeMeta: PageCmsSlotMeta | undefined = activeKey ? slotMetaMap[activeKey] : undefined;

  const activeItemId = activeKey ? parsePageCmsSlotKey(activeKey)?.itemId : undefined;

  function readTextValue(key: string) {
    const parsed = parsePageCmsSlotKey(key);
    if (!parsed) return "";
    if (parsed.kind === "title") return page.title;
    if (parsed.kind === "lead") return page.lead;
    if (parsed.kind === "body") return page.body;
    if (parsed.itemId) {
      const item = page.items.find((row) => row.id === parsed.itemId);
      if (!item) return "";
      if (parsed.kind === "itemTitle") return item.title;
      if (parsed.kind === "itemText") return item.text ?? "";
    }
    return "";
  }

  function renderItemCardPanel(itemId: string) {
    const item = page.items.find((row) => row.id === itemId);
    if (!item) {
      return <p className="text-xs text-destructive">카드 데이터를 찾을 수 없습니다. 저장 후 새로고침하세요.</p>;
    }
    const galleryLink = CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug) || slug === "procedure";
    const directions = slug === "directions";
    const titleKey = pageSlotItemTitle(slug, itemId);
    const textKey = pageSlotItemText(slug, itemId);
  return (
      <div className="space-y-3">
        {!directions ? (
          <label className="block space-y-1.5 text-sm">
            <span className="font-medium text-foreground">카드 제목 (ko)</span>
            <input
              className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              disabled={busy}
              value={item.title}
              onChange={(e) => patchText(titleKey, e.target.value)}
            />
          </label>
        ) : (
          <p className="text-[11px] text-muted-foreground">오시는 길 카드는 제목 없이 설명만 표시됩니다.</p>
        )}
        <CmsFieldKo
          multiline
          disabled={busy}
          value={item.text ?? ""}
          onChange={(value) => patchText(textKey, value)}
        />
        {galleryLink ? (
          <div className="space-y-2 border-t pt-3">
            <ManageImagePicker
              src={item.image ?? ""}
              disabled={busy}
              libraryOnly
              label="갤러리에서 사진 연결"
              onPickSrc={(src, photo) => patchItemImage(itemId, src, photo?.id)}
            />
            {item.image ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => patchItemImage(itemId, "", "")}
              >
                연결 해제
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    );
  }

  const panelChildren = (() => {
    if (!activeKey) return null;
    if (activeItemId && activeMeta && (activeMeta.kind === "itemTitle" || activeMeta.kind === "itemText" || activeMeta.kind === "itemImage")) {
      return renderItemCardPanel(activeItemId);
    }
    if (!activeMeta) return null;
    const multiline =
      activeMeta.kind === "lead" || activeMeta.kind === "body" || activeMeta.kind === "itemText";
    if (activeMeta.kind === "bodyImage") {
      return (
        <ManageImagePicker
          src={page.bodyImage ?? ""}
          disabled={busy}
          enableLibrary
          label="본문 좌측 사진"
          onFile={(file) => void uploadBodyImage(file)}
          onPickSrc={patchBodyImage}
        />
      );
    }
    return (
      <CmsFieldKo
        multiline={multiline}
        disabled={busy}
        value={readTextValue(activeKey)}
        onChange={(value) => patchText(activeKey, value)}
      />
    );
  })();

  const lotsHint =
    slug === "burial" || slug === "lawn" || slug === "columbarium"
      ? `사진 격자는 갤러리 「${GALLERY_TAG[slug]}」 태그로 자동 표시됩니다. /manage/gallery 에서 관리하세요.`
      : undefined;

  const itemSlot =
    activeMeta && (activeMeta.kind === "itemTitle" || activeMeta.kind === "itemText" || activeMeta.kind === "itemImage");

  const panelHint = activeMeta
    ? lotsHint ??
      (itemSlot
        ? "카드 제목·설명을 클릭하거나 우측 상단 「사진」으로 갤러리를 연결하세요."
        : "입력 즉시 왼쪽 미리보기에 반영됩니다. 한글만 저장하면 영·중은 공개에서 자동 처리됩니다.")
    : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <p className="cms-orders-lead">
        실제 페이지(<code>{publicPath}</code>)와 동일한 배치입니다. 편집할 영역을 <strong>클릭</strong>한 뒤
        오른쪽에서 수정하세요. 갤러리·공지는 기존 관리 메뉴를 사용합니다.
      </p>
      <div className="cms-layout mx-auto w-full max-w-[100rem] flex-1 gap-4 p-3 md:p-4">
        <div className="cms-preview-wrap flex min-h-0 min-w-0 flex-col">
          <div className="cms-preview-toolbar">
            <span className="text-muted-foreground">미리보기 언어</span>
            <select
              className="h-8 rounded-md border border-input bg-card px-2 text-xs"
              value="ko"
              disabled
              aria-label="미리보기 언어"
            >
              <option value="ko">한국어</option>
            </select>
            <Link
              href={publicPath}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto rounded-md border border-input bg-card px-2.5 py-1 text-xs font-medium hover:bg-accent"
            >
              공개 페이지 새 창
            </Link>
          </div>
          <iframe ref={iframeRef} key={iframeSrc} title="페이지 미리보기" src={iframeSrc} className="cms-frame flex-1" />
        </div>
        <CmsSlotPanel
          slotKey={activeKey ?? undefined}
          slotLabel={
            itemSlot && activeItemId
              ? activeMeta?.label?.replace(/ 제목$| 설명$| 사진$/, "") ?? "카드 편집"
              : activeMeta?.label
          }
          onSave={() => void save()}
          saveDisabled={busy}
          saving={busy}
          hint={panelHint}
          footer={
            message ? (
              <p
                className={cn(
                  "text-center text-xs",
                  status === "error" ? "text-destructive" : status === "ok" ? "text-green-700" : "text-muted-foreground",
                )}
              >
                {message}
                {dirty && status !== "error" ? " (미저장 변경 있음)" : null}
              </p>
            ) : dirty ? (
              <p className="text-center text-xs text-amber-800">미저장 변경이 있습니다.</p>
            ) : null
          }
        >
          {panelChildren}
        </CmsSlotPanel>
      </div>
    </div>
  );
}