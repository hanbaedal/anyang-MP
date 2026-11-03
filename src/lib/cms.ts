import { randomUUID } from "node:crypto";
import { BURIAL, COLUMBARIUM, LAWN, REMODEL_TYPES } from "./content";
import { MESSAGES, type Locale } from "./i18n";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";
import { FEATURES, SALE_STEPS, SITE } from "./site";
import { PRICES, REMAINING } from "./facts";
import { type CmsItem, type CmsLocaleFields, type CmsPage, type CmsSlug } from "./cms-types";
import { CONTENT_LOCALES, stillHasHangul, translateText, type ContentLocale } from "./translate-content";

export { CMS_SLUGS, isCmsSlug, type CmsItem, type CmsPage, type CmsSlug } from "./cms-types";

const localFile = dataFile("cms.local.json");
const ko = MESSAGES.ko;

function nid() {
  return randomUUID();
}

export function defaultCmsPage(slug: CmsSlug): CmsPage {
  const now = new Date().toISOString();
  if (slug === "greeting") {
    const sign = ko["greeting.signDated"] || ko["greeting.sign"];
    return {
      slug,
      title: ko["greeting.title"],
      lead: ko["greeting.lead"],
      body: [ko["greeting.p1"], ko["greeting.p2"], ko["greeting.p3"], ko["greeting.thanks"], sign].join("\n\n"),
      items: [],
      updatedAt: now,
    };
  }
  if (slug === "features") {
    return {
      slug,
      title: ko["features.title"],
      lead: ko["features.lead"],
      body: "",
      items: FEATURES.map((feature) => ({
        id: nid(),
        title: ko[feature.titleKey],
        text: ko[feature.bodyKey],
        image: feature.image,
      })),
      updatedAt: now,
    };
  }
  if (slug === "directions") {
    return {
      slug,
      title: ko["dir.title"],
      lead: "",
      body: "",
      // AMP-64: 자가용·버스·택시만 (주소 항목 없음 — 공개는 SITE.address)
      items: [
        { id: nid(), title: ko["dir.car"], text: ko["dir.carBody"], image: "", galleryId: "" },
        { id: nid(), title: ko["dir.bus"], text: ko["dir.busBody"], image: "", galleryId: "" },
        { id: nid(), title: ko["dir.taxi"], text: ko["dir.taxiBody"], image: "", galleryId: "" },
      ],
      updatedAt: now,
    };
  }
  if (slug === "burial") {
    return {
      slug,
      title: ko["burial.title"],
      lead: ko["burial.lead"],
      body: ko["burial.body"],
      items: BURIAL.map((item) => ({ id: nid(), title: item.title, text: item.caption, image: item.image })),
      updatedAt: now,
    };
  }
  if (slug === "lawn") {
    return {
      slug,
      title: ko["lawn.title"],
      lead: ko["lawn.lead"],
      body: ko["lawn.body"],
      items: LAWN.map((item) => ({ id: nid(), title: item.title, image: item.image })),
      updatedAt: now,
    };
  }
  if (slug === "columbarium") {
    return {
      slug,
      title: ko["col.title"],
      lead: ko["col.lead"],
      body: ko["col.body"],
      items: COLUMBARIUM.map((item) => ({ id: nid(), title: item.title, image: item.image })),
      updatedAt: now,
    };
  }
  if (slug === "remodeling") {
    return {
      slug,
      title: ko["remodel.title"],
      lead: ko["remodel.lead"],
      body: [ko["remodel.body"], ko["remodel.cost"]].join("\n\n"),
      items: REMODEL_TYPES.map((item) => ({ id: nid(), title: item.title, text: item.text, image: item.image })),
      updatedAt: now,
    };
  }
  if (slug === "prices") {
    return {
      slug,
      title: ko["prices.title"],
      lead: ko["prices.lead"],
      body: ko["prices.deposit"],
      items: [
        ...PRICES.map((row) => ({ id: nid(), title: ko[row.nameKey], won: "" })),
        ...REMAINING.map((row) => ({ id: nid(), title: ko[row.nameKey], remaining: "" })),
      ],
      updatedAt: now,
    };
  }
  if (slug === "procedure") {
    return {
      slug,
      title: ko["proc.title"],
      lead: ko["proc.lead"],
      body: [
        `${ko["proc.consult"]} ${ko["proc.form"]}${ko["proc.consultEnd"]}`,
        ko["proc.account"],
        ko["proc.twoDays"],
      ].join("\n\n"),
      items: SALE_STEPS.map((step) => ({
        id: nid(),
        title: ko[step.titleKey],
        text: ko[step.textKey],
      })),
      updatedAt: now,
    };
  }
  if (slug === "fees") {
    return {
      slug,
      title: ko["fees.title"],
      lead: ko["fees.lead"],
      body: "",
      // AMP-86: 4카드 items + 갤러리 링크 (본문 1칸 폐기)
      items: [
        { id: nid(), title: ko["fees.c1.title"], text: ko["fees.p1"], image: "", galleryId: "" },
        { id: nid(), title: ko["fees.c2.title"], text: ko["fees.p2"], image: "", galleryId: "" },
        { id: nid(), title: ko["fees.c3.title"], text: ko["fees.p3"], image: "", galleryId: "" },
        { id: nid(), title: ko["fees.c4.title"], text: ko["fees.p4"], image: "", galleryId: "" },
      ],
      updatedAt: now,
    };
  }
  if (slug === "services") {
    return {
      slug,
      title: ko["svc.title"],
      lead: ko["svc.lead"],
      body: "",
      // AMP-88: 5카드 items + 갤러리 링크 (fees형)
      items: [
        {
          id: nid(),
          title: ko["svc.reloc.title"],
          text: [ko["svc.reloc.p1"], ko["svc.reloc.p2"]].join("\n\n"),
          image: "",
          galleryId: "",
        },
        { id: nid(), title: ko["svc.stone.title"], text: ko["svc.stone.p1"], image: "", galleryId: "" },
        { id: nid(), title: ko["svc.turf.title"], text: ko["svc.turf.p1"], image: "", galleryId: "" },
        { id: nid(), title: ko["svc.weed.title"], text: ko["svc.weed.p1"], image: "", galleryId: "" },
        { id: nid(), title: ko["svc.design.title"], text: ko["svc.design.p1"], image: "", galleryId: "" },
      ],
      updatedAt: now,
    };
  }
  return {
    slug: "funeral",
    title: ko["fun.title"],
    lead: ko["fun.lead"],
    body: ko["fun.more"],
    // AMP-89: 4단계 카드 + 갤러리 링크 (본문·서류는 카드 아래 유지)
    items: [
      {
        id: nid(),
        title: ko["fun.s1t"],
        text: ko["fun.s1d"].replace("{phone}", SITE.phone),
        image: "",
        galleryId: "",
      },
      { id: nid(), title: ko["fun.s2t"], text: ko["fun.s2d"], image: "", galleryId: "" },
      { id: nid(), title: ko["fun.s3t"], text: ko["fun.s3d"], image: "", galleryId: "" },
      { id: nid(), title: ko["fun.s4t"], text: ko["fun.s4d"], image: "", galleryId: "" },
    ],
    updatedAt: now,
  };
}

