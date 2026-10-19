"use client";

import Link from "next/link";
import { MapPin, Phone } from "lucide-react";
import { useT } from "@/components/locale-provider";
import { SITE, socialHref } from "@/lib/site";
import { cn } from "@/lib/utils";

const logoBtn =
  "inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-white shadow-md ring-1 ring-black/10 transition hover:scale-[1.04] hover:bg-white";
const logoBtnSm =
  "inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-black/10 transition hover:scale-[1.04] hover:bg-white";

function FacebookMark() {
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

function InstagramMark() {
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

function YoutubeMark() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden>
      <rect width="24" height="24" rx="6" fill="#FF0000" />
      <path fill="#fff" d="M10 8.2v7.6L16.5 12 10 8.2z" />
    </svg>
  );
}

function NaverBlogMark() {
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

function SocialLink({
  href,
  label,
  compact,
  children,
}: {
  href: string;
  label: string;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const external = href.startsWith("http") || href.startsWith("tel:");
  const className = compact ? logoBtnSm : logoBtn;
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

export function SocialActions({ compact = false }: { compact?: boolean }) {
  const items = [
    { href: socialHref("FACEBOOK", SITE.phoneTel), label: "페이스북", icon: <FacebookMark /> },
    { href: socialHref("INSTAGRAM", "/intro/directions"), label: "인스타그램", icon: <InstagramMark /> },
    { href: socialHref("YOUTUBE", "/lots/prices"), label: "유튜브", icon: <YoutubeMark /> },
    { href: socialHref("BLOG", "/support/notices"), label: "네이버 블로그", icon: <NaverBlogMark /> },
  ];

  return (
    <nav
      aria-label="소셜 바로 가기"
      className={cn("flex shrink-0 items-center", compact ? "gap-1.5 [&_svg]:size-4" : "gap-2 sm:gap-2.5")}
    >
      {items.map((item) => (
        <SocialLink key={item.label} href={item.href} label={item.label} compact={compact}>
          {item.icon}
        </SocialLink>
      ))}
    </nav>
  );
}

export function HeroCallActions() {
  const t = useT();
  return (
    <nav aria-label={t("home.call")} className="flex flex-wrap justify-center gap-2 sm:gap-3 md:justify-end">
      <a
        href={SITE.phoneTel}
        className="inline-flex items-center gap-2 rounded-2xl bg-secondary px-4 py-2.5 text-sm font-medium text-secondary-foreground shadow-sm hover:bg-[#dce8e0] sm:px-5"
      >
        <Phone className="size-4" aria-hidden />
        {SITE.phone}
      </a>
      <Link
        href="/intro/directions"
        className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-white hover:text-primary sm:px-5"
      >
        <MapPin className="size-4" aria-hidden />
        {t("directions")}
      </Link>
    </nav>
  );
}
