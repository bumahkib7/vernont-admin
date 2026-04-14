"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, X, Package } from "lucide-react";
import { getProducts, type ProductSummary } from "@/lib/api/products";
import type { BlogBlock } from "@/lib/api/blog";

// Re-export for convenience
export type { BlogBlock } from "@/lib/api/blog";

export type BlockType = BlogBlock["type"];

// ---------------------------------------------------------------------------
// Product search hook (debounced, shared between single & multi pickers)
// ---------------------------------------------------------------------------

function useProductSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await getProducts({ q: query, start: 0, end: 8 });
        setResults(res.content);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query]);

  return { query, setQuery, results, loading };
}

// ---------------------------------------------------------------------------
// Single product picker
// ---------------------------------------------------------------------------

function ProductPicker({
  productId,
  onChange,
}: {
  productId: string | undefined;
  onChange: (id: string, title: string, thumbnail?: string) => void;
}) {
  const { query, setQuery, results, loading } = useProductSearch();
  const [selected, setSelected] = useState<{
    id: string;
    title: string;
    thumbnail?: string;
  } | null>(productId ? { id: productId, title: productId, thumbnail: undefined } : null);

  const handleSelect = (p: ProductSummary) => {
    setSelected({ id: p.id, title: p.title, thumbnail: p.thumbnail });
    onChange(p.id, p.title, p.thumbnail ?? undefined);
    setQuery("");
  };

  return (
    <div className="space-y-2">
      {selected && (
        <div className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
          {selected.thumbnail ? (
            <img
              src={selected.thumbnail}
              alt=""
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-muted-foreground" />
          )}
          <span className="flex-1 truncate">{selected.title}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => {
              setSelected(null);
              onChange("", "", undefined);
            }}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-md border bg-popover text-sm">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent"
                onClick={() => handleSelect(p)}
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt=""
                    className="h-7 w-7 rounded object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="truncate">{p.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Multi product picker (chips + search)
// ---------------------------------------------------------------------------

export function MultiProductPicker({
  productIds,
  onChange,
}: {
  productIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const { query, setQuery, results, loading } = useProductSearch();
  const [chips, setChips] = useState<
    { id: string; title: string; thumbnail?: string }[]
  >(productIds.map((id) => ({ id, title: id })));

  const handleAdd = (p: ProductSummary) => {
    if (chips.some((c) => c.id === p.id)) return;
    const next = [...chips, { id: p.id, title: p.title, thumbnail: p.thumbnail ?? undefined }];
    setChips(next);
    onChange(next.map((c) => c.id));
    setQuery("");
  };

  const handleRemove = (id: string) => {
    const next = chips.filter((c) => c.id !== id);
    setChips(next);
    onChange(next.map((c) => c.id));
  };

  return (
    <div className="space-y-2">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {chips.map((c) => (
            <Badge key={c.id} variant="secondary" className="gap-1 pr-1">
              {c.thumbnail && (
                <img
                  src={c.thumbnail}
                  alt=""
                  className="h-4 w-4 rounded object-cover"
                />
              )}
              <span className="max-w-[120px] truncate">{c.title}</span>
              <button
                type="button"
                onClick={() => handleRemove(c.id)}
                className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products to add..."
          className="pl-8"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>
      {results.length > 0 && (
        <ul className="max-h-48 overflow-y-auto rounded-md border bg-popover text-sm">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-accent disabled:opacity-40"
                disabled={chips.some((c) => c.id === p.id)}
                onClick={() => handleAdd(p)}
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt=""
                    className="h-7 w-7 rounded object-cover"
                  />
                ) : (
                  <Package className="h-5 w-5 text-muted-foreground" />
                )}
                <span className="truncate">{p.title}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Auto-resizing textarea
// ---------------------------------------------------------------------------

function AutoTextarea(props: React.ComponentProps<"textarea">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  useEffect(() => {
    resize();
  }, [props.value, resize]);

  return (
    <Textarea
      {...props}
      ref={ref}
      onInput={resize}
      className={`min-h-[72px] resize-none ${props.className ?? ""}`}
    />
  );
}

// ---------------------------------------------------------------------------
// Label helper
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-xs font-medium text-muted-foreground">
      {children}
    </label>
  );
}

// ---------------------------------------------------------------------------
// BlockForm
// ---------------------------------------------------------------------------

interface BlockFormProps {
  block: BlogBlock;
  onChange: (updated: BlogBlock) => void;
}

export function BlockForm({ block, onChange }: BlockFormProps) {
  const update = (patch: Record<string, unknown>) =>
    onChange({ ...block, ...patch });

  switch (block.type) {
    // -- heading -----------------------------------------------------------
    case "heading":
      return (
        <div className="grid grid-cols-[100px_1fr] gap-3">
          <div className="space-y-1">
            <FieldLabel>Level</FieldLabel>
            <Select
              value={(block.level as string) ?? "h2"}
              onValueChange={(v) => update({ level: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="h2">H2</SelectItem>
                <SelectItem value="h3">H3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <FieldLabel>Text</FieldLabel>
            <Input
              placeholder="Heading text..."
              value={(block.text as string) ?? ""}
              onChange={(e) => update({ text: e.target.value })}
            />
          </div>
        </div>
      );

    // -- paragraph ---------------------------------------------------------
    case "paragraph":
      return (
        <div className="space-y-1">
          <FieldLabel>Content</FieldLabel>
          <AutoTextarea
            placeholder="Write paragraph content..."
            value={(block.text as string) ?? ""}
            onChange={(e) => update({ text: e.target.value })}
          />
        </div>
      );

    // -- image -------------------------------------------------------------
    case "image":
      return (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <FieldLabel>Image URL</FieldLabel>
            <Input
              placeholder="https://..."
              value={(block.url as string) ?? ""}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Alt text</FieldLabel>
            <Input
              placeholder="Descriptive alt text"
              value={(block.alt as string) ?? ""}
              onChange={(e) => update({ alt: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Caption</FieldLabel>
            <Input
              placeholder="Optional caption"
              value={(block.caption as string) ?? ""}
              onChange={(e) => update({ caption: e.target.value })}
            />
          </div>
        </div>
      );

    // -- product-card ------------------------------------------------------
    case "product-card":
      return (
        <div className="space-y-1">
          <FieldLabel>Product</FieldLabel>
          <ProductPicker
            productId={block.productId as string | undefined}
            onChange={(id, title, thumb) =>
              update({ productId: id, productTitle: title, productThumbnail: thumb })
            }
          />
        </div>
      );

    // -- product-comparison ------------------------------------------------
    case "product-comparison":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <FieldLabel>Products to compare</FieldLabel>
            <MultiProductPicker
              productIds={(block.productIds as string[]) ?? []}
              onChange={(ids) => update({ productIds: ids })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Caption (optional)</FieldLabel>
            <Input
              placeholder="Comparison caption..."
              value={(block.caption as string) ?? ""}
              onChange={(e) => update({ caption: e.target.value })}
            />
          </div>
        </div>
      );

    // -- callout -----------------------------------------------------------
    case "callout":
      return (
        <div className="grid grid-cols-[120px_1fr] gap-3">
          <div className="space-y-1">
            <FieldLabel>Icon</FieldLabel>
            <Select
              value={(block.icon as string) ?? "info"}
              onValueChange={(v) => update({ icon: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="shield">Shield</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <FieldLabel>Title</FieldLabel>
            <Input
              placeholder="Callout title..."
              value={(block.title as string) ?? ""}
              onChange={(e) => update({ title: e.target.value })}
            />
          </div>
          <div className="col-span-2 space-y-1">
            <FieldLabel>Text</FieldLabel>
            <AutoTextarea
              placeholder="Callout body..."
              value={(block.text as string) ?? ""}
              onChange={(e) => update({ text: e.target.value })}
            />
          </div>
        </div>
      );

    // -- faq ---------------------------------------------------------------
    case "faq":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <FieldLabel>Question</FieldLabel>
            <Input
              placeholder="What is...?"
              value={(block.question as string) ?? ""}
              onChange={(e) => update({ question: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Answer</FieldLabel>
            <AutoTextarea
              placeholder="The answer is..."
              value={(block.answer as string) ?? ""}
              onChange={(e) => update({ answer: e.target.value })}
            />
          </div>
        </div>
      );

    // -- cta ---------------------------------------------------------------
    case "cta":
      return (
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <FieldLabel>Button text</FieldLabel>
            <Input
              placeholder="Shop Now"
              value={(block.buttonText as string) ?? ""}
              onChange={(e) => update({ buttonText: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>URL</FieldLabel>
            <Input
              placeholder="/collections/..."
              value={(block.url as string) ?? ""}
              onChange={(e) => update({ url: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Variant</FieldLabel>
            <Select
              value={(block.variant as string) ?? "primary"}
              onValueChange={(v) => update({ variant: v })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">Primary</SelectItem>
                <SelectItem value="secondary">Secondary</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    // -- quote -------------------------------------------------------------
    case "quote":
      return (
        <div className="space-y-3">
          <div className="space-y-1">
            <FieldLabel>Quote</FieldLabel>
            <AutoTextarea
              placeholder="The quoted text..."
              value={(block.text as string) ?? ""}
              onChange={(e) => update({ text: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <FieldLabel>Attribution</FieldLabel>
            <Input
              placeholder="Author or source"
              value={(block.attribution as string) ?? ""}
              onChange={(e) => update({ attribution: e.target.value })}
            />
          </div>
        </div>
      );

    // -- divider -----------------------------------------------------------
    case "divider":
      return (
        <p className="text-sm text-muted-foreground italic">
          Horizontal divider — no editable fields
        </p>
      );

    default:
      return null;
  }
}