const CMS_TITLE_ALIASES: Partial<Record<CmsSlug, string[]>> = {
  services: ["서비스", "Services", "服务"],
  funeral: ["장례·안치", "장례 절차", "Funeral", "Funeral and interment", "葬礼", "葬礼与安葬", "葬礼·安置"],
};

function currentCmsTitle(slug: CmsSlug, title: string) {
  if (CMS_TITLE_ALIASES[slug]?.includes(title)) return defaultCmsPage(slug).title;
  return title;
}

/** 오시는길 CMS에서 주소 중복 항목 제거 (관리·공개 공통). */
const DIRECTIONS_ADDRESS_TITLES = new Set(["주소", "Address", "地址", "dir.alt"]);

export function stripDirectionsAddressItems(items: CmsItem[]): CmsItem[] {
  return items.filter((item) => {
    const title = String(item.title ?? "").trim();
    if (!title) return true;
    if (DIRECTIONS_ADDRESS_TITLES.has(title)) return false;
    if (title === ko["dir.alt"]) return false;
    return true;
  });
}

function sanitizeDirectionsPage(page: CmsPage): CmsPage {
  if (page.slug !== "directions") return page;
  const items = stripDirectionsAddressItems(page.items ?? []);
  const i18n = page.i18n
    ? Object.fromEntries(
        Object.entries(page.i18n).map(([locale, fields]) => [
          locale,
          fields
            ? { ...fields, items: stripDirectionsAddressItems(fields.items ?? []) }
            : fields,
        ]),
      )
    : undefined;
  return { ...page, items, ...(i18n ? { i18n: i18n as CmsPage["i18n"] } : {}) };
}

