"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  HOME_HERO_AUDIO_MAX_BYTES,
  HOME_HERO_AUDIO_MAX_LABEL,
  HOME_HERO_MAX_SETS,
  HOME_HERO_VIDEO_MAX_BYTES,
  HOME_HERO_VIDEO_MAX_LABEL,
  type HomeHeroSet,
  type HomeHeroSettings,
} from "@/lib/home-hero-types";
import { cn } from "@/lib/utils";

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

/** 서버·클라이언트 타임존이 달라도 hydration 어긋나지 않게, 마운트 후에만 포맷 */
function useSeoulDateLabel(iso: string | undefined) {
  const [label, setLabel] = useState("");
  useEffect(() => {
    if (!iso) {
      setLabel("");
      return;
    }
    setLabel(
      new Date(iso).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }),
    );
  }, [iso]);
  return label;
}

async function parseSettingsResponse(res: Response): Promise<{
  ok: boolean;
  error?: string;
  settings?: HomeHeroSettings;
  status: number;
}> {
  const text = await res.text();
  let json: { ok?: boolean; error?: string; settings?: HomeHeroSettings } = {};
  try {
    json = text ? (JSON.parse(text) as typeof json) : {};
  } catch {
    return {
      ok: false,
      status: res.status,
      error:
        res.status === 413 || res.status === 502 || res.status === 504
          ? `업로드가 끊겼습니다 (HTTP ${res.status}). 영상 ${HOME_HERO_VIDEO_MAX_LABEL} 이하·안정된 네트워크에서 다시 시도해 주세요.`
          : `응답을 읽지 못했습니다 (HTTP ${res.status}). 잠시 후 다시 시도해 주세요.`,
    };
  }
  if (!res.ok || !json.ok || !json.settings) {
    return {
      ok: false,
      status: res.status,
      error: json.error || `요청에 실패했습니다 (HTTP ${res.status}).`,
    };
  }
  return { ok: true, status: res.status, settings: json.settings };
}

