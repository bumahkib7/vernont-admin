"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TopProductRow } from "@/hooks/use-analytics";
import { formatCurrency } from "@/lib/format";

interface TopProductsTableProps {
  data: TopProductRow[];
}

type SortKey = "revenue" | "orders" | "avgPrice";

export function TopProductsTable({ data }: TopProductsTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("revenue");
  const [sortAsc, setSortAsc] = useState(false);

  const sorted = [...data].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey];
    return sortAsc ? diff : -diff;
  });

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-muted-foreground">
        No product data available
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-8">#</TableHead>
          <TableHead>Product</TableHead>
          <TableHead className="hidden sm:table-cell">SKU</TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("revenue")}>
              Revenue <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead className="text-right">
            <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("orders")}>
              Orders <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
          <TableHead className="text-right hidden md:table-cell">
            <Button variant="ghost" size="sm" className="h-auto p-0 font-medium" onClick={() => handleSort("avgPrice")}>
              Avg Price <ArrowUpDown className="ml-1 h-3 w-3" />
            </Button>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((product, index) => (
          <TableRow key={product.id}>
            <TableCell className="text-muted-foreground">{index + 1}</TableCell>
            <TableCell className="font-medium max-w-[200px] truncate">{product.name}</TableCell>
            <TableCell className="hidden sm:table-cell text-muted-foreground">{product.sku}</TableCell>
            <TableCell className="text-right tabular-nums">{formatCurrency(product.revenue)}</TableCell>
            <TableCell className="text-right tabular-nums">{product.orders}</TableCell>
            <TableCell className="text-right tabular-nums hidden md:table-cell">{formatCurrency(product.avgPrice)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
