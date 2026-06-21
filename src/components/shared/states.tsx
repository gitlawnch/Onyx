import { AlertTriangle, SearchX, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Shared empty state — an invitation to act, not a dead end. */
export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
}: {
  title: string;
  description: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-16 text-center">
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-white/5">
        <div className="absolute inset-0 -z-10 rounded-xl bg-white/10 blur-xl" />
        <Icon className="h-6 w-6 text-muted-foreground" />
      </div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

/** Shared error state with optional retry. */
export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/[0.04] px-6 py-16 text-center">
      <div className="relative mb-4 grid h-12 w-12 place-items-center rounded-xl border border-red-500/20 bg-red-500/10">
        <div className="absolute inset-0 -z-10 rounded-xl bg-red-500/20 blur-xl" />
        <AlertTriangle className="h-6 w-6 text-red-300" />
      </div>
      <h3 className="font-display text-lg font-semibold">Something went wrong</h3>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
      {onRetry && (
        <Button variant="ghost" size="sm" className="mt-5" onClick={onRetry}>
          <RefreshCw className="h-4 w-4" /> Try again
        </Button>
      )}
    </div>
  );
}

export function NotFoundState({ query }: { query?: string }) {
  return (
    <EmptyState
      icon={SearchX}
      title="No match found"
      description={
        query
          ? `Nothing on Base matched "${query}". Try a contract address, wallet, token symbol, or project name.`
          : "Try a contract address, wallet, token symbol, or project name."
      }
    />
  );
}