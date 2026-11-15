import type { CmsPage } from "@/lib/cms-types";
import { CMS_GALLERY_LINK_ITEM_SLUGS } from "@/lib/cms-types";
import type { ManageVisualCmsSlug } from "@/lib/manage-visual-pages";

export type PageCmsSlotKind = "title" | "lead" | "body" | "bodyImage" | "itemTitle" | "itemText" | "itemImage";

export type PageCmsSlotMeta = {
  label: string;
  kind: PageCmsSlotKind;
  slug: ManageVisualCmsSlug;
  itemId?: string;
};

export function pageSlotTitle(slug: string) {
  return `page.${slug}.title`;
}
export function pageSlotLead(slug: string) {
  return `page.${slug}.lead`;
}
export function pageSlotBody(slug: string) {
  return `page.${slug}.body`;
}
export function pageSlotBodyImage(slug: string) {
  return `page.${slug}.bodyImage`;
}
export function pageSlotItemTitle(slug: string, itemId: string) {
  return `page.${slug}.item.${itemId}.title`;
}
export function pageSlotItemText(slug: string, itemId: string) {
  return `page.${slug}.item.${itemId}.text`;
}
export function pageSlotItemImage(slug: string, itemId: string) {
  return `page.${slug}.item.${itemId}.image`;
}

const LOTS_SLUGS = new Set<ManageVisualCmsSlug>(["burial", "lawn", "columbarium"]);

export function buildPageCmsSlotMeta(page: CmsPage): Record<string, PageCmsSlotMeta> {
  const slug = page.slug as ManageVisualCmsSlug;
  const meta: Record<string, PageCmsSlotMeta> = {
    [pageSlotTitle(slug)]: { label: "페이지 제목", kind: "title", slug },
    [pageSlotLead(slug)]: { label: "페이지 요약", kind: "lead", slug },
  };

  if (LOTS_SLUGS.has(slug) || slug === "procedure" || slug === "funeral") {
    meta[pageSlotBody(slug)] = { label: "본문", kind: "body", slug };
  }
  if (slug === "greeting") {
    meta[pageSlotBodyImage(slug)] = { label: "본문 사진", kind: "bodyImage", slug };
    meta[pageSlotBody(slug)] = { label: "본문", kind: "body", slug };
  }

  const galleryLink = CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug);
  const directions = slug === "directions";

  page.items.forEach((item, index) => {
    meta[pageSlotItemTitle(slug, item.id)] = {
      label: directions ? `교통 ${index + 1} 제목` : `항목 ${index + 1} 제목`,
      kind: "itemTitle",
      slug,
      itemId: item.id,
    };
    meta[pageSlotItemText(slug, item.id)] = {
      label: directions ? `교통 ${index + 1} 설명` : `항목 ${index + 1} 설명`,
      kind: "itemText",
      slug,
      itemId: item.id,
    };
    if (galleryLink || slug === "procedure") {
      meta[pageSlotItemImage(slug, item.id)] = {
        label: directions ? `교통 ${index + 1} 사진` : `항목 ${index + 1} 사진`,
        kind: "itemImage",
        slug,
        itemId: item.id,
      };
    }
  });

  return meta;
}

/** item id에 점(.)이 있어도 파싱 — 예: dir.car */
export function parsePageCmsSlotKey(key: string): PageCmsSlotMeta | null {
  const titleM = /^page\.([a-z]+)\.title$/.exec(key);
  if (titleM) return { label: "", kind: "title", slug: titleM[1] as ManageVisualCmsSlug };

  const leadM = /^page\.([a-z]+)\.lead$/.exec(key);
  if (leadM) return { label: "", kind: "lead", slug: leadM[1] as ManageVisualCmsSlug };

  const bodyM = /^page\.([a-z]+)\.body$/.exec(key);
  if (bodyM) return { label: "", kind: "body", slug: bodyM[1] as ManageVisualCmsSlug };

  const imgM = /^page\.([a-z]+)\.bodyImage$/.exec(key);
  if (imgM) return { label: "", kind: "bodyImage", slug: imgM[1] as ManageVisualCmsSlug };

  const itemM = /^page\.([a-z]+)\.item\.(.+)\.(title|text|image)$/.exec(key);
  if (!itemM) return null;
  const kind: PageCmsSlotKind =
    itemM[3] === "title" ? "itemTitle" : itemM[3] === "text" ? "itemText" : "itemImage";
  return {
    label: "",
    kind,
    slug: itemM[1] as ManageVisualCmsSlug,
    itemId: itemM[2],
  };
}

export function findCmsItemBySlotKey(page: CmsPage, key: string) {
  const parsed = parsePageCmsSlotKey(key);
  if (!parsed?.itemId) return null;
  return page.items.find((row) => row.id === parsed.itemId) ?? null;
}

export function isItemCardSlotKind(kind: PageCmsSlotKind) {
  return kind === "itemTitle" || kind === "itemText" || kind === "itemImage";
}