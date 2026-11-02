import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo } from "./mongo";
import type { Locale } from "./i18n";
import { CONTENT_LOCALES, stillHasHangul, translateText, type ContentLocale } from "./translate-content";

export type NoticeLocaleFields = {
  title: string;
  body: string;
};

export type Notice = {
  slug: string;
  title: string;
  body: string;
  publishedAt: string;
  pinned?: boolean;
  i18n?: Partial<Record<"en" | "zh", NoticeLocaleFields>>;
};

const seedFile = dataFile("notices.json");
const localFile = dataFile("notices.local.json");

function fromDoc(doc: Record<string, unknown>): Notice {
  const published = doc.publishedAt instanceof Date ? doc.publishedAt.toISOString() : String(doc.publishedAt ?? "");
  return {
    slug: String(doc.slug ?? ""),
    title: String(doc.title ?? ""),
    body: String(doc.body ?? ""),
    publishedAt: published,
    pinned: Boolean(doc.pinned),
    i18n: doc.i18n && typeof doc.i18n === "object" ? (doc.i18n as Notice["i18n"]) : undefined,
  };
}

function sortNotices(rows: Notice[]) {
  return [...rows].sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
}

async function fromFiles(): Promise<Notice[]> {
  const seeded = await readJsonFile<Notice[]>(seedFile, []);
  const local = await readJsonFile<Notice[] | null>(localFile, null);
  if (local && local.length) return sortNotices(local);
  return sortNotices(seeded);
}

export async function listNotices(): Promise<Notice[]> {
  if (hasMongo()) {
    try {
      const db = await getDb();
      if (db) {
        const rows = await db.collection("notices").find({}).sort({ pinned: -1, publishedAt: -1 }).toArray();
        if (rows.length) return rows.map((row) => fromDoc(row as Record<string, unknown>));
      }
    } catch (error) {
      console.error("[notices] mongo read failed, using file fallback", error);
    }
  }
  return fromFiles();
}

export async function getNotice(slug: string): Promise<Notice | null> {
  const all = await listNotices();
  return all.find((item) => item.slug === slug) ?? null;
}

export function localizeNotice(notice: Notice, locale: Locale): Notice {
  if (locale === "ko") return notice;
  const loc = notice.i18n?.[locale];
  if (!loc) return notice;
  return {
    ...notice,
    title: loc.title || notice.title,
    body: loc.body || notice.body,
  };
}

function noticeLocaleIncomplete(notice: Notice, locale: ContentLocale) {
  const loc = notice.i18n?.[locale];
  if (!loc?.title) return true;
  return stillHasHangul(`${loc.title}\n${loc.body}`);
}

export async function listNoticesLocalized(locale: Locale): Promise<Notice[]> {
  const all = await listNotices();
  if (locale === "ko") return all;
  const out: Notice[] = [];
  for (const notice of all) {
    let row = notice;
    if (locale === "en" || locale === "zh") {
      if (noticeLocaleIncomplete(row, locale)) {
        try {
          row = { ...row, i18n: await fillNoticeI18n(row, true) };
          await persistNotice(row);
        } catch (error) {
          console.error(`[notices] auto-localize ${row.slug} failed`, error);
        }
      }
    }
    out.push(localizeNotice(row, locale));
  }
  return out;
}

export async function getNoticeLocalized(slug: string, locale: Locale): Promise<Notice | null> {
  const notice = await getNotice(slug);
  if (!notice) return null;
  if (locale === "ko") return notice;
  let row = notice;
  if (locale === "en" || locale === "zh") {
    if (noticeLocaleIncomplete(row, locale)) {
      try {
        row = { ...row, i18n: await fillNoticeI18n(row, true) };
        await persistNotice(row);
      } catch (error) {
        console.error(`[notices] auto-localize ${row.slug} failed`, error);
      }
    }
  }
  return localizeNotice(row, locale);
}

async function buildNoticeLocale(title: string, body: string, to: ContentLocale): Promise<NoticeLocaleFields> {
  return {
    title: await translateText(title, to),
    body: await translateText(body, to),
  };
}

async function seedI18nForSlug(slug: string | undefined): Promise<Notice["i18n"] | undefined> {
  if (!slug) return undefined;
  const seeded = await readJsonFile<Notice[]>(seedFile, []);
  return seeded.find((item) => item.slug === slug)?.i18n;
}

