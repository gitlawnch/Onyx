"use client";
import { ErrorState } from "@/components/shared/states";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="container py-24">
      <ErrorState
        message={error.message || "An unexpected error occurred."}
        onRetry={reset}
      />
    </div>
  );
}
