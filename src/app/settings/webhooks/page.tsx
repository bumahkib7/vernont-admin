"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2, ExternalLink } from "lucide-react";
import { getWebhookEndpoints, deleteWebhookEndpoint, type WebhookEndpoint } from "@/lib/api";
import { toast } from "sonner";

export default function WebhooksPage() {
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEndpoints = useCallback(async () => {
    try {
      const data = await getWebhookEndpoints();
      setEndpoints(data.endpoints);
    } catch {
      toast.error("Failed to load webhooks");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEndpoints();
  }, [fetchEndpoints]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this webhook endpoint?")) return;
    try {
      await deleteWebhookEndpoint(id);
      toast.success("Webhook deleted");
      fetchEndpoints();
    } catch {
      toast.error("Failed to delete webhook");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Webhooks</h1>
          <p className="text-muted-foreground">Manage webhook endpoints for third-party integrations</p>
        </div>
        <Button asChild>
          <Link href="/settings/webhooks/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Endpoint
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Endpoints</CardTitle>
          <CardDescription>Webhook endpoints receive event notifications via HTTP POST</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : endpoints.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No webhook endpoints configured. Create one to start receiving event notifications.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Events</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Failures</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {endpoints.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell>
                      <Link href={`/settings/webhooks/${ep.id}`} className="font-medium hover:underline flex items-center gap-1">
                        {ep.url.length > 60 ? ep.url.slice(0, 60) + "..." : ep.url}
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                      {ep.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ep.description}</p>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {ep.events.slice(0, 3).map((evt) => (
                          <Badge key={evt} variant="secondary" className="text-xs">{evt}</Badge>
                        ))}
                        {ep.events.length > 3 && (
                          <Badge variant="outline" className="text-xs">+{ep.events.length - 3}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={ep.isActive ? "default" : "destructive"}>
                        {ep.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={ep.failureCount > 0 ? "text-red-600 font-medium" : ""}>
                        {ep.failureCount}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(ep.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