export function ManageHomeHero({ initial }: { initial: HomeHeroSettings }) {
  const [settings, setSettings] = useState(initial);
  const [selectedId, setSelectedId] = useState(initial.activeSetId || initial.sets[0]?.id || "");
  const [pendingVideo, setPendingVideo] = useState<File | null>(null);
  const [pendingAudio, setPendingAudio] = useState<File | null>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [status, setStatus] = useState<"idle" | "busy" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");
  const savedAtLabel = useSeoulDateLabel(settings.updatedAt);
  const busy = status === "busy";

  const pendingVideoUrl = useMemo(
    () => (pendingVideo ? URL.createObjectURL(pendingVideo) : null),
    [pendingVideo],
  );
  const pendingAudioUrl = useMemo(
    () => (pendingAudio ? URL.createObjectURL(pendingAudio) : null),
    [pendingAudio],
  );

  useEffect(() => {
    return () => {
      if (pendingVideoUrl) URL.revokeObjectURL(pendingVideoUrl);
    };
  }, [pendingVideoUrl]);
  useEffect(() => {
    return () => {
      if (pendingAudioUrl) URL.revokeObjectURL(pendingAudioUrl);
    };
  }, [pendingAudioUrl]);

  useEffect(() => {
    if (!settings.sets.some((s) => s.id === selectedId)) {
      setSelectedId(settings.activeSetId || settings.sets[0]?.id || "");
    }
  }, [settings, selectedId]);

  const canSave = Boolean(pendingVideo);
  const atCap = settings.sets.length >= HOME_HERO_MAX_SETS;
  const selected = settings.sets.find((s) => s.id === selectedId) || null;
  const selectedIsActive = Boolean(selected && selected.id === settings.activeSetId);

  function clearPending() {
    setPendingVideo(null);
    setPendingAudio(null);
    setPendingLabel("");
  }

  function onPickVideo(file: File | null) {
    if (!file) {
      setPendingVideo(null);
      return;
    }
    if (file.size > HOME_HERO_VIDEO_MAX_BYTES) {
      setPendingVideo(null);
      setStatus("error");
      setMessage(`영상은 ${HOME_HERO_VIDEO_MAX_LABEL} 이하만 올릴 수 있습니다. (선택: ${formatBytes(file.size)})`);
      return;
    }
    setPendingVideo(file);
    setMessage("");
    setStatus("idle");
  }

  function onPickAudio(file: File | null) {
    if (!file) {
      setPendingAudio(null);
      return;
    }
    if (file.size > HOME_HERO_AUDIO_MAX_BYTES) {
      setPendingAudio(null);
      setStatus("error");
      setMessage(`음악은 ${HOME_HERO_AUDIO_MAX_LABEL} 이하만 올릴 수 있습니다. (선택: ${formatBytes(file.size)})`);
      return;
    }
    setPendingAudio(file);
    setMessage("");
    setStatus("idle");
  }

  async function uploadSet(action: "add" | "replace") {
    if (!canSave || !pendingVideo) return;
    if (action === "replace" && !selected) {
      setStatus("error");
      setMessage("교체할 세트를 아래 목록에서 먼저 선택해 주세요.");
      return;
    }
    if (action === "add" && atCap) {
      setStatus("error");
      setMessage(`세트는 최대 ${HOME_HERO_MAX_SETS}개입니다. 하나를 삭제하거나 「선택 세트 교체」를 사용해 주세요.`);
      return;
    }
    if (pendingVideo.size > HOME_HERO_VIDEO_MAX_BYTES) {
      setStatus("error");
      setMessage(`영상은 ${HOME_HERO_VIDEO_MAX_LABEL} 이하만 올릴 수 있습니다.`);
      return;
    }
    if (pendingAudio && pendingAudio.size > HOME_HERO_AUDIO_MAX_BYTES) {
      setStatus("error");
      setMessage(`음악은 ${HOME_HERO_AUDIO_MAX_LABEL} 이하만 올릴 수 있습니다.`);
      return;
    }

    setStatus("busy");
    setMessage("");
    const form = new FormData();
    form.set("action", action);
    form.set("video", pendingVideo);
    if (pendingAudio) form.set("audio", pendingAudio);
    if (pendingLabel.trim()) form.set("label", pendingLabel.trim());
    if (action === "replace" && selected) form.set("setId", selected.id);

    try {
      const res = await fetch("/api/manage/home-hero", { method: "POST", body: form });
      const parsed = await parseSettingsResponse(res);
      if (!parsed.ok || !parsed.settings) {
        setStatus("error");
        setMessage(parsed.error || "저장에 실패했습니다.");
        return;
      }
      setSettings(parsed.settings);
      if (action === "add") {
        const newest = parsed.settings.sets[parsed.settings.sets.length - 1];
        if (newest) setSelectedId(newest.id);
      }
      clearPending();
      setStatus("ok");
      setMessage(
        action === "replace"
          ? "선택한 세트를 새 파일로 교체했습니다."
          : pendingAudio
            ? "세트를 추가했습니다. 아래에서 선택·공개할 수 있습니다."
            : "세트를 추가했습니다(음악 공란). 아래에서 선택·공개할 수 있습니다.",
      );
    } catch {
      setStatus("error");
      setMessage(
        `연결이 끊겼습니다. 파일 용량(영상 ${HOME_HERO_VIDEO_MAX_LABEL} 이하)과 네트워크를 확인한 뒤 다시 시도해 주세요.`,
      );
    }
  }

  async function putAction(body: Record<string, string>, okMessage: string) {
    setStatus("busy");
    setMessage("");
    try {
      const res = await fetch("/api/manage/home-hero", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const parsed = await parseSettingsResponse(res);
      if (!parsed.ok || !parsed.settings) {
        setStatus("error");
        setMessage(parsed.error || "처리에 실패했습니다.");
        return;
      }
      setSettings(parsed.settings);
      if (body.action === "delete") {
        const nextId = parsed.settings.activeSetId || parsed.settings.sets[0]?.id || "";
        setSelectedId(nextId);
      }
      setStatus("ok");
      setMessage(okMessage);
    } catch {
      setStatus("error");
      setMessage("연결이 끊겼습니다. 잠시 후 다시 시도해 주세요.");
    }
  }

  async function togglePublic(nextPublic: boolean) {
    if (!selected) return;
    if (nextPublic) {
      await putAction({ action: "publish", setId: selected.id }, "홈에 이 세트를 공개했습니다. (다른 세트는 비공개)");
    } else {
      await putAction({ action: "unpublish" }, "홈 공개를 해제했습니다. 홈은 기본 배포 영상·음악을 씁니다.");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-3 py-6 sm:px-4">
      <p className="text-xs leading-relaxed text-muted-foreground">
        영상·음악은 최대 {HOME_HERO_MAX_SETS}세트까지 보관합니다. 위에서 등록한 뒤, 아래 카드를 고르고{" "}
        <strong className="font-medium text-foreground">공개</strong> 스위치로 홈에 올립니다. 한 번에 하나만
        공개되며, 끄면 홈은 기본 배포 미디어로 돌아갑니다. 음악이 없으면 홈에서 영상 소리를 켭니다.
      </p>

      <section className="space-y-3 rounded-lg border-2 border-primary/25 bg-card p-3 sm:p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">새 세트 등록</h2>
          <p className="text-[11px] text-muted-foreground">
            {settings.sets.length}/{HOME_HERO_MAX_SETS}
          </p>
        </div>

        <label className="block space-y-1">
          <span className="text-xs text-muted-foreground">세트 이름 (선택)</span>
          <input
            type="text"
            value={pendingLabel}
            maxLength={40}
            disabled={busy}
            placeholder="예: 봄, 설날"
            onChange={(e) => setPendingLabel(e.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <label>
            <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
              <span>1. 영상 등록</span>
            </Button>
            <input
              type="file"
              accept="video/mp4,video/webm,.mp4,.webm"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                onPickVideo(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
          <label>
            <Button type="button" size="sm" variant="outline" disabled={busy} asChild>
              <span>2. 음악 등록</span>
            </Button>
            <input
              type="file"
              accept="audio/mpeg,.mp3,.wav,.m4a"
              className="sr-only"
              disabled={busy}
              onChange={(e) => {
                onPickAudio(e.target.files?.[0] ?? null);
                e.target.value = "";
              }}
            />
          </label>
          <Button
            type="button"
            size="sm"
            disabled={busy || !canSave || atCap}
            onClick={() => void uploadSet("add")}
          >
            {busy ? "저장 중…" : "3. 세트 추가"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={busy || !canSave || !selected}
            onClick={() => void uploadSet("replace")}
          >
            선택 세트 교체
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          영상 필수({HOME_HERO_VIDEO_MAX_LABEL} 이하) · 음악 선택({HOME_HERO_AUDIO_MAX_LABEL} 이하)
          {atCap ? ` · 세트가 가득 찼습니다. 교체하거나 삭제 후 추가하세요.` : null}
        </p>

        {pendingVideo || pendingAudio ? (
          <div className="space-y-3 rounded-md border border-dashed border-primary/30 bg-muted/40 p-3">
            <p className="text-xs font-medium text-primary">저장 대기</p>
            <div className="grid gap-4 md:grid-cols-2">
              {pendingVideo && pendingVideoUrl ? (
                <div className="space-y-2">
                  <p className="truncate text-xs">
                    영상: {pendingVideo.name} ({formatBytes(pendingVideo.size)})
                  </p>
                  <video
                    src={pendingVideoUrl}
                    className="aspect-video w-full rounded-md bg-muted object-cover"
                    controls
                    muted
                    playsInline
                    preload="metadata"
                  />
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setPendingVideo(null)}>
                    영상 선택 취소
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">영상: 미등록(저장하려면 영상 필요)</p>
              )}
              {pendingAudio && pendingAudioUrl ? (
                <div className="space-y-2">
                  <p className="truncate text-xs">
                    음악: {pendingAudio.name} ({formatBytes(pendingAudio.size)})
                  </p>
                  <audio src={pendingAudioUrl} className="w-full" controls preload="metadata" />
                  <Button type="button" size="sm" variant="ghost" disabled={busy} onClick={() => setPendingAudio(null)}>
                    음악 선택 취소
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">음악: 미등록 → 저장 시 공란</p>
              )}
            </div>
          </div>
        ) : null}
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium">등록된 세트</h2>
          {!settings.activeSetId ? (
            <p className="text-[11px] text-muted-foreground">홈 공개 없음 · 기본 배포 미디어</p>
          ) : null}
        </div>
        {settings.sets.length === 0 ? (
          <p className="rounded-md border border-dashed px-3 py-8 text-center text-xs text-muted-foreground">
            등록된 세트가 없습니다. 위에서 영상을 추가하세요. 홈은 기본 배포 영상·음악을 사용합니다.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {settings.sets.map((set) => (
              <SetCard
                key={set.id}
                set={set}
                active={set.id === settings.activeSetId}
                selected={set.id === selectedId}
                disabled={busy}
                onSelect={() => {
                  setSelectedId(set.id);
                  setMessage("");
                }}
              />
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <section className="space-y-3 rounded-lg border bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-medium">선택 미리보기 · {selected.label}</h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="inline-flex cursor-pointer items-center gap-2 text-sm">
                <span className="text-muted-foreground">{selectedIsActive ? "공개" : "비공개"}</span>
                <span className="relative inline-flex h-6 w-11 shrink-0 items-center">
                  <input
                    type="checkbox"
                    role="switch"
                    className="peer sr-only"
                    checked={selectedIsActive}
                    disabled={busy}
                    onChange={(e) => void togglePublic(e.target.checked)}
                    aria-label={selectedIsActive ? "홈 공개 해제" : "홈에 공개"}
                  />
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full border transition-colors",
                      selectedIsActive ? "border-primary bg-primary" : "border-input bg-muted",
                      busy && "opacity-60",
                    )}
                    aria-hidden
                  />
                  <span
                    className={cn(
                      "absolute left-0.5 size-5 rounded-full bg-background shadow transition-transform",
                      selectedIsActive && "translate-x-5",
                    )}
                    aria-hidden
                  />
                </span>
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => {
                  if (!window.confirm(`「${selected.label}」 세트를 삭제할까요?`)) return;
                  void putAction({ action: "delete", setId: selected.id }, "세트를 삭제했습니다.");
                }}
              >
                삭제
              </Button>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">영상 · {selected.videoLabel}</p>
              <video
                key={selected.videoSrc}
                src={selected.videoSrc}
                className="aspect-video w-full rounded-lg bg-muted object-cover"
                controls
                muted
                playsInline
                preload="metadata"
              />
            </div>
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                음악 · {selected.audioSrc ? selected.audioLabel || "음악" : "없음(공란)"}
              </p>
              {selected.audioSrc ? (
                <audio key={selected.audioSrc} src={selected.audioSrc} className="w-full" controls preload="metadata" />
              ) : (
                <p className="rounded-md border border-dashed px-3 py-6 text-center text-xs text-muted-foreground">
                  음악 없음 · 홈에서 「배경음악 재생」으로 영상 소리를 켭니다
                </p>
              )}
            </div>
          </div>
          {savedAtLabel ? (
            <p className="text-[11px] text-muted-foreground">마지막 저장: {savedAtLabel}</p>
          ) : settings.updatedAt ? (
            <p className="text-[11px] text-muted-foreground">마지막 저장: …</p>
          ) : null}
        </section>
      ) : null}

      {message ? (
        <p className={status === "error" ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>{message}</p>
      ) : null}
    </div>
  );
}

function SetCard({
  set,
  active,
  selected,
  disabled,
  onSelect,
}: {
  set: HomeHeroSet;
  active: boolean;
  selected: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        "overflow-hidden rounded-lg border bg-card text-left transition-colors",
        selected ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40",
        disabled && "opacity-60",
      )}
    >
      <div className="relative aspect-video bg-muted">
        <video
          src={set.videoSrc}
          className="h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
          tabIndex={-1}
        />
        {active ? (
          <span className="absolute left-2 top-2 rounded bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-foreground">
            공개 중
          </span>
        ) : (
          <span className="absolute left-2 top-2 rounded bg-background/90 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border">
            비공개
          </span>
        )}
      </div>
      <div className="space-y-0.5 px-3 py-2">
        <p className="truncate text-sm font-medium">{set.label}</p>
        <p className="truncate text-[11px] text-muted-foreground">
          {set.audioSrc ? `음악 · ${set.audioLabel || "있음"}` : "음악 없음(영상 소리)"}
        </p>
      </div>
    </button>
  );
}
