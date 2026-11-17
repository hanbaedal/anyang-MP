/** CMS textarea·저장·표시 공통 — 줄 끝 정규화 */
export function normalizeCmsMultilineText(text: string): string {
  return text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}