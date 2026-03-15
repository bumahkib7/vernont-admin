"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { Megaphone, Plus } from "lucide-react";

export default function AdCampaignsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Ad Campaigns</h1>
          <p className="text-muted-foreground mt-1">
            Manage campaigns across all connected ad platforms.
          </p>
        </div>
        <Button asChild>
          <Link href="/marketing/advertising/campaigns/new">
            <Plus className="h-4 w-4 mr-2" />
            Create Campaign
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={<Megaphone className="h-8 w-8 text-muted-foreground" />}
            title="No campaigns yet"
            description="Connect an ad platform first, then create your first campaign to start advertising your products."
            action={{
              label: "Connect Platform",
              onClick: () => window.location.href = "/marketing/advertising",
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
