"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/discover", label: "Discover" },
  { href: "/smart-money", label: "Smart Money" },
  { href: "/discover#airdrops", label: "Airdrops" },
  { href: "/discover#trending", label: "Analytics" },
];

function XLogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const pathname = usePathname();

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 border-b backdrop-blur-md transition-all duration-300",
        scrolled
          ? "border-brand-lime/[0.12] bg-background/70 backdrop-blur-xl shadow-[0_8px_30px_rgba(0,0,0,0.35)]"
          : "border-transparent bg-background/20"
      )}
    >
      <div className="container flex h-[72px] items-center justify-between">
        <Logo />

        <nav className="hidden items-center gap-1 rounded-full border border-white/[0.08] bg-white/[0.03] p-1.5 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm font-normal text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <a
            href="https://x.com/onyx_netlify"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Onyx on X"
            className="hidden h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.035] text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground sm:grid"
          >
            <XLogoIcon className="h-4 w-4" />
          </a>
          <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
            <Link href="/discover">Launch App</Link>
          </Button>
          <button
            className="grid h-10 w-10 place-items-center rounded-full border border-white/[0.08] bg-white/[0.035] text-foreground md:hidden"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "overflow-hidden border-b border-white/[0.08] bg-background/95 backdrop-blur-xl transition-all duration-300 md:hidden",
          menuOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
        )}
      >
        <nav className="container flex flex-col gap-1 py-4">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="rounded-lg px-3 py-3 text-base text-muted-foreground hover:bg-white/[0.04] hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <Button asChild variant="ghost" className="mt-2">
            <Link href="/discover">Launch App</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