/** AMP-86/87: body만 있는 옛 관리비 문서 → 4카드 마이그레이션 대상인지 */
export function feesNeedsCardMigration(page: CmsPage): boolean {
  if (page.slug !== "fees") return false;
  return !page.items?.some((item) => item.title.trim() || item.text?.trim());
}

/** AMP-88: 이용안내 — 빈 items이거나 galleryId 미정규화·잔여 body */
export function servicesNeedsCardMigration(page: CmsPage): boolean {
  if (page.slug !== "services") return false;
  if (!page.items?.some((item) => item.title.trim() || item.text?.trim())) return true;
  if (page.body?.trim()) return true;
  return page.items.some((item) => item.galleryId === undefined);
}

/** AMP-89: 이용절차 — 빈 items이거나 galleryId 미정규화 (body는 안내문으로 유지) */
export function funeralNeedsCardMigration(page: CmsPage): boolean {
  if (page.slug !== "funeral") return false;
  if (!page.items?.some((item) => item.title.trim() || item.text?.trim())) return true;
  return page.items.some((item) => item.galleryId === undefined);
}

/** AMP-86: 예전 body 문단 → 4 items (갤러리 링크). 이미 items면 그대로. */
export function ensureFeesCardItems(page: CmsPage): CmsPage {
  if (page.slug !== "fees") return page;
  if (!feesNeedsCardMigration(page)) {
    return { ...page, body: page.items.length ? "" : page.body };
  }
  const blocks = page.body?.trim()
    ? page.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [];
  const titles = [ko["fees.c1.title"], ko["fees.c2.title"], ko["fees.c3.title"], ko["fees.c4.title"]];
  const texts = [ko["fees.p1"], ko["fees.p2"], ko["fees.p3"], ko["fees.p4"]];
  return {
    ...page,
    body: "",
    items: titles.map((title, index) => ({
      id: nid(),
      title,
      text: blocks[index] || texts[index] || "",
      image: "",
      galleryId: "",
    })),
  };
}

/** AMP-88: 이용안내 → 5 items (갤러리 링크). 기존 제목·설명 유지. */
export function ensureServicesCardItems(page: CmsPage): CmsPage {
  if (page.slug !== "services") return page;
  if (page.items?.some((item) => item.title.trim() || item.text?.trim())) {
    return {
      ...page,
      body: "",
      items: page.items.map((item) => ({
        ...item,
        id: item.id || nid(),
        image: String(item.image ?? "").trim(),
        galleryId: String(item.galleryId ?? "").trim(),
      })),
    };
  }
  const defaults = defaultCmsPage("services").items;
  const blocks = page.body?.trim()
    ? page.body
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map((block) => block.trim())
        .filter(Boolean)
    : [];
  return {
    ...page,
    body: "",
    items: defaults.map((item, index) => ({
      ...item,
      id: nid(),
      text: blocks[index] || item.text || "",
      image: "",
      galleryId: "",
    })),
  };
}

/** AMP-89: 이용절차 → 4 items (갤러리 링크). 본문(추가 안내)은 유지. */
export function ensureFuneralCardItems(page: CmsPage): CmsPage {
  if (page.slug !== "funeral") return page;
  if (page.items?.some((item) => item.title.trim() || item.text?.trim())) {
    return {
      ...page,
      items: page.items.map((item) => ({
        ...item,
        id: item.id || nid(),
        image: String(item.image ?? "").trim(),
        galleryId: String(item.galleryId ?? "").trim(),
      })),
    };
  }
  const defaults = defaultCmsPage("funeral").items;
  return {
    ...page,
    items: defaults.map((item) => ({
      ...item,
      id: nid(),
      image: "",
      galleryId: "",
    })),
  };
}

