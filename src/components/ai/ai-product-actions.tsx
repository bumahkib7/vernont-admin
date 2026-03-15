"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { aiDescribeProduct, aiSuggestTags } from "@/lib/api";
import { Sparkles, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── AI Description Generator ───────────────────────────────────────────────

interface AiDescriptionActionProps {
  productId: string;
  onAccept: (description: string) => void;
  className?: string;
}

export function AiDescriptionAction({
  productId,
  onAccept,
  className,
}: AiDescriptionActionProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await aiDescribeProduct(productId);
      setResult(data.description);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate description");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (result) {
      onAccept(result);
      setResult(null);
    }
  };

  const handleReject = () => {
    setResult(null);
    setError(null);
  };

  if (result) {
    return (
      <div className={cn("rounded-md border bg-muted/50 p-3 space-y-2", className)}>
        <p className="text-sm text-muted-foreground font-medium">AI-generated description</p>
        <p className="text-sm leading-relaxed">{result}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={handleAccept}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Accept
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject}>
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleGenerate}
        disabled={loading}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        )}
        Generate with AI
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

// ─── AI Tag Suggester ────────────────────────────────────────────────────────

interface AiTagSuggestionActionProps {
  productName: string;
  description?: string;
  onAccept: (tags: string[]) => void;
  className?: string;
}

export function AiTagSuggestionAction({
  productName,
  description,
  onAccept,
  className,
}: AiTagSuggestionActionProps) {
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState<string[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    setTags(null);
    try {
      const data = await aiSuggestTags(productName, description);
      setTags(data.tags);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to suggest tags");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (tags) {
      onAccept(tags);
      setTags(null);
    }
  };

  const handleReject = () => {
    setTags(null);
    setError(null);
  };

  if (tags) {
    return (
      <div className={cn("rounded-md border bg-muted/50 p-3 space-y-2", className)}>
        <p className="text-sm text-muted-foreground font-medium">Suggested tags</p>
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary">
              {tag}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="default" onClick={handleAccept}>
            <Check className="h-3.5 w-3.5 mr-1" />
            Accept all
          </Button>
          <Button size="sm" variant="outline" onClick={handleReject}>
            <X className="h-3.5 w-3.5 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Button
        type="button"
        size="sm"
        variant="outline"
        onClick={handleSuggest}
        disabled={loading || !productName}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
        ) : (
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />
        )}
        Suggest tags with AI
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
