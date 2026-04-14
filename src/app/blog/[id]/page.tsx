"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Save,
  Loader2,
  ChevronDown,
  ChevronRight,
  Eye,
  RefreshCw,
  Send,
  CheckCircle,
  XCircle,
  Sparkles,
  X,
  Plus,
  Package,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useBlogPost,
  useUpdateBlogPost,
  useUpdateBlogPostStatus,
  useGenerateBlogPostAI,
  useAiAssistBlocks,
} from "@/hooks/use-blog-posts";
import { generatePreviewToken } from "@/lib/api/blog";
import { BlockEditor } from "@/components/blog/BlockEditor";
import { BlogPostAIDialog } from "@/components/blog/BlogPostAIDialog";
import { AiCopilotPanel } from "@/components/blog/AiCopilotPanel";
import type {
  BlogPost,
  BlogBlock,
  BlogPostType,
  BlogPostStatus,
  BlogPostProduct,
  GenerateBlogPostAIInput,
} from "@/lib/api";

// ============================================================================
// Constants
// ============================================================================

const POST_TYPE_OPTIONS: { value: BlogPostType; label: string }[] = [
  { value: "PRODUCT_GUIDE", label: "Product Guide" },
  { value: "COMPARISON", label: "Comparison" },
  { value: "CATEGORY_GUIDE", label: "Category Guide" },
  { value: "EDITORIAL", label: "Editorial" },
  { value: "EXPERT_COLUMN", label: "Expert Column" },
];

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  DRAFT: {
    bg: "bg-gray-100 dark:bg-gray-800/40",
    text: "text-gray-600 dark:text-gray-400",
    dot: "bg-gray-400",
  },
  PENDING_REVIEW: {
    bg: "bg-amber-50 dark:bg-amber-950/40",
    text: "text-amber-700 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  APPROVED: {
    bg: "bg-emerald-50 dark:bg-emerald-950/40",
    text: "text-emerald-700 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  REJECTED: {
    bg: "bg-red-50 dark:bg-red-950/40",
    text: "text-red-700 dark:text-red-300",
    dot: "bg-red-500",
  },
  ARCHIVED: {
    bg: "bg-slate-100 dark:bg-slate-800/40",
    text: "text-slate-600 dark:text-slate-400",
    dot: "bg-slate-400",
  },
};

