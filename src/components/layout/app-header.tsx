"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const AUTH_ROUTES = ["/sign-in", "/sign-up"];

function extractFundraiseId(pathname: string): string | null {
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] ?? null;
}

function NavLink({
  href,
  label,
  pathname,
  exact,
}: {
  href: string;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <Link
      href={href}
      className={cn(
        "whitespace-nowrap rounded-md px-3 py-1.5 transition-colors",
        active
          ? "bg-zinc-100 font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-900 dark:hover:text-zinc-100",
      )}
    >
      {label}
    </Link>
  );
}

export function AppHeader() {
  const pathname = usePathname() ?? "";

  if (AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    return null;
  }

  const fundraiseId = extractFundraiseId(pathname);

  const dashboardLinks = fundraiseId
    ? [
        { href: `/dashboard/${fundraiseId}`, label: "Overview", exact: true },
        { href: `/dashboard/${fundraiseId}/pipeline`, label: "Pipeline" },
        { href: `/dashboard/${fundraiseId}/outreach`, label: "Outreach" },
      ]
    : [];

  const globalLinks = [
    { href: "/", label: "Home", exact: true },
    { href: "/#pricing", label: "Pricing" },
    { href: "/onboarding", label: "New fundraise" },
    { href: "/admin", label: "Admin" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link
          href={fundraiseId ? `/dashboard/${fundraiseId}` : "/"}
          className="shrink-0 text-lg font-semibold tracking-tight"
        >
          Fundraise OS
        </Link>

        <nav className="flex max-w-[70vw] items-center gap-0.5 overflow-x-auto sm:max-w-none sm:gap-1">
          {dashboardLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              exact={link.exact}
            />
          ))}
          {dashboardLinks.length > 0 && (
            <span
              className="mx-1 hidden h-4 w-px shrink-0 bg-zinc-200 sm:mx-2 sm:block dark:bg-zinc-700"
              aria-hidden
            />
          )}
          {globalLinks.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              label={link.label}
              pathname={pathname}
              exact={link.exact}
            />
          ))}
        </nav>
      </div>
    </header>
  );
}
