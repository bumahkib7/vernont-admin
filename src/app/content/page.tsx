"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  FileText,
  CheckCircle2,
  Clock,
  XCircle,
  TrendingUp,
  Package,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface DashboardStats {
  totalPublishedProducts: number;
  productsWithApprovedContent: number;
  productsNeedingContent: number;
  pendingReviewCount: number;
  contentGeneratedLast24h: number;
  coveragePercentage: number;
  contentByStatus: {
    draft: number;
    pending_review: number;
    approved: number;
    rejected: number;
  };
  recentContent: Array<{
    id: string;
    productId: string;
    productTitle: string;
    status: string;
    qualityScore: number;
    createdAt: string;
  }>;
}

export default function ContentDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/admin/content/dashboard");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        toast.error("Failed to load dashboard stats");
      }
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      toast.error("Error loading dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Sparkles className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-lg font-medium">Failed to load dashboard</p>
          <Button onClick={fetchDashboardStats} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          AI SEO Content Dashboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Manage AI-generated product content and SEO optimization
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPublishedProducts}</div>
            <p className="text-xs text-muted-foreground">
              Published products in catalog
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Content</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsWithApprovedContent}</div>
            <p className="text-xs text-muted-foreground">
              Have approved AI content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Need Content</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.productsNeedingContent}</div>
            <p className="text-xs text-muted-foreground">
              Missing SEO content
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Coverage</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.coveragePercentage}%
            </div>
            <p className="text-xs text-muted-foreground">
              Content completion rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Content by Status</CardTitle>
            <CardDescription>Current state of AI-generated content</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Draft</span>
              </div>
              <Badge variant="secondary">{stats.contentByStatus.draft}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-medium">Pending Review</span>
              </div>
              <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                {stats.contentByStatus.pending_review}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">Approved</span>
              </div>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                {stats.contentByStatus.approved}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">Rejected</span>
              </div>
              <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
                {stats.contentByStatus.rejected}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common SEO content tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/content/generate">
              <Button className="w-full justify-start" variant="default">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Content for Products
              </Button>
            </Link>
            <Link href="/content/list?status=pending_review">
              <Button className="w-full justify-start" variant="outline">
                <Clock className="mr-2 h-4 w-4" />
                Review Pending Content ({stats.contentByStatus.pending_review})
              </Button>
            </Link>
            <Link href="/content/list">
              <Button className="w-full justify-start" variant="outline">
                <FileText className="mr-2 h-4 w-4" />
                View All Content
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Content */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Content</CardTitle>
          <CardDescription>Latest AI-generated product content</CardDescription>
        </CardHeader>
        <CardContent>
          {stats.recentContent.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No content generated yet</p>
              <Link href="/content/generate">
                <Button variant="outline" className="mt-4">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Your First Content
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.recentContent.slice(0, 5).map((content) => (
                <div
                  key={content.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                >
                  <div className="space-y-1">
                    <Link
                      href={`/content/${content.id}`}
                      className="font-medium hover:underline"
                    >
                      {content.productTitle}
                    </Link>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Quality: {content.qualityScore}/100</span>
                      <span>•</span>
                      <span>
                        {new Date(content.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        content.status === "approved"
                          ? "default"
                          : content.status === "pending_review"
                          ? "secondary"
                          : "outline"
                      }
                      className={
                        content.status === "approved"
                          ? "bg-green-100 text-green-800 hover:bg-green-100"
                          : content.status === "pending_review"
                          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          : ""
                      }
                    >
                      {content.status.replace("_", " ")}
                    </Badge>
                    <Link href={`/content/${content.id}`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
