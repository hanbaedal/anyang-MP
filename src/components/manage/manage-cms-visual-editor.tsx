"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { DirectionsMap } from "@/components/directions-map";
import { FeaturesPhotoGrid, type FeaturePhotoItem } from "@/components/features-photo-grid";
import { LotsPhotoGrid, type LotsPhotoItem } from "@/components/lots-photo-grid";
import { ManageCmsItemEditor } from "@/components/manage/manage-cms-item-editor";
import { ManageEditToolbar } from "@/components/manage/manage-edit-toolbar";
import { ManageEditableIntro } from "@/components/manage/manage-editable-intro";
import { ManageImagePicker } from "@/components/manage-image-picker";
import { Paragraphs } from "@/components/paragraphs";
import { PastelBox } from "@/components/pastel-box";
import { Prose } from "@/components/page-hero";
import { SaleSteps } from "@/components/sale-steps";
import { ServicesAttachedCards } from "@/components/services-attached-cards";
import type { CmsItem, CmsPage } from "@/lib/cms-types";
import { uploadOriginalUrl } from "@/lib/media";
import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";

const bodyArea =
  "min-h-[10rem] w-full resize-y rounded-lg border border-dashed border-[color:var(--pastel-chrome-border)] bg-[#fffcf7]/50 px-3 py-2 text-[15px] leading-7 text-[color:var(--pastel-chrome-fg)] outline-none focus:border-primary/40";

const GALLERY_TAG: Partial<Record<ManageVisualCmsSlug, string>> = {
  burial: "매장묘",
  lawn: "평장묘",
  columbarium: "봉안묘",
};

