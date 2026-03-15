"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { getExportUrl } from "@/lib/api";

interface CsvExportButtonProps {
  type: "products" | "customers" | "orders";
  label?: string;
}

export function CsvExportButton({ type, label }: CsvExportButtonProps) {
  const handleExport = () => {
    // Open in new tab — backend sends Content-Disposition: attachment
    window.open(getExportUrl(type), "_blank");
  };

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="h-4 w-4 mr-2" />
      {label || `Export ${type.charAt(0).toUpperCase() + type.slice(1)}`}
    </Button>
  );
}
