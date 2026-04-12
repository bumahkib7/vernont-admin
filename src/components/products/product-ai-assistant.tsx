"use client";

import { useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Check,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  useProductAgent,
  type ProductAgentStep,
} from "@/hooks/use-product-agent";
import type { ProductContentResult } from "@/lib/api/ai";

// ── Types ──────────────────────────────────────────────────────────────

interface ProductAiAssistantProps {
  productId?: string;
  title?: string;
  brand?: string;
  images?: string[];
  onApplyField: (field: string, value: string | string[]) => void;
}

// ── Field display config ───────────────────────────────────────────────

const FIELD_CONFIG: {
  key: keyof ProductContentResult;
  label: string;
  isArray?: boolean;
}[] = [
  { key: "description", label: "Description" },
  { key: "subtitle", label: "Subtitle" },
  { key: "tags", label: "Tags", isArray: true },
  { key: "metaTitle", label: "Meta Title" },
  { key: "metaDescription", label: "Meta Description" },
  { key: "metaKeywords", label: "Meta Keywords" },
];

// Known steps for the pending indicator
const ALL_STEPS = [
  "analyze_product_image",
  "search_product_online",
  "generate_product_content",
] as const;

const STEP_LABELS: Record<string, string> = {
  analyze_product_image: "Analyzing product images",
  search_product_online: "Researching product online",
  generate_product_content: "Generating product content",
};

// ── Component ──────────────────────────────────────────────────────────

export function ProductAiAssistant({
  productId,
  title,
  brand,
  images,
  onApplyField,
}: ProductAiAssistantProps) {
  const agent = useProductAgent();
  const [appliedFields, setAppliedFields] = useState<Set<string>>(new Set());
  const [showBuffer, setShowBuffer] = useState(false);

  const handleGenerate = useCallback(() => {
    setAppliedFields(new Set());
    agent.start({ productId, title, brand, images });
  }, [agent, productId, title, brand, images]);

  const handleRegenerate = useCallback(() => {
    setAppliedFields(new Set());
    agent.reset();
  }, [agent]);

  const handleApply = useCallback(
    (field: string, value: string | string[]) => {
      onApplyField(field, value);
      setAppliedFields((prev) => new Set(prev).add(field));
    },
    [onApplyField]
  );

  const handleApplyAll = useCallback(() => {
    if (!agent.result) return;
    for (const fc of FIELD_CONFIG) {
      const value = agent.result[fc.key];
      if (value !== undefined && value !== null) {
        onApplyField(fc.key, value);
      }
    }
    setAppliedFields(new Set(FIELD_CONFIG.map((fc) => fc.key)));
  }, [agent.result, onApplyField]);

  // ── Idle ──────────────────────────────────────────────────────────────

  if (agent.status === "idle") {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            AI Product Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <p className="text-sm text-muted-foreground mb-4">
            Generate product descriptions, tags, and SEO content from your
            product images and brand information.
          </p>
          <Button onClick={handleGenerate}>
            <Sparkles className="h-4 w-4 mr-2" />
            Generate Content
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Running ───────────────────────────────────────────────────────────

  if (agent.status === "running") {
    const activeStepTools = new Set(agent.steps.map((s) => s.tool));

    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-950/20 dark:to-blue-950/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-base">
            <Loader2 className="h-5 w-5 animate-spin text-violet-600 dark:text-violet-400" />
            Generating...
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Steps */}
          <div className="space-y-2">
            {ALL_STEPS.map((toolName) => {
              const step = agent.steps.find((s) => s.tool === toolName);
              return (
                <StepRow
                  key={toolName}
                  label={STEP_LABELS[toolName] || toolName}
                  status={step?.status}
                  active={activeStepTools.has(toolName)}
                />
              );
            })}
          </div>

          {/* Text buffer */}
          {agent.textBuffer && (
            <div className="space-y-1">
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowBuffer((v) => !v)}
              >
                Agent reasoning
                {showBuffer ? (
                  <ChevronUp className="h-3 w-3" />
                ) : (
                  <ChevronDown className="h-3 w-3" />
                )}
              </button>
              {showBuffer && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded p-2 max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {agent.textBuffer}
                </p>
              )}
            </div>
          )}

          <Button variant="outline" size="sm" onClick={agent.cancel}>
            Cancel
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Error ─────────────────────────────────────────────────────────────

  if (agent.status === "error") {
    return (
      <Card>
        <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 rounded-t-lg">
          <CardTitle className="flex items-center gap-2 text-base text-red-700 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            Generation failed
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm text-muted-foreground">
            {agent.error || "An unknown error occurred."}
          </p>
          <Button variant="outline" size="sm" onClick={handleGenerate}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // ── Done ──────────────────────────────────────────────────────────────

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-base text-green-700 dark:text-green-400">
          <Check className="h-5 w-5" />
          Content generated
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {/* Top actions */}
        <div className="flex gap-2">
          <Button size="sm" onClick={handleApplyAll}>
            Apply All
          </Button>
          <Button variant="outline" size="sm" onClick={handleRegenerate}>
            Regenerate
          </Button>
        </div>

        {/* Result fields */}
        {agent.result && (
          <div className="space-y-3">
            {FIELD_CONFIG.map((fc) => {
              const value = agent.result![fc.key];
              if (value === undefined || value === null) return null;
              const isApplied = appliedFields.has(fc.key);

              return (
                <div
                  key={fc.key}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="flex-1 min-w-0 space-y-1">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      {fc.label}
                    </span>
                    {fc.isArray && Array.isArray(value) ? (
                      <div className="flex flex-wrap gap-1">
                        {(value as string[]).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm line-clamp-2">{value as string}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={isApplied ? "text-green-600" : ""}
                    onClick={() =>
                      handleApply(fc.key, value as string | string[])
                    }
                  >
                    {isApplied ? (
                      <>
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Applied
                      </>
                    ) : (
                      "Apply"
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}

        {!agent.result && (
          <p className="text-sm text-muted-foreground">
            No structured content was returned. Try regenerating.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

// ── Step row sub-component ─────────────────────────────────────────────

function StepRow({
  label,
  status,
  active,
}: {
  label: string;
  status?: ProductAgentStep["status"];
  active: boolean;
}) {
  if (status === "complete") {
    return (
      <div className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-600 shrink-0" />
        <span className="text-sm">{label}</span>
      </div>
    );
  }
  if (status === "executing") {
    return (
      <div className="flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
        <span className="text-sm">{label}</span>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
        <span className="text-sm text-red-600">{label}</span>
      </div>
    );
  }
  // Pending
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 w-4 rounded-full border border-muted-foreground/30 shrink-0" />
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}
