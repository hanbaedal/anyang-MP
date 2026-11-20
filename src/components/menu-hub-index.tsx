import Link from "next/link";
import { cn } from "@/lib/utils";

export type MenuHubIndexItem = {
  href: string;
  title: string;
  /** 짧은 요약 — CMS lead 또는 i18n */
  lead?: string;
};

/**
 * AMP-112: 상위 메뉴 허브 — NAV 서브 링크(제목·짧은 요약)만.
 * 상세 CMS·카드 UI는 각 하위 URL에 둔다.
 */
export function MenuHubIndex({
  items,
  className,
}: {
  items: MenuHubIndexItem[];
  className?: string;
}) {
  if (!items.length) return null;

  return (
    <ul className={cn("divide-y divide-[#ead7b4]/80 border-y border-[#ead7b4]/80", className)}>
      {items.map((item) => (
        <li key={item.href}>
          <Link
            href={item.href}
            className="group flex flex-col gap-1.5 px-1 py-5 transition-colors hover:bg-[#fffcf7]/80 sm:px-2 md:py-6"
          >
            <span className="font-serif text-xl text-primary underline-offset-4 group-hover:underline md:text-2xl">
              {item.title}
            </span>
            {item.lead?.trim() ? (
              <span className="max-w-3xl text-sm leading-relaxed text-muted-foreground md:text-[0.9375rem] md:leading-7">
                {item.lead.trim()}
              </span>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
