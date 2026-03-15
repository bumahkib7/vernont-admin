"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { submitAdOAuthCallback } from "@/lib/api";

function ConnectContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  const platform = (params.platform as string)?.toUpperCase();
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  useEffect(() => {
    if (error) {
      setStatus("error");
      setMessage(searchParams.get("error_description") || "Authorization was denied or failed.");
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("No authorization code received from the platform.");
      return;
    }

    const handleCallback = async () => {
      try {
        const redirectUri = `${window.location.origin}/marketing/advertising/connect/${platform.toLowerCase()}`;
        await submitAdOAuthCallback(platform, code, redirectUri, state || undefined);
        setStatus("success");
        setMessage("Platform connected successfully!");
        setTimeout(() => router.push("/marketing/advertising"), 2000);
      } catch (err: any) {
        setStatus("error");
        setMessage(err?.message || "Failed to connect platform.");
      }
    };

    handleCallback();
  }, [code, error, platform, state, searchParams, router]);

  const platformName = platform === "GOOGLE_ADS" ? "Google Ads"
    : platform === "META_ADS" ? "Meta Ads"
    : platform === "PINTEREST_ADS" ? "Pinterest Ads"
    : platform;

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle>
            {status === "loading" && `Connecting ${platformName}...`}
            {status === "success" && `${platformName} Connected`}
            {status === "error" && "Connection Failed"}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {status === "loading" && (
            <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          )}
          {status === "success" && (
            <CheckCircle2 className="h-10 w-10 text-green-600" />
          )}
          {status === "error" && (
            <XCircle className="h-10 w-10 text-destructive" />
          )}
          <p className="text-sm text-muted-foreground text-center">{message}</p>
          {status === "error" && (
            <Button onClick={() => router.push("/marketing/advertising")}>
              Back to Ad Platforms
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default function ConnectPlatformPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <ConnectContent />
    </Suspense>
  );
}
