"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DataTable, type Column } from "@/components/ui/data-table";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  FileText,
  Inbox,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useBlogPosts } from "@/hooks/use-blog-posts";
import type { BlogPostListItem, BlogPostType, BlogPostStatus } from "@/lib/api";

// ============================================================================
// Constants
// ============================================================================

const STATUS_TABS: { value: BlogPostStatus | "ALL"; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_REVIEW", label: "Pending Review" },
  { value: "APPROVED", label: "Approved" },
];

const POST_TYPE_OPTIONS: { value: BlogPostType; label: string }[] = [
  { value: "PRODUCT_GUIDE", label: "Product Guide" },
  { value: "COMPARISON", label: "Comparison" },
  { value: "CATEGORY_GUIDE", label: "Category Guide" },
  { value: "EDITORIAL", label: "Editorial" },
  { value: "EXPERT_COLUMN", label: "Expert Column" },
];

// ============================================================================
// Status Badge
// ============================================================================

const STATUS_STYLES: Record<BlogPostStatus, { bg: string; text: string; dot: string }> = {
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

function PostStatusBadge({ status }: { status: BlogPostStatus }) {
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
// Post Type Badge
// ============================================================================

function PostTypeBadge({ type }: { type: BlogPostType }) {
  const label = POST_TYPE_OPTIONS.find((o) => o.value === type)?.label ?? type;
  return (
    <Badge variant="secondary" className="font-normal">
      {label}
    </Badge>
  );
}

// ============================================================================
// Main Page
// ============================================================================

export default function BlogListPage() {
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isFetching, error, refetch } = useBlogPosts({
    status: statusFilter === "ALL" ? undefined : statusFilter,
    type: (typeFilter || undefined) as BlogPostType | undefined,
    search: searchInput || undefined,
    page,
    size: pageSize,
  });

  const posts = data?.items ?? [];
  const totalCount = data?.total ?? 0;

  // ── Column definitions ────────────────────────────────────────────────────

  const columns: Column<BlogPostListItem>[] = useMemo(
    () => [
      {
        id: "title",
        header: "Title",
        cell: (post) => (
          <Link
            href={`/blog/${post.id}`}
            className="font-medium text-sm hover:underline truncate block max-w-[300px]"
            onClick={(e) => e.stopPropagation()}
          >
            {post.title}
          </Link>
        ),
      },
      {
        id: "type",
        header: "Type",
        cell: (post) => <PostTypeBadge type={post.postType} />,
      },
      {
        id: "status",
        header: "Status",
        cell: (post) => <PostStatusBadge status={post.status} />,
      },
      {
        id: "category",
        header: "Category",
        hideOnMobile: true,
        cell: (post) => (
          <span className="text-sm text-muted-foreground">
            {post.category || "--"}
          </span>
        ),
      },
      {
        id: "wordCount",
        header: "Words",
        hideOnMobile: true,
        cell: (post) => (
          <span className="text-sm text-muted-foreground tabular-nums">
            {post.wordCount?.toLocaleString() ?? "--"}
          </span>
        ),
      },
      {
        id: "publishedAt",
        header: "Published",
        hideOnMobile: true,
        cell: (post) => (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString("en-GB", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })
              : "--"}
          </span>
        ),
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (post) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/blog/${post.id}`}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive focus:text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const hasActiveFilters = statusFilter !== "ALL" || !!typeFilter || !!searchInput;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pb-4">
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl font-semibold">Blog Posts</CardTitle>
            {totalCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {totalCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <Link href="/blog/new">
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                New Post
              </Button>
            </Link>
          </div>
        </CardHeader>

        <CardContent>
          {/* Status Tabs */}
          <div className="flex items-center gap-1 mb-4 border-b">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => {
                  setStatusFilter(tab.value);
                  setPage(0);
                }}
                className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
                  statusFilter === tab.value
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Select
                value={typeFilter || "__all__"}
                onValueChange={(val) => {
                  setTypeFilter(val === "__all__" ? "" : val);
                  setPage(0);
                }}
              >
                <SelectTrigger className="h-8 w-[170px]">
                  <SelectValue placeholder="Post Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Types</SelectItem>
                  {POST_TYPE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 text-muted-foreground"
                  onClick={() => {
                    setStatusFilter("ALL");
                    setTypeFilter("");
                    setSearchInput("");
                    setPage(0);
                  }}
                >
                  Clear all
                </Button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search posts..."
                className="pl-8 h-8 w-full sm:w-[240px]"
                value={searchInput}
                onChange={(e) => {
                  setSearchInput(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 dark:bg-red-950/20 dark:text-red-400 rounded-lg">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span className="text-sm">{error.message}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refetch()}
                className="ml-auto"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Data Table */}
          <DataTable
            columns={columns}
            data={posts}
            loading={isLoading}
            loadingRows={8}
            getRowId={(p) => p.id}
            onRowClick={(p) => (window.location.href = `/blog/${p.id}`)}
            pagination={{
              page,
              pageSize,
              total: totalCount,
              onPageChange: setPage,
            }}
            emptyIcon={<Inbox className="h-12 w-12 opacity-30" />}
            emptyTitle="No blog posts yet"
            emptyDescription={
              hasActiveFilters
                ? "Try adjusting your filters or search query."
                : "Create your first post."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
