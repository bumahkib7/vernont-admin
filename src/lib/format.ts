/**
 * Centralized formatting utilities.
 * Import from "@/lib/format" instead of defining locally per page.
 */

/** Format date: "Mar 19, 2026" */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/** Format date + time: "Mar 19, 2026, 14:30" */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format relative time: "2 hours ago", "3 days ago" */
export function formatRelativeTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return formatDate(date);
}

/** Format time only: "14:30" */
export function formatTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  return new Date(date).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Format currency from minor units (cents/pence): "£25.00" */
export function formatCurrency(amountMinor: number, currency = "GBP"): string {
  const amount = amountMinor / 100;
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Format currency from major units: "£25.00" */
export function formatCurrencyMajor(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}
