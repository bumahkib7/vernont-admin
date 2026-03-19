/**
 * Virtual Table — for lists with 100+ rows
 *
 * TODO: Implement using @tanstack/react-virtual
 * Install: pnpm add @tanstack/react-virtual
 *
 * This component will virtualize table rows so only visible rows
 * are rendered in the DOM. For now, use DataTable for all tables
 * (sufficient for current data volumes < 100 rows per page).
 *
 * When to switch: if any table page loads 500+ rows at once.
 */
export function VirtualTable() {
  throw new Error("VirtualTable not yet implemented — use DataTable instead");
}