function applyGalleryCardEnsures(page: CmsPage): CmsPage {
  return ensureFuneralCardItems(
    ensureServicesCardItems(ensureFeesCardItems(sanitizeDirectionsPage(page))),
  );
}

function fromDocRaw(doc: Record<string, unknown>): CmsPage {
  const bodyImage = String(doc.bodyImage ?? "").trim();
  const slug = doc.slug as CmsSlug;
  return {
    slug,
    title: currentCmsTitle(slug, String(doc.title ?? "")),
    lead: String(doc.lead ?? ""),
    body: String(doc.body ?? ""),
    items: Array.isArray(doc.items) ? (doc.items as CmsItem[]) : [],
    updatedAt: doc.updatedAt instanceof Date ? doc.updatedAt.toISOString() : String(doc.updatedAt ?? ""),
    ...(bodyImage ? { bodyImage } : {}),
    i18n: doc.i18n && typeof doc.i18n === "object" ? (doc.i18n as CmsPage["i18n"]) : undefined,
  };
}

function fromDoc(doc: Record<string, unknown>): CmsPage {
  return applyGalleryCardEnsures(fromDocRaw(doc));
}

async function readLocal(): Promise<CmsPage[]> {
  return readJsonFile<CmsPage[]>(localFile, []);
}

/** AMP-87/88: 메모리만 마이그레이션하면 관리·DB 어긋남 → 디스크/Mongo에 한 번 저장 */
async function ensureGalleryLinkCardsPersisted(page: CmsPage): Promise<CmsPage> {
  const sanitized = sanitizeDirectionsPage(page);
  const needsPersist =
    feesNeedsCardMigration(sanitized) ||
    servicesNeedsCardMigration(sanitized) ||
    funeralNeedsCardMigration(sanitized);
  const migrated = applyGalleryCardEnsures(sanitized);
  if (!needsPersist) return migrated;
  try {
    await persistCmsPage(migrated);
  } catch (error) {
    console.error("[cms] gallery-link card migration persist failed", error);
  }
  return migrated;
}

export async function getCmsPage(slug: CmsSlug): Promise<CmsPage | null> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const row = await db.collection("cms").findOne({ slug });
        if (row) return ensureGalleryLinkCardsPersisted(fromDocRaw(row as Record<string, unknown>));
      }
    } catch (error) {
      console.error("[cms] mongo read failed", error);
    }
  }
  const all = await readLocal();
  const found = all.find((item) => item.slug === slug);
  if (!found) return null;
  return ensureGalleryLinkCardsPersisted({ ...found, title: currentCmsTitle(found.slug, found.title) });
}

export async function getCmsPageOrDefault(slug: CmsSlug): Promise<CmsPage> {
  const page = (await getCmsPage(slug)) ?? defaultCmsPage(slug);
  return ensureGalleryLinkCardsPersisted(page);
}

function cmsLocaleIncomplete(page: CmsPage, locale: ContentLocale) {
  const loc = page.i18n?.[locale];
  if (!loc?.title) return true;
  if (stillHasHangul([loc.title, loc.lead, loc.body].join("\n"))) return true;
  return (loc.items ?? []).some((item) => stillHasHangul(`${item.title}\n${item.text ?? ""}`));
}

/** 손님 화면용: 로케일에 맞는 제목·본문·항목. 번역이 없거나 한글이 남으면 채운 뒤 저장합니다. */
export async function getCmsPageLocalized(slug: CmsSlug, locale: Locale): Promise<CmsPage> {
  let page = await getCmsPageOrDefault(slug);
  if (locale === "ko") return page;
  if (locale === "en" || locale === "zh") {
    if (cmsLocaleIncomplete(page, locale)) {
      try {
        const base = { slug: page.slug, title: page.title, lead: page.lead, body: page.body, items: page.items };
        const i18n = { ...(page.i18n ?? {}), [locale]: await buildLocaleFields(base, locale) };
        page = { ...page, i18n, updatedAt: new Date().toISOString() };
        await persistCmsPage(page);
      } catch (error) {
        console.error(`[cms] auto-localize ${slug} failed`, error);
      }
    }
  }
  const loc = page.i18n?.[locale as ContentLocale];
  if (!loc) return page;
  return {
    ...page,
    title: loc.title || page.title,
    lead: loc.lead || page.lead,
    body: loc.body || page.body,
    items: loc.items?.length ? loc.items : page.items,
  };
}

