/**
 * Display formatters. All accept null/undefined and return a stable em-dash
 * placeholder so the UI renders "—" for unknown values rather than "NaN" or "0".
 */

const DASH = "—";

export function formatUsd(value: number | null | undefined, compact = true): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: value < 1 ? 6 : 2,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

export function formatNumber(value: number | null | undefined, compact = true): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  return new Intl.NumberFormat("en-US", {
    notation: compact && value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: compact ? 1 : 0,
  }).format(value);
}

export function formatPercent(value: number | null | undefined, withSign = true): string {
  if (value == null || !Number.isFinite(value)) return DASH;
  const sign = withSign && value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

export function shortenAddress(address: string | null | undefined, chars = 4): string {
  if (!address) return DASH;
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function formatAgeDays(days: number | null | undefined): string {
  if (days == null || !Number.isFinite(days)) return DASH;
  if (days < 1) return "< 1 day";
  if (days < 30) return `${Math.floor(days)} days`;
  if (days < 365) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? "month" : "months"}`;
  }
  const years = (days / 365).toFixed(1);
  return `${years} ${parseFloat(years) === 1 ? "year" : "years"}`;
}

export function relativeTime(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return DASH;
  const diff = Date.now() - then;
  const sec = Math.floor(diff / 1000);
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return DASH;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return DASH;
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
