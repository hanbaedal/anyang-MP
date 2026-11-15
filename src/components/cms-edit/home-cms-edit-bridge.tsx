"use client";

import { useEffect } from "react";

/** 홈 iframe CMS: 부모/manage가 클릭·하이라이트·문구 패치 (인천 homeCms와 동일 흐름) */
export function HomeCmsEditBridge({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.parent === window) return;

    const styleId = "cmsEditStyle";
    if (!document.getElementById(styleId)) {
      const st = document.createElement("style");
      st.id = styleId;
      st.textContent = `
        [data-cms-key].cms-editable-slot { cursor: pointer; outline: 2px dashed transparent; outline-offset: 2px; transition: outline-color .15s; border-radius: 4px; }
        [data-cms-key].cms-editable-slot:hover { outline-color: #b99247; background: rgba(185,146,71,.12); }
        [data-cms-key].cms-slot-active { outline: 2px solid #002b50; background: rgba(0,43,80,.1); }
      `;
      document.head.appendChild(st);
    }

    document.querySelectorAll("[data-cms-key]").forEach((el) => {
      el.classList.add("cms-editable-slot");
    });

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest?.("[data-cms-key]");
      if (!target || !(target instanceof HTMLElement)) return;
      e.preventDefault();
      e.stopPropagation();
      const key = target.getAttribute("data-cms-key");
      if (!key) return;
      window.parent.postMessage({ type: "anyang-cms-select", key }, window.location.origin);
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as { type?: string; key?: string; active?: boolean; text?: string };
      if (data?.type === "anyang-cms-active") {
        document.querySelectorAll(".cms-slot-active").forEach((el) => el.classList.remove("cms-slot-active"));
        if (data.active && data.key) {
          document
            .querySelectorAll(`[data-cms-key="${CSS.escape(data.key)}"]`)
            .forEach((el) => el.classList.add("cms-slot-active"));
        }
      }
      if (data?.type === "anyang-cms-patch" && data.key && typeof data.text === "string") {
        const el = document.querySelector(`[data-cms-key="${CSS.escape(data.key)}"]`);
        if (!el) return;
        if (data.key === "home.lead") {
          el.innerHTML = data.text
            .split(/\r?\n/)
            .filter((line) => line.trim())
            .map((line, i) => (i ? `<br class="md:hidden" />` : "") + line.trim())
            .join("");
        } else {
          el.textContent = data.text;
        }
      }
      if (data?.type === "anyang-cms-reload") {
        window.location.reload();
      }
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("message", onMessage);
    window.parent.postMessage({ type: "anyang-cms-ready" }, window.location.origin);

    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
    };
  }, [enabled]);

  return null;
}