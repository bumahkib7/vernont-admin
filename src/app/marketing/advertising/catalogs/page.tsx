"use client";

import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { ShoppingBag } from "lucide-react";

export default function CatalogsPage() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Product Catalog</h1>
        <p className="text-muted-foreground mt-1">
          Sync your product catalog to connected ad platforms for shopping campaigns.
        </p>
      </div>

      <Card>
        <CardContent className="py-8">
          <EmptyState
            icon={<ShoppingBag className="h-8 w-8 text-muted-foreground" />}
            title="No catalog syncs"
            description="Connect an ad platform first to sync your product catalog for shopping campaigns."
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
