"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Lock,
  Send,
  MessageSquare,
  StickyNote,
  ChevronDown,
  User,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Tag,
  X,
  Plus,
  ExternalLink,
  ShoppingCart,
  MessagesSquare,
  ArrowRight,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { usePageContext } from "@/hooks/use-page-context";
import {
  getTicket,
  replyToTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  updateTicketTags,
  getAssignableUsers,
  getCannedResponses,
  formatDateTime,
  formatDate,
  TicketDetail,
  TicketMessage,
  TicketEvent,
  TicketStatus,
  TicketPriority,
  TicketCategory,
  TicketMessageType,
  TicketAssignee,
  CannedResponse,
} from "@/lib/api";

// ============================================================================
// Constants
// ============================================================================

const TICKET_STATUSES: { value: TicketStatus; label: string }[] = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "WAITING_ON_CUSTOMER", label: "Waiting on Customer" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const TICKET_PRIORITIES: { value: TicketPriority; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const STATUS_TYPE_MAP: Record<string, string> = {
  OPEN: "info",
  IN_PROGRESS: "pending",
  WAITING_ON_CUSTOMER: "warning",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  MEDIUM: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  HIGH: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  URGENT: "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700",
};

const CATEGORY_LABELS: Record<TicketCategory, string> = {
  ORDER_ISSUE: "Order Issue",
  PRODUCT_INQUIRY: "Product Inquiry",
  RETURN_REQUEST: "Return Request",
  SHIPPING: "Shipping",
  BILLING: "Billing",
  ACCOUNT: "Account",
  OTHER: "Other",
};

const SOURCE_LABELS: Record<string, string> = {
  CONTACT_FORM: "Contact Form",
  LIVE_CHAT: "Live Chat",
  EMAIL: "Email",
  PHONE: "Phone",
  ADMIN: "Admin Created",
};

const EVENT_ICONS: Record<string, React.ReactNode> = {
  created: <Plus className="h-3 w-3 text-white" />,
  status_changed: <ArrowRight className="h-3 w-3 text-white" />,
  priority_changed: <AlertTriangle className="h-3 w-3 text-white" />,
  assigned: <User className="h-3 w-3 text-white" />,
  replied: <MessageSquare className="h-3 w-3 text-white" />,
  resolved: <CheckCircle className="h-3 w-3 text-white" />,
  closed: <XCircle className="h-3 w-3 text-white" />,
};

const EVENT_COLORS: Record<string, string> = {
  created: "bg-blue-500",
  status_changed: "bg-indigo-500",
  priority_changed: "bg-orange-500",
  assigned: "bg-purple-500",
  replied: "bg-green-500",
  resolved: "bg-emerald-600",
  closed: "bg-gray-500",
};

// ============================================================================
// Helper Components
// ============================================================================

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  return (
    <Badge variant="outline" className={`font-normal ${PRIORITY_COLORS[priority] ?? ""}`}>
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </Badge>
  );
}

function SlaTimer({ deadline, met }: { deadline: string; met: boolean | null }) {
  const now = new Date();
  const due = new Date(deadline);
  const diff = due.getTime() - now.getTime();
  const breached = diff < 0;
  const absDiff = Math.abs(diff);

  const hours = Math.floor(absDiff / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  if (met === true) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400">
        <CheckCircle className="h-3.5 w-3.5" />
        <span>Met</span>
      </div>
    );
  }

  if (met === false || breached) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Overdue by {hours}h {minutes}m</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-amber-600 dark:text-amber-400">
      <Clock className="h-3.5 w-3.5" />
      <span>{hours}h {minutes}m remaining</span>
    </div>
  );
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

