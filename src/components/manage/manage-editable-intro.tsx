"use client";

const titleClass =
  "font-serif text-2xl font-semibold tracking-tight text-[color:var(--pastel-chrome-fg)] md:text-[1.65rem] w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 outline-none focus:border-[color:var(--pastel-chrome-border)] focus:bg-[#fffcf7]/80";
const leadClass =
  "mt-2 max-w-3xl w-full resize-y rounded-md border border-transparent bg-transparent px-1 py-1 text-[15px] leading-relaxed text-[color:var(--pastel-chrome-fg)]/88 outline-none focus:border-[color:var(--pastel-chrome-border)] focus:bg-[#fffcf7]/80 md:mt-2.5 md:text-base md:leading-7 min-h-[3rem]";

export function ManageEditableIntro({
  title,
  lead,
  onTitle,
  onLead,
}: {
  title: string;
  lead: string;
  onTitle: (value: string) => void;
  onLead: (value: string) => void;
}) {
  return (
    <header className="mb-5 border-b border-[color:var(--pastel-chrome-border)] pb-4 md:mb-6 md:pb-5">
      <label className="block">
        <span className="sr-only">제목</span>
        <input className={titleClass} value={title} onChange={(e) => onTitle(e.target.value)} placeholder="제목" />
      </label>
      <label className="mt-2 block">
        <span className="sr-only">요약</span>
        <textarea className={leadClass} value={lead} rows={2} onChange={(e) => onLead(e.target.value)} placeholder="요약" />
      </label>
    </header>
  );
}