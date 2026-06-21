import Link from "next/link";
import { Sparkles, Wallet, Coins, Trophy, Boxes } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

const QUICK_LINKS = [
  { href: "/wallet", icon: Wallet, label: "Wallet score", hint: "Paste any Base address" },
  { href: "/discover#trending", icon: Coins, label: "Token risk", hint: "Liquidity & holder checks" },
  { href: "/discover#airdrops", icon: Trophy, label: "Airdrop status", hint: "Active quests tracked" },
  { href: "/discover", icon: Boxes, label: "Projects", hint: "Trending on Base" },
];

/**
 * Command-center style hero: oversized search card + quick entity chips,
 * matching the "Base Alpha" Framer prototype layout while reusing the
 * existing functional SearchBar underneath.
 */
export function HeroSearch() {
  return (
    <section className="flex flex-col items-center pt-10 text-center md:pt-16">
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-lime/[0.2] bg-brand-lime/[0.06] px-4 py-1.5 text-sm text-muted-foreground">
        <Sparkles className="h-3.5 w-3.5 text-brand-lime" />
        Search-first intelligence for Base
      </div>

      <h1 className="max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
        One command bar for every wallet, token,
        <br className="hidden md:block" />
        quest, and signal on <span className="text-gradient">Base</span>.
      </h1>

      <p className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg">
        Paste a wallet, token, contract, project, quest or airdrop. Onyx
        detects what it is and shows verified on-chain intelligence, never
        guessed.
      </p>

      <div className="mt-10 w-full max-w-3xl rounded-[28px] border border-brand-lime/[0.26] bg-gradient-to-b from-white/[0.05] to-white/[0.02] p-4 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.55),0_0_70px_-20px_rgba(237,227,199,0.08)]">
        <SearchBar size="lg" autoFocus />

        <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          {QUICK_LINKS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="group flex flex-col items-start gap-1 rounded-2xl border border-white/[0.08] bg-background/40 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-brand-lime/30 hover:bg-white/[0.04]"
            >
              <item.icon className="h-4 w-4 text-brand-lime" />
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
              <span className="text-[11px] text-muted-foreground">{item.hint}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
