import { resolveUploadRequest } from "@/lib/upload-store";

export const dynamic = "force-dynamic";

function cacheControlFor(pathSegments: string[]) {
  const joined = pathSegments.join("/").toLowerCase();
  // 히어로 영상 등은 교체 후 모바일 캐시가 남지 않게 immutable·장기 캐시 금지
  if (/\.(mp4|webm|mp3|wav|m4a)$/.test(joined) || joined.includes("home-hero/")) {
    return "public, max-age=300, must-revalidate";
  }
  return "public, max-age=604800, stale-while-revalidate=86400";
}

export async function GET(_request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params;
  const pathSegments = segments ?? [];
  const file = await resolveUploadRequest(pathSegments);
  if (!file) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": cacheControlFor(pathSegments),
    },
  });
}
