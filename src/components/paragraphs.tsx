import { Fragment } from "react";
import { cn } from "@/lib/utils";

/** CMS 한 블록(제목·카드 제목 등) — Enter 줄바꿈 */
export function CmsInlineBreaks({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (lines.length <= 1) return <>{text}</>;
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={`${i}-${line.slice(0, 12)}`}>
          {i > 0 ? <br /> : null}
          {line}
        </Fragment>
      ))}
    </>
  );
}

/**
 * CMS 텍스트 표시:
 * - Enter 한 번 → 줄바꿈(br)
 * - Enter 두 번(빈 줄) → 새 문단(p)
 */
export function Paragraphs({
  text,
  className,
}: {
  text: string;
  /** 각 문단 `<p>`에 적용 */
  className?: string;
}) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.trim().length > 0);

  return (
    <div className={cn("cms-paragraphs flex flex-col gap-[0.85em]", className)}>
      {blocks.map((block, index) => {
        const lines = block.split("\n");
        return (
          <p key={`${index}-${block.slice(0, 24)}`} className="m-0 leading-relaxed">
            {lines.map((line, lineIndex) => (
              <Fragment key={`${lineIndex}-${line.slice(0, 16)}`}>
                {lineIndex > 0 ? <br /> : null}
                {line}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
