"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Megaphone,
  Plus,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  getAdCampaigns,
  pauseAdCampaign,
  resumeAdCampaign,
  type AdCampaign,
} from "@/lib/api";
import { formatCurrency } from "@/lib/format";

function platformLabel(platform: string): string {
  switch (platform) {
    case "GOOGLE_ADS": return "Google Ads";
    case "META_ADS": return "Meta Ads";
    case "PINTEREST_ADS": return "Pinterest";
    default: return platform;
  }
}

function statusBadge(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "ENABLED":
      return <Badge className="bg-green-600">Active</Badge>;
    case "PAUSED":
      return <Badge variant="secondary">Paused</Badge>;
    case "REMOVED":
    case "DELETED":
      return <Badge variant="destructive">Removed</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdCampaignsPage() {
  const [campaigns, setCampaigns] = useState<AdCampaign[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCampaigns = async () => {
    try {
      const data = await getAdCampaigns();
      setCampaigns(data.campaigns);
    } catch (err) {
      console.error("Failed to fetch campaigns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const handlePause = async (id: string) => {
    try {
      await pauseAdCampaign(id);
      toast.success("Campaign paused");
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.message || "Failed to pause campaign");
    }
  };

  const handleResume = async (id: string) => {
    try {
      await resumeAdCampaign(id);
      toast.success("Campaign resumed");
      fetchCampaigns();
    } catch (err: any) {
      toast.error(err?.message || "Failed to resume campaign");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns across all connected ad platforms.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <EmptyState
              icon={<Megaphone className="h-8 w-8 text-muted-foreground" />}
              title="No campaigns yet"
              description="Connect an ad platform first, then create your first campaign to start advertising your products."
              action={{
                label: "Connect Platform",
                onClick: () => (window.location.href = "/marketing/advertising"),
              }}
            />
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Campaign</TableHead>
                <TableHead>Platform</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Daily Budget</TableHead>
                <TableHead className="w-[50px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.name || campaign.externalCampaignId}
                  </TableCell>
                  <TableCell>{platformLabel(campaign.platform)}</TableCell>
                  <TableCell>{statusBadge(campaign.status)}</TableCell>
                  <TableCell>{campaign.campaignType || "-"}</TableCell>
                  <TableCell>
                    {campaign.dailyBudgetCents != null ? formatCurrency(campaign.dailyBudgetCents, campaign.currency) : "-"}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/marketing/advertising/campaigns/${campaign.id}`}>
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Metrics
                          </Link>
                        </DropdownMenuItem>
                        {campaign.status.toUpperCase() === "ACTIVE" || campaign.status.toUpperCase() === "ENABLED" ? (
                          <DropdownMenuItem onClick={() => handlePause(campaign.id)}>
                            <Pause className="h-4 w-4 mr-2" />
                            Pause
                          </DropdownMenuItem>
                        ) : campaign.status.toUpperCase() === "PAUSED" ? (
                          <DropdownMenuItem onClick={() => handleResume(campaign.id)}>
                            <Play className="h-4 w-4 mr-2" />
                            Resume
                          </DropdownMenuItem>
                        ) : null}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