function StatusBadgeInline({ status }: { status: BlogPostStatus }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.DRAFT;
  const label = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return (
    <Badge
      variant="outline"
      className={`${style.bg} ${style.text} border-transparent font-normal gap-1.5`}
    >
      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${style.dot}`} />
      {label}
    </Badge>
  );
}

// ============================================================================
// Slug helper
// ============================================================================

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

// ============================================================================
// Tag Input Component
// ============================================================================

function TagInput({
  tags,
  onChange,
}: {
  tags: string[];
  onChange: (tags: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const value = input.trim();
      if (value && !tags.includes(value)) {
        onChange([...tags, value]);
      }
      setInput("");
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="gap-1 cursor-pointer"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
          >
            {tag}
            <X className="h-3 w-3" />
          </Badge>
        ))}
      </div>
      <Input
        placeholder="Type a tag and press Enter..."
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}

// ============================================================================
// Product Link Component
// ============================================================================

function ProductLinksCard({
  products,
  onAdd,
  onRemove,
}: {
  products: BlogPostProduct[];
  onAdd: () => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Linked Products</CardTitle>
          <Button variant="outline" size="sm" className="h-7 gap-1" onClick={onAdd}>
            <Plus className="h-3 w-3" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground">No products linked.</p>
        ) : (
          <div className="space-y-2">
            {products.map((p) => (
              <div
                key={p.productId}
                className="flex items-center justify-between py-1.5 px-2 rounded-md bg-muted/50"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{p.productTitle ?? p.productId}</span>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {p.role}
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onRemove(p.productId)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ============================================================================
// Map between dialog PostType (kebab-case) and API BlogPostType (UPPER_SNAKE)
// ============================================================================

const DIALOG_TO_API_TYPE: Record<string, BlogPostType> = {
  "product-guide": "PRODUCT_GUIDE",
  comparison: "COMPARISON",
  "category-guide": "CATEGORY_GUIDE",
  editorial: "EDITORIAL",
  "expert-column": "EXPERT_COLUMN",
};

// ============================================================================
// Main Editor Page
// ============================================================================

export default function BlogEditorPage() {
  const params = useParams();
  const postId = params.id as string;

  const { data: post, isLoading, error } = useBlogPost(postId);
  const updatePost = useUpdateBlogPost();
  const updateStatus = useUpdateBlogPostStatus();
  const generateAI = useGenerateBlogPostAI();
  const aiAssist = useAiAssistBlocks();

  // ── Local form state ─────────────────────────────────────────────────────
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [postType, setPostType] = useState<BlogPostType>("PRODUCT_GUIDE");
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [excerpt, setExcerpt] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorCredential, setAuthorCredential] = useState("");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [featured, setFeatured] = useState(false);
  const [blocks, setBlocks] = useState<BlogBlock[]>([]);
  const [products, setProducts] = useState<BlogPostProduct[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [metadataOpen, setMetadataOpen] = useState(true);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [previewSize, setPreviewSize] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [previewReady, setPreviewReady] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // ── Sync from fetched data ───────────────────────────────────────────────
  useEffect(() => {
    if (post) {
      setTitle(post.title ?? "");
      setSubtitle(post.subtitle ?? "");
      setSlug(post.slug ?? "");
      setPostType(post.postType ?? "PRODUCT_GUIDE");
      setCategory(post.category ?? "");
      setTags(post.tags ?? []);
      setExcerpt(post.excerpt ?? "");
      setCoverImageUrl(post.coverImageUrl ?? "");
      setAuthorName(post.author?.name ?? "");
      setAuthorCredential(post.author?.credential ?? "");
      setSeoTitle(post.seoTitle ?? "");
      setSeoDescription(post.seoDescription ?? "");
      setFeatured(post.featured ?? false);
      setBlocks(post.blocks ?? []);
      setProducts(post.products ?? []);
    }
  }, [post]);

  // ── Auto-slug from title ─────────────────────────────────────────────────
  useEffect(() => {
    if (!slugManuallyEdited && title) {
      setSlug(slugify(title));
    }
  }, [title, slugManuallyEdited]);

  // ── Listen for PREVIEW_READY from iframe ─────────────────────────────────
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "PREVIEW_READY") {
        setPreviewReady(true);
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // ── Send live updates to iframe via PostMessage ─────────────────────────
  useEffect(() => {
    if (!previewReady || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      {
        type: "PREVIEW_UPDATE",
        title,
        subtitle,
        excerpt,
        coverImageUrl,
        category,
        readingTimeMinutes: Math.max(1, Math.ceil(
          blocks.filter((b) => b.type === "paragraph" || b.type === "heading")
            .reduce((sum, b) => sum + String(b.text ?? "").split(/\s+/).length, 0) / 200
        )),
        author: authorName ? { name: authorName, credential: authorCredential } : null,
        blocks,
      },
      "*"
    );
  }, [previewReady, title, subtitle, excerpt, coverImageUrl, category, authorName, authorCredential, blocks]);

  // ── Scroll to block in preview ──────────────────────────────────────────
  const scrollToBlockInPreview = useCallback((index: number) => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "SCROLL_TO_BLOCK", index },
      "*"
    );
  }, []);

  // ── Save handler ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    try {
      await updatePost.mutateAsync({
        id: postId,
        data: {
          title,
          subtitle: subtitle || undefined,
          slug,
          postType,
          category: category || undefined,
          tags,
          excerpt: excerpt || undefined,
          coverImageUrl: coverImageUrl || undefined,
          author:
            authorName || authorCredential
              ? { name: authorName, credential: authorCredential }
              : undefined,
          seoTitle: seoTitle || undefined,
          seoDescription: seoDescription || undefined,
          featured,
          blocks,
          products,
        },
      });
    } catch {
      // Error toast handled by the mutation hook
    }
  }, [
    postId,
    title,
    subtitle,
    slug,
    postType,
    category,
    tags,
    excerpt,
    coverImageUrl,
    authorName,
    authorCredential,
    seoTitle,
    seoDescription,
    featured,
    blocks,
    products,
    updatePost,
  ]);

  // ── Status transition handlers ───────────────────────────────────────────
  const handleStatusChange = useCallback(
    async (newStatus: BlogPostStatus) => {
      try {
        await updateStatus.mutateAsync({ id: postId, status: newStatus });
      } catch {
        // Error toast handled by the mutation hook
      }
    },
    [postId, updateStatus]
  );

  // ── Preview handler ──────────────────────────────────────────────────────
  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const result = await generatePreviewToken(postId);
      setPreviewToken(result.token);
    } catch {
      toast.error("Failed to generate preview");
    } finally {
      setPreviewLoading(false);
    }
  }, [postId]);

  // ── AI generation handler ────────────────────────────────────────────────
  const handleAIGenerate = useCallback(
    async (data: { type: string; productIds: string[]; topic?: string }) => {
      const apiType = DIALOG_TO_API_TYPE[data.type] ?? postType;
      try {
        await generateAI.mutateAsync({
          id: postId,
          data: {
            type: apiType,
            productIds: data.productIds,
            topic: data.topic,
          },
        });
        setAiDialogOpen(false);
      } catch {
        // Error toast handled by the mutation hook
      }
    },
    [postId, postType, generateAI]
  );

  // ── Product add/remove ───────────────────────────────────────────────────
  const handleAddProduct = useCallback(() => {
    toast.info("Product search coming soon");
  }, []);

  const handleRemoveProduct = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.productId !== productId));
  }, []);

  // ── AI Copilot handler ──────────────────────────────────────────────────
  const handleCopilotSubmit = useCallback(
    (prompt: string) => {
      aiAssist.mutate(
        {
          postId,
          data: {
            prompt,
            blocks,
            context: { title, postType, category },
          },
        },
        {
          onSuccess: (result) => {
            setBlocks(result.blocks as BlogBlock[]);
            // Push response message to copilot panel
            const addMessage = (window as unknown as Record<string, unknown>)
              .__blogCopilotAddMessage as
              | ((message: string, summary: string) => void)
              | undefined;
            addMessage?.(result.message, result.summary);
            toast.success(`AI Copilot: ${result.summary}`);
          },
        }
      );
    },
    [postId, blocks, title, postType, category, aiAssist]
  );

  // ── Preview URL ──────────────────────────────────────────────────────────
  const previewUrl = previewToken
    ? `https://vernont.com/blog/preview?token=${previewToken}`
    : null;

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-6 w-64" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-96 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (error || !post) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">
          {error?.message ?? "Blog post not found"}
        </p>
        <Link href="/blog">
          <Button variant="outline">Back to Blog</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/blog">
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="text-lg font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0 max-w-md"
            placeholder="Post title..."
          />
          <StatusBadgeInline status={post.status} />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Save */}
          <Button
            onClick={handleSave}
            disabled={updatePost.isPending}
            className="gap-1.5"
          >
            {updatePost.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save
          </Button>

          {/* Status Actions */}
          {post.status === "DRAFT" && (
            <Button
              variant="outline"
              onClick={() => handleStatusChange("PENDING_REVIEW")}
              disabled={updateStatus.isPending}
              className="gap-1.5"
            >
              <Send className="h-4 w-4" />
              Submit for Review
            </Button>
          )}
          {post.status === "PENDING_REVIEW" && (
            <>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("APPROVED")}
                disabled={updateStatus.isPending}
                className="gap-1.5 text-emerald-700 border-emerald-300 hover:bg-emerald-50 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-950/30"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="outline"
                onClick={() => handleStatusChange("REJECTED")}
                disabled={updateStatus.isPending}
                className="gap-1.5 text-red-700 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-950/30"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </Button>
            </>
          )}

          {/* AI Generate */}
          <Button
            variant="outline"
            onClick={() => setAiDialogOpen(true)}
            className="gap-1.5"
          >
            <Sparkles className="h-4 w-4" />
            Generate with AI
          </Button>
        </div>
      </div>

      {/* ── Two Column Layout ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Metadata Form */}
          <Collapsible open={metadataOpen} onOpenChange={setMetadataOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Post Metadata
                    </CardTitle>
                    {metadataOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-title">Title</Label>
                    <Input
                      id="meta-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  {/* Subtitle */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-subtitle">Subtitle</Label>
                    <Input
                      id="meta-subtitle"
                      value={subtitle}
                      onChange={(e) => setSubtitle(e.target.value)}
                      placeholder="Optional subtitle..."
                    />
                  </div>

                  {/* Slug */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-slug">Slug</Label>
                    <Input
                      id="meta-slug"
                      value={slug}
                      onChange={(e) => {
                        setSlug(e.target.value);
                        setSlugManuallyEdited(true);
                      }}
                      placeholder="url-friendly-slug"
                    />
                  </div>

                  {/* Post Type */}
                  <div className="space-y-1.5">
                    <Label>Post Type</Label>
                    <Select
                      value={postType}
                      onValueChange={(val) => setPostType(val as BlogPostType)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POST_TYPE_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Category */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-category">Category</Label>
                    <Input
                      id="meta-category"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      placeholder="e.g. Sunglasses, Eyeglasses..."
                    />
                  </div>

                  {/* Tags */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Tags</Label>
                    <TagInput tags={tags} onChange={setTags} />
                  </div>

                  {/* Excerpt */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="meta-excerpt">Excerpt</Label>
                    <Textarea
                      id="meta-excerpt"
                      value={excerpt}
                      onChange={(e) => setExcerpt(e.target.value)}
                      placeholder="A short summary of the post..."
                      rows={3}
                    />
                  </div>

                  {/* Cover Image URL */}
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="meta-cover">Cover Image URL</Label>
                    <Input
                      id="meta-cover"
                      value={coverImageUrl}
                      onChange={(e) => setCoverImageUrl(e.target.value)}
                      placeholder="https://..."
                    />
                    {coverImageUrl && (
                      <div className="mt-2 relative h-32 w-48 rounded-md overflow-hidden border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImageUrl}
                          alt="Cover preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}
                  </div>

                  <Separator className="sm:col-span-2" />

                  {/* Author Name */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-author">Author Name</Label>
                    <Input
                      id="meta-author"
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Author name..."
                    />
                  </div>

                  {/* Author Credential */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-credential">Author Credential</Label>
                    <Input
                      id="meta-credential"
                      value={authorCredential}
                      onChange={(e) => setAuthorCredential(e.target.value)}
                      placeholder="e.g. Optician, Editor..."
                    />
                  </div>

                  <Separator className="sm:col-span-2" />

                  {/* SEO Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-seo-title">SEO Title</Label>
                    <Input
                      id="meta-seo-title"
                      value={seoTitle}
                      onChange={(e) => setSeoTitle(e.target.value)}
                      placeholder="SEO-optimized title..."
                    />
                  </div>

                  {/* SEO Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="meta-seo-desc">SEO Description</Label>
                    <Textarea
                      id="meta-seo-desc"
                      value={seoDescription}
                      onChange={(e) => setSeoDescription(e.target.value)}
                      placeholder="Meta description for search engines..."
                      rows={2}
                    />
                  </div>

                  {/* Featured Toggle */}
                  <div className="flex items-center gap-3 sm:col-span-2">
                    <Switch
                      id="meta-featured"
                      checked={featured}
                      onCheckedChange={setFeatured}
                    />
                    <Label htmlFor="meta-featured" className="cursor-pointer">
                      Featured Post
                    </Label>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Block Editor */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Content</CardTitle>
            </CardHeader>
            <CardContent>
              <BlockEditor blocks={blocks} onChange={setBlocks} />
            </CardContent>
          </Card>

          {/* AI Copilot Panel */}
          <AiCopilotPanel
            postId={postId}
            blocks={blocks}
            title={title}
            postType={postType}
            category={category}
            onBlocksUpdate={setBlocks}
            isPending={aiAssist.isPending}
            onSubmit={handleCopilotSubmit}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Preview Panel */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">
                  Preview {previewReady && <span className="text-xs text-green-600 font-normal ml-1">Live</span>}
                </CardTitle>
                <div className="flex gap-1.5">
                  {previewToken && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1"
                      onClick={handlePreview}
                      disabled={previewLoading}
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${previewLoading ? "animate-spin" : ""}`}
                      />
                      Refresh
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1"
                    onClick={handlePreview}
                    disabled={previewLoading}
                  >
                    {previewLoading ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                    Preview
                  </Button>
                </div>
              </div>
              {/* Responsive preview toggle */}
              {previewUrl && (
                <div className="flex gap-1 mt-2">
                  {(["desktop", "tablet", "mobile"] as const).map((size) => (
                    <Button
                      key={size}
                      variant={previewSize === size ? "default" : "ghost"}
                      size="sm"
                      className="h-6 text-xs px-2"
                      onClick={() => setPreviewSize(size)}
                    >
                      {size === "desktop" ? "Desktop" : size === "tablet" ? "Tablet" : "Mobile"}
                    </Button>
                  ))}
                </div>
              )}
            </CardHeader>
            <CardContent>
              {previewUrl ? (
                <div className="flex justify-center bg-muted/30 rounded p-2">
                  <iframe
                    ref={iframeRef}
                    src={previewUrl}
                    className="border rounded bg-white transition-all duration-300 h-[600px]"
                    style={{
                      width: previewSize === "mobile" ? "375px" : previewSize === "tablet" ? "768px" : "100%",
                    }}
                    title="Blog post preview"
                    onLoad={() => {
                      // Send initial data once iframe loads
                      setTimeout(() => {
                        iframeRef.current?.contentWindow?.postMessage(
                          {
                            type: "PREVIEW_UPDATE",
                            title,
                            subtitle,
                            excerpt,
                            coverImageUrl,
                            category,
                            author: authorName ? { name: authorName, credential: authorCredential } : null,
                            blocks,
                          },
                          "*"
                        );
                      }, 500);
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Eye className="h-10 w-10 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">
                    Click Preview to see how this post will look on the storefront
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Post Info Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Post Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <StatusBadgeInline status={post.status} />
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Word Count</span>
                <span className="tabular-nums">{post.wordCount?.toLocaleString() ?? "--"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Reading Time</span>
                <span>{post.readingTimeMinutes ? `${post.readingTimeMinutes} min` : "--"}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Quality Score</span>
                <span className="tabular-nums">{post.qualityScore ?? "--"}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Created</span>
                <span className="text-xs">
                  {post.createdAt
                    ? new Date(post.createdAt).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Updated</span>
                <span className="text-xs">
                  {post.updatedAt
                    ? new Date(post.updatedAt).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "--"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Published</span>
                <span className="text-xs">
                  {post.publishedAt
                    ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "--"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <ProductLinksCard
            products={products}
            onAdd={handleAddProduct}
            onRemove={handleRemoveProduct}
          />
        </div>
      </div>

      {/* AI Dialog */}
      <BlogPostAIDialog
        open={aiDialogOpen}
        onOpenChange={setAiDialogOpen}
        onGenerate={handleAIGenerate}
        isGenerating={generateAI.isPending}
      />
    </div>
  );
}
