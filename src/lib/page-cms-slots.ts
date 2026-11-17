import type { CmsPage, FuneralDocsKoField } from "@/lib/cms-types";
import { CMS_GALLERY_LINK_ITEM_SLUGS } from "@/lib/cms-types";
import {
  FUNERAL_DOCS_KO_FIELDS,
  FUNERAL_DOCS_SLOT_LABELS,
  pageSlotFuneralDocPdf,
  pageSlotFuneralDocsField,
} from "@/lib/funeral-docs-cms";
import { FUNERAL_DOC_IDS, FUNERAL_DOC_META, type FuneralDocId } from "@/lib/funeral-docs-types";
import { MANAGE_VISUAL_CMS_SLUGS, type ManageVisualCmsSlug } from "@/lib/manage-visual-pages";

export type PageCmsSlotKind =
  | "title"
  | "lead"
  | "body"
  | "heroImage"
  | "bodyImage"
  | "itemTitle"
  | "itemText"
  | "itemImage"
  | "funeralDocText"
  | "funeralDocPdf";

const PAGE_TEXT_STYLE_KINDS = new Set<PageCmsSlotKind>([
  "title",
  "lead",
  "body",
  "itemTitle",
  "itemText",
  "funeralDocText",
]);

export function isPageCmsTextStyleSlot(kind: PageCmsSlotKind) {
  return PAGE_TEXT_STYLE_KINDS.has(kind);
}

export type PageCmsSlotMeta = {
  label: string;
  kind: PageCmsSlotKind;
  slug: ManageVisualCmsSlug;
  itemId?: string;
  funeralDocField?: FuneralDocsKoField;
  funeralDocId?: FuneralDocId;
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
export function pageSlotHeroImage(slug: string) {
  return `page.${slug}.heroImage`;
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
const HERO_MENU_SLUGS = new Set<string>(MANAGE_VISUAL_CMS_SLUGS);

export function buildPageCmsSlotMeta(page: CmsPage): Record<string, PageCmsSlotMeta> {
  const slug = page.slug as ManageVisualCmsSlug;
  const menuHero = HERO_MENU_SLUGS.has(slug);
  const titleLabel = menuHero ? "제목" : "페이지 제목";
  const leadLabel = menuHero ? "요약" : "페이지 요약";
  const meta: Record<string, PageCmsSlotMeta> = {
    [pageSlotTitle(slug)]: { label: titleLabel, kind: "title", slug },
    [pageSlotLead(slug)]: { label: leadLabel, kind: "lead", slug },
  };

  if (menuHero) {
    meta[pageSlotHeroImage(slug)] = { label: "상단 배경", kind: "heroImage", slug };
  }

  if (LOTS_SLUGS.has(slug) || slug === "procedure" || slug === "funeral") {
    meta[pageSlotBody(slug)] = { label: "본문", kind: "body", slug };
  }
  if (slug === "greeting") {
    meta[pageSlotBodyImage(slug)] = { label: "본문 사진", kind: "bodyImage", slug };
    meta[pageSlotBody(slug)] = { label: "본문", kind: "body", slug };
  }

  const galleryLink = CMS_GALLERY_LINK_ITEM_SLUGS.includes(slug);
  const directions = slug === "directions";

  if (slug === "funeral") {
    for (const field of FUNERAL_DOCS_KO_FIELDS) {
      meta[pageSlotFuneralDocsField(slug, field)] = {
        label: FUNERAL_DOCS_SLOT_LABELS[field],
        kind: "funeralDocText",
        slug,
        funeralDocField: field,
      };
    }
    for (const docId of FUNERAL_DOC_IDS) {
      meta[pageSlotFuneralDocPdf(docId)] = {
        label: `${FUNERAL_DOC_META[docId].manageLabel} · PDF`,
        kind: "funeralDocPdf",
        slug,
        funeralDocId: docId,
      };
    }
  }

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

  const heroImgM = /^page\.([a-z]+)\.heroImage$/.exec(key);
  if (heroImgM) return { label: "", kind: "heroImage", slug: heroImgM[1] as ManageVisualCmsSlug };

  const imgM = /^page\.([a-z]+)\.bodyImage$/.exec(key);
  if (imgM) return { label: "", kind: "bodyImage", slug: imgM[1] as ManageVisualCmsSlug };

  const funeralPdfM = /^page\.funeral\.docs\.pdf\.(death|family|police|cremation)$/.exec(key);
  if (funeralPdfM) {
    return {
      label: "",
      kind: "funeralDocPdf",
      slug: "funeral",
      funeralDocId: funeralPdfM[1] as FuneralDocId,
    };
  }

  const funeralTextM = /^page\.funeral\.docs\.(burialTitle|cremationTitle|hint|death|family|idLine|police|cremation)$/.exec(
    key,
  );
  if (funeralTextM) {
    return {
      label: "",
      kind: "funeralDocText",
      slug: "funeral",
      funeralDocField: funeralTextM[1] as FuneralDocsKoField,
    };
  }

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