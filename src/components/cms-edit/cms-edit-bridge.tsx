"use client";

import { useEffect } from "react";
import { homeLeadToInnerHTML, paragraphsToInnerHTML } from "@/lib/cms-edit-html";
import {
  applyHomeHeroSlotStyleToElement,
  patchHomeHeroCopyText,
  type HomeHeroFontPreset,
} from "@/lib/home-hero-text-style";

/** iframe CMS — 홈·소메뉴 공통 클릭 / 하이라이트 / 실시간 패치 */
export function CmsEditBridge({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;
    if (window.parent === window) return;

    const styleId = "cmsEditStyle";
    if (!document.getElementById(styleId)) {
      const st = document.createElement("style");
      st.id = styleId;
      st.textContent = `
        [data-cms-key].cms-editable-slot { cursor: pointer; outline: 2px solid transparent; outline-offset: 3px; transition: outline-color .15s, background-color .15s, box-shadow .15s; border-radius: 4px; }
        [data-cms-key].cms-editable-slot:hover { outline-color: #002b50; background: rgba(0,43,80,.14); box-shadow: 0 0 0 1px rgba(255,255,255,.85); }
        [data-cms-key].cms-slot-active { outline: 2px solid #002b50; background: rgba(0,43,80,.18); box-shadow: 0 0 0 1px rgba(255,255,255,.9); }
      `;
      document.head.appendChild(st);
    }

    function wireSlots() {
      document.querySelectorAll("[data-cms-key]").forEach((el) => {
        el.classList.add("cms-editable-slot");
      });
    }
    wireSlots();
    const mo = new MutationObserver(() => wireSlots());
    mo.observe(document.body, { childList: true, subtree: true });

    function applyTextPatch(el: HTMLElement, key: string, text: string) {
      if (key.startsWith("home.") && key !== "home.slides") {
        patchHomeHeroCopyText(el, key, text, homeLeadToInnerHTML(text));
        return;
      }
      if (key === "home.lead") {
        el.innerHTML = homeLeadToInnerHTML(text);
        return;
      }
      if (key.endsWith(".body") || key.endsWith(".text") || key.endsWith(".lead")) {
        if (key.endsWith(".lead") && !key.startsWith("page.")) {
          el.textContent = text;
          return;
        }
        if (key.endsWith(".lead")) {
          el.textContent = text;
          return;
        }
        el.innerHTML = paragraphsToInnerHTML(text);
        return;
      }
      el.textContent = text;
    }

    function onClick(e: MouseEvent) {
      const target = (e.target as HTMLElement | null)?.closest?.("[data-cms-key]");
      if (!target || !(target instanceof HTMLElement)) return;
      e.preventDefault();
      e.stopPropagation();
      const key = target.getAttribute("data-cms-key");
      if (!key) return;
      const href = target.getAttribute("data-social-href")?.trim();
      const text = target.getAttribute("aria-label")?.trim();
      window.parent.postMessage(
        { type: "anyang-cms-select", key, ...(href ? { href } : {}), ...(text ? { text } : {}) },
        window.location.origin,
      );
    }

    function onMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
      const data = event.data as {
        type?: string;
        key?: string;
        active?: boolean;
        text?: string;
        imageSrc?: string;
        href?: string;
        fontScale?: number;
        fontPreset?: HomeHeroFontPreset;
        textColor?: string;
      };
      if (data?.type === "anyang-cms-active") {
        document.querySelectorAll(".cms-slot-active").forEach((el) => el.classList.remove("cms-slot-active"));
        if (data.active && data.key) {
          document
            .querySelectorAll(`[data-cms-key="${CSS.escape(data.key)}"]`)
            .forEach((el) => el.classList.add("cms-slot-active"));
        }
      }
      if (data?.type === "anyang-cms-patch" && data.key) {
        if (
          data.key.startsWith("home.") &&
          (typeof data.fontScale === "number" ||
            data.fontPreset !== undefined ||
            data.textColor !== undefined)
        ) {
          document.querySelectorAll(`[data-cms-key="${CSS.escape(data.key)}"]`).forEach((node) => {
            applyHomeHeroSlotStyleToElement(node as HTMLElement, {
              ...(typeof data.fontScale === "number" ? { scalePct: data.fontScale } : {}),
              ...(data.fontPreset !== undefined ? { font: data.fontPreset } : {}),
              ...(data.textColor !== undefined ? { color: data.textColor } : {}),
            });
          });
        }
        const el = document.querySelector(`[data-cms-key="${CSS.escape(data.key)}"]`);
        if (!el || !(el instanceof HTMLElement)) return;
        if (typeof data.text === "string" && !data.key.startsWith("home.social.")) {
          applyTextPatch(el, data.key, data.text);
        }
        if (typeof data.imageSrc === "string") {
          const img = el.querySelector("img") ?? (el.tagName === "IMG" ? el : null);
          if (img instanceof HTMLImageElement) {
            img.src = data.imageSrc;
          }
        }
        if (data.key.startsWith("home.social.") && data.key !== "home.social.add") {
          if (typeof data.href === "string") {
            el.setAttribute("data-social-href", data.href);
          }
          const label = (
            typeof data.text === "string" ? data.text : el.getAttribute("aria-label")
          )?.trim();
          const href = el.getAttribute("data-social-href")?.trim() || "";
          if (label) {
            el.setAttribute("aria-label", label);
            el.setAttribute("title", href ? `${label} — ${href}` : label);
          } else if (href) {
            el.setAttribute("title", href);
          }
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
      mo.disconnect();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("message", onMessage);
    };
  }, [enabled]);

  return null;
}