/** CMS 본문 — 빈 줄(2개 이상)로 나눈 단락 블록 */
export function cmsBodyBlocks(body?: string): string[] {
  if (!body?.trim()) return [];
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);
}