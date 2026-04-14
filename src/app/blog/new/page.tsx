"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { useCreateBlogPost } from "@/hooks/use-blog-posts";
import type { BlogPostType } from "@/lib/api";

const POST_TYPE_OPTIONS: { value: BlogPostType; label: string }[] = [
  { value: "PRODUCT_GUIDE", label: "Product Guide" },
  { value: "COMPARISON", label: "Comparison" },
  { value: "CATEGORY_GUIDE", label: "Category Guide" },
  { value: "EDITORIAL", label: "Editorial" },
  { value: "EXPERT_COLUMN", label: "Expert Column" },
];

export default function NewBlogPostPage() {
  const router = useRouter();
  const createPost = useCreateBlogPost();

  const [title, setTitle] = useState("");
  const [postType, setPostType] = useState<BlogPostType | "">("");

  const canSubmit = title.trim().length > 0 && postType !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !postType) return;

    try {
      const result = await createPost.mutateAsync({
        title: title.trim(),
        postType: postType as BlogPostType,
      });
      router.push(`/blog/${result.id}`);
    } catch {
      // Error toast handled by the mutation hook
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Link href="/blog">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">New Blog Post</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Create Post</CardTitle>
          </div>
          <CardDescription>
            Start with a title and post type. You can add content and details in the editor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Enter post title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="postType">Post Type *</Label>
              <Select
                value={postType}
                onValueChange={(val) => setPostType(val as BlogPostType)}
              >
                <SelectTrigger id="postType">
                  <SelectValue placeholder="Select a post type" />
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

            <div className="flex justify-end gap-2 pt-2">
              <Link href="/blog">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={!canSubmit || createPost.isPending}>
                {createPost.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Post
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
