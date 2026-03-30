"use client";

import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Truck,
  AlertCircle,
  RefreshCw,
  CheckCircle,
  Loader2,
  Printer,
  DollarSign,
  Clock,
  ChevronDown,
  ChevronRight,
  MapPin,
  ArrowLeft,
  Scale,
  Ruler,
  BoxIcon,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  getOrder,
  shipOrder,
  getShippingOptions,
  getShippingConfig,
  getShippingRates,
  getCarrierServices,
  Order,
  FulfillmentStatus,
  ShippingOption,
  ShippingConfig,
  ShippingRate,
  ServiceInfo,
  formatPrice,
  formatDateTime,
} from "@/lib/api";

const PACKAGE_PRESETS = [
  { label: "Small parcel", weight: "0.5", length: "20", width: "15", height: "5" },
  { label: "Medium box", weight: "2", length: "35", width: "25", height: "15" },
  { label: "Large box", weight: "5", length: "50", width: "40", height: "30" },
];

function FulfillmentStatusBadge({ status }: { status: FulfillmentStatus }) {
  return <StatusBadge status={status} type="fulfillment" dot />;
}

export default function ShipOrderPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const orderId = params.id as string;
  const queryClient = useQueryClient();

  // Order data
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Shipping method
  const [useShipEngine, setUseShipEngine] = useState(false);
  const [selectedCarrier, setSelectedCarrier] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("");

  // Package dimensions
  const [packageDimensions, setPackageDimensions] = useState({
    weight: "",
    length: "",
    width: "",
    height: "",
  });

  // Shipping data
  const [shippingConfig, setShippingConfig] = useState<ShippingConfig | null>(null);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [carrierServices, setCarrierServices] = useState<ServiceInfo[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [ratesError, setRatesError] = useState<string | null>(null);

  // Collapsible sections
  const [methodOpen, setMethodOpen] = useState(true);
  const [packageOpen, setPackageOpen] = useState(true);
  const [ratesOpen, setRatesOpen] = useState(true);

  // Label dialog
  const [labelDialogOpen, setLabelDialogOpen] = useState(false);
  const [labelUrl, setLabelUrl] = useState<string | null>(null);

  // Fetch order
  const orderQuery = useQuery({
    queryKey: ["order-detail", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId && !!user && !authLoading,
    staleTime: 15_000,
  });

  const loading = orderQuery.isLoading;

  useEffect(() => {
    if (orderQuery.data) {
      const data = orderQuery.data;
      setOrder(data);
      if (data.shippingMethodId) {
        setCarrier(data.shippingMethodId);
      }
    }
    if (orderQuery.error) {
      setError(orderQuery.error instanceof Error ? orderQuery.error.message : "Failed to load order");
    }
  }, [orderQuery.data, orderQuery.error]);

  // Fetch shipping options
  const shippingOptionsQuery = useQuery({
    queryKey: ["shipping-options"],
    queryFn: async () => {
      const response = await getShippingOptions();
      return response.shipping_options || [];
    },
    enabled: !!user && !authLoading,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (shippingOptionsQuery.data) {
      setShippingOptions(shippingOptionsQuery.data);
    }
  }, [shippingOptionsQuery.data]);

  // Fetch shipping config
  const shippingConfigQuery = useQuery({
    queryKey: ["shipping-config"],
    queryFn: () => getShippingConfig(),
    enabled: !!user && !authLoading,
    staleTime: 5 * 60_000,
  });

  useEffect(() => {
    if (shippingConfigQuery.data) {
      const config = shippingConfigQuery.data;
      setShippingConfig(config);
      if (config.shipEngineConfigured) {
        setSelectedCarrier(config.defaultCarrierId);
        setSelectedService(config.defaultServiceCode);
      }
    }
  }, [shippingConfigQuery.data]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

  const fetchCarrierServices = useCallback(async (carrierId: string) => {
    setServicesLoading(true);
    try {
      const data = await getCarrierServices(carrierId);
      setCarrierServices(data.services || []);
      if (data.services?.length > 0) {
        setSelectedService(data.services[0].code);
      }
    } catch (err) {
      console.error("Failed to load carrier services:", err);
      setCarrierServices([]);
    } finally {
      setServicesLoading(false);
    }
  }, []);

  const fetchRates = useCallback(async () => {
    setRatesLoading(true);
    setRatesError(null);
    try {
      const data = await getShippingRates(orderId, {
        packageWeight: packageDimensions.weight ? parseFloat(packageDimensions.weight) : undefined,
        packageLength: packageDimensions.length ? parseFloat(packageDimensions.length) : undefined,
        packageWidth: packageDimensions.width ? parseFloat(packageDimensions.width) : undefined,
        packageHeight: packageDimensions.height ? parseFloat(packageDimensions.height) : undefined,
      });
      setRates(data.rates || []);
    } catch (err) {
      console.error("Failed to load rates:", err);
      setRatesError("Failed to fetch rates. Check ShipEngine configuration.");
      toast.error("Failed to fetch shipping rates");
    } finally {
      setRatesLoading(false);
    }
  }, [orderId, packageDimensions]);

  const handleShip = async () => {
    if (!order) return;
    setActionLoading(true);
    try {
      const result = await shipOrder(order.id, {
        trackingNumber: useShipEngine ? undefined : (trackingNumber || undefined),
        carrier: useShipEngine ? undefined : (carrier || undefined),
        useShipEngine,
        carrierId: useShipEngine ? selectedCarrier : undefined,
        serviceCode: useShipEngine ? selectedService : undefined,
        packageWeight: useShipEngine && packageDimensions.weight
          ? parseFloat(packageDimensions.weight) : undefined,
        packageLength: useShipEngine && packageDimensions.length
          ? parseFloat(packageDimensions.length) : undefined,
        packageWidth: useShipEngine && packageDimensions.width
          ? parseFloat(packageDimensions.width) : undefined,
        packageHeight: useShipEngine && packageDimensions.height
          ? parseFloat(packageDimensions.height) : undefined,
      });

      await queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] });

      if (result.labelUrls && result.labelUrls.length > 0) {
        setLabelUrl(result.labelUrls[0]);
        setLabelDialogOpen(true);
        toast.success("Order shipped! Label ready for printing.");
      } else {
        toast.success("Order marked as shipped");
        router.push(`/orders/${orderId}`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to ship order");
    } finally {
      setActionLoading(false);
    }
  };

  const applyPreset = (preset: typeof PACKAGE_PRESETS[number]) => {
    setPackageDimensions({
      weight: preset.weight,
      length: preset.length,
      width: preset.width,
      height: preset.height,
    });
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-6 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !order) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load order</h2>
        <p className="text-muted-foreground">{error || "Order not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/orders")}>
            Back to Orders
          </Button>
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["order-detail", orderId] })}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const canShip = (order.fulfillmentStatus === "FULFILLED" || order.fulfillmentStatus === "NOT_FULFILLED") && order.status !== "CANCELED";

  if (!canShip) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <Package className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-semibold">Cannot ship this order</h2>
        <p className="text-muted-foreground">
          This order is not in a state that allows shipping. Current status: {order.fulfillmentStatus}
        </p>
        <Button variant="outline" asChild>
          <Link href={`/orders/${orderId}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/orders">Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href={`/orders/${orderId}`}>#{order.displayId}</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Ship</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary Header */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <h1 className="text-2xl font-semibold">Ship Order #{order.displayId}</h1>
                  </div>
                  <p className="text-sm text-muted-foreground ml-8">
                    {formatDateTime(order.createdAt)} &middot; {order.email}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={order.status} type="order" dot />
                  <FulfillmentStatusBadge status={order.fulfillmentStatus} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Method Section */}
          <Collapsible open={methodOpen} onOpenChange={setMethodOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-muted-foreground" />
                      <CardTitle className="text-base">Shipping Method</CardTitle>
                    </div>
                    {methodOpen ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <CardDescription>
                    {shippingConfig?.shipEngineConfigured
                      ? "Generate a label automatically or enter tracking manually"
                      : "Enter tracking information for this shipment"}
                  </CardDescription>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="space-y-5 pt-0">
                  {/* ShipEngine Toggle */}
                  {shippingConfig?.shipEngineConfigured && (
                    <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">Auto-generate Label</p>
                          <p className="text-xs text-muted-foreground">
                            Use ShipEngine to create shipping labels
                          </p>
                        </div>
                        {shippingConfig.sandboxMode && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/20">
                            Sandbox
                          </Badge>
                        )}
                      </div>
                      <Switch
                        checked={useShipEngine}
                        onCheckedChange={setUseShipEngine}
                      />
                    </div>
                  )}

                  {useShipEngine ? (
                    <>
                      {/* Carrier & Service Selection */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Carrier</label>
                          <Select
                            value={selectedCarrier}
                            onValueChange={(val) => {
                              setSelectedCarrier(val);
                              setRates([]);
                              fetchCarrierServices(val);
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select carrier" />
                            </SelectTrigger>
                            <SelectContent>
                              {(shippingConfig?.availableCarriers || []).map((c) => (
                                <SelectItem key={c.code} value={c.code}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Service</label>
                          <Select value={selectedService} onValueChange={setSelectedService}>
                            <SelectTrigger>
                              <SelectValue placeholder={servicesLoading ? "Loading..." : "Select service"} />
                            </SelectTrigger>
                            <SelectContent>
                              {carrierServices.length > 0 ? (
                                carrierServices.map((s) => (
                                  <SelectItem key={s.code} value={s.code}>
                                    {s.name}
                                  </SelectItem>
                                ))
                              ) : (
                                <SelectItem value={selectedService || "_placeholder"} disabled>
                                  {servicesLoading ? "Loading services..." : "Select a carrier first"}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual Tracking Entry */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Shipping Method</label>
                        <Select value={carrier} onValueChange={setCarrier}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select shipping method" />
                          </SelectTrigger>
                          <SelectContent>
                            {shippingOptions.length > 0 ? (
                              shippingOptions.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  {option.name} ({formatPrice(option.amount / 100, order.currencyCode || "GBP")})
                                </SelectItem>
                              ))
                            ) : (
                              <>
                                <SelectItem value="royal_mail">Royal Mail</SelectItem>
                                <SelectItem value="dhl">DHL</SelectItem>
                                <SelectItem value="ups">UPS</SelectItem>
                                <SelectItem value="fedex">FedEx</SelectItem>
                                <SelectItem value="dpd">DPD</SelectItem>
                                <SelectItem value="evri">Evri (Hermes)</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                              </>
                            )}
                          </SelectContent>
                        </Select>
                        {order.shippingMethodId && (
                          <p className="text-xs text-muted-foreground">
                            Customer selected: {shippingOptions.find(o => o.id === order.shippingMethodId)?.name || order.shippingMethodId}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Tracking Number</label>
                        <Input
                          placeholder="Enter tracking number"
                          value={trackingNumber}
                          onChange={(e) => setTrackingNumber(e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Package Details Section */}
          {useShipEngine && (
            <Collapsible open={packageOpen} onOpenChange={setPackageOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BoxIcon className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Package Details</CardTitle>
                      </div>
                      {packageOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      Dimensions and weight for accurate shipping rates
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    {/* Preset Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {PACKAGE_PRESETS.map((preset) => (
                        <Button
                          key={preset.label}
                          variant="outline"
                          size="sm"
                          onClick={() => applyPreset(preset)}
                          className="text-xs"
                        >
                          <BoxIcon className="h-3 w-3 mr-1.5" />
                          {preset.label}
                        </Button>
                      ))}
                    </div>

                    {/* Dimensions Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Scale className="h-3 w-3" />
                          Weight (kg)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="0.5"
                          value={packageDimensions.weight}
                          onChange={(e) => setPackageDimensions(prev => ({
                            ...prev, weight: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          Length (cm)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="20"
                          value={packageDimensions.length}
                          onChange={(e) => setPackageDimensions(prev => ({
                            ...prev, length: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          Width (cm)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="15"
                          value={packageDimensions.width}
                          onChange={(e) => setPackageDimensions(prev => ({
                            ...prev, width: e.target.value
                          }))}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                          <Ruler className="h-3 w-3" />
                          Height (cm)
                        </label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="5"
                          value={packageDimensions.height}
                          onChange={(e) => setPackageDimensions(prev => ({
                            ...prev, height: e.target.value
                          }))}
                        />
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Rate Comparison Section */}
          {useShipEngine && (
            <Collapsible open={ratesOpen} onOpenChange={setRatesOpen}>
              <Card>
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                        <CardTitle className="text-base">Rate Comparison</CardTitle>
                        {rates.length > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {rates.length} rate{rates.length !== 1 ? "s" : ""}
                          </Badge>
                        )}
                      </div>
                      {ratesOpen ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <CardDescription>
                      Compare shipping rates across carriers
                    </CardDescription>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-4 pt-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        {rates.length > 0
                          ? "Select a rate to auto-fill carrier and service"
                          : "Fetch rates to compare prices across carriers"}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={fetchRates}
                        disabled={ratesLoading}
                      >
                        {ratesLoading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        ) : (
                          <DollarSign className="h-3.5 w-3.5 mr-1.5" />
                        )}
                        {ratesLoading ? "Fetching..." : "Compare Rates"}
                      </Button>
                    </div>

                    {/* Rate Loading Skeleton */}
                    {ratesLoading && rates.length === 0 && (
                      <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="p-4 rounded-lg border">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <Skeleton className="h-4 w-4 rounded-full" />
                                <Skeleton className="h-4 w-32" />
                              </div>
                              <Skeleton className="h-4 w-16" />
                            </div>
                            <Skeleton className="h-3 w-24 mt-2 ml-7" />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Rate Cards */}
                    {rates.length > 0 && (
                      <div className="space-y-2">
                        {rates
                          .sort((a, b) => a.shippingAmount.amount - b.shippingAmount.amount)
                          .map((rate, idx) => {
                            const isSelected = selectedCarrier === rate.carrierId && selectedService === rate.serviceCode;
                            const isCheapest = idx === 0;
                            const deliveryDate = rate.estimatedDeliveryDate
                              ? new Date(rate.estimatedDeliveryDate).toLocaleDateString("en-GB", {
                                  weekday: "short",
                                  month: "short",
                                  day: "numeric",
                                })
                              : null;

                            return (
                              <button
                                key={rate.rateId}
                                className={`w-full text-left p-4 rounded-lg border transition-all ${
                                  isSelected
                                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                                    : "border-border hover:border-muted-foreground/30 hover:bg-muted/30"
                                }`}
                                onClick={() => {
                                  setSelectedCarrier(rate.carrierId);
                                  setSelectedService(rate.serviceCode);
                                }}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className={`h-4 w-4 rounded-full border-2 transition-colors ${
                                        isSelected
                                          ? "border-primary bg-primary"
                                          : "border-muted-foreground/40"
                                      }`}
                                    />
                                    <div>
                                      <span className="font-medium text-sm capitalize">
                                        {rate.carrierCode?.replace(/_/g, " ")}
                                      </span>
                                      <span className="text-muted-foreground text-sm ml-2">
                                        {rate.serviceType || rate.serviceCode?.replace(/_/g, " ")}
                                      </span>
                                    </div>
                                    {isCheapest && (
                                      <Badge
                                        variant="outline"
                                        className="text-[10px] font-semibold uppercase tracking-wider text-emerald-600 border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30 dark:border-emerald-800"
                                      >
                                        Best price
                                      </Badge>
                                    )}
                                  </div>
                                  <span className="font-semibold text-sm">
                                    {new Intl.NumberFormat("en-GB", {
                                      style: "currency",
                                      currency: rate.shippingAmount.currency || "GBP",
                                    }).format(rate.shippingAmount.amount)}
                                  </span>
                                </div>
                                {(rate.deliveryDays || deliveryDate) && (
                                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5 ml-7">
                                    <Clock className="h-3 w-3" />
                                    {deliveryDate
                                      ? `Arrives by ${deliveryDate}`
                                      : `${rate.deliveryDays} business day${rate.deliveryDays! > 1 ? "s" : ""}`}
                                  </div>
                                )}
                              </button>
                            );
                          })}
                      </div>
                    )}

                    {ratesError && (
                      <div className="flex items-center gap-2 p-3 bg-destructive/10 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-destructive" />
                        <p className="text-sm text-destructive">{ratesError}</p>
                      </div>
                    )}

                    {rates.length === 0 && !ratesLoading && !ratesError && (
                      <div className="text-center py-6 text-muted-foreground">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        <p className="text-sm">
                          Click &quot;Compare Rates&quot; to see shipping prices across carriers.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          )}

          {/* Items Being Shipped */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Items Being Shipped</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? "s" : ""}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {order.items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                    <div className="h-12 w-12 bg-muted rounded-md flex items-center justify-center overflow-hidden flex-shrink-0">
                      {item.thumbnail ? (
                        <img src={item.thumbnail} alt={item.title} className="h-full w-full object-cover" />
                      ) : (
                        <Package className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.variantId}</p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.quantity}x
                    </div>
                    <p className="font-medium text-sm w-20 text-right">
                      {formatPrice(item.total, order.currencyCode)}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Sidebar */}
        <div className="space-y-6">
          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Shipping Address</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              {order.shippingAddress ? (
                <div className="text-sm space-y-1">
                  {(order.shippingAddress.firstName || order.shippingAddress.lastName) && (
                    <p className="font-medium">
                      {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                    </p>
                  )}
                  {order.shippingAddress.address1 && (
                    <p className="text-muted-foreground">{order.shippingAddress.address1}</p>
                  )}
                  {order.shippingAddress.address2 && (
                    <p className="text-muted-foreground">{order.shippingAddress.address2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {order.shippingAddress.city}
                    {order.shippingAddress.postalCode && `, ${order.shippingAddress.postalCode}`}
                  </p>
                  {order.shippingAddress.countryCode && (
                    <p className="text-muted-foreground uppercase">{order.shippingAddress.countryCode}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shipping address provided</p>
              )}
            </CardContent>
          </Card>

          {/* Cost Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base">Cost Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatPrice(order.subtotal, order.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Shipping</span>
                <span>{formatPrice(order.shipping, order.currencyCode)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatPrice(order.tax, order.currencyCode)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount, order.currencyCode)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>{formatPrice(order.total, order.currencyCode)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons - Sticky */}
          <div className="lg:sticky lg:top-6">
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleShip}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : useShipEngine ? (
                    <Printer className="h-4 w-4 mr-2" />
                  ) : (
                    <Truck className="h-4 w-4 mr-2" />
                  )}
                  {useShipEngine ? "Generate Label & Ship" : "Mark as Shipped"}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  size="lg"
                  asChild
                >
                  <Link href={`/orders/${orderId}`}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Order
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Label Print Dialog */}
      <Dialog open={labelDialogOpen} onOpenChange={setLabelDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Shipping Label Ready</DialogTitle>
            <DialogDescription>
              Your shipping label has been generated. Click below to download or print.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="p-4 bg-green-100 dark:bg-green-950/30 rounded-full">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              The tracking number has been added to the order automatically.
            </p>
            {labelUrl && (
              <Button asChild>
                <a href={labelUrl} target="_blank" rel="noopener noreferrer">
                  <Printer className="h-4 w-4 mr-2" />
                  Download/Print Label
                </a>
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setLabelDialogOpen(false);
                router.push(`/orders/${orderId}`);
              }}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
