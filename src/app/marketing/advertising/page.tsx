"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Share2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdConnections,
  getAdAuthUrl,
  disconnectAdPlatform,
  refreshAdToken,
  type AdConnection,
} from "@/lib/api";

type PlatformInfo = {
  id: string;
  name: string;
  description: string;
  icon: string;
};

const PLATFORM_INFO: PlatformInfo[] = [
  {
    id: "GOOGLE_ADS",
    name: "Google Ads",
    description: "Search, Display, Shopping, and YouTube campaigns",
    icon: "G",
  },
  {
    id: "META_ADS",
    name: "Meta Ads",
    description: "Facebook and Instagram advertising",
    icon: "M",
  },
  {
    id: "PINTEREST_ADS",
    name: "Pinterest Ads",
    description: "Promoted Pins and Shopping campaigns",
    icon: "P",
  },
];

export default function AdvertisingPage() {
  const [connections, setConnections] = useState<AdConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<string | null>(null);
  const [disconnecting, setDisconnecting] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    try {
      const data = await getAdConnections();
      setConnections(data.connections);
    } catch (err) {
      console.error("Failed to fetch connections:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const getConnection = (platformId: string): AdConnection | undefined => {
    return connections.find(
      (c) => c.platform === platformId && c.status !== "DISCONNECTED"
    );
  };

  const handleConnect = async (platformId: string) => {
    setConnecting(platformId);
    try {
      const redirectUri = `${window.location.origin}/marketing/advertising/connect/${platformId.toLowerCase()}`;
      const data = await getAdAuthUrl(platformId, redirectUri);
      // Redirect to OAuth provider
      window.location.href = data.authorizationUrl;
    } catch (err: any) {
      toast.error(
        err?.message || "Failed to start connection. Make sure the platform is configured on the server."
      );
      setConnecting(null);
    }
  };

  const handleDisconnect = async (connectionId: string, platformName: string) => {
    if (!confirm(`Disconnect ${platformName}? This will remove your ad account connection.`)) {
      return;
    }
    setDisconnecting(connectionId);
    try {
      await disconnectAdPlatform(connectionId);
      toast.success(`${platformName} disconnected`);
      await fetchConnections();
    } catch (err: any) {
      toast.error(err?.message || "Failed to disconnect");
    } finally {
      setDisconnecting(null);
    }
  };

  const handleRefresh = async (connectionId: string, platformName: string) => {
    try {
      await refreshAdToken(connectionId);
      toast.success(`${platformName} token refreshed`);
      await fetchConnections();
    } catch (err: any) {
      toast.error(err?.message || "Failed to refresh token");
    }
  };

  const connectedCount = connections.filter((c) => c.status === "CONNECTED").length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad Platforms</h1>
          <p className="text-muted-foreground mt-1">
            Connect your advertising accounts to manage campaigns from Vernont.
          </p>
        </div>
        <Badge variant="secondary">
          {connectedCount} of {PLATFORM_INFO.length} connected
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {PLATFORM_INFO.map((platform) => {
            const connection = getConnection(platform.id);
            const isConnected = connection?.status === "CONNECTED";
            const isError = connection?.status === "ERROR";
            const isConnecting = connecting === platform.id;
            const isDisconnecting = disconnecting === connection?.id;

            return (
              <Card key={platform.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted font-bold text-lg">
                        {platform.icon}
                      </div>
                      <div>
                        <CardTitle className="text-base">{platform.name}</CardTitle>
                      </div>
                    </div>
                    {isConnected ? (
                      <Badge variant="default" className="bg-green-600">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    ) : isError ? (
                      <Badge variant="destructive">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Error
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <XCircle className="h-3 w-3 mr-1" />
                        Not Connected
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="mt-2">
                    {platform.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isConnected && connection ? (
                    <div className="space-y-3">
                      {connection.accountName && (
                        <p className="text-sm text-muted-foreground">
                          Account: {connection.accountName}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRefresh(connection.id, platform.name)}
                        >
                          <RefreshCw className="h-3.5 w-3.5 mr-1" />
                          Refresh
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDisconnect(connection.id, platform.name)}
                          disabled={isDisconnecting}
                        >
                          {isDisconnecting ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : null}
                          Disconnect
                        </Button>
                      </div>
                    </div>
                  ) : isError && connection ? (
                    <div className="space-y-3">
                      <p className="text-sm text-destructive">
                        {connection.errorMessage || "Connection error"}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleConnect(platform.id)}
                          disabled={isConnecting}
                        >
                          {isConnecting && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                          Reconnect
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDisconnect(connection.id, platform.name)}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => handleConnect(platform.id)}
                      disabled={isConnecting}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        `Connect ${platform.name}`
                      )}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {!loading && connectedCount === 0 && (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={<Share2 className="h-8 w-8 text-muted-foreground" />}
              title="No platforms connected"
              description="Connect an advertising platform above to start managing your campaigns from Vernont."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
