import { NextResponse } from "next/server";
import { addGalleryPhoto, deleteGalleryPhoto, GALLERY_TAGS, listGallery, updateGalleryPhoto } from "@/lib/gallery";
import type { GalleryTag } from "@/lib/content";
import { requireStaffApi } from "@/lib/manage-guard";
import { saveManageUpload } from "@/lib/manage-image-upload";

export async function GET() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  return NextResponse.json({ ok: true, items: await listGallery() });
}

function parseTags(raw: unknown): GalleryTag[] {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? raw.split(",") : [];
  return list.filter((tag): tag is GalleryTag => GALLERY_TAGS.includes(tag as GalleryTag));
}

export async function POST(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  try {
    const form = await request.formData();
    const file = form.get("file");
    const alt = String(form.get("alt") ?? "");
    const tags = parseTags(form.get("tags"));
    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "사진 파일을 선택해 주세요." }, { status: 400 });
    }
    const saved = await saveManageUpload(file);
    if (!saved.ok) return NextResponse.json(saved, { status: 400 });
    const photo = await addGalleryPhoto({ src: saved.src, alt, tags });
    return NextResponse.json({ ok: true, photo });
  } catch (error) {
    console.error("[manage/gallery] POST failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "갤러리 저장에 실패했습니다." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const body = (await request.json()) as { id?: string; alt?: string; tags?: string[] };
  if (!body.id) return NextResponse.json({ ok: false, error: "사진이 없습니다." }, { status: 400 });
  const result = await updateGalleryPhoto(body.id, { alt: body.alt, tags: parseTags(body.tags) });
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}

export async function DELETE(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  const id = new URL(request.url).searchParams.get("id") ?? "";
  const result = await deleteGalleryPhoto(id);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  return NextResponse.json(result);
}
