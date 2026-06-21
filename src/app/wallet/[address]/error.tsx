"use client";
import { ErrorState } from "@/components/shared/states";

export default function WalletError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-16">
      <ErrorState message={error.message || "Failed to load wallet."} onRetry={reset} />
    </div>
  );
}
