import Link from "next/link";
import { Logo } from "@/components/shared/logo";

const SOURCES = [
  "DexScreener",
  "Base RPC",
  "DefiLlama",
  "BaseScan",
  "CoinGecko",
  "Supabase",
];

export function Footer() {
  return (
    <footer className="relative mt-32 border-t border-white/[0.08]">
      <div className="container py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Search-first intelligence for the Base ecosystem. Wallets, tokens,
              projects, quests and airdrops - verified, never guessed.
            </p>
          </div>
          <FooterCol
            title="Product"
            links={[
              { href: "/discover", label: "Discover" },
              { href: "/smart-money", label: "Smart Money" },
              { href: "/discover#airdrops", label: "Airdrops" },
            ]}
          />
          <FooterCol
            title="Analyzers"
            links={[
              { href: "/discover#trending", label: "Trending" },
              { href: "/discover#new", label: "New Projects" },
              { href: "/discover#quests", label: "Active Quests" },
            ]}
          />
          <FooterCol
            title="Resources"
            links={[
              { href: "https://x.com/onyx_netlify", label: "Twitter", external: true },
              { href: "https://basescan.org", label: "BaseScan", external: true },
              { href: "https://docs.base.org", label: "Base Docs", external: true },
            ]}
          />
        </div>
        <div className="mt-12 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            (c) {new Date().getFullYear()} Onyx - Data is provided as-is for
            research. Not financial advice.
          </p>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-xs text-muted-foreground">Sources:</span>
            {SOURCES.map((s) => (
              <span
                key={s}
                className="rounded-md border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <h4 className="font-display text-sm font-semibold text-foreground">{title}</h4>
      <ul className="mt-4 space-y-2.5">
        {links.map((link) => (
          <li key={link.label}>
            {link.external ? (
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </a>
            ) : (
              <Link
                href={link.href}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
