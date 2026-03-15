"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
} from "lucide-react";
import { apiFetch, formatDate } from "@/lib/api";

type ClaimStatus = "OPEN" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "RESOLVED";
type ClaimType = "DAMAGED" | "DEFECTIVE" | "WRONG_ITEM" | "MISSING_ITEM";

interface Claim {
  id: string;
  orderId: string;
  customerId?: string;
  claimType: ClaimType;
  status: ClaimStatus;
  resolution?: string;
  description?: string;
  itemCount?: number;
  createdAt: string;
  resolvedAt?: string;
}

const STATUS_CONFIG: Record<ClaimStatus, { label: string; color: string; icon: typeof Clock }> = {
  OPEN: { label: "Open", color: "bg-blue-100 text-blue-800", icon: Clock },
  UNDER_REVIEW: { label: "Under Review", color: "bg-yellow-100 text-yellow-800", icon: Eye },
  APPROVED: { label: "Approved", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "bg-red-100 text-red-800", icon: XCircle },
  RESOLVED: { label: "Resolved", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 },
};

const TYPE_LABELS: Record<ClaimType, string> = {
  DAMAGED: "Damaged",
  DEFECTIVE: "Defective",
  WRONG_ITEM: "Wrong Item",
  MISSING_ITEM: "Missing Item",
};

function ClaimStatusBadge({ status }: { status: ClaimStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.OPEN;
  const Icon = config.icon;
  return (
    <Badge variant="secondary" className={config.color}>
      <Icon className="h-3 w-3 mr-1" />
      {config.label}
    </Badge>
  );
}

function TableSkeleton() {
  return (
    <>
      {[...Array(5)].map((_, i) => (
        <TableRow key={i}>
          {[...Array(6)].map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const fetchClaims = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      const params = statusFilter !== "ALL" ? `?status=${statusFilter}` : "";
      const data = await apiFetch(`/admin/claims${params}`) as { claims?: Claim[] };
      setClaims(data.claims ?? []);
    } catch (err) {
      console.error("Failed to fetch claims:", err);
      setError("Failed to load claims");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Claims</h1>
          <p className="text-muted-foreground mt-1">
            Manage damage, defect, and missing item claims from customers.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchClaims} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button asChild>
            <Link href="/returns/claims/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New Claim
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "OPEN").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Under Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "UNDER_REVIEW").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "APPROVED").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter((c) => c.status === "RESOLVED").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter + Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              All Claims
            </CardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
              <AlertTriangle className="h-4 w-4 mr-2 text-destructive" />
              {error}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim ID</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Resolution</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableSkeleton />
                ) : claims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No claims found.
                    </TableCell>
                  </TableRow>
                ) : (
                  claims.map((claim) => (
                    <TableRow key={claim.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell>
                        <Link href={`/returns/claims/${claim.id}`} className="font-medium text-primary hover:underline">
                          {claim.id.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/orders/${claim.orderId}`} className="text-primary hover:underline">
                          {claim.orderId.slice(0, 8)}...
                        </Link>
                      </TableCell>
                      <TableCell>{TYPE_LABELS[claim.claimType] ?? claim.claimType}</TableCell>
                      <TableCell><ClaimStatusBadge status={claim.status} /></TableCell>
                      <TableCell className="text-muted-foreground">
                        {claim.resolution ?? "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(claim.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
