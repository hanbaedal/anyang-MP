"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CmsFontPick } from "@/components/manage/cms-font-pick";
import { CmsFontScale } from "@/components/manage/cms-font-scale";
import { CmsPageSlotSelect } from "@/components/manage/cms-page-slot-select";
import { CmsTextColor } from "@/components/manage/cms-text-color";
import { CmsFieldKo, CmsSlotPanel } from "@/components/manage/cms-slot-panel";
import { ManageImagePicker } from "@/components/manage-image-picker";
import { Button } from "@/components/ui/button";
import type { CmsPage } from "@/lib/cms-types";
import { CMS_GALLERY_LINK_ITEM_SLUGS } from "@/lib/cms-types";
import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";
import {
  buildPageCmsSlotMeta,
  buildPageCmsTextPatches,
  findCmsItemBySlotKey,
  isItemCardSlotKind,
  isPageCmsTextStyleSlot,
  parsePageCmsSlotKey,
  pageSlotBodyImage,
  pageSlotHeroImage,
  pageSlotItemImage,
  pageSlotItemText,
  pageSlotItemTitle,
  pageSlotTitle,
} from "@/lib/page-cms-slots";
import { ManageFuneralDocPdfPanel } from "@/components/manage/manage-funeral-doc-pdf-panel";
import { FUNERAL_DOCS_I18N } from "@/lib/funeral-docs-cms";
import { PAGE_CMS_PUBLIC_PATH } from "@/lib/page-cms-path";
import { t } from "@/lib/i18n";
import { uploadOriginalUrl } from "@/lib/media";
import {
  defaultPageCmsTextStyle,
  mergePageCmsTextStyle,
  type PageCmsTextStyle,
  type PageCmsTextStyles,
} from "@/lib/page-cms-text-style";
import type { HomeHeroFontPreset } from "@/lib/home-hero-text-style";
import { normalizeCmsMultilineText } from "@/lib/cms-multiline-text";
import { cn } from "@/lib/utils";

const GALLERY_TAG: Partial<Record<ManageVisualCmsSlug, string>> = {
  burial: "매장묘",
  lawn: "평장묘",
  columbarium: "봉안묘",
};

