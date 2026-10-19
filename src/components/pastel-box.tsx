import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 푸터 크롬(#9ec9e3)과 맞춘 파스텔 콘텐츠 박스 — 밝은 틴트 배경 + 남색 글자 */
export const PASTEL_CHROME_CLASS =
  "rounded-xl border border-[color:var(--pastel-chrome-border)] bg-[color:var(--pastel-chrome-bg)] text-[color:var(--pastel-chrome-fg)] shadow-sm";

export function PastelBox({
  children,
  className,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: ElementType;
}) {
  return <Tag className={cn(PASTEL_CHROME_CLASS, "p-5 md:p-6", className)}>{children}</Tag>;
}
