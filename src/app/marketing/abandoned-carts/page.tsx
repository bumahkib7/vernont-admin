"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  ShoppingCart,
  Mail,
  TrendingUp,
  Loader2,
  CheckCircle2,
  Clock,
  Eye,
  MousePointer,
} from "lucide-react";
import {
  getAbandonedCartStats,
  getAbandonedCartNotifications,
  type AbandonedCartStats,
  type AbandonedCartNotification,
} from "@/lib/api";
import { formatDateTime } from "@/lib/format";

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "SENT":
      return <Badge variant="secondary"><Mail className="h-3 w-3 mr-1" />Sent</Badge>;
    case "OPENED":
      return <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-950/30 text-blue-800 dark:text-blue-400"><Eye className="h-3 w-3 mr-1" />Opened</Badge>;
    case "CLICKED":
      return <Badge variant="secondary" className="bg-amber-100 dark:bg-amber-950/30 text-amber-800 dark:text-amber-400"><MousePointer className="h-3 w-3 mr-1" />Clicked</Badge>;
    case "RECOVERED":
      return <Badge variant="default" className="bg-green-600"><CheckCircle2 className="h-3 w-3 mr-1" />Recovered</Badge>;
    case "EXPIRED":
      return <Badge variant="outline">Expired</Badge>;
    case "PENDING":
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AbandonedCartsPage() {
  const [stats, setStats] = useState<AbandonedCartStats | null>(null);
  const [notifications, setNotifications] = useState<AbandonedCartNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const [statsData, notifData] = await Promise.all([
        getAbandonedCartStats().catch(() => null),
        getAbandonedCartNotifications().catch(() => ({ notifications: [], count: 0 })),
      ]);
      if (statsData) setStats(statsData);
      setNotifications(notifData.notifications ?? []);
    } catch (err) {
      console.error("Failed to load abandoned cart data:", err);
      setError("Failed to load abandoned cart data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Abandoned Cart Recovery</h1>
        <p className="text-muted-foreground mt-1">
          Automatic email reminders for customers who leave items in their cart.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Abandoned Carts
            </CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAbandoned ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emails Sent (24h)
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.sentLast24h ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovered (24h)
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.recoveredLast24h ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recovery Rate
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.recoveryRate ? `${stats.recoveryRate.toFixed(1)}%` : "0%"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.totalRecovered ?? 0} of {stats?.totalSent ?? 0} total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No abandoned cart notifications sent yet. They will appear here once the recovery system sends its first emails.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Email #</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Opened</TableHead>
                  <TableHead>Recovered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {notifications.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell className="font-medium">{n.email}</TableCell>
                    <TableCell>{n.notificationNumber} of 3</TableCell>
                    <TableCell><StatusBadge status={n.status} /></TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(n.sentAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(n.openedAt)}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDateTime(n.recoveredAt)}
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
