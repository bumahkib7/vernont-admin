"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  RefreshCw,
  Trash2,
  Database,
  ShoppingBag,
  AlertCircle,
} from "lucide-react";
import {
  clearPinterestFeedCaches,
  clearAllCaches,
  getCacheNames,
} from "@/lib/api/cache";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

export default function CachePage() {
  const [isClearing, setIsClearing] = useState(false);
  const [isPinterestClearing, setIsPinterestClearing] = useState(false);
  const [caches, setCaches] = useState<string[]>([]);
  const [isLoadingCaches, setIsLoadingCaches] = useState(false);

  const handleClearPinterestFeeds = async () => {
    setIsPinterestClearing(true);
    try {
      const result = await clearPinterestFeedCaches();
      if (result.success) {
        toast.success("Pinterest feed caches cleared", {
          description: "The Pinterest Shopping catalog will regenerate on next request with latest product data.",
        });
      }
    } catch (error: any) {
      toast.error("Failed to clear Pinterest feed caches", {
        description: error.message || "An error occurred while clearing the caches.",
      });
    } finally {
      setIsPinterestClearing(false);
    }
  };

  const handleClearAllCaches = async () => {
    if (!confirm("Are you sure you want to clear ALL caches? This may temporarily impact performance.")) {
      return;
    }

    setIsClearing(true);
    try {
      const result = await clearAllCaches();
      if (result.success) {
        toast.success("All caches cleared", {
          description: `Cleared ${result.clearedCaches?.length || 0} cache(s) successfully.`,
        });
      }
    } catch (error: any) {
      toast.error("Failed to clear all caches", {
        description: error.message || "An error occurred while clearing the caches.",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const handleLoadCaches = async () => {
    setIsLoadingCaches(true);
    try {
      const result = await getCacheNames();
      if (result.success && result.caches) {
        setCaches(result.caches);
        toast.success("Cache names loaded", {
          description: `Found ${result.caches.length} active cache(s).`,
        });
      }
    } catch (error: any) {
      toast.error("Failed to load cache names", {
        description: error.message || "An error occurred while loading cache names.",
      });
    } finally {
      setIsLoadingCaches(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Cache</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>About Caching</AlertTitle>
        <AlertDescription>
          Caches help improve performance by storing frequently accessed data. Clear caches after making updates to ensure changes are immediately visible.
        </AlertDescription>
      </Alert>

      {/* Pinterest Feed Cache */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-purple-600" />
            <CardTitle>Pinterest Shopping Feed</CardTitle>
          </div>
          <CardDescription>
            Clear Pinterest catalog feed caches (CSV and XML) after updating products to ensure Pinterest sees the latest data.
            Feed is cached for 15 minutes by default.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleClearPinterestFeeds}
            disabled={isPinterestClearing}
            className="w-full sm:w-auto"
          >
            {isPinterestClearing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Clearing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Clear Pinterest Feed Caches
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* View Active Caches */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" />
            <CardTitle>Active Caches</CardTitle>
          </div>
          <CardDescription>
            View all active cache names in the system.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleLoadCaches}
            disabled={isLoadingCaches}
            variant="outline"
            className="w-full sm:w-auto"
          >
            {isLoadingCaches ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Load Cache Names
              </>
            )}
          </Button>

          {caches.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Active Caches ({caches.length}):</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {caches.map((cache) => (
                  <div
                    key={cache}
                    className="px-3 py-2 bg-muted rounded-md text-sm font-mono"
                  >
                    {cache}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Clear All Caches - Danger Zone */}
      <Card className="border-destructive">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
          </div>
          <CardDescription>
            Clear all application caches. This may temporarily impact performance while caches rebuild.
            Use only when necessary.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleClearAllCaches}
            disabled={isClearing}
            variant="destructive"
            className="w-full sm:w-auto"
          >
            {isClearing ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Clearing All Caches...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All Caches
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
