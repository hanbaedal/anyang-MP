import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import {
  getHomeIntroSlidesSettingsForWrite,
  HOME_INTRO_SLIDES_MAX,
  saveHomeIntroSlidesSettings,
  type HomeIntroSlide,
} from "@/lib/home-intro-slides";
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

/** 전용 업로드 폐지 — 갤러리에서 고른 뒤 PUT으로 저장 */
export async function POST() {
  const guard = await requireStaffApi();
  if (guard.error) return guard.error;
  return NextResponse.json(
    {
      ok: false,
      error: "메인 이미지는 갤러리에서 고릅니다. 새 사진은 갤러리 관리에서 올려 주세요.",
    },
    { status: 405 },
  );
}

/** JSON: 갤러리에서 고른 슬라이드 목록 저장(클릭 순 = sort) */
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

  try {
    await getHomeIntroSlidesSettingsForWrite();
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "설정을 읽지 못했습니다." },
      { status: 503 },
    );
  }

  const nextSlides: HomeIntroSlide[] = [];
  const seenSrc = new Set<string>();

  for (const raw of body.slides) {
    if (!raw || typeof raw !== "object") continue;
    const row = raw as Record<string, unknown>;
    const src = String(row.src ?? "");
    if (!src.startsWith("/uploads/") && !src.startsWith("/api/uploads/")) continue;
    if (seenSrc.has(src)) continue;
    if (nextSlides.length >= HOME_INTRO_SLIDES_MAX) break;
    seenSrc.add(src);
    nextSlides.push({
      id: String(row.id || randomUUID()),
      src,
      alt: String(row.alt ?? "").trim().slice(0, 80) || `메인 전경 ${nextSlides.length + 1}`,
      sort: nextSlides.length,
      createdAt: String(row.createdAt ?? new Date().toISOString()),
    });
  }

  try {
    // 갤러리 공유 자산 — 선택 해제 시 파일을 지우지 않음
    const settings = await saveHomeIntroSlidesSettings({
      slides: nextSlides,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    console.error("[home-slides] put failed", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "저장에 실패했습니다." },
      { status: 500 },
    );
  }
}
