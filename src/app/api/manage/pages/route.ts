import { NextResponse } from "next/server";
import { getCmsPageOrDefault, isCmsSlug, saveCmsPage, type CmsItem } from "@/lib/cms";
import { requireStaffApi } from "@/lib/manage-guard";

export async function GET(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  if (!isCmsSlug(slug)) return NextResponse.json({ ok: false, error: "잘못된 페이지입니다." }, { status: 400 });
  const page = await getCmsPageOrDefault(slug);
  return NextResponse.json({ ok: true, page });
}

export async function PUT(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  let body: { slug?: string; title?: string; lead?: string; body?: string; bodyImage?: string; items?: CmsItem[] };
  try {
    const raw = await request.text();
    if (!raw.trim()) {
      return NextResponse.json({ ok: false, error: "저장 데이터가 비어 있습니다. 다시 시도해 주세요." }, { status: 400 });
    }
    body = JSON.parse(raw) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "잘못된 요청입니다." }, { status: 400 });
  }
  if (!body || typeof body !== "object" || !body.slug || !isCmsSlug(body.slug)) {
    return NextResponse.json({ ok: false, error: "잘못된 페이지입니다." }, { status: 400 });
  }
  try {
    const page = await saveCmsPage({
      slug: body.slug,
      title: body.title ?? "",
      lead: body.lead ?? "",
      body: body.body ?? "",
      bodyImage: body.bodyImage ?? "",
      items: Array.isArray(body.items) ? body.items : [],
    });
    return NextResponse.json({ ok: true, page });
  } catch (error) {
    console.error("[cms] save failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
