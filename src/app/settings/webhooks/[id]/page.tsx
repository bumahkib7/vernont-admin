"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Send, Loader2 } from "lucide-react";
import {
  getWebhookEndpoint,
  getWebhookDeliveries,
  testWebhookEndpoint,
  type WebhookEndpoint,
  type WebhookDelivery,
} from "@/lib/api";
import { toast } from "sonner";

function StatusBadge({ status }: { status: string }) {
  const variant = status === "DELIVERED" ? "default" : status === "FAILED" ? "destructive" : "secondary";
  return <Badge variant={variant}>{status}</Badge>;
}

export default function WebhookDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [endpoint, setEndpoint] = useState<WebhookEndpoint | null>(null);
  const [deliveries, setDeliveries] = useState<WebhookDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [ep, del] = await Promise.all([
        getWebhookEndpoint(id),
        getWebhookDeliveries(id),
      ]);
      setEndpoint(ep);
      setDeliveries(del.deliveries);
    } catch {
      toast.error("Failed to load webhook details");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTest = async () => {
    setTesting(true);
    try {
      await testWebhookEndpoint(id);
      toast.success("Test webhook sent");
      fetchData();
    } catch {
      toast.error("Test delivery failed");
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!endpoint) {
    return <div className="text-center py-12 text-muted-foreground">Webhook endpoint not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings/webhooks">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Webhook Details</h1>
            <p className="text-muted-foreground text-sm">{endpoint.url}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleTest} disabled={testing}>
          {testing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
          Send Test
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={endpoint.isActive ? "default" : "destructive"}>
                {endpoint.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {endpoint.description && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="text-sm">{endpoint.description}</p>
              </div>
            )}
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{new Date(endpoint.createdAt).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Subscribed Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {endpoint.events.map((evt) => (
                <Badge key={evt} variant="secondary">{evt}</Badge>
              ))}
            </div>
            {endpoint.failureCount > 0 && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700 font-medium">
                  {endpoint.failureCount} consecutive failure{endpoint.failureCount > 1 ? "s" : ""}
                </p>
                {endpoint.lastFailureAt && (
                  <p className="text-xs text-red-600">Last failure: {new Date(endpoint.lastFailureAt).toLocaleString()}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Deliveries</CardTitle>
          <CardDescription>Last 20 webhook delivery attempts</CardDescription>
        </CardHeader>
        <CardContent>
          {deliveries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No deliveries yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Response</TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {deliveries.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell>
                      <Badge variant="outline">{d.eventType}</Badge>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={d.status} />
                    </TableCell>
                    <TableCell>
                      {d.responseStatus ? (
                        <span className={d.responseStatus >= 200 && d.responseStatus < 300 ? "text-green-600" : "text-red-600"}>
                          {d.responseStatus}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{d.attempts}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(d.createdAt).toLocaleString()}
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
