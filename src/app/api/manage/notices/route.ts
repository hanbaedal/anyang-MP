import { NextResponse } from "next/server";
import { createNotice, deleteNotice, listNotices, updateNotice, validateNotice } from "@/lib/notices";
import { requireStaffApi } from "@/lib/manage-guard";

export async function GET() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  return NextResponse.json({ ok: true, items: await listNotices() });
}

export async function POST(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const body = (await request.json()) as { title?: string; body?: string; slug?: string; pinned?: boolean };
  const error = validateNotice(body);
  if (error) return NextResponse.json({ ok: false, error }, { status: 400 });
  const notice = await createNotice({
    title: body.title!,
    body: body.body!,
    slug: body.slug,
    pinned: body.pinned,
  });
  return NextResponse.json({ ok: true, notice });
}

export async function PATCH(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const body = (await request.json()) as {
    slug?: string;
    title?: string;
    body?: string;
    pinned?: boolean;
    nextSlug?: string;
  };
  if (!body.slug) return NextResponse.json({ ok: false, error: "공지가 없습니다." }, { status: 400 });
  const error = validateNotice({ title: body.title, body: body.body, slug: body.nextSlug });
  if (error && (body.title || body.body)) return NextResponse.json({ ok: false, error }, { status: 400 });
  const result = await updateNotice(body.slug, body);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const slug = new URL(request.url).searchParams.get("slug") ?? "";
  const result = await deleteNotice(slug);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