export async function fillNoticeI18n(
  notice: Pick<Notice, "title" | "body" | "i18n"> & { slug?: string },
  force = false,
): Promise<Notice["i18n"]> {
  const i18n: NonNullable<Notice["i18n"]> = { ...(notice.i18n ?? {}) };
  const fromSeed = await seedI18nForSlug(notice.slug);
  for (const to of CONTENT_LOCALES) {
    const seededLoc = fromSeed?.[to];
    if (seededLoc?.title && !stillHasHangul(`${seededLoc.title}\n${seededLoc.body}`)) {
      if (force || !i18n[to]?.title || stillHasHangul(`${i18n[to]?.title}\n${i18n[to]?.body}`)) {
        i18n[to] = seededLoc;
        continue;
      }
    }
    if (!force && i18n[to]?.title && !stillHasHangul(`${i18n[to]?.title}\n${i18n[to]?.body}`)) continue;
    try {
      i18n[to] = await buildNoticeLocale(notice.title, notice.body, to);
    } catch (error) {
      console.error(`[notices] translate ${to} failed`, error);
    }
  }
  return i18n;
}

function slugify(title: string) {
  const ascii = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return ascii || `notice-${Date.now()}`;
}

async function persist(items: Notice[]) {
  if (hasMongo()) {
    const db = await getDb();
    if (!db) throw new Error("데이터베이스에 연결하지 못했습니다.");
    await db.collection("notices").deleteMany({});
    if (items.length) {
      await db.collection("notices").insertMany(
        items.map((item) => ({
          ...item,
          publishedAt: new Date(item.publishedAt),
        })),
      );
    }
    return;
  }
  await writeJsonFile(localFile, items);
}

export function validateNotice(input: { title?: string; body?: string; slug?: string }) {
  const title = input.title?.trim() ?? "";
  const body = input.body?.trim() ?? "";
  if (title.length < 2 || title.length > 120) return "제목을 2자 이상 적어 주세요.";
  if (body.length < 5 || body.length > 8000) return "본문을 조금 더 적어 주세요.";
  if (input.slug && !/^[a-z0-9-]{2,80}$/.test(input.slug)) return "주소(slug)는 영문 소문자·숫자·하이픈만 가능합니다.";
  return null;
}

export async function createNotice(input: { title: string; body: string; slug?: string; pinned?: boolean }) {
  const items = await listNotices();
  let slug = (input.slug?.trim() || slugify(input.title)).toLowerCase();
  if (items.some((item) => item.slug === slug)) slug = `${slug}-${Date.now()}`;
  const notice: Notice = {
    slug,
    title: input.title.trim(),
    body: input.body.trim(),
    publishedAt: new Date().toISOString(),
    pinned: Boolean(input.pinned),
  };
  notice.i18n = await fillNoticeI18n(notice, true);
  items.unshift(notice);
  await persist(items);
  return notice;
}

export async function updateNotice(
  slug: string,
  input: { title?: string; body?: string; pinned?: boolean; nextSlug?: string },
) {
  const items = await listNotices();
  const idx = items.findIndex((item) => item.slug === slug);
  if (idx < 0) return { ok: false as const, error: "공지를 찾지 못했습니다." };
  const nextSlug = input.nextSlug?.trim() || items[idx].slug;
  if (nextSlug !== slug && items.some((item) => item.slug === nextSlug)) {
    return { ok: false as const, error: "이미 있는 주소입니다." };
  }
  const prev = items[idx];
  const title = input.title !== undefined ? input.title.trim() : prev.title;
  const body = input.body !== undefined ? input.body.trim() : prev.body;
  const contentChanged = title !== prev.title || body !== prev.body;
  const next: Notice = {
    ...prev,
    slug: nextSlug,
    title,
    body,
    pinned: input.pinned !== undefined ? input.pinned : prev.pinned,
  };
  if (contentChanged) {
    next.i18n = await fillNoticeI18n(next, true);
  }
  items[idx] = next;
  await persist(items);
  return { ok: true as const, notice: items[idx] };
}

export async function deleteNotice(slug: string) {
  const items = await listNotices();
  const next = items.filter((item) => item.slug !== slug);
  if (next.length === items.length) return { ok: false as const, error: "공지를 찾지 못했습니다." };
  await persist(next);
  return { ok: true as const };
}

export async function persistNotice(notice: Notice) {
  const items = await listNotices();
  const idx = items.findIndex((item) => item.slug === notice.slug);
  if (idx >= 0) items[idx] = notice;
  else items.unshift(notice);
  await persist(items);
}