export function ManagePageCms({
  initial,
  slug,
  defaultSlotKey,
  onPersisted,
}: {
  initial: CmsPage;
  slug: ManageVisualCmsSlug;
  defaultSlotKey?: string;
  onPersisted?: (page: CmsPage) => void;
}) {
  const [page, setPage] = useState(initial);
  const [activeKey, setActiveKey] = useState<string | null>(
    defaultSlotKey && defaultSlotKey in buildPageCmsSlotMeta({ ...initial, slug })
      ? defaultSlotKey
      : pageSlotTitle(slug),
  );
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const [frameRev, setFrameRev] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const busy = status === "busy";

  const slotMetaMap = useMemo(() => buildPageCmsSlotMeta({ ...page, slug }), [page, slug]);
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
      if (data?.type === "anyang-cms-ready") {
        const current = pageRef.current;
        const styles = current.textStyles ?? {};
        for (const key of Object.keys(styles)) {
          const row = styles[key];
          if (!row) continue;
          postToFrame({
            type: "anyang-cms-patch",
            key,
            fontScale: row.scale,
            fontPreset: row.font,
            textColor: row.color,
          });
        }
        for (const patch of buildPageCmsTextPatches(current)) {
          postToFrame({ type: "anyang-cms-patch", key: patch.key, text: patch.text });
        }
      }
      if (data?.type === "anyang-cms-select" && data.key) {
        if (data.key in slotMetaMap || data.key.startsWith("page.")) {
          setActiveKey(data.key);
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [slotMetaMap, page.textStyles, postToFrame]);

  function markDirty() {
    setDirty(true);
    setStatus("idle");
  }

  function slotTextStyle(key: string): PageCmsTextStyle {
    return page.textStyles?.[key] ?? defaultPageCmsTextStyle();
  }

  function patchSlotTextStyle(key: string, patch: Partial<PageCmsTextStyle>) {
    markDirty();
    setPage((prev) => {
      const textStyles = mergePageCmsTextStyle(prev.textStyles, key, patch);
      const row = textStyles[key] ?? defaultPageCmsTextStyle();
      postToFrame({
        type: "anyang-cms-patch",
        key,
        fontScale: row.scale,
        fontPreset: row.font,
        textColor: row.color,
      });
      return { ...prev, textStyles };
    });
  }

  function renderTextStyleControls(slotKey: string) {
    const style = slotTextStyle(slotKey);
    return (
      <>
        <CmsFontPick
          value={style.font}
          disabled={busy}
          onChange={(preset: HomeHeroFontPreset) => patchSlotTextStyle(slotKey, { font: preset })}
        />
        <CmsFontScale
          value={style.scale}
          disabled={busy}
          onChange={(scale) => patchSlotTextStyle(slotKey, { scale })}
        />
        <CmsTextColor
          value={style.color}
          disabled={busy}
          onChange={(color) => patchSlotTextStyle(slotKey, { color })}
        />
      </>
    );
  }

  function patchText(key: string, text: string) {
    const parsed = parsePageCmsSlotKey(key);
    if (!parsed) return;
    const normalized =
      parsed.kind === "body" || parsed.kind === "itemText" || parsed.kind === "lead"
        ? normalizeCmsMultilineText(text)
        : text;
    setPage((prev) => {
      const next = { ...prev };
      if (parsed.kind === "title") next.title = text;
      else if (parsed.kind === "lead") next.lead = normalized;
      else if (parsed.kind === "body") next.body = normalized;
      else if (parsed.kind === "funeralDocText" && parsed.funeralDocField) {
        next.funeralDocs = { ...prev.funeralDocs, [parsed.funeralDocField]: text };
      } else if (parsed.itemId) {
        next.items = prev.items.map((item) => {
          if (item.id !== parsed.itemId) return item;
          if (parsed.kind === "itemTitle") return { ...item, title: text };
          if (parsed.kind === "itemText") return { ...item, text: normalized };
          return item;
        });
      }
      return next;
    });
    markDirty();
    postToFrame({ type: "anyang-cms-patch", key, text: normalized });
  }

  function patchBodyImage(src: string) {
    setPage((prev) => ({ ...prev, bodyImage: src }));
    markDirty();
    setMessage("사진을 골랐습니다. 저장을 눌러 반영하세요.");
    if (src) {
      postToFrame({ type: "anyang-cms-patch", key: pageSlotBodyImage(slug), imageSrc: uploadOriginalUrl(src) });
    }
  }

  function patchHeroImage(src: string) {
    setPage((prev) => ({ ...prev, heroImage: src }));
    markDirty();
    setMessage("배경을 골랐습니다. 저장을 눌러 반영하세요.");
    if (src) {
      postToFrame({ type: "anyang-cms-patch", key: pageSlotHeroImage(slug), imageSrc: uploadOriginalUrl(src) });
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

  async function uploadHeroImage(file: File) {
    setStatus("busy");
    setMessage("");
    const form = new FormData();
    form.set("file", file);
    try {
      const res = await fetch("/api/manage/upload-image", { method: "POST", body: form });
      const json = (await res.json()) as { ok?: boolean; src?: string; error?: string };
      if (json.src) {
        patchHeroImage(json.src);
        setMessage("배경을 올렸습니다. 저장을 눌러 반영하세요.");
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
          heroImage: page.heroImage ?? "",
          items: page.items ?? [],
          funeralDocs: page.funeralDocs,
          textStyles: page.textStyles,
        }),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string; page?: CmsPage };
      if (!res.ok || !json.ok) {
        setMessage(json.error || "저장에 실패했습니다.");
        setStatus("error");
        return;
      }
      if (json.page) {
        setPage(json.page);
        onPersisted?.(json.page);
      }
      setDirty(false);
      setMessage("저장했습니다. 미리보기와 공개 페이지에 반영됩니다.");
      setStatus("ok");
      setFrameRev((n) => n + 1);
    } catch {
      setMessage("네트워크 오류입니다. 저장되지 않았을 수 있습니다.");
      setStatus("error");
    } finally {
      setStatus((prev) => (prev === "busy" ? "idle" : prev));
    }
  }

  const parsedSlot = activeKey ? parsePageCmsSlotKey(activeKey) : null;
  const activeMeta = activeKey ? slotMetaMap[activeKey] : undefined;
  const editingItem = activeKey ? findCmsItemBySlotKey(page, activeKey) : null;
  const isItemCard =
    Boolean(parsedSlot && editingItem && isItemCardSlotKind(parsedSlot.kind));

  const itemCardLabel = (() => {
    if (!editingItem) return undefined;
    const index = page.items.findIndex((row) => row.id === editingItem.id);
    if (index < 0) return "카드 편집";
    return slug === "directions" ? `교통 카드 ${index + 1}` : `카드 ${index + 1}`;
  })();

  function readTextValue(key: string) {
    const parsed = parsePageCmsSlotKey(key);
    if (!parsed) return "";
    if (parsed.kind === "title") return page.title;
    if (parsed.kind === "lead") return page.lead;
    if (parsed.kind === "body") return page.body;
    if (parsed.kind === "funeralDocText" && parsed.funeralDocField) {
      const custom = page.funeralDocs?.[parsed.funeralDocField];
      return custom ?? t("ko", FUNERAL_DOCS_I18N[parsed.funeralDocField]);
    }
    const item = findCmsItemBySlotKey(page, key);
    if (!item) return "";
    if (parsed.kind === "itemTitle") return item.title;
    if (parsed.kind === "itemText") return item.text ?? "";
    return "";
  }

  function renderItemCardPanel(itemId: string) {
    const item = page.items.find((row) => row.id === itemId);
    if (!item) {
      return <p className="text-xs text-destructive">카드 데이터를 찾을 수 없습니다. 페이지를 새로고침하세요.</p>;
    }
    const galleryLink = CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug) || slug === "procedure";
    const titleKey = pageSlotItemTitle(slug, itemId);
    const textKey = pageSlotItemText(slug, itemId);
    return (
      <div className="space-y-3">
        {renderTextStyleControls(titleKey)}
        <CmsFieldKo
          multiline
          label={slug === "directions" ? "교통 수단 이름 (한국어)" : "카드 제목 (한국어)"}
          disabled={busy}
          value={item.title}
          onChange={(value) => patchText(titleKey, value)}
        />
        {renderTextStyleControls(textKey)}
        <CmsFieldKo
          multiline
          label="카드 설명 (한국어)"
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
    if (isItemCard && editingItem) {
      return renderItemCardPanel(editingItem.id);
    }
    if (parsedSlot?.kind === "funeralDocPdf" && parsedSlot.funeralDocId) {
      return (
        <ManageFuneralDocPdfPanel
          docId={parsedSlot.funeralDocId}
          disabled={busy}
          onChanged={() => setFrameRev((n) => n + 1)}
        />
      );
    }
    if (!activeMeta) return null;
    const multiline =
      activeMeta.kind === "title" ||
      activeMeta.kind === "lead" ||
      activeMeta.kind === "body" ||
      activeMeta.kind === "itemText" ||
      activeMeta.kind === "itemTitle" ||
      activeMeta.kind === "funeralDocText";
    if (activeMeta.kind === "heroImage") {
      return (
        <ManageImagePicker
          src={page.heroImage ?? ""}
          disabled={busy}
          enableLibrary
          label="상단 배너 배경"
          onFile={(file) => void uploadHeroImage(file)}
          onPickSrc={patchHeroImage}
        />
      );
    }
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
    const styleSlot = isPageCmsTextStyleSlot(activeMeta.kind);
    return (
      <>
        {styleSlot ? renderTextStyleControls(activeKey) : null}
        <CmsFieldKo
          multiline={multiline}
          disabled={busy}
          value={readTextValue(activeKey)}
          onChange={(value) => patchText(activeKey, value)}
          hint={
            activeMeta.kind === "body" || activeMeta.kind === "itemText"
              ? "Enter 한 번: 같은 문단 안 줄바꿈 · 빈 줄(Enter 두 번): 새 문단 · 문단 앞 띄어쓰기도 그대로 반영됩니다."
              : undefined
          }
        />
      </>
    );
  })();

  const lotsHint =
    slug === "burial" || slug === "lawn" || slug === "columbarium"
      ? `사진 격자는 갤러리 「${GALLERY_TAG[slug]}」 태그로 자동 표시됩니다. /manage/gallery 에서 관리하세요.`
      : undefined;

  const panelHint = activeMeta
    ? lotsHint ??
      (isItemCard
        ? "카드 제목·설명을 클릭하거나 우측 상단 「사진」으로 갤러리를 연결하세요."
        : "입력 즉시 왼쪽 미리보기에 반영됩니다. 한글만 저장하면 영·중은 공개에서 자동 처리됩니다.")
    : isItemCard
      ? "카드 제목·설명을 클릭하거나 우측 상단 「사진」으로 갤러리를 연결하세요."
      : undefined;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-background">
      <div className="cms-layout mx-auto w-full max-w-[100rem] flex-1 gap-4 p-3 md:p-4">
        <div className="cms-preview-wrap flex min-h-0 min-w-0 flex-col">
          <iframe ref={iframeRef} key={iframeSrc} title="페이지 미리보기" src={iframeSrc} className="cms-frame flex-1" />
        </div>
        <CmsSlotPanel
          slotKey={activeKey ?? undefined}
          slotSelector={
            activeKey ? (
              <CmsPageSlotSelect
                page={{ ...page, slug }}
                value={activeKey}
                disabled={busy}
                onChange={setActiveKey}
              />
            ) : null
          }
          onSave={() => void save()}
          saveDisabled={busy}
          saving={busy}
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