/** Render message body as plain text — avoids XSS from raw HTML. */
function MessageBody({ html }: { html: string }) {
  // Strip HTML tags and render as text paragraphs to prevent XSS.
  // If the backend guarantees sanitized HTML, swap to dangerouslySetInnerHTML.
  const text = html.replace(/<[^>]*>/g, "");
  return <p className="text-sm whitespace-pre-wrap">{text}</p>;
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TicketDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <Skeleton className="h-5 w-48" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function MessageBubble({ message }: { message: TicketMessage }) {
  const isCustomer = message.senderRole === "CUSTOMER";
  const isInternalNote = message.messageType === "INTERNAL_NOTE";
  const isSystem = message.messageType === "SYSTEM";

  // System event — inline gray message
  if (isSystem) {
    return (
      <div className="flex justify-center py-2">
        <p className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">
          {message.body}
        </p>
      </div>
    );
  }

  // Internal note — amber background
  if (isInternalNote) {
    return (
      <div className="max-w-[85%] ml-auto">
        <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Lock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              Internal Note
            </span>
          </div>
          <MessageBody html={message.body} />
          <div className="flex items-center gap-2 mt-2 text-xs text-amber-600/70 dark:text-amber-400/70">
            <span className="font-medium">{message.senderName}</span>
            <span>{formatDateTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Customer message — left-aligned
  if (isCustomer) {
    return (
      <div className="max-w-[85%]">
        <div className="bg-muted rounded-lg rounded-tl-none p-3">
          <MessageBody html={message.body} />
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-medium">{message.senderName}</span>
            <span>{formatDateTime(message.createdAt)}</span>
          </div>
        </div>
      </div>
    );
  }

  // Admin reply — right-aligned
  return (
    <div className="max-w-[85%] ml-auto">
      <div className="bg-primary/10 dark:bg-primary/20 border border-primary/20 rounded-lg rounded-tr-none p-3">
        <MessageBody html={message.body} />
        <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
          <span className="font-medium">{message.senderName}</span>
          <span>{formatDateTime(message.createdAt)}</span>
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-sm">{label}</span>
      {children}
    </div>
  );
}

// ============================================================================
// Main Page Component
// ============================================================================

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const ticketId = params.id as string;
  usePageContext("support", ticketId, "ticket");

  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reply state
  const [replyBody, setReplyBody] = useState("");
  const [replyType, setReplyType] = useState<"REPLY" | "INTERNAL_NOTE">("REPLY");

  // Tag input state
  const [tagInput, setTagInput] = useState("");
  const [isAddingTag, setIsAddingTag] = useState(false);

  // Fetch ticket detail
  const ticketQuery = useQuery({
    queryKey: ["ticket-detail", ticketId],
    queryFn: () => getTicket(ticketId),
    enabled: !!ticketId && !!user && !authLoading,
    staleTime: 15_000,
  });

  // Fetch assignable users
  const assignableQuery = useQuery({
    queryKey: ["assignable-users"],
    queryFn: getAssignableUsers,
    enabled: !!user && !authLoading,
    staleTime: 5 * 60_000,
  });

  // Fetch canned responses
  const cannedQuery = useQuery({
    queryKey: ["canned-responses"],
    queryFn: () => getCannedResponses(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60_000,
  });

  const ticket = ticketQuery.data ?? null;
  const assignableUsers = assignableQuery.data ?? [];
  const cannedResponses = cannedQuery.data?.items ?? [];

  // Scroll to bottom of messages when they change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  // Invalidate helper
  const refreshTicket = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["ticket-detail", ticketId] });
  }, [queryClient, ticketId]);

  // ---- Mutations ----

  const replyMutation = useMutation({
    mutationFn: () =>
      replyToTicket(ticketId, { body: replyBody, messageType: replyType }),
    onSuccess: () => {
      setReplyBody("");
      refreshTicket();
      toast.success(replyType === "REPLY" ? "Reply sent" : "Internal note added");
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to send reply");
    },
  });

  const statusMutation = useMutation({
    mutationFn: (status: TicketStatus) => updateTicketStatus(ticketId, status),
    onSuccess: () => {
      refreshTicket();
      toast.success("Status updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update status"),
  });

  const priorityMutation = useMutation({
    mutationFn: (priority: TicketPriority) =>
      updateTicketPriority(ticketId, priority),
    onSuccess: () => {
      refreshTicket();
      toast.success("Priority updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update priority"),
  });

  const assignMutation = useMutation({
    mutationFn: (assigneeId: string) => assignTicket(ticketId, assigneeId),
    onSuccess: () => {
      refreshTicket();
      toast.success("Ticket assigned");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to assign ticket"),
  });

  const tagsMutation = useMutation({
    mutationFn: (tags: string[]) => updateTicketTags(ticketId, tags),
    onSuccess: () => {
      refreshTicket();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update tags"),
  });

  // ---- Handlers ----

  const handleSendReply = () => {
    if (!replyBody.trim()) return;
    replyMutation.mutate();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSendReply();
    }
  };

  const handleInsertCannedResponse = (cr: CannedResponse) => {
    setReplyBody((prev) => (prev ? prev + "\n\n" + cr.body : cr.body));
  };

  const handleAddTag = () => {
    if (!tagInput.trim() || !ticket) return;
    const newTags = [...ticket.tags, tagInput.trim()];
    tagsMutation.mutate(newTags);
    setTagInput("");
    setIsAddingTag(false);
  };

  const handleRemoveTag = (tag: string) => {
    if (!ticket) return;
    const newTags = ticket.tags.filter((t) => t !== tag);
    tagsMutation.mutate(newTags);
  };

  const handleCloseTicket = () => {
    statusMutation.mutate("CLOSED");
  };

  const handleAssignToMe = () => {
    if (!user) return;
    assignMutation.mutate(user.id);
  };

  // ---- Loading / Error states ----

  if (authLoading || ticketQuery.isLoading) {
    return <TicketDetailSkeleton />;
  }

  if (ticketQuery.error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-red-400" />
        <p className="text-lg font-medium">Failed to load ticket</p>
        <p className="text-sm text-muted-foreground">
          {ticketQuery.error instanceof Error
            ? ticketQuery.error.message
            : "An unexpected error occurred"}
        </p>
        <Button variant="outline" onClick={() => ticketQuery.refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  if (!ticket) return null;

  const isClosed = ticket.status === "CLOSED";

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/support/tickets">Tickets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>#{ticket.ticketNumber}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ================================================================ */}
        {/* LEFT COLUMN — Main Content (2/3) */}
        {/* ================================================================ */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl font-semibold">
                      #{ticket.ticketNumber}
                    </h1>
                    <StatusBadge
                      status={STATUS_TYPE_MAP[ticket.status] ?? "neutral"}
                      type="custom"
                      dot
                    />
                    <PriorityBadge priority={ticket.priority} />
                    <Badge variant="outline" className="font-normal">
                      {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                    </Badge>
                  </div>
                  <h2 className="text-lg text-muted-foreground">
                    {ticket.subject}
                  </h2>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status Dropdown */}
                  <Select
                    value={ticket.status}
                    onValueChange={(v) =>
                      statusMutation.mutate(v as TicketStatus)
                    }
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Change Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Priority Dropdown */}
                  <Select
                    value={ticket.priority}
                    onValueChange={(v) =>
                      priorityMutation.mutate(v as TicketPriority)
                    }
                  >
                    <SelectTrigger className="w-[130px] h-9">
                      <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {TICKET_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Assign Dropdown */}
                  <Select
                    value={ticket.assignee?.id ?? ""}
                    onValueChange={(v) => assignMutation.mutate(v)}
                  >
                    <SelectTrigger className="w-[160px] h-9">
                      <SelectValue placeholder="Assign to..." />
                    </SelectTrigger>
                    <SelectContent>
                      {assignableUsers.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.firstName} {u.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Close Button */}
                  {!isClosed && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCloseTicket}
                      disabled={statusMutation.isPending}
                    >
                      {statusMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-1" />
                      )}
                      Close
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversation Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Conversation</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] px-6">
                <div className="space-y-4 py-4">
                  {ticket.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <Separator />

              {/* Reply Box */}
              <div className="p-4 space-y-3">
                {/* Toggle Reply / Internal Note */}
                <div className="flex items-center gap-2">
                  <Button
                    variant={replyType === "REPLY" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setReplyType("REPLY")}
                  >
                    <MessageSquare className="h-3.5 w-3.5 mr-1.5" />
                    Reply
                  </Button>
                  <Button
                    variant={
                      replyType === "INTERNAL_NOTE" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setReplyType("INTERNAL_NOTE")}
                  >
                    <StickyNote className="h-3.5 w-3.5 mr-1.5" />
                    Internal Note
                  </Button>

                  {/* Canned Responses */}
                  {cannedResponses.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          Canned Responses
                          <ChevronDown className="h-3.5 w-3.5 ml-1" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        className="w-64 max-h-60 overflow-y-auto"
                      >
                        {cannedResponses.map((cr) => (
                          <DropdownMenuItem
                            key={cr.id}
                            onClick={() => handleInsertCannedResponse(cr)}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-sm">
                                {cr.title}
                              </span>
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {cr.body}
                              </span>
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>

                {replyType === "INTERNAL_NOTE" && (
                  <div className="flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400">
                    <Lock className="h-3 w-3" />
                    This note is only visible to team members
                  </div>
                )}

                <Textarea
                  placeholder={
                    replyType === "REPLY"
                      ? "Write a reply to the customer..."
                      : "Write an internal note..."
                  }
                  value={replyBody}
                  onChange={(e) => setReplyBody(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={
                    replyType === "INTERNAL_NOTE"
                      ? "border-amber-300 bg-amber-50/50 dark:border-amber-700 dark:bg-amber-950/30"
                      : ""
                  }
                  rows={4}
                  disabled={isClosed}
                />

                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Cmd+Enter to send
                  </p>
                  <Button
                    onClick={handleSendReply}
                    disabled={
                      !replyBody.trim() || replyMutation.isPending || isClosed
                    }
                    size="sm"
                  >
                    {replyMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                    ) : (
                      <Send className="h-4 w-4 mr-1.5" />
                    )}
                    {replyType === "REPLY" ? "Send Reply" : "Add Note"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ================================================================ */}
        {/* RIGHT COLUMN — Sidebar (1/3) */}
        {/* ================================================================ */}
        <div className="space-y-6">
          {/* Ticket Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Status">
                <StatusBadge
                  status={STATUS_TYPE_MAP[ticket.status] ?? "neutral"}
                  type="custom"
                  dot
                />
              </DetailRow>
              <DetailRow label="Priority">
                <PriorityBadge priority={ticket.priority} />
              </DetailRow>
              <DetailRow label="Category">
                <span className="text-muted-foreground">
                  {CATEGORY_LABELS[ticket.category] ?? ticket.category}
                </span>
              </DetailRow>
              <DetailRow label="Source">
                <span className="text-muted-foreground">
                  {SOURCE_LABELS[ticket.source] ?? ticket.source}
                </span>
              </DetailRow>
              <Separator />
              <DetailRow label="Created">
                <span className="text-muted-foreground">
                  {formatDateTime(ticket.createdAt)}
                </span>
              </DetailRow>
              <DetailRow label="Updated">
                <span className="text-muted-foreground">
                  {formatDateTime(ticket.updatedAt)}
                </span>
              </DetailRow>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Assignment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.assignee ? (
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {getInitials(
                        ticket.assignee.firstName,
                        ticket.assignee.lastName
                      )}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">
                      {ticket.assignee.firstName} {ticket.assignee.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {ticket.assignee.email}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Unassigned</p>
              )}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleAssignToMe}
                  disabled={
                    assignMutation.isPending ||
                    ticket.assignee?.id === user?.id
                  }
                >
                  {assignMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                  ) : (
                    <User className="h-3.5 w-3.5 mr-1.5" />
                  )}
                  Assign to me
                </Button>
              </div>
              <Select
                value={ticket.assignee?.id ?? ""}
                onValueChange={(v) => assignMutation.mutate(v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Change assignee..." />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.firstName} {u.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Customer Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">
                    {getInitials(
                      ticket.customer.firstName,
                      ticket.customer.lastName
                    )}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link
                    href={`/customers/${ticket.customer.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {ticket.customer.firstName} {ticket.customer.lastName}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {ticket.customer.email}
                  </p>
                </div>
              </div>
              <Separator />
              <DetailRow label="Previous tickets">
                <span className="text-muted-foreground">
                  {ticket.customer.previousTicketCount}
                </span>
              </DetailRow>
              <DetailRow label="Customer since">
                <span className="text-muted-foreground">
                  {formatDate(ticket.customer.customerSince)}
                </span>
              </DetailRow>
              <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href={`/customers/${ticket.customer.id}`}>
                  View Profile
                  <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* SLA Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">SLA</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  First Response
                </p>
                <SlaTimer
                  deadline={ticket.sla.firstResponseDeadline}
                  met={ticket.sla.firstResponseMet}
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due: {formatDateTime(ticket.sla.firstResponseDeadline)}
                </p>
              </div>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground mb-1">
                  Resolution
                </p>
                <SlaTimer
                  deadline={ticket.sla.resolutionDeadline}
                  met={ticket.sla.resolutionMet}
                />
                <p className="text-xs text-muted-foreground mt-0.5">
                  Due: {formatDateTime(ticket.sla.resolutionDeadline)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Related</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticket.linkedOrderId && (
                <Link
                  href={`/orders/${ticket.linkedOrderId}`}
                  className="flex items-center gap-2 text-sm hover:underline text-blue-600 dark:text-blue-400"
                >
                  <ShoppingCart className="h-3.5 w-3.5" />
                  Linked Order
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {ticket.linkedChatId && (
                <Link
                  href="/messages"
                  className="flex items-center gap-2 text-sm hover:underline text-blue-600 dark:text-blue-400"
                >
                  <MessagesSquare className="h-3.5 w-3.5" />
                  Linked Chat
                  <ExternalLink className="h-3 w-3" />
                </Link>
              )}
              {!ticket.linkedOrderId && !ticket.linkedChatId && (
                <p className="text-sm text-muted-foreground">
                  No linked items
                </p>
              )}

              <Separator />

              {/* Tags */}
              <div>
                <p className="text-xs text-muted-foreground mb-2">Tags</p>
                <div className="flex flex-wrap gap-1.5">
                  {ticket.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="text-xs gap-1"
                    >
                      <Tag className="h-2.5 w-2.5" />
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-0.5 hover:text-red-500"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                    </Badge>
                  ))}
                  {isAddingTag ? (
                    <div className="flex items-center gap-1">
                      <Input
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddTag();
                          if (e.key === "Escape") {
                            setIsAddingTag(false);
                            setTagInput("");
                          }
                        }}
                        className="h-6 w-24 text-xs"
                        placeholder="Tag name"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={handleAddTag}
                      >
                        <CheckCircle className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setIsAddingTag(false);
                          setTagInput("");
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs"
                      onClick={() => setIsAddingTag(true)}
                    >
                      <Plus className="h-3 w-3 mr-0.5" />
                      Add
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Activity Timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[280px] px-6">
                <div className="space-y-0 py-3">
                  {ticket.events.map((event, idx) => (
                    <div key={event.id} className="flex gap-3 pb-4 relative">
                      {/* Vertical line connector */}
                      {idx < ticket.events.length - 1 && (
                        <div className="absolute left-3 top-6 w-px h-[calc(100%-12px)] bg-border" />
                      )}
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${
                          EVENT_COLORS[event.eventType] ?? "bg-gray-400"
                        }`}
                      >
                        {EVENT_ICONS[event.eventType] ?? (
                          <ArrowRight className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug">
                          {event.description}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">
                            {event.actorName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(event.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ticket.events.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2">
                      No events recorded
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
