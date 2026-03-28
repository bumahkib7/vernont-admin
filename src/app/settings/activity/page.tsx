"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Loader2,
  RefreshCw,
  Search,
  Activity,
  ShoppingCart,
  Package,
  Users,
  Settings,
  Tag,
  CreditCard,
} from "lucide-react";
import {
  getRecentActivity,
  type ActivityItem,
} from "@/lib/api";

const ENTITY_ICONS: Record<string, React.ReactNode> = {
  ORDER: <ShoppingCart className="h-3.5 w-3.5" />,
  PRODUCT: <Package className="h-3.5 w-3.5" />,
  CUSTOMER: <Users className="h-3.5 w-3.5" />,
  SETTING: <Settings className="h-3.5 w-3.5" />,
  CATEGORY: <Tag className="h-3.5 w-3.5" />,
  PAYMENT: <CreditCard className="h-3.5 w-3.5" />,
};

function ActionBadge({ type }: { type: string }) {
  const upper = type.toUpperCase();
  if (upper.includes("CREATE") || upper.includes("ADD")) {
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-xs">Create</Badge>;
  }
  if (upper.includes("UPDATE") || upper.includes("EDIT") || upper.includes("MODIFY")) {
    return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 text-xs">Update</Badge>;
  }
  if (upper.includes("DELETE") || upper.includes("REMOVE")) {
    return <Badge variant="destructive" className="text-xs">Delete</Badge>;
  }
  if (upper.includes("LOGIN") || upper.includes("AUTH")) {
    return <Badge variant="secondary" className="text-xs">Auth</Badge>;
  }
  return <Badge variant="outline" className="text-xs">{type}</Badge>;
}

function formatTimestamp(ts: string): string {
  const date = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ActivityLogPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch events via React Query with auto-refresh
  const eventsQuery = useQuery({
    queryKey: ["activity-events"],
    queryFn: async () => {
      const data = await getRecentActivity(100);
      return data.items;
    },
    staleTime: 15_000,
    refetchInterval: autoRefresh ? 30_000 : false,
  });

  const events = eventsQuery.data ?? [];
  const loading = eventsQuery.isLoading;

  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      search === "" ||
      event.message.toLowerCase().includes(search.toLowerCase()) ||
      event.userName?.toLowerCase().includes(search.toLowerCase()) ||
      event.entityType?.toLowerCase().includes(search.toLowerCase());

    const matchesType =
      typeFilter === "all" ||
      event.type.toUpperCase().includes(typeFilter.toUpperCase());

    return matchesSearch && matchesType;
  });

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
          <h1 className="text-2xl font-semibold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            Track all admin actions and system events.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Activity className="h-3.5 w-3.5 mr-1" />
            {autoRefresh ? "Live" : "Paused"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => eventsQuery.refetch()}>
            <RefreshCw className="h-3.5 w-3.5 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search events..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="CREATE">Created</SelectItem>
                <SelectItem value="UPDATE">Updated</SelectItem>
                <SelectItem value="DELETE">Deleted</SelectItem>
                <SelectItem value="LOGIN">Auth</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Events table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {filteredEvents.length} event{filteredEvents.length !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No activity events found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Time</TableHead>
                  <TableHead className="w-[80px]">Action</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead className="w-[120px]">Entity</TableHead>
                  <TableHead className="w-[120px]">User</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTimestamp(event.timestamp)}
                    </TableCell>
                    <TableCell>
                      <ActionBadge type={event.type} />
                    </TableCell>
                    <TableCell className="text-sm">{event.message}</TableCell>
                    <TableCell>
                      {event.entityType && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          {ENTITY_ICONS[event.entityType.toUpperCase()] || null}
                          <span>{event.entityType}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {event.userName || "-"}
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
