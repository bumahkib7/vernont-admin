"use client";

import * as React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { SortableHeader } from "@/components/ui/sortable-header";
import { DataTableSkeleton } from "@/components/ui/data-table-skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Package } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Column<T> {
  id: string;
  header: string | React.ReactNode;
  cell: (row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  loadingRows?: number;

  // Selection
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  getRowId: (row: T) => string;

  // Sorting
  sortField?: string;
  sortDirection?: "asc" | "desc";
  onSort?: (field: string) => void;

  // Pagination
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };

  // Empty state
  emptyIcon?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;

  // Row click
  onRowClick?: (row: T) => void;
}

// ── Component ────────────────────────────────────────────────────────────────

export function DataTable<T>({
  columns,
  data,
  loading = false,
  loadingRows = 5,
  selectable = false,
  selectedIds,
  onSelectionChange,
  getRowId,
  sortField,
  sortDirection,
  onSort,
  pagination,
  emptyIcon,
  emptyTitle = "No results found",
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading && data.length === 0) {
    return (
      <DataTableSkeleton
        columns={columns.length + (selectable ? 1 : 0)}
        rows={loadingRows}
      />
    );
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  const allSelected =
    data.length > 0 && selectedIds?.size === data.length;

  const toggleAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(new Set(data.map((row) => getRowId(row))));
    } else {
      onSelectionChange(new Set());
    }
  };

  const toggleRow = (id: string, checked: boolean) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (checked) next.add(id);
    else next.delete(id);
    onSelectionChange(next);
  };

  const colSpan = columns.length + (selectable ? 1 : 0);

  const responsiveClass = (col: Column<T>) =>
    cn(
      col.className,
      col.hideOnMobile && "hidden sm:table-cell",
      col.hideOnTablet && "hidden md:table-cell"
    );

  // ── Pagination math ────────────────────────────────────────────────────────
  const totalPages = pagination
    ? Math.ceil(pagination.total / pagination.pageSize)
    : 0;
  const rangeStart = pagination
    ? (pagination.page - 1) * pagination.pageSize + 1
    : 0;
  const rangeEnd = pagination
    ? Math.min(pagination.page * pagination.pageSize, pagination.total)
    : 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-[40px]">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={(checked) => toggleAll(!!checked)}
                  />
                </TableHead>
              )}
              {columns.map((col) => (
                <TableHead key={col.id} className={responsiveClass(col)}>
                  {col.sortable && onSort ? (
                    <SortableHeader
                      label={typeof col.header === "string" ? col.header : ""}
                      field={col.id}
                      currentSort={sortField}
                      currentDirection={sortDirection}
                      onSort={onSort}
                    />
                  ) : (
                    col.header
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={colSpan} className="py-12">
                  <div className="flex flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                    {emptyIcon ?? <Package className="h-10 w-10 opacity-40" />}
                    <p className="font-medium">{emptyTitle}</p>
                    {emptyDescription && (
                      <p className="text-sm">{emptyDescription}</p>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((row) => {
                const rowId = getRowId(row);
                return (
                  <TableRow
                    key={rowId}
                    className={cn(
                      onRowClick && "cursor-pointer hover:bg-muted/50"
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <TableCell>
                        <Checkbox
                          checked={selectedIds?.has(rowId) ?? false}
                          onCheckedChange={(checked) =>
                            toggleRow(rowId, !!checked)
                          }
                          onClick={(e) => e.stopPropagation()}
                        />
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell key={col.id} className={responsiveClass(col)}>
                        {col.cell(row)}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && totalPages > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-muted-foreground">
          <span>
            Showing {rangeStart}&ndash;{rangeEnd} of {pagination.total}
          </span>
          <div className="flex items-center gap-2">
            <span>
              Page {pagination.page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.page >= totalPages}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
