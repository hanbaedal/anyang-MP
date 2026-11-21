"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CmsSocialAddSlot } from "@/components/cms-edit/cms-social-add-slot";
import { homeSocialSlotKey, type SiteSocialIcon, type SiteSocialLink } from "@/lib/site-social";
import { cn } from "@/lib/utils";

const logoBtn =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition hover:scale-[1.04] hover:bg-white";
const logoBtnSm =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 transition hover:scale-[1.04] hover:bg-white md:size-11";

export function FacebookMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <circle cx="12" cy="12" r="12" fill="#1877F2" />
      <path
        fill="#fff"
        d="M13.5 20v-6.2h2.08l.31-2.4H13.5V9.86c0-.7.19-1.17 1.2-1.17h1.28V6.54c-.22-.03-.98-.1-1.86-.1-1.84 0-3.1 1.12-3.1 3.18v1.78H8.7v2.4h2.32V20h2.48z"
      />
    </svg>
  );
}

export function InstagramMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <defs>
        <radialGradient id="ig" cx="30%" cy="110%" r="120%">
          <stop offset="0%" stopColor="#f58529" />
          <stop offset="45%" stopColor="#dd2a7b" />
          <stop offset="100%" stopColor="#515bd4" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="6" fill="url(#ig)" />
      <rect x="5.2" y="5.2" width="13.6" height="13.6" rx="4" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" strokeWidth="1.7" />
      <circle cx="16.4" cy="7.6" r="1" fill="#fff" />
    </svg>
  );
}

export function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path fill="#fff" d="M10 8.2v7.6L16.5 12 10 8.2z" />
    </svg>
  );
}

export function NaverBlogMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#03C75A" />
      <path
        fill="#fff"
        d="M7.2 6.2h9.6c.7 0 1.2.5 1.2 1.2v9.2c0 .7-.5 1.2-1.2 1.2H7.2c-.7 0-1.2-.5-1.2-1.2V7.4c0-.7.5-1.2 1.2-1.2z"
      />
      <path fill="#03C75A" d="M8.4 9.1h7.2v1.3H8.4zm0 2.5h7.2v1.3H8.4zm0 2.5h4.8v1.3H8.4z" />
    </svg>
  );
}

function socialIconNode(icon: SiteSocialIcon) {
  switch (icon) {
    case "facebook":
      return <FacebookMark />;
    case "instagram":
      return <InstagramMark />;
    case "youtube":
      return <YoutubeMark />;
    case "blog":
      return <NaverBlogMark />;
  }
}

function SocialLink({
  href,
  label,
  compact,
  cmsEdit,
  slotKey,
  children,
}: {
  href: string;
  label: string;
  compact?: boolean;
  cmsEdit?: boolean;
  slotKey?: string;
  children: React.ReactNode;
}) {
  const className = compact ? logoBtnSm : logoBtn;
  if (cmsEdit && slotKey) {
    return (
      <button
        type="button"
        data-cms-key={slotKey}
        data-social-href={href}
        aria-label={label}
        title={`${label} — ${href}`}
        className={cn(className, "cursor-pointer")}
        onClick={(e) => e.preventDefault()}
      >
        {children}
      </button>
    );
  }
  const external = href.startsWith("http") || href.startsWith("tel:");
  if (external) {
    return (
      <a
        href={href}
        aria-label={label}
        title={label}
        className={className}
        {...(href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={href} aria-label={label} title={label} className={className}>
      {children}
    </Link>
  );
}

export function SocialActions({
  links,
  compact = false,
  verticalFixed = false,
  cmsEditMarkers = false,
}: {
  links: SiteSocialLink[];
  compact?: boolean;
  verticalFixed?: boolean;
  cmsEditMarkers?: boolean;
}) {
  const pathname = usePathname();
  const onHome = pathname === "/";
  const sorted = [...links].sort((a, b) => a.sort - b.sort);
  /** AMP-159: #content-scroll overflow가 fixed를 잘라 미표시 → body 포털 후에만 마운트 */
  const [portalReady, setPortalReady] = useState(false);
  useEffect(() => {
    setPortalReady(true);
  }, []);

  const nav = (
    <nav
      aria-label="소셜 바로 가기"
      className={cn(
        "flex shrink-0",
        verticalFixed
          ? cn(
              /* AMP-161: 뷰포트 우측 하단 앵커 → 위로 스택 (bottom 크면 중·우측으로 뜸) */
              "pointer-events-auto fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] right-2 z-[90] flex-col gap-2",
              "sm:right-3 md:right-4 md:gap-2.5",
              onHome
                ? "md:bottom-[calc(7.5rem+env(safe-area-inset-bottom))]"
                : "md:bottom-[calc(6rem+env(safe-area-inset-bottom))]",
            )
          : cn(
              "items-center",
              compact ? "gap-1.5 [&_svg]:size-4 md:gap-2 md:[&_svg]:size-5" : "gap-2 sm:gap-2.5",
            ),
        verticalFixed && compact && "[&_svg]:size-4 md:[&_svg]:size-5",
      )}
    >
      {sorted.map((item) => (
        <SocialLink
          key={item.id}
          href={item.href}
          label={item.label}
          compact={compact}
          cmsEdit={cmsEditMarkers}
          slotKey={homeSocialSlotKey(item.id)}
        >
          {socialIconNode(item.icon)}
        </SocialLink>
      ))}
      {cmsEditMarkers && verticalFixed ? <CmsSocialAddSlot compact={compact} /> : null}
    </nav>
  );

  if (!verticalFixed) return nav;
  if (!portalReady) return null;
  return createPortal(nav, document.body);
}