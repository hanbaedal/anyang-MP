/** iframe 실시간 패치용 — `Paragraphs`와 동일 규칙 */
export function paragraphsToInnerHTML(text: string) {
  const blocks = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\n+|\n+$/g, ""))
    .filter((block) => block.trim().length > 0);

  if (!blocks.length) return "";

  return blocks
    .map((block) => {
      const lines = block.split("\n");
      const inner = lines
        .map((line, lineIndex) => {
          const safe = escapeHtml(line);
          return lineIndex > 0 ? `<br>${safe}` : safe;
        })
        .join("");
      return `<p>${inner}</p>`;
    })
    .join("");
}

/** home.lead 패치(단일 p, 모바일 br) */
export function homeLeadToInnerHTML(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return "";
  return lines
    .map((line, i) => (i ? `<br class="md:hidden" />` : "") + escapeHtml(line.trim()))
    .join("");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/** 제목·요약 등 단일 블록 — Enter → `<br>` (iframe 실시간 패치) */
export function inlineBreaksToInnerHTML(text: string) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  if (!lines.length) return "";
  return lines
    .map((line, i) => (i ? `<br />` : "") + escapeHtml(line))
    .join("");
}