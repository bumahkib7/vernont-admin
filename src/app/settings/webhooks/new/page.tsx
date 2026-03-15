"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { createWebhookEndpoint } from "@/lib/api";
import { toast } from "sonner";

const AVAILABLE_EVENTS = [
  { value: "order.created", label: "Order Created" },
  { value: "order.completed", label: "Order Completed" },
  { value: "order.cancelled", label: "Order Cancelled" },
  { value: "customer.registered", label: "Customer Registered" },
  { value: "customer.updated", label: "Customer Updated" },
  { value: "product.created", label: "Product Created" },
  { value: "product.updated", label: "Product Updated" },
  { value: "payment.captured", label: "Payment Captured" },
  { value: "payment.refunded", label: "Payment Refunded" },
];

export default function NewWebhookPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [secret, setSecret] = useState("");
  const [description, setDescription] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]
    );
  };

  const toggleAll = () => {
    if (selectedEvents.length === AVAILABLE_EVENTS.length) {
      setSelectedEvents([]);
    } else {
      setSelectedEvents(AVAILABLE_EVENTS.map((e) => e.value));
    }
  };

  const handleCreate = async () => {
    if (!url || !secret || selectedEvents.length === 0) {
      toast.error("URL, secret, and at least one event are required");
      return;
    }

    setSaving(true);
    try {
      await createWebhookEndpoint({ url, secret, events: selectedEvents, description: description || undefined });
      toast.success("Webhook endpoint created");
      router.push("/settings/webhooks");
    } catch (err: any) {
      toast.error(err?.message || "Failed to create webhook");
    } finally {
      setSaving(false);
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
            <BreadcrumbLink href="/settings/webhooks">Webhooks</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Endpoint</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Endpoint Details</CardTitle>
            <CardDescription>The URL that will receive webhook POST requests</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">Endpoint URL</Label>
              <Input
                id="url"
                placeholder="https://example.com/webhooks"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="secret">Signing Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="whsec_..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Used to sign payloads with HMAC-SHA256</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What this webhook is used for..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>Select which events trigger this webhook</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Checkbox
                  id="select-all"
                  checked={selectedEvents.length === AVAILABLE_EVENTS.length}
                  onCheckedChange={toggleAll}
                />
                <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                  Select All
                </label>
              </div>
              {AVAILABLE_EVENTS.map((evt) => (
                <div key={evt.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={evt.value}
                    checked={selectedEvents.includes(evt.value)}
                    onCheckedChange={() => toggleEvent(evt.value)}
                  />
                  <label htmlFor={evt.value} className="text-sm cursor-pointer">
                    <span className="font-medium">{evt.label}</span>
                    <span className="text-muted-foreground ml-2 text-xs">{evt.value}</span>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={handleCreate} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Create Endpoint
          </Button>
          <Button variant="outline" asChild>
            <Link href="/settings/webhooks">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
