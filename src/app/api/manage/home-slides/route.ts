import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getHomeIntroSlidesSettingsForWrite,
  HOME_INTRO_SLIDES_MAX,
  removeHomeIntroSlideFile,
  saveHomeIntroSlidesSettings,
  type HomeIntroSlide,
} from "@/lib/home-intro-slides";
import { saveManageUpload } from "@/lib/manage-image-upload";
import { requireStaffApi } from "@/lib/manage-guard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  try {
    const settings = await getHomeIntroSlidesSettingsForWrite();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[home-slides] get failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "설정을 불러오지 못했습니다." },
      { status: 503 },
    );
  }
}

/** multipart: 파일 업로드 후 목록에 추가하고 저장 */
export async function POST(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;

  let form: FormData;
  try {
    form = await request.formData();
  } catch (error) {
    console.error("[home-slides] formData failed", error);
    return NextResponse.json(
      { ok: false, error: "업로드가 끊겼거나 파일이 너무 큽니다. 다시 시도해 주세요." },
      { status: 413 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File) || file.size < 1) {
    return NextResponse.json({ ok: false, error: "사진 파일을 선택해 주세요." }, { status: 400 });
  }

  let current;
  try {
    current = await getHomeIntroSlidesSettingsForWrite();
  } catch (error) {
    console.error("[home-slides] pre-upload read failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "설정을 읽지 못했습니다." },
      { status: 503 },
    );
  }

  if (current.slides.length >= HOME_INTRO_SLIDES_MAX) {
    return NextResponse.json(
      {
        ok: false,
        error: `이미지는 최대 ${HOME_INTRO_SLIDES_MAX}장까지 등록할 수 있습니다. 하나를 삭제한 뒤 추가해 주세요.`,
      },
      { status: 400 },
    );
  }

  const saved = await saveManageUpload(file);
  if (!saved.ok) return NextResponse.json(saved, { status: 400 });

  const alt = String(form.get("alt") || "").trim();
  const nextSlide: HomeIntroSlide = {
    id: randomUUID(),
    src: saved.src,
    alt: alt.slice(0, 80) || `메인 전경 ${current.slides.length + 1}`,
    sort: current.slides.length,
    createdAt: new Date().toISOString(),
  };

  try {
    const settings = await saveHomeIntroSlidesSettings({
      ...current,
      slides: [...current.slides, nextSlide],
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[home-slides] save after upload failed", error);
    await removeHomeIntroSlideFile(saved.src);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}

/** JSON: 전체 목록 저장(순서·alt) 또는 삭제 */
export async function PUT(request: Request) {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;

  let body: { slides?: unknown };
  try {
    body = (await request.json()) as { slides?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "요청 본문이 올바르지 않습니다." }, { status: 400 });
  }

  if (!Array.isArray(body.slides)) {
    return NextResponse.json({ ok: false, error: "slides 배열이 필요합니다." }, { status: 400 });
  }

  let current;
  try {
    current = await getHomeIntroSlidesSettingsForWrite();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "설정을 읽지 못했습니다." },
      { status: 503 },
    );
  }

  const prevById = new Map(current.slides.map((s) => [s.id, s]));
  const nextIds = new Set<string>();
  const nextSlides: HomeIntroSlide[] = [];

  for (const raw of body.slides) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const id = String(row.id || "");
    const prev = prevById.get(id);
    const src = prev?.src ?? String(row.src ?? "");
    if (!prev && !src.startsWith("/uploads/") && !src.startsWith("/api/uploads/")) continue;
    if (nextSlides.length >= HOME_INTRO_SLIDES_MAX) break;
    nextIds.add(id || src);
    nextSlides.push({
      id: id || randomUUID(),
      src: prev?.src ?? src,
      alt: String(row.alt ?? prev?.alt ?? "").trim().slice(0, 80) || `메인 전경 ${nextSlides.length + 1}`,
      sort: nextSlides.length,
      createdAt: prev?.createdAt ?? new Date().toISOString(),
    });
  }

  const removed = current.slides.filter((s) => !nextIds.has(s.id));

  try {
    const settings = await saveHomeIntroSlidesSettings({
      slides: nextSlides,
      updatedAt: new Date().toISOString(),
    });
    await Promise.all(removed.map((s) => removeHomeIntroSlideFile(s.src)));
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[home-slides] put failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
