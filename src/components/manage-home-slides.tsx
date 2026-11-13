"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HOME_INTRO_SLIDE_FALLBACK_SRC,
  HOME_INTRO_SLIDES_MAX,
  type HomeIntroSlide,
  type HomeIntroSlidesSettings,
} from "@/lib/home-intro-slides-types";
import { thumbUrl, uploadOriginalUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

export function ManageHomeSlides({ initial }: { initial: HomeIntroSlidesSettings }) {
  const [slides, setSlides] = useState<HomeIntroSlide[]>(initial.slides);
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const [dirty, setDirty] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const busy = status === "busy";

  async function uploadFiles(files: FileList | null) {
    if (!files?.length) return;
    setStatus("busy");
    setMessage("");
    let next = slides;
    try {
      for (const file of Array.from(files)) {
        if (next.length >= HOME_INTRO_SLIDES_MAX) {
          setMessage(`최대 ${HOME_INTRO_SLIDES_MAX}장까지 등록할 수 있습니다.`);
          setStatus("error");
          break;
        }
        const form = new FormData();
        form.set("file", file);
        const res = await fetch("/api/manage/home-slides", { method: "POST", body: form });
        const json = (await res.json()) as {
          ok?: boolean;
          error?: string;
          settings?: HomeIntroSlidesSettings;
        };
        if (!res.ok || !json.ok || !json.settings) {
          setMessage(json.error || "업로드에 실패했습니다.");
          setStatus("error");
          setSlides(next);
          return;
        }
        next = json.settings.slides;
        setSlides(next);
      }
      setDirty(false);
      setMessage("올렸습니다. 홈에 바로 반영됩니다. 순서를 바꾸면 「순서 저장」을 눌러 주세요.");
      setStatus("ok");
    } catch {
      setMessage("네트워크 오류입니다.");
      setStatus("error");
    }
  }

  async function saveOrder() {
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/home-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        settings?: HomeIntroSlidesSettings;
      };
      if (!res.ok || !json.ok || !json.settings) {
        setMessage(json.error || "저장에 실패했습니다.");
        setStatus("error");
        return;
      }
      setSlides(json.settings.slides);
      setDirty(false);
      setMessage("순서를 저장했습니다. 홈에 반영됩니다.");
      setStatus("ok");
    } catch {
      setMessage("네트워크 오류입니다.");
      setStatus("error");
    }
  }

  function move(index: number, dir: -1 | 1) {
    const j = index + dir;
    if (j < 0 || j >= slides.length) return;
    const next = slides.slice();
    const tmp = next[index]!;
    next[index] = next[j]!;
    next[j] = tmp;
    setSlides(next.map((s, i) => ({ ...s, sort: i })));
    setDirty(true);
    setMessage("순서를 바꿨습니다. 「순서 저장」을 눌러 홈에 반영하세요.");
    setStatus("idle");
  }

  async function removeAt(index: number) {
    if (!confirm("이 이미지를 삭제할까요? 홈에서도 바로 빠집니다.")) return;
    const next = slides.filter((_, i) => i !== index).map((s, i) => ({ ...s, sort: i }));
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/home-slides", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slides: next }),
      });
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        settings?: HomeIntroSlidesSettings;
      };
      if (!res.ok || !json.ok || !json.settings) {
        setMessage(json.error || "삭제에 실패했습니다.");
        setStatus("error");
        return;
      }
      setSlides(json.settings.slides);
      setDirty(false);
      setMessage(
        json.settings.slides.length
          ? "삭제했습니다."
          : "모두 삭제했습니다. 홈에는 폴백 이미지(05)가 보입니다.",
      );
      setStatus("ok");
    } catch {
      setMessage("네트워크 오류입니다.");
      setStatus("error");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        홈(/) 전경 슬라이드용 사진을 올립니다. 가로(와이드) 권장 · 장당 약 10MB 이하 · 최대{" "}
        {HOME_INTRO_SLIDES_MAX}장. 등록이 없으면 홈에{" "}
        <code className="rounded bg-muted px-1">{HOME_INTRO_SLIDE_FALLBACK_SRC}</code> 한 장이
        보입니다.
      </p>

      <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            multiple
            className="sr-only"
            disabled={busy || slides.length >= HOME_INTRO_SLIDES_MAX}
            onChange={(e) => {
              void uploadFiles(e.target.files);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            size="sm"
            disabled={busy || slides.length >= HOME_INTRO_SLIDES_MAX}
            onClick={() => inputRef.current?.click()}
          >
            <Upload className="size-4" aria-hidden />
            이미지 올리기
          </Button>
          <Button type="button" size="sm" variant="outline" disabled={busy || !dirty} onClick={() => void saveOrder()}>
            순서 저장
          </Button>
          <span className="text-xs text-muted-foreground">
            {slides.length}/{HOME_INTRO_SLIDES_MAX}
          </span>
        </div>
        {message ? (
          <p
            className={cn(
              "text-xs",
              status === "error" ? "text-destructive" : "text-muted-foreground",
            )}
            role="status"
          >
            {message}
          </p>
        ) : null}
      </section>

      <section className="space-y-2 rounded-lg border bg-card p-3 sm:p-4">
        <h2 className="text-sm font-medium">등록 목록 ({slides.length})</h2>
        {slides.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            아직 없습니다. 홈에는 폴백 이미지만 표시됩니다.
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {slides.map((slide, index) => (
              <li key={slide.id} className="flex items-center gap-2 p-2 text-xs sm:gap-3">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={thumbUrl(uploadOriginalUrl(slide.src))}
                    alt=""
                    className="size-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{slide.alt}</p>
                  <p className="truncate text-muted-foreground">{slide.src}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-0.5 sm:flex-row">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={busy || index === 0}
                    aria-label="위로"
                    onClick={() => move(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8"
                    disabled={busy || index === slides.length - 1}
                    aria-label="아래로"
                    onClick={() => move(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-8 text-destructive"
                    disabled={busy}
                    aria-label="삭제"
                    onClick={() => void removeAt(index)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
