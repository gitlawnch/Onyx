import Link from "next/link";
import { Home, Search } from "lucide-react";
import { SearchBar } from "@/components/search/search-bar";

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      <p className="font-display text-7xl font-bold text-gradient">404</p>
      <h1 className="mt-4 font-display text-2xl font-bold">Page not found</h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        That page doesn&apos;t exist. Try searching for a wallet, token, project,
        or airdrop instead.
      </p>
      <div className="mt-8 w-full max-w-xl">
        <SearchBar size="md" />
      </div>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-xl border border-white/[0.12] px-5 py-2.5 text-sm font-medium transition-colors hover:bg-white/[0.04]"
      >
        <Home className="h-4 w-4" /> Back home
      </Link>
    </div>
  );
}
