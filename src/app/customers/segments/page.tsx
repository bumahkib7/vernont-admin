"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Plus, Users, RefreshCw, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  getCustomerSegments,
  evaluateCustomerSegment,
  deleteCustomerSegment,
  type CustomerSegment,
} from "@/lib/api";

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "Never";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function SegmentsPage() {
  const [segments, setSegments] = useState<CustomerSegment[]>([]);
  const [loading, setLoading] = useState(true);
  const [evaluating, setEvaluating] = useState<string | null>(null);

  const fetchSegments = useCallback(async () => {
    try {
      const data = await getCustomerSegments();
      setSegments(data.segments);
    } catch (err) {
      console.error("Failed to fetch segments:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSegments();
  }, [fetchSegments]);

  const handleEvaluate = async (id: string) => {
    setEvaluating(id);
    try {
      await evaluateCustomerSegment(id);
      toast.success("Segment re-evaluated");
      await fetchSegments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to evaluate segment");
    } finally {
      setEvaluating(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete segment "${name}"?`)) return;
    try {
      await deleteCustomerSegment(id);
      toast.success("Segment deleted");
      await fetchSegments();
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete segment");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Segments</h1>
          <p className="text-muted-foreground mt-1">
            Create dynamic segments based on customer behavior and attributes.
          </p>
        </div>
        <Button asChild>
          <Link href="/customers/segments/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Segment
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {segments.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="font-medium">No segments yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create your first segment to group customers by behavior.
              </p>
              <Button asChild className="mt-4">
                <Link href="/customers/segments/new">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Segment
                </Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Customers</TableHead>
                  <TableHead>Last Evaluated</TableHead>
                  <TableHead className="w-[140px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {segments.map((segment) => (
                  <TableRow key={segment.id}>
                    <TableCell>
                      <Link
                        href={`/customers/segments/${segment.id}`}
                        className="font-medium hover:underline"
                      >
                        {segment.name}
                      </Link>
                      {segment.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{segment.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      {segment.isDynamic ? (
                        <Badge variant="secondary">
                          <Zap className="h-3 w-3 mr-1" />
                          Dynamic
                        </Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {segment.customerCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(segment.lastEvaluatedAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-end">
                        {segment.isDynamic && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            disabled={evaluating === segment.id}
                            onClick={() => handleEvaluate(segment.id)}
                          >
                            {evaluating === segment.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive h-8"
                          onClick={() => handleDelete(segment.id, segment.name)}
                        >
                          Delete
                        </Button>
                      </div>
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
