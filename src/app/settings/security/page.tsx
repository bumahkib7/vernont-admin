"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Users,
  Loader2,
  AlertCircle,
  Plus,
  Trash2,
  RefreshCw,
  Globe,
  Monitor,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  MapPin,
  Wifi,
  WifiOff,
  Map,
} from "lucide-react";
import { SessionMap } from "@/components/session-map";
import { ApiError, type SecuritySession, type SecurityEvent, type SecurityConfig } from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";
import { useSecurityDashboard, useSessionsWebSocketUpdate } from "@/hooks/use-security-dashboard";

// Helper to format relative time
function formatRelativeTime(dateString: string | null | undefined): string {
  if (!dateString) return "-";

  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "-";

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();

  // Handle future dates or very small differences
  if (diffMs < 0) return "Just now";

  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

// Get severity badge color
function getSeverityColor(severity: string): string {
  switch (severity) {
    case "CRITICAL":
      return "bg-red-600 text-white";
    case "HIGH":
      return "bg-orange-500 text-white";
    case "MEDIUM":
      return "bg-yellow-500 text-black";
    case "LOW":
      return "bg-blue-500 text-white";
    default:
      return "bg-gray-500 text-white";
  }
}

// Get event type display name
function getEventTypeDisplay(type: string | null | undefined): string {
  if (!type) return "-";
  const typeMap: Record<string, string> = {
    VPN_BLOCKED: "VPN Blocked",
    PROXY_BLOCKED: "Proxy Blocked",
    TOR_BLOCKED: "Tor Blocked",
    DATACENTER_BLOCKED: "Datacenter Blocked",
    BOT_BLOCKED: "Bot Blocked",
    FRAUD_SCORE_BLOCKED: "Fraud Score",
    BLOCKLIST_BLOCKED: "Blocklist",
    ALLOWLIST_REQUIRED: "Allowlist Required",
    SESSION_CREATED: "Session Created",
    SESSION_EXPIRED: "Session Expired",
    SESSION_REVOKED: "Session Revoked",
    SESSION_HEARTBEAT: "Session Heartbeat",
    IP_LIST_ADDED: "IP Added",
    IP_LIST_REMOVED: "IP Removed",
    CONFIG_CHANGED: "Config Changed",
    LOGIN_SUCCESS: "Login Success",
    LOGIN_FAILED: "Login Failed",
    LOGOUT: "Logout",
  };
  // Normalize type: handle both snake_case and other formats
  const normalizedType = type.toUpperCase().replace(/-/g, "_");
  if (typeMap[normalizedType]) return typeMap[normalizedType];
  // Fallback: convert snake_case to Title Case
  return type
    .replace(/_/g, " ")
    .replace(/-/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

// Error helper
const getErrorMessage = (err: unknown): string => {
  if (err instanceof ApiError) return err.message;
  if (err instanceof Error) return err.message;
  return "An unexpected error occurred";
};

export default function SecuritySettingsPage() {
  const {
    // Data
    stats,
    sessions,
    ipList,
    events,
    config,

    // Loading states
    isLoadingStats,
    isLoadingSessions,
    isLoadingIpList,
    isLoadingEvents,
    isLoadingConfig,
    isRevoking,
    isAddingIp,
    isSavingConfig,
    isBulkResolving,

    // Errors
    revokeError,
    addIpError,
    bulkResolveError,

    // Refetch
    refetchSessions,
    refetchEvents,

    // Actions
    revokeSession,
    addIp,
    removeIp,
    resolveEvent,
    bulkResolveEvents,
    updateConfig,

    // UI State
    ipListTab,
    setIpListTab,
    eventFilter,
    setEventFilter,
    selectedEventIds,
    toggleEventSelection,
    selectAllEvents,
    clearEventSelection,
    isAddIpDialogOpen,
    openAddIpDialog,
    closeAddIpDialog,
    isRevokeDialogOpen,
    sessionToRevoke,
    openRevokeDialog,
    closeRevokeDialog,
    isResolveDialogOpen,
    eventToResolve,
    openResolveDialog,
    closeResolveDialog,
    isBulkResolveDialogOpen,
    openBulkResolveDialog,
    closeBulkResolveDialog,
  } = useSecurityDashboard();

  // Form state for add IP
  const [newIpAddress, setNewIpAddress] = useState("");
  const [newIpReason, setNewIpReason] = useState("");

  // Form state for resolve event
  const [resolveNotes, setResolveNotes] = useState("");

  // Form state for bulk resolve
  const [bulkResolveNotes, setBulkResolveNotes] = useState("");

  // General error display
  const [displayError, setDisplayError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const { isConnected, subscribe } = useWebSocket({ autoConnect: true, debug: false });
  const wsUpdates = useSessionsWebSocketUpdate();

  // WebSocket subscriptions
  useEffect(() => {
    if (!isConnected) return;

    const sessionsSub = subscribe("/topic/sessions", (message: unknown) => {
      const data = message as { type: string; session?: SecuritySession; sessionId?: string };
      if (data.type === "SESSION_CREATED" && data.session) {
        wsUpdates.handleSessionCreated(data.session);
      } else if (data.type === "SESSION_UPDATED" && data.session) {
        wsUpdates.handleSessionUpdated(data.session);
      } else if ((data.type === "SESSION_EXPIRED" || data.type === "SESSION_REVOKED") && data.sessionId) {
        wsUpdates.handleSessionRemoved(data.sessionId);
      }
    });

    const eventsSub = subscribe("/topic/security-events", (message: unknown) => {
      const data = message as { type: string; event?: SecurityEvent };
      if (data.event) {
        wsUpdates.handleEventCreated(data.event);
      }
    });

    return () => {
      if (sessionsSub) sessionsSub.unsubscribe();
      if (eventsSub) eventsSub.unsubscribe();
    };
  }, [isConnected, subscribe, wsUpdates]);

  // Handlers
  const handleRevokeSession = () => {
    if (!sessionToRevoke) return;
    revokeSession(sessionToRevoke.id, "Revoked by admin");
  };

  const handleAddIp = () => {
    if (!newIpAddress.trim()) return;
    addIp({
      ipAddress: newIpAddress.trim(),
      listType: ipListTab,
      reason: newIpReason.trim() || undefined,
    });
    setNewIpAddress("");
    setNewIpReason("");
  };

  const handleResolveEvent = () => {
    if (!eventToResolve) return;
    resolveEvent(eventToResolve.id, resolveNotes.trim() || undefined);
    setResolveNotes("");
  };

  const handleBulkResolve = () => {
    if (selectedEventIds.size === 0) return;
    bulkResolveEvents(Array.from(selectedEventIds), bulkResolveNotes.trim() || undefined);
    setBulkResolveNotes("");
  };

  // Get unresolved events for select all
  const unresolvedEvents = events.filter((e) => !e.resolved);
  const allUnresolvedSelected =
    unresolvedEvents.length > 0 && unresolvedEvents.every((e) => selectedEventIds.has(e.id));
  const someSelected = selectedEventIds.size > 0;

  const handleConfigToggle = (key: keyof SecurityConfig, value: boolean) => {
    updateConfig({ [key]: value });
  };

  const handleConfigNumber = (key: keyof SecurityConfig, value: number) => {
    updateConfig({ [key]: value });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Security</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Error Alert */}
      {displayError && (
        <div className="flex items-center gap-2 p-4 text-red-600 bg-red-50 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{displayError}</span>
          <Button variant="ghost" size="sm" onClick={() => setDisplayError(null)} className="ml-auto">
            Dismiss
          </Button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.active_sessions ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Currently logged in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Blocked (24h)</CardTitle>
            <ShieldX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.blocked_attempts_24h ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Access denied</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unresolved Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.unresolved_events ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Needs review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">VPN Flagged (24h)</CardTitle>
            <WifiOff className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.vpn_flagged_24h ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">VPN detected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Proxy Flagged (24h)</CardTitle>
            <Globe className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingStats ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.proxy_flagged_24h ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Proxy detected</p>
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Connection Status */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {isConnected ? (
          <>
            <Wifi className="h-4 w-4 text-green-500" />
            <span>Real-time updates connected</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span>Real-time updates disconnected</span>
          </>
        )}
      </div>

      {/* Live Session Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            Live Session Map
          </CardTitle>
          <CardDescription>Real-time visualization of active admin sessions worldwide</CardDescription>
        </CardHeader>
        <CardContent>
          <SessionMap sessions={sessions} className="h-[300px]" />
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Active Sessions
            </CardTitle>
            <CardDescription>Monitor and manage active admin sessions</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchSessions()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingSessions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No active sessions</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Device</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((session) => (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium">{session.userEmail || "Unknown"}</TableCell>
                    <TableCell className="font-mono text-sm">{session.ipAddress}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-muted-foreground" />
                        {session.city && session.countryCode
                          ? `${session.city}, ${session.countryCode}`
                          : session.countryCode || "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Monitor className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {session.browser || "Unknown"} / {session.os || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {formatRelativeTime(session.lastActivityAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {session.flaggedVpn && (
                          <Badge variant="destructive" className="text-xs">VPN</Badge>
                        )}
                        {session.flaggedProxy && (
                          <Badge variant="destructive" className="text-xs">Proxy</Badge>
                        )}
                        {session.fraudScore !== null && session.fraudScore >= 75 && (
                          <Badge variant="destructive" className="text-xs">
                            Risk: {session.fraudScore}
                          </Badge>
                        )}
                        {!session.flaggedVpn && !session.flaggedProxy && (session.fraudScore === null || session.fraudScore < 75) && (
                          <Badge variant="outline" className="text-xs text-green-600">Clean</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openRevokeDialog(session)}
                        disabled={isRevoking}
                      >
                        <XCircle className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* IP List Manager */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              IP Access Control
            </CardTitle>
            <CardDescription>Manage IP allowlist and blocklist</CardDescription>
          </div>
          <Button onClick={openAddIpDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add IP
          </Button>
        </CardHeader>
        <CardContent>
          <Tabs value={ipListTab} onValueChange={(v) => setIpListTab(v as "ALLOWLIST" | "BLOCKLIST")}>
            <TabsList className="mb-4">
              <TabsTrigger value="ALLOWLIST" className="gap-2">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Allowlist
              </TabsTrigger>
              <TabsTrigger value="BLOCKLIST" className="gap-2">
                <ShieldX className="h-4 w-4 text-red-500" />
                Blocklist
              </TabsTrigger>
            </TabsList>

            <TabsContent value={ipListTab}>
              {isLoadingIpList ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : ipList.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No IPs in {ipListTab.toLowerCase()}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Expires</TableHead>
                      <TableHead>Added</TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ipList.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-mono">{entry.ipAddress}</TableCell>
                        <TableCell>{entry.reason || "-"}</TableCell>
                        <TableCell>
                          {entry.expiresAt
                            ? new Date(entry.expiresAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>{formatRelativeTime(entry.createdAt)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeIp(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Security Events */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Security Events
            </CardTitle>
            <CardDescription>Recent security incidents and audit log</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {someSelected && (
              <>
                <span className="text-sm text-muted-foreground">
                  {selectedEventIds.size} selected
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearEventSelection}
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={openBulkResolveDialog}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve Selected
                </Button>
              </>
            )}
            <Select value={eventFilter} onValueChange={(v) => setEventFilter(v as "all" | "unresolved")}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="all">All Events</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={() => refetchEvents()}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingEvents ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No security events
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allUnresolvedSelected && unresolvedEvents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          selectAllEvents(unresolvedEvents.map((e) => e.id));
                        } else {
                          clearEventSelection();
                        }
                      }}
                      aria-label="Select all unresolved events"
                    />
                  </TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[80px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell>
                      {!event.resolved && (
                        <Checkbox
                          checked={selectedEventIds.has(event.id)}
                          onCheckedChange={() => toggleEventSelection(event.id)}
                          aria-label={`Select event ${event.title}`}
                        />
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatRelativeTime(event.createdAt)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{getEventTypeDisplay(event.eventType)}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(event.severity)}>{event.severity}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{event.ipAddress || "-"}</TableCell>
                    <TableCell className="text-sm">{event.userEmail || "-"}</TableCell>
                    <TableCell className="max-w-[300px] truncate" title={event.description || ""}>
                      {event.title}
                    </TableCell>
                    <TableCell>
                      {event.resolved ? (
                        <Badge variant="outline" className="text-green-600">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Resolved
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Open
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {!event.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openResolveDialog(event)}
                        >
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Security Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>Configure IP intelligence and session security settings</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingConfig ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : config ? (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Blocking Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Blocking Settings</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block VPN</Label>
                    <p className="text-sm text-muted-foreground">Block users connecting via VPN</p>
                  </div>
                  <Switch
                    checked={config.block_vpn}
                    onCheckedChange={(v) => handleConfigToggle("block_vpn", v)}
                    disabled={isSavingConfig}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Proxy</Label>
                    <p className="text-sm text-muted-foreground">Block proxy connections</p>
                  </div>
                  <Switch
                    checked={config.block_proxy}
                    onCheckedChange={(v) => handleConfigToggle("block_proxy", v)}
                    disabled={isSavingConfig}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Datacenter IPs</Label>
                    <p className="text-sm text-muted-foreground">Block datacenter/cloud IPs</p>
                  </div>
                  <Switch
                    checked={config.block_datacenter}
                    onCheckedChange={(v) => handleConfigToggle("block_datacenter", v)}
                    disabled={isSavingConfig}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Tor</Label>
                    <p className="text-sm text-muted-foreground">Block Tor exit nodes</p>
                  </div>
                  <Switch
                    checked={config.block_tor}
                    onCheckedChange={(v) => handleConfigToggle("block_tor", v)}
                    disabled={isSavingConfig}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Block Bots</Label>
                    <p className="text-sm text-muted-foreground">Block known bot IPs</p>
                  </div>
                  <Switch
                    checked={config.block_bots}
                    onCheckedChange={(v) => handleConfigToggle("block_bots", v)}
                    disabled={isSavingConfig}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Require Allowlist</Label>
                    <p className="text-sm text-muted-foreground">Only allow IPs in allowlist</p>
                  </div>
                  <Switch
                    checked={config.require_allowlist}
                    onCheckedChange={(v) => handleConfigToggle("require_allowlist", v)}
                    disabled={isSavingConfig}
                  />
                </div>
              </div>

              {/* Threshold Settings */}
              <div className="space-y-4">
                <h3 className="font-medium">Threshold Settings</h3>

                <div className="space-y-2">
                  <Label>Fraud Score Threshold</Label>
                  <p className="text-sm text-muted-foreground">Block IPs with fraud score above this value (0-100)</p>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={config.fraud_score_threshold}
                    onChange={(e) => handleConfigNumber("fraud_score_threshold", parseInt(e.target.value) || 75)}
                    disabled={isSavingConfig}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Session Timeout (minutes)</Label>
                  <p className="text-sm text-muted-foreground">Expire inactive sessions after this duration</p>
                  <Input
                    type="number"
                    min="5"
                    max="1440"
                    value={config.session_timeout_minutes}
                    onChange={(e) => handleConfigNumber("session_timeout_minutes", parseInt(e.target.value) || 30)}
                    disabled={isSavingConfig}
                    className="w-24"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Max Sessions Per User</Label>
                  <p className="text-sm text-muted-foreground">Maximum concurrent sessions allowed per user</p>
                  <Input
                    type="number"
                    min="1"
                    max="10"
                    value={config.max_sessions_per_user}
                    onChange={(e) => handleConfigNumber("max_sessions_per_user", parseInt(e.target.value) || 5)}
                    disabled={isSavingConfig}
                    className="w-24"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <Label>IPQualityScore Enabled</Label>
                    <p className="text-sm text-muted-foreground">Enable IP intelligence API</p>
                  </div>
                  <Switch
                    checked={config.ipqs_enabled}
                    onCheckedChange={(v) => handleConfigToggle("ipqs_enabled", v)}
                    disabled={isSavingConfig}
                  />
                </div>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Revoke Session Confirmation */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={(open) => !open && closeRevokeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the session for{" "}
              <strong>{sessionToRevoke?.userEmail}</strong>?
              This will force them to log in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {revokeError && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-4 w-4" />
              {getErrorMessage(revokeError)}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeSession}
              className="bg-red-600 hover:bg-red-700"
              disabled={isRevoking}
            >
              {isRevoking ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Revoking...
                </>
              ) : (
                "Revoke Session"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add IP Dialog */}
      <Dialog open={isAddIpDialogOpen} onOpenChange={(open) => !open && closeAddIpDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add IP to {ipListTab === "ALLOWLIST" ? "Allowlist" : "Blocklist"}
            </DialogTitle>
            <DialogDescription>
              {ipListTab === "ALLOWLIST"
                ? "IPs in the allowlist will always be allowed access."
                : "IPs in the blocklist will always be denied access."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {addIpError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {getErrorMessage(addIpError)}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="ip-address">IP Address</Label>
              <Input
                id="ip-address"
                placeholder="192.168.1.1"
                value={newIpAddress}
                onChange={(e) => setNewIpAddress(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ip-reason">Reason (optional)</Label>
              <Textarea
                id="ip-reason"
                placeholder="Why is this IP being added?"
                value={newIpReason}
                onChange={(e) => setNewIpReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeAddIpDialog}>
              Cancel
            </Button>
            <Button onClick={handleAddIp} disabled={isAddingIp || !newIpAddress.trim()}>
              {isAddingIp ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add IP"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Event Dialog */}
      <Dialog open={isResolveDialogOpen} onOpenChange={(open) => !open && closeResolveDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Security Event</DialogTitle>
            <DialogDescription>
              Mark this event as resolved. Add notes if needed.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {eventToResolve && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="font-medium">{eventToResolve.title}</p>
                <p className="text-sm text-muted-foreground">{eventToResolve.description}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="resolve-notes">Resolution Notes (optional)</Label>
              <Textarea
                id="resolve-notes"
                placeholder="How was this resolved?"
                value={resolveNotes}
                onChange={(e) => setResolveNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeResolveDialog}>
              Cancel
            </Button>
            <Button onClick={handleResolveEvent} className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Resolve Dialog */}
      <Dialog open={isBulkResolveDialogOpen} onOpenChange={(open) => !open && closeBulkResolveDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Resolve Security Events</DialogTitle>
            <DialogDescription>
              Mark {selectedEventIds.size} selected event{selectedEventIds.size !== 1 ? "s" : ""} as resolved.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {bulkResolveError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {getErrorMessage(bulkResolveError)}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="bulk-resolve-notes">Resolution Notes (optional)</Label>
              <Textarea
                id="bulk-resolve-notes"
                placeholder="Add notes for all resolved events..."
                value={bulkResolveNotes}
                onChange={(e) => setBulkResolveNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeBulkResolveDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleBulkResolve}
              disabled={isBulkResolving || selectedEventIds.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              {isBulkResolving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Resolving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Resolve {selectedEventIds.size} Event{selectedEventIds.size !== 1 ? "s" : ""}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