export function ManageCmsVisualEditor({
  initial,
  lotsPreviewItems = [],
}: {
  initial: CmsPage;
  lotsPreviewItems?: LotsPhotoItem[];
}) {
  const [page, setPage] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "ok" | "error" | "busy">("idle");
  const [message, setMessage] = useState("");
  const pageRef = useRef(page);
  const slug = page.slug as ManageVisualCmsSlug;
  const directionsPage = slug === "directions";
  const galleryDriven = slug === "burial" || slug === "lawn" || slug === "columbarium";

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  function patchItem(id: string, patch: Partial<CmsItem>) {
    setPage((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
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
        heroImage: snapshot.heroImage ?? "",
        items: snapshot.items ?? [],
        textStyles: snapshot.textStyles,
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
    setMessage("저장했습니다. 공개에 바로 반영되며, 영어·중국어는 백그라운드에서 자동 번역됩니다.");
    return true;
  }, []);

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      await putPage(page);
    } catch {
      setStatus("error");
      setMessage("네트워크 오류입니다.");
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
        setPage((prev) => ({ ...prev, bodyImage: json.src }));
        setMessage("본문 사진을 올렸습니다. 저장을 눌러 반영하세요.");
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

  const busy = status === "saving" || status === "busy";
  const gridItems: FeaturePhotoItem[] = page.items.map((item) => ({
    id: item.id,
    title: item.title,
    text: item.text,
    image: item.image?.trim() || undefined,
  }));

  const steps = page.items.map((item, index) => ({
    n: String(index + 1),
    id: item.id,
    title: item.title,
    text: item.text ?? "",
    image: item.image?.trim() || undefined,
  }));

  const bodyImage = page.bodyImage?.trim() || "";
  const imageSrc = bodyImage ? uploadOriginalUrl(bodyImage) : "";

  return (
    <div className="flex min-h-full flex-col bg-background">
      <ManageEditToolbar
        busy={busy}
        message={message}
        status={status}
        onSave={() => void save()}
        hint={
          galleryDriven
            ? `사진은 갤러리 「${GALLERY_TAG[slug]}」 태그로 표시됩니다.`
            : directionsPage
              ? "지도·주소는 정적입니다. 교통 카드만 수정하세요."
              : undefined
        }
      />
      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 md:max-w-7xl md:py-10">
        {slug === "directions" ? (
          <div className="space-y-4">
            <PastelBox>
              <ManageEditableIntro
                title={page.title}
                lead={page.lead}
                onTitle={(title) => setPage((p) => ({ ...p, title }))}
                onLead={(lead) => setPage((p) => ({ ...p, lead }))}
              />
            </PastelBox>
            <div className="min-h-[14rem] overflow-hidden rounded-xl border">
              <DirectionsMap />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {page.items.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <FeaturesPhotoGrid
                    className="md:grid-cols-1"
                    dense
                    titleBar
                    items={[
                      {
                        id: item.id,
                        title: item.title,
                        text: item.text,
                        image: item.image?.trim() || undefined,
                      },
                    ]}
                  />
                  <ManageCmsItemEditor
                    slug={slug}
                    item={item}
                    index={index}
                    busy={busy}
                    directionsPage
                    onPatch={(patch) => patchItem(item.id, patch)}
                    onMessage={setMessage}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : slug === "greeting" ? (
          <PastelBox>
            <ManageEditableIntro
              title={page.title}
              lead={page.lead}
              onTitle={(title) => setPage((p) => ({ ...p, title }))}
              onLead={(lead) => setPage((p) => ({ ...p, lead }))}
            />
            <div
              className={
                imageSrc
                  ? "grid gap-6 md:grid-cols-[minmax(0,18rem)_minmax(0,1fr)] md:items-start"
                  : "space-y-4"
              }
            >
              {imageSrc ? (
                <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-lg bg-black/5 md:mx-0">
                  <Image src={imageSrc} alt="" fill className="object-cover" sizes="18rem" unoptimized />
                </div>
              ) : null}
              <div className="space-y-3">
                {!imageSrc ? (
                  <ManageImagePicker
                    src=""
                    disabled={busy}
                    enableLibrary
                    label="본문 좌측 사진"
                    onFile={uploadBodyImage}
                    onPickSrc={(src) => {
                      setPage((p) => ({ ...p, bodyImage: src }));
                      setMessage("사진을 골랐습니다. 저장을 눌러 반영하세요.");
                    }}
                  />
                ) : (
                  <ManageImagePicker
                    src={bodyImage}
                    disabled={busy}
                    enableLibrary
                    label="본문 사진 바꾸기"
                    onFile={uploadBodyImage}
                    onPickSrc={(src) => setPage((p) => ({ ...p, bodyImage: src }))}
                  />
                )}
                <label className="block space-y-1">
                  <span className="text-xs text-[color:var(--pastel-chrome-fg)]/70">본문</span>
                  <textarea
                    className={bodyArea}
                    value={page.body}
                    disabled={busy}
                    onChange={(e) => setPage((p) => ({ ...p, body: e.target.value }))}
                  />
                </label>
                {page.body.trim() ? (
                  <Prose className="max-w-none border-t border-dashed pt-4 text-[color:var(--pastel-chrome-fg)]/80">
                    <p className="mb-2 text-xs">미리보기</p>
                    <Paragraphs text={page.body} />
                  </Prose>
                ) : null}
              </div>
            </div>
          </PastelBox>
        ) : slug === "procedure" ? (
          <div className="pc-soft-card-fill space-y-6">
            <PastelBox>
              <ManageEditableIntro
                title={page.title}
                lead={page.lead}
                onTitle={(title) => setPage((p) => ({ ...p, title }))}
                onLead={(lead) => setPage((p) => ({ ...p, lead }))}
              />
            </PastelBox>
            <SaleSteps
              variant="orbs"
              steps={steps}
              cmsSlug="procedure"
              cmsTextStyles={page.textStyles}
              aside={
                <PastelBox className="min-h-[8rem] p-4">
                  <p className="mb-2 text-xs font-medium text-[color:var(--pastel-chrome-fg)]/70">5단계 옆 안내 (본문)</p>
                  <textarea
                    className={bodyArea}
                    value={page.body}
                    disabled={busy}
                    onChange={(e) => setPage((p) => ({ ...p, body: e.target.value }))}
                  />
                </PastelBox>
              }
            />
            <div className="grid gap-4 md:grid-cols-2">
              {page.items.map((item, index) => (
                <ManageCmsItemEditor
                  key={item.id}
                  slug={slug}
                  item={item}
                  index={index}
                  busy={busy}
                  onPatch={(patch) => patchItem(item.id, patch)}
                  onMessage={setMessage}
                />
              ))}
            </div>
          </div>
        ) : galleryDriven ? (
          <div className="space-y-6">
            <div className="space-y-3">
              <ManageEditableIntro
                title={page.title}
                lead={page.lead}
                onTitle={(title) => setPage((p) => ({ ...p, title }))}
                onLead={(lead) => setPage((p) => ({ ...p, lead }))}
              />
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">본문</span>
                <textarea
                  className={cnBodyArea()}
                  value={page.body}
                  disabled={busy}
                  onChange={(e) => setPage((p) => ({ ...p, body: e.target.value }))}
                />
              </label>
            </div>
            <LotsPhotoGrid items={lotsPreviewItems} layout="detail" emptyLabel="갤러리에 해당 태그 사진을 올리면 여기에 보입니다." />
          </div>
        ) : slug === "services" ? (
          <div className="pc-soft-card-fill space-y-6">
            <PastelBox>
              <ManageEditableIntro
                title={page.title}
                lead={page.lead}
                onTitle={(title) => setPage((p) => ({ ...p, title }))}
                onLead={(lead) => setPage((p) => ({ ...p, lead }))}
              />
            </PastelBox>
            <ServicesAttachedCards items={gridItems} cmsSlug="services" cmsTextStyles={page.textStyles} />
            <div className="grid gap-4 md:grid-cols-2">
              {page.items.map((item, index) => (
                <ManageCmsItemEditor
                  key={item.id}
                  slug={slug}
                  item={item}
                  index={index}
                  busy={busy}
                  onPatch={(patch) => patchItem(item.id, patch)}
                  onMessage={setMessage}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="pc-soft-card-fill space-y-6">
            <PastelBox>
              <ManageEditableIntro
                title={page.title}
                lead={page.lead}
                onTitle={(title) => setPage((p) => ({ ...p, title }))}
                onLead={(lead) => setPage((p) => ({ ...p, lead }))}
              />
            </PastelBox>
            <div className="grid gap-6 md:grid-cols-2">
              {page.items.map((item, index) => (
                <div key={item.id} className="space-y-2">
                  <FeaturesPhotoGrid items={[gridItems[index]!]} featureRainbow={slug === "features"} />
                  <ManageCmsItemEditor
                    slug={slug}
                    item={item}
                    index={index}
                    busy={busy}
                    onPatch={(patch) => patchItem(item.id, patch)}
                    onMessage={setMessage}
                  />
                </div>
              ))}
            </div>
            {slug === "funeral" ? (
              <PastelBox className="space-y-2">
                <p className="text-xs font-medium text-[color:var(--pastel-chrome-fg)]/70">카드 아래 안내 본문</p>
                <textarea
                  className={bodyArea}
                  value={page.body}
                  disabled={busy}
                  onChange={(e) => setPage((p) => ({ ...p, body: e.target.value }))}
                />
              </PastelBox>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

function cnBodyArea() {
  return bodyArea + " mt-4";
}