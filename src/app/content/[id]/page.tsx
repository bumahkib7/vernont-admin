"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

interface ContentDetail {
  id: string;
  productId: string;
  entityId?: string;
  entityType?: string;
  content: string;
  wordCount: number;
  h2Headings: string[];
  faqCount: number;
  keywords: string[];
  status: string;
  qualityScore: number | null;
  approvedBy?: string | null;
  approvedAt?: string | null;
  rejectedBy?: string | null;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  contentUpdatedAt?: string;
  createdAt: string;
}

interface Props {
  params: Promise<{ id: string }>;
}

export default function ContentDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const [content, setContent] = useState<ContentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  useEffect(() => {
    fetchContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/content/${id}`);
      if (response.status === 404) {
        toast.error("Content not found");
        setContent(null);
        return;
      }
      if (!response.ok) {
        toast.error("Failed to load content");
        return;
      }
      const data: ContentDetail = await response.json();
      setContent(data);
    } catch (error) {
      console.error("Error fetching content:", error);
      toast.error("Error loading content");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!response.ok) {
        toast.error("Failed to approve");
        return;
      }
      toast.success("Content approved");
      await fetchContent();
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Please provide a rejection reason");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/admin/content/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      if (!response.ok) {
        toast.error("Failed to reject");
        return;
      }
      toast.success("Content rejected");
      setShowRejectForm(false);
      setRejectReason("");
      await fetchContent();
    } finally {
      setBusy(false);
    }
  };

  const statusBadge = (status: string) => {
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

  const qualityBadge = (score: number | null) => {
    if (score === null || score === undefined) {
      return <span className="text-muted-foreground">—</span>;
    }
    const color =
      score >= 80
        ? "bg-green-100 text-green-800 hover:bg-green-100"
        : score >= 60
          ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
          : "bg-red-100 text-red-800 hover:bg-red-100";
    return <Badge className={color}>{Math.round(score)}/100</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Sparkles className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="space-y-6 p-6">
        <Button variant="ghost" onClick={() => router.push("/content/list")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to list
        </Button>
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium">Content not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const canReview = content.status?.toLowerCase() === "pending_review";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/content/list")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" />
          Content review
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Metadata</span>
            <div className="flex items-center gap-2">
              {statusBadge(content.status)}
              {qualityBadge(content.qualityScore)}
            </div>
          </CardTitle>
          <CardDescription className="font-mono text-xs">{content.id}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Product ID</dt>
              <dd className="font-mono text-xs break-all">{content.productId || content.entityId || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Word count</dt>
              <dd>{content.wordCount}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">H2 headings</dt>
              <dd>{content.h2Headings?.length ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">FAQs</dt>
              <dd>{content.faqCount ?? 0}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Keywords</dt>
              <dd className="text-xs">{content.keywords?.join(", ") || "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd>{new Date(content.createdAt).toLocaleString()}</dd>
            </div>
            {content.rejectionReason && (
              <div className="col-span-2">
                <dt className="text-muted-foreground">Rejection reason</dt>
                <dd className="text-red-700">{content.rejectionReason}</dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Storefront preview</CardTitle>
          <CardDescription>
            Exactly how this content will render on the storefront once approved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <iframe
            title="Storefront preview"
            src={`/api/admin/content/${id}/preview`}
            className="w-full rounded-md border bg-white"
            style={{ height: "70vh" }}
            sandbox="allow-same-origin allow-scripts allow-popups"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw markdown</CardTitle>
          <CardDescription>
            Source produced by the agent — useful when the preview looks wrong.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap rounded-md border bg-muted/30 p-4 text-sm leading-relaxed font-sans max-h-96 overflow-auto">
            {content.content || "(empty)"}
          </pre>
        </CardContent>
      </Card>

      {canReview && (
        <Card>
          <CardHeader>
            <CardTitle>Review</CardTitle>
            <CardDescription>Approve to publish, or reject with a reason.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleApprove} disabled={busy}>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => setShowRejectForm((v) => !v)}
                disabled={busy}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Reject
              </Button>
            </div>
            {showRejectForm && (
              <div className="space-y-2">
                <Textarea
                  placeholder="Reason for rejection..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={3}
                />
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleReject}
                  disabled={busy || !rejectReason.trim()}
                >
                  Confirm reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="text-right">
        <Link
          href="/content/list"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to content list
        </Link>
      </div>
    </div>
  );
}
