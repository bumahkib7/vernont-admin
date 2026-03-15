"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Share2, CheckCircle2, XCircle, ExternalLink } from "lucide-react";

type Platform = {
  id: string;
  name: string;
  description: string;
  icon: string;
  connected: boolean;
  accountName?: string;
};

const PLATFORMS: Platform[] = [
  {
    id: "GOOGLE_ADS",
    name: "Google Ads",
    description: "Search, Display, Shopping, and YouTube campaigns",
    icon: "G",
    connected: false,
  },
  {
    id: "META_ADS",
    name: "Meta Ads",
    description: "Facebook and Instagram advertising",
    icon: "M",
    connected: false,
  },
  {
    id: "PINTEREST_ADS",
    name: "Pinterest Ads",
    description: "Promoted Pins and Shopping campaigns",
    icon: "P",
    connected: false,
  },
];

export default function AdvertisingPage() {
  const [platforms] = useState<Platform[]>(PLATFORMS);

  const connectedCount = platforms.filter((p) => p.connected).length;

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
          {connectedCount} of {platforms.length} connected
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {platforms.map((platform) => (
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
                {platform.connected ? (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Connected
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
              {platform.connected ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Account: {platform.accountName}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <ExternalLink className="h-3.5 w-3.5 mr-1" />
                      Manage
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      Disconnect
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="sm" className="w-full">
                  Connect {platform.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {connectedCount === 0 && (
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
