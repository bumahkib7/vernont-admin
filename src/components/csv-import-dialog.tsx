"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { type ImportResult } from "@/lib/api";

interface CsvImportDialogProps {
  type: "products" | "customers";
  onImport: (file: File) => Promise<ImportResult>;
  onComplete?: () => void;
}

export function CsvImportDialog({ type, onImport, onComplete }: CsvImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith(".csv")) {
      toast.error("Please select a CSV file");
      return;
    }

    setImporting(true);
    setResult(null);

    try {
      const importResult = await onImport(file);
      setResult(importResult);
      if (importResult.failed === 0) {
        toast.success(`Import complete: ${importResult.imported} imported, ${importResult.updated} updated`);
      } else {
        toast.warning(`Import complete with errors: ${importResult.failed} failed`);
      }
      onComplete?.();
    } catch (err: any) {
      toast.error(err?.message || "Import failed");
    } finally {
      setImporting(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const reset = () => {
    setResult(null);
    setImporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Import {type.charAt(0).toUpperCase() + type.slice(1)}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
          <DialogDescription>
            Upload a CSV file. Existing records will be updated by {type === "products" ? "handle" : "email"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!result ? (
            <>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="csv-upload"
                  disabled={importing}
                />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  {importing ? (
                    <>
                      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Importing...</p>
                    </>
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium">Click to select a CSV file</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Required columns: {type === "products" ? "title" : "email"}
                      </p>
                    </>
                  )}
                </label>
              </div>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-amber-500" />
                )}
                <span className="font-medium">Import Complete</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-green-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-green-700">{result.imported}</p>
                  <p className="text-xs text-green-600">Imported</p>
                </div>
                <div className="bg-blue-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-blue-700">{result.updated}</p>
                  <p className="text-xs text-blue-600">Updated</p>
                </div>
                <div className="bg-red-50 rounded-lg p-3">
                  <p className="text-lg font-bold text-red-700">{result.failed}</p>
                  <p className="text-xs text-red-600">Failed</p>
                </div>
              </div>
              {result.errors.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs text-muted-foreground bg-muted rounded p-2">
                  {result.errors.map((err, i) => (
                    <p key={i}>{err}</p>
                  ))}
                </div>
              )}
              <Button variant="outline" className="w-full" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
