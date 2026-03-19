"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  MessageSquare,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  getAiSessions,
  type AiSessionSummary,
  type AgentType,
} from "@/lib/api";

function AgentBadge({ type }: { type: AgentType }) {
  if (type === "STOREFRONT") {
    return (
      <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 text-xs">
        Storefront
      </Badge>
    );
  }
  return (
    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 text-xs">
      Admin
    </Badge>
  );
}

function truncate(text: string, maxLength: number): string {
  if (!text) return "-";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export default function ChatSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<AiSessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [agentFilter, setAgentFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const pageSize = 20;

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const params: {
        page: number;
        size: number;
        agentType?: AgentType;
        search?: string;
      } = { page, size: pageSize };
      if (agentFilter !== "all") {
        params.agentType = agentFilter as AgentType;
      }
      if (search.trim()) {
        params.search = search.trim();
      }
      const data = await getAiSessions(params);
      setSessions(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch (err) {
      console.error("Failed to fetch AI sessions:", err);
    } finally {
      setLoading(false);
    }
  }, [page, agentFilter, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [agentFilter, search]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Chat Sessions</h1>
          <p className="text-muted-foreground mt-1">
            View AI conversation logs from storefront and admin agents.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchSessions}>
          <RefreshCw className="h-3.5 w-3.5 mr-1" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user ID or message content..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={agentFilter} onValueChange={setAgentFilter}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                <SelectItem value="STOREFRONT">Storefront</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Sessions table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            {totalElements} session{totalElements !== 1 ? "s" : ""}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No chat sessions found.
            </p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[110px]">Agent</TableHead>
                    <TableHead className="w-[140px]">User ID</TableHead>
                    <TableHead>First Message</TableHead>
                    <TableHead className="w-[90px] text-center">Messages</TableHead>
                    <TableHead className="w-[140px]">Started</TableHead>
                    <TableHead className="w-[140px]">Last Active</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow
                      key={session.sessionId}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() =>
                        router.push(`/chat-sessions/${session.sessionId}`)
                      }
                    >
                      <TableCell>
                        <AgentBadge type={session.agentType} />
                      </TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">
                        {truncate(session.userId, 16)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {truncate(session.firstMessage, 60)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="text-xs">
                          {session.messageCount}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.startedAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(session.lastMessageAt), {
                          addSuffix: true,
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {page + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 0}
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= totalPages - 1}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