async function buildLocaleFields(page: Omit<CmsPage, "updatedAt" | "i18n">, to: ContentLocale): Promise<CmsLocaleFields> {
  const items: CmsItem[] = [];
  for (const item of page.items ?? []) {
    items.push({
      ...item,
      title: item.title ? await translateText(item.title, to) : "",
      text: item.text ? await translateText(item.text, to) : item.text,
    });
  }
  return {
    title: await translateText(page.title, to),
    lead: await translateText(page.lead, to),
    body: await translateText(page.body, to),
    items,
  };
}

export async function fillCmsI18n(page: CmsPage, force = false): Promise<CmsPage["i18n"]> {
  const i18n: NonNullable<CmsPage["i18n"]> = { ...(page.i18n ?? {}) };
  const base = { slug: page.slug, title: page.title, lead: page.lead, body: page.body, items: page.items };
  for (const to of CONTENT_LOCALES) {
    if (!force && i18n[to]?.title) continue;
    try {
      i18n[to] = await buildLocaleFields(base, to);
    } catch (error) {
      console.error(`[cms] translate ${page.slug} ${to} failed`, error);
    }
  }
  return i18n;
}

export async function saveCmsPage(input: Omit<CmsPage, "updatedAt"> & { updatedAt?: string }): Promise<CmsPage> {
  const bodyImage = String(input.bodyImage ?? "").trim();
  const rawItems = (input.items ?? []).map((item) => {
    const image = String(item.image ?? "").trim();
    const galleryId = String(item.galleryId ?? "").trim();
    return {
      id: item.id || nid(),
      title: item.title.trim(),
      text: item.text ?? "",
      image,
      ...(galleryId ? { galleryId } : {}),
      won: item.won,
      remaining: item.remaining,
    };
  });
  const page: CmsPage = sanitizeDirectionsPage({
    slug: input.slug,
    title: input.title.trim(),
    lead: input.lead.trim(),
    body: input.body,
    items: rawItems,
    updatedAt: new Date().toISOString(),
    ...(bodyImage ? { bodyImage } : {}),
  });
  page.i18n = await fillCmsI18n(page, true);

  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    const { bodyImage: _omit, ...rest } = page;
    void _omit;
    const update = page.bodyImage
      ? { $set: { ...page, updatedAt: new Date(page.updatedAt) } }
      : { $set: { ...rest, updatedAt: new Date(page.updatedAt) }, $unset: { bodyImage: "" } };
    await db.collection("cms").updateOne({ slug: page.slug }, update, { upsert: true });
    return page;
  }

  const all = await readLocal();
  const idx = all.findIndex((item) => item.slug === page.slug);
  if (idx >= 0) all[idx] = page;
  else all.push(page);
  await writeJsonFile(localFile, all);
  return page;
}

export async function listCmsPages(): Promise<CmsPage[]> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const rows = await db.collection("cms").find({}).toArray();
        if (rows.length) return rows.map((row) => fromDoc(row as Record<string, unknown>));
      }
    } catch (error) {
      console.error("[cms] mongo list failed", error);
    }
  }
  return readLocal();
}

export async function persistCmsPage(page: CmsPage) {
  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    await db.collection("cms").updateOne({ slug: page.slug }, { $set: { ...page, updatedAt: new Date(page.updatedAt) } }, { upsert: true });
    return;
  }
  const all = await readLocal();
  const idx = all.findIndex((item) => item.slug === page.slug);
  if (idx >= 0) all[idx] = page;
  else all.push(page);
  await writeJsonFile(localFile, all);
}
