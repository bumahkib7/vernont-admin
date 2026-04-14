"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles } from "lucide-react";
import { MultiProductPicker } from "./BlockForm";

// ---------------------------------------------------------------------------
// Post types for AI generation
// ---------------------------------------------------------------------------

const POST_TYPES = [
  { value: "product-guide", label: "Product Guide" },
  { value: "comparison", label: "Comparison" },
  { value: "category-guide", label: "Category Guide" },
  { value: "editorial", label: "Editorial" },
  { value: "expert-column", label: "Expert Column" },
] as const;

type PostType = (typeof POST_TYPES)[number]["value"];

// ---------------------------------------------------------------------------
// BlogPostAIDialog
// ---------------------------------------------------------------------------

interface BlogPostAIDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (data: {
    type: PostType;
    productIds: string[];
    topic?: string;
  }) => void;
  isGenerating: boolean;
}

export function BlogPostAIDialog({
  open,
  onOpenChange,
  onGenerate,
  isGenerating,
}: BlogPostAIDialogProps) {
  const [type, setType] = useState<PostType>("product-guide");
  const [productIds, setProductIds] = useState<string[]>([]);
  const [topic, setTopic] = useState("");

  const handleGenerate = () => {
    onGenerate({
      type,
      productIds,
      topic: topic.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Blog Post with AI
          </DialogTitle>
          <DialogDescription>
            Choose a post type, select relevant products, and optionally provide
            a topic. Claude will generate a structured article with blocks.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Post type selector */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Post type</label>
            <Select
              value={type}
              onValueChange={(v) => setType(v as PostType)}
              disabled={isGenerating}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {POST_TYPES.map((pt) => (
                  <SelectItem key={pt.value} value={pt.value}>
                    {pt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Product multi-search */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Products</label>
            <MultiProductPicker
              productIds={productIds}
              onChange={setProductIds}
            />
          </div>

          {/* Optional topic */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium">
              Topic / title{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </label>
            <Input
              placeholder="e.g. Best Polarized Sunglasses for Fishing"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              disabled={isGenerating}
            />
          </div>

          {/* Progress indicator */}
          {isGenerating && (
            <div className="flex items-center gap-2 rounded-md bg-muted px-4 py-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Claude is generating your article...
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate with Claude
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
