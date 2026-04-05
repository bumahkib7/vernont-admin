"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Truck,
} from "lucide-react";
import { toast } from "sonner";
import { apiFetch, formatDateTime } from "@/lib/api/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CarrierService {
  id: string;
  carrierCode: string;
  serviceCode: string;
  serviceName: string;
  domestic: boolean;
  international: boolean;
  enabled: boolean;
}

interface ShippingCarrier {
  id: string;
  carrierCode: string;
  carrierName: string;
  shipengineCarrierId: string;
  enabled: boolean;
  isDefault: boolean;
  lastSyncedAt: string | null;
  services: CarrierService[];
}

interface CarriersResponse {
  carriers: ShippingCarrier[];
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function getCarriers(): Promise<CarriersResponse> {
  return apiFetch<CarriersResponse>("/admin/shipping/carriers");
}

async function syncCarriers(): Promise<CarriersResponse> {
  return apiFetch<CarriersResponse>("/admin/shipping/carriers/sync", {
    method: "POST",
  });
}

async function toggleCarrier(
  id: string,
  enabled: boolean
): Promise<ShippingCarrier> {
  return apiFetch<ShippingCarrier>(`/admin/shipping/carriers/${id}`, {
    method: "PUT",
    body: JSON.stringify({ enabled }),
  });
}

async function setDefaultCarrier(id: string): Promise<ShippingCarrier> {
  return apiFetch<ShippingCarrier>(
    `/admin/shipping/carriers/${id}/set-default`,
    { method: "PUT" }
  );
}

async function toggleService(
  carrierId: string,
  serviceId: string,
  enabled: boolean
): Promise<CarrierService> {
  return apiFetch<CarrierService>(
    `/admin/shipping/carriers/${carrierId}/services/${serviceId}`,
    { method: "PUT", body: JSON.stringify({ enabled }) }
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ShippingCarriersPage() {
  const queryClient = useQueryClient();
  const [expandedCarrier, setExpandedCarrier] = useState<string | null>(null);

  // Fetch carriers
  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["shipping-carriers"],
    queryFn: getCarriers,
  });

  const carriers = data?.carriers ?? [];

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: syncCarriers,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
      toast.success("Carriers synced from ShipEngine");
    },
    onError: () => {
      toast.error("Failed to sync carriers");
    },
  });

  // Toggle carrier enabled
  const toggleCarrierMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) =>
      toggleCarrier(id, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
    },
    onError: () => {
      toast.error("Failed to update carrier");
    },
  });

  // Set default carrier
  const setDefaultMutation = useMutation({
    mutationFn: (id: string) => setDefaultCarrier(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
      toast.success("Default carrier updated");
    },
    onError: () => {
      toast.error("Failed to set default carrier");
    },
  });

  // Toggle service enabled
  const toggleServiceMutation = useMutation({
    mutationFn: ({
      carrierId,
      serviceId,
      enabled,
    }: {
      carrierId: string;
      serviceId: string;
      enabled: boolean;
    }) => toggleService(carrierId, serviceId, enabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipping-carriers"] });
    },
    onError: () => {
      toast.error("Failed to update service");
    },
  });

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Shipping Carriers</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Shipping Carriers
          </h1>
          <p className="text-muted-foreground">
            Manage carriers and services synced from ShipEngine.
          </p>
        </div>
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
        >
          {syncMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          Sync from ShipEngine
        </Button>
      </div>

      {/* Content */}
      <Card>
        <CardHeader>
          <CardTitle>Carriers</CardTitle>
          <CardDescription>
            Enable or disable carriers and their individual services. The
            default carrier is used when no specific carrier is selected.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>Failed to load carriers.</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() =>
                  queryClient.invalidateQueries({
                    queryKey: ["shipping-carriers"],
                  })
                }
              >
                Retry
              </Button>
            </div>
          ) : carriers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Truck className="mb-3 h-10 w-10" />
              <p className="font-medium">No carriers configured</p>
              <p className="mt-1 text-sm">
                Click &quot;Sync from ShipEngine&quot; to import your carriers.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Carrier</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Enabled</TableHead>
                  <TableHead>Default</TableHead>
                  <TableHead>Last Synced</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {carriers.map((carrier) => {
                  const isExpanded = expandedCarrier === carrier.id;
                  return (
                    <>
                      {/* Carrier row */}
                      <TableRow
                        key={carrier.id}
                        className="cursor-pointer"
                        onClick={() =>
                          setExpandedCarrier(isExpanded ? null : carrier.id)
                        }
                      >
                        <TableCell>
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {carrier.carrierName}
                        </TableCell>
                        <TableCell>
                          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                            {carrier.carrierCode}
                          </code>
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          <Switch
                            checked={carrier.enabled}
                            onCheckedChange={(checked) =>
                              toggleCarrierMutation.mutate({
                                id: carrier.id,
                                enabled: checked,
                              })
                            }
                          />
                        </TableCell>
                        <TableCell onClick={(e) => e.stopPropagation()}>
                          {carrier.isDefault ? (
                            <Badge>Default</Badge>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              onClick={() =>
                                setDefaultMutation.mutate(carrier.id)
                              }
                            >
                              Set default
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {carrier.lastSyncedAt
                            ? formatDateTime(carrier.lastSyncedAt)
                            : "Never"}
                        </TableCell>
                      </TableRow>

                      {/* Expanded services */}
                      {isExpanded &&
                        carrier.services.length > 0 &&
                        carrier.services.map((service) => (
                          <TableRow
                            key={service.id}
                            className="bg-muted/30"
                          >
                            <TableCell />
                            <TableCell className="pl-8 text-sm">
                              {service.serviceName}
                            </TableCell>
                            <TableCell>
                              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                {service.serviceCode}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Switch
                                checked={service.enabled}
                                onCheckedChange={(checked) =>
                                  toggleServiceMutation.mutate({
                                    carrierId: carrier.id,
                                    serviceId: service.id,
                                    enabled: checked,
                                  })
                                }
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                {service.domestic && (
                                  <Badge variant="outline" className="text-xs">
                                    Domestic
                                  </Badge>
                                )}
                                {service.international && (
                                  <Badge variant="outline" className="text-xs">
                                    International
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell />
                          </TableRow>
                        ))}

                      {/* No services message */}
                      {isExpanded && carrier.services.length === 0 && (
                        <TableRow
                          key={`${carrier.id}-empty`}
                          className="bg-muted/30"
                        >
                          <TableCell />
                          <TableCell
                            colSpan={5}
                            className="text-sm text-muted-foreground italic"
                          >
                            No services found for this carrier. Try syncing
                            again.
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
