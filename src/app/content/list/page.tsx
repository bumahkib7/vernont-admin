"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  FileText,
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ContentItem {
  id: string;
  productId: string;
  entityId?: string;
  productTitle?: string;
  status: string;
  qualityScore: number | null;
  createdAt: string;
  updatedAt?: string;
  contentUpdatedAt?: string;
}

export default function ContentListPage() {
  const searchParams = useSearchParams();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all"
  );

  useEffect(() => {
    fetchContent();
  }, [statusFilter]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "all") {
        params.set("status", statusFilter);
      }

      const response = await fetch(`/api/admin/content/list?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Backend returns a Spring Page object with 'content' array
        setContent(Array.isArray(data) ? data : (data.content || []));
      } else {
        toast.error("Failed to load content");
      }
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Error loading content");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "approved":
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Approved
          </Badge>
        );
      case "pending_review":
        return (
          <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
            <Clock className="mr-1 h-3 w-3" />
            Pending Review
          </Badge>
        );
      case "draft":
        return (
          <Badge variant="secondary">
            <FileText className="mr-1 h-3 w-3" />
            Draft
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
            <XCircle className="mr-1 h-3 w-3" />
            Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getQualityBadge = (score: number | null) => {
    if (score === null) return <span className="text-muted-foreground">-</span>;

    let variant: "default" | "secondary" | "destructive" = "default";
    let colorClass = "";

    if (score >= 80) {
      colorClass = "bg-green-100 text-green-800 hover:bg-green-100";
    } else if (score >= 60) {
      colorClass = "bg-amber-100 text-amber-800 hover:bg-amber-100";
    } else {
      colorClass = "bg-red-100 text-red-800 hover:bg-red-100";
    }

    return (
      <Badge className={colorClass}>
        {score}/100
      </Badge>
    );
  };

  const filteredContent = content.filter((item) => {
    if (!searchQuery) return true;
    const haystack = `${item.productTitle ?? ""} ${item.productId ?? ""}`.toLowerCase();
    return haystack.includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8" />
          All SEO Content
        </h1>
        <p className="text-muted-foreground mt-2">
          View and manage all AI-generated product content
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Search and filter content</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search by product name..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_review">Pending Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content Table */}
      <Card>
        <CardHeader>
          <CardTitle>Content ({filteredContent.length})</CardTitle>
          <CardDescription>
            {statusFilter !== "all"
              ? `Showing ${statusFilter.replace("_", " ")} content`
              : "Showing all content"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Sparkles className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredContent.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium">No content found</p>
              <p className="text-muted-foreground mb-4">
                {statusFilter !== "all"
                  ? `No content with status "${statusFilter.replace("_", " ")}"`
                  : searchQuery
                  ? "Try adjusting your search query"
                  : "Generate your first AI content to get started"}
              </p>
              <Link href="/content/generate">
                <Button>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content
                </Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Quality Score</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredContent.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.productTitle ?? (
                        <span className="text-xs text-muted-foreground font-mono">
                          {item.productId ?? item.entityId ?? "—"}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell>{getQualityBadge(item.qualityScore)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(() => {
                        const ts = item.updatedAt ?? item.contentUpdatedAt ?? item.createdAt;
                        return ts ? new Date(ts).toLocaleDateString() : "—";
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href={`/content/${item.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
