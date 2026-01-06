"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  Crown,
  Edit,
  Trash2,
  Plus,
  ExternalLink,
  ShoppingBag,
  Heart,
  Clock,
  Star,
  TrendingUp,
  Ban,
  CheckCircle,
  Gift,
  Loader2,
  Key,
  Users,
  LogIn,
  UserPlus,
  FileText,
  Lock,
} from "lucide-react";
import {
  getCustomer,
  getCustomerOrders,
  getCustomerActivity,
  updateCustomer,
  activateCustomer,
  getTierDisplay,
  getCustomerStatusDisplay,
  getCustomerName,
  getCustomerInitials,
  getActivityTypeDisplay,
  formatPrice,
  formatDate,
  type Customer,
  type CustomerActivity,
  type OrderSummary,
  type CustomerActivityType,
  type FulfillmentStatus,
  type PaymentStatus,
} from "@/lib/api";
import { SendEmailDialog } from "@/components/customers/SendEmailDialog";
import { SendGiftCardDialog } from "@/components/customers/SendGiftCardDialog";
import { SuspendCustomerDialog } from "@/components/customers/SuspendCustomerDialog";
import { ChangeTierDialog } from "@/components/customers/ChangeTierDialog";

function getTierBadge(tier: string) {
  const display = getTierDisplay(tier as "BRONZE" | "SILVER" | "GOLD" | "PLATINUM");
  if (tier === "PLATINUM") {
    return (
      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
        <Crown className="mr-1 h-3 w-3" /> {display.label}
      </Badge>
    );
  }
  return <Badge className={display.color}>{display.label}</Badge>;
}

function getStatusBadge(status: string) {
  const display = getCustomerStatusDisplay(status as "ACTIVE" | "SUSPENDED" | "BANNED");
  return <Badge className={display.color}>{display.label}</Badge>;
}

function getFulfillmentStatusBadge(status: FulfillmentStatus) {
  const styles: Record<string, string> = {
    NOT_FULFILLED: "bg-gray-100 text-gray-800",
    PARTIALLY_FULFILLED: "bg-yellow-100 text-yellow-800",
    FULFILLED: "bg-blue-100 text-blue-800",
    PARTIALLY_SHIPPED: "bg-purple-100 text-purple-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    PARTIALLY_RETURNED: "bg-orange-100 text-orange-800",
    RETURNED: "bg-orange-100 text-orange-800",
    CANCELED: "bg-red-100 text-red-800",
    REQUIRES_ACTION: "bg-yellow-100 text-yellow-800",
  };
  const labels: Record<string, string> = {
    NOT_FULFILLED: "Not Fulfilled",
    PARTIALLY_FULFILLED: "Partial",
    FULFILLED: "Fulfilled",
    PARTIALLY_SHIPPED: "Partial Ship",
    SHIPPED: "Shipped",
    PARTIALLY_RETURNED: "Partial Return",
    RETURNED: "Returned",
    CANCELED: "Canceled",
    REQUIRES_ACTION: "Action Required",
  };
  return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{labels[status] || status}</Badge>;
}

function getPaymentStatusBadge(status: PaymentStatus) {
  const styles: Record<string, string> = {
    NOT_PAID: "bg-gray-100 text-gray-800",
    AWAITING: "bg-yellow-100 text-yellow-800",
    CAPTURED: "bg-green-100 text-green-800",
    PAID: "bg-green-100 text-green-800",
    PARTIALLY_REFUNDED: "bg-orange-100 text-orange-800",
    REFUNDED: "bg-orange-100 text-orange-800",
    CANCELED: "bg-red-100 text-red-800",
    REQUIRES_ACTION: "bg-yellow-100 text-yellow-800",
    PARTIALLY_PAID: "bg-blue-100 text-blue-800",
  };
  const labels: Record<string, string> = {
    NOT_PAID: "Not Paid",
    AWAITING: "Awaiting",
    CAPTURED: "Paid",
    PAID: "Paid",
    PARTIALLY_REFUNDED: "Partial Refund",
    REFUNDED: "Refunded",
    CANCELED: "Canceled",
    REQUIRES_ACTION: "Action Required",
    PARTIALLY_PAID: "Partial",
  };
  return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{labels[status] || status}</Badge>;
}

function getActivityIcon(type: CustomerActivityType) {
  const iconMap: Partial<Record<CustomerActivityType, React.ReactNode>> = {
    ORDER_PLACED: <ShoppingBag className="h-4 w-4" />,
    ORDER_COMPLETED: <CheckCircle className="h-4 w-4" />,
    ORDER_CANCELED: <Ban className="h-4 w-4" />,
    PASSWORD_RESET_REQUESTED: <Key className="h-4 w-4" />,
    PASSWORD_CHANGED: <Lock className="h-4 w-4" />,
    ACCOUNT_CREATED: <UserPlus className="h-4 w-4" />,
    TIER_CHANGED: <Star className="h-4 w-4" />,
    ACCOUNT_SUSPENDED: <Ban className="h-4 w-4" />,
    ACCOUNT_ACTIVATED: <CheckCircle className="h-4 w-4" />,
    ACCOUNT_BANNED: <Ban className="h-4 w-4" />,
    EMAIL_SENT: <Mail className="h-4 w-4" />,
    GIFT_CARD_SENT: <Gift className="h-4 w-4" />,
    PROFILE_UPDATED: <Edit className="h-4 w-4" />,
    ADDRESS_ADDED: <MapPin className="h-4 w-4" />,
    ADDRESS_UPDATED: <MapPin className="h-4 w-4" />,
    ADDRESS_DELETED: <Trash2 className="h-4 w-4" />,
    GROUP_ADDED: <Users className="h-4 w-4" />,
    GROUP_REMOVED: <Users className="h-4 w-4" />,
    WISHLIST_ITEM_ADDED: <Heart className="h-4 w-4" />,
    WISHLIST_ITEM_REMOVED: <Heart className="h-4 w-4" />,
    NOTE_ADDED: <FileText className="h-4 w-4" />,
    LOGIN: <LogIn className="h-4 w-4" />,
    LOGOUT: <LogIn className="h-4 w-4" />,
  };
  return iconMap[type] || <Clock className="h-4 w-4" />;
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-GB", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function CustomerDetailPage() {
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [activities, setActivities] = useState<CustomerActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  // Dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [giftCardDialogOpen, setGiftCardDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [changeTierDialogOpen, setChangeTierDialogOpen] = useState(false);

  const fetchCustomer = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getCustomer(customerId);
      setCustomer(response.customer);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customer");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  const fetchOrders = useCallback(async () => {
    try {
      const response = await getCustomerOrders(customerId, { limit: 20 });
      setOrders(response.orders);
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }, [customerId]);

  const fetchActivity = useCallback(async () => {
    try {
      const response = await getCustomerActivity(customerId, { limit: 20 });
      setActivities(response.activities);
    } catch (err) {
      console.error("Failed to load activity:", err);
    }
  }, [customerId]);

  useEffect(() => {
    fetchCustomer();
    fetchOrders();
    fetchActivity();
  }, [fetchCustomer, fetchOrders, fetchActivity]);

  const handleActionSuccess = () => {
    fetchCustomer();
    fetchActivity();
  };

  const handleActivate = async () => {
    if (!customer) return;
    try {
      await activateCustomer(customer.id);
      fetchCustomer();
      fetchActivity();
    } catch (err) {
      console.error("Failed to activate customer:", err);
    }
  };

  const handleSaveNote = async () => {
    if (!customer || !newNote.trim()) return;
    try {
      setSavingNote(true);
      const existingNotes = customer.internalNotes || "";
      const timestamp = new Date().toLocaleString("en-GB");
      const updatedNotes = existingNotes
        ? `${existingNotes}\n\n[${timestamp}]\n${newNote.trim()}`
        : `[${timestamp}]\n${newNote.trim()}`;

      await updateCustomer(customer.id, { internalNotes: updatedNotes });
      setNewNote("");
      fetchCustomer();
      fetchActivity();
    } catch (err) {
      console.error("Failed to save note:", err);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">{error || "Customer not found"}</p>
        <Button variant="outline" asChild>
          <Link href="/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
    );
  }

  const customerSummary = {
    id: customer.id,
    email: customer.email,
    firstName: customer.firstName,
    lastName: customer.lastName,
    tier: customer.tier,
    totalSpent: customer.totalSpent,
    orderCount: customer.orderCount,
    status: customer.status,
    hasAccount: customer.hasAccount,
    createdAt: customer.createdAt,
  };

  // Safe defaults for potentially missing data
  const totalSpent = customer.totalSpent ?? 0;
  const orderCount = customer.orderCount ?? 0;
  const avgOrderValue = orderCount > 0 ? totalSpent / orderCount : 0;

  const addresses = customer.addresses || [];
  const groups = customer.groups || [];
  const defaultShippingAddress = addresses.find(a => a.isDefault);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/customers">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-muted text-lg">
              {getCustomerInitials(customer)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {getCustomerName(customer)}
              </h1>
              {getTierBadge(customer.tier)}
              {getStatusBadge(customer.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Customer since {customer.createdAt ? formatDate(customer.createdAt) : "N/A"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEmailDialogOpen(true)}>
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm" onClick={() => setGiftCardDialogOpen(true)}>
            <Gift className="mr-2 h-4 w-4" />
            Send Gift Card
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setChangeTierDialogOpen(true)}>
                <Star className="mr-2 h-4 w-4" />
                Change Tier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {customer.status === "ACTIVE" ? (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => setSuspendDialogOpen(true)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Account
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={handleActivate}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Account
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Package className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <p className="text-2xl font-bold">{orderCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">{formatPrice(totalSpent, "GBP")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2">
              <ShoppingBag className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold">{formatPrice(avgOrderValue, "GBP")}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-2">
              <Star className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Tier</p>
              <p className="text-2xl font-bold">{getTierDisplay(customer.tier).label}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tabs */}
          <Tabs defaultValue="orders" className="space-y-4">
            <TabsList>
              <TabsTrigger value="orders">Orders ({orders.length})</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="addresses">Addresses ({addresses.length})</TabsTrigger>
              <TabsTrigger value="groups">Groups ({groups.length})</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    {orderCount} orders placed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {orders.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No orders yet</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Items</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                          <TableHead>Fulfillment</TableHead>
                          <TableHead>Payment</TableHead>
                          <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Link
                                href={`/orders/${order.id}`}
                                className="font-medium hover:underline"
                              >
                                #{order.displayId}
                              </Link>
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {formatDate(order.createdAt)}
                            </TableCell>
                            <TableCell>{order.itemCount} items</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPrice(order.total, order.currencyCode)}
                            </TableCell>
                            <TableCell>{getFulfillmentStatusBadge(order.fulfillmentStatus)}</TableCell>
                            <TableCell>{getPaymentStatusBadge(order.paymentStatus)}</TableCell>
                            <TableCell>
                              <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                <Link href={`/orders/${order.id}`}>
                                  <ExternalLink className="h-4 w-4" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Customer interactions and events</CardDescription>
                </CardHeader>
                <CardContent>
                  {activities.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No activity recorded</p>
                  ) : (
                    <div className="space-y-6">
                      {activities.map((event, index) => (
                        <div key={event.id} className="flex gap-4">
                          <div className="relative">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                              {getActivityIcon(event.activityType)}
                            </div>
                            {index < activities.length - 1 && (
                              <div className="absolute left-1/2 top-8 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-6">
                            <p className="text-sm font-medium">
                              {getActivityTypeDisplay(event.activityType).label}
                            </p>
                            <p className="text-sm text-muted-foreground">{event.description}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatDateTime(event.occurredAt)}
                              {event.performedBy && event.performedBy !== "system" && (
                                <span> by {event.performedBy}</span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Addresses</CardTitle>
                    <CardDescription>Saved shipping addresses</CardDescription>
                  </div>
                  <Button size="sm" disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Address
                  </Button>
                </CardHeader>
                <CardContent>
                  {addresses.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No addresses saved</p>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {addresses.map((address) => (
                        <div
                          key={address.id}
                          className="relative rounded-lg border p-4"
                        >
                          <div className="flex items-center gap-2 mb-3">
                            {address.isDefault && (
                              <Badge className="bg-green-100 text-green-800">Default</Badge>
                            )}
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="font-medium">
                              {address.firstName} {address.lastName}
                            </p>
                            {address.company && (
                              <p className="text-muted-foreground">{address.company}</p>
                            )}
                            <p className="text-muted-foreground">{address.address1}</p>
                            {address.address2 && (
                              <p className="text-muted-foreground">{address.address2}</p>
                            )}
                            <p className="text-muted-foreground">
                              {address.city}{address.province ? `, ${address.province}` : ""} {address.postalCode}
                            </p>
                            <p className="text-muted-foreground">{address.countryCode}</p>
                            {address.phone && (
                              <p className="text-muted-foreground pt-2">{address.phone}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Groups Tab */}
            <TabsContent value="groups">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Customer Groups</CardTitle>
                    <CardDescription>Groups this customer belongs to</CardDescription>
                  </div>
                  <Button size="sm" disabled>
                    <Plus className="mr-2 h-4 w-4" />
                    Add to Group
                  </Button>
                </CardHeader>
                <CardContent>
                  {groups.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Not in any groups</p>
                  ) : (
                    <div className="space-y-3">
                      {groups.map((group) => (
                        <div
                          key={group.id}
                          className="flex items-center justify-between rounded-lg border p-4"
                        >
                          <div>
                            <p className="font-medium">{group.name}</p>
                            {group.description && (
                              <p className="text-sm text-muted-foreground">{group.description}</p>
                            )}
                          </div>
                          <Badge variant="outline">{group.memberCount} members</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a
                    href={`mailto:${customer.email}`}
                    className="text-sm text-muted-foreground hover:underline"
                  >
                    {customer.email}
                  </a>
                </div>
              </div>
              {customer.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Phone</p>
                    <p className="text-sm text-muted-foreground">{customer.phone}</p>
                  </div>
                </div>
              )}
              {customer.lastLoginAt && (
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Login</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(customer.lastLoginAt)}
                    </p>
                  </div>
                </div>
              )}
              {customer.lastOrderAt && (
                <div className="flex items-center gap-3">
                  <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">Last Order</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(customer.lastOrderAt)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Default Address */}
          {defaultShippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Default Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm space-y-1">
                  <p className="font-medium">
                    {defaultShippingAddress.firstName} {defaultShippingAddress.lastName}
                  </p>
                  <p className="text-muted-foreground">{defaultShippingAddress.address1}</p>
                  {defaultShippingAddress.address2 && (
                    <p className="text-muted-foreground">{defaultShippingAddress.address2}</p>
                  )}
                  <p className="text-muted-foreground">
                    {defaultShippingAddress.city}{defaultShippingAddress.province ? `, ${defaultShippingAddress.province}` : ""} {defaultShippingAddress.postalCode}
                  </p>
                  <p className="text-muted-foreground">{defaultShippingAddress.countryCode}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Account Status */}
          {customer.status !== "ACTIVE" && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Account Suspended</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customer.suspendedAt && (
                  <p className="text-sm text-yellow-700">
                    Suspended on {formatDateTime(customer.suspendedAt)}
                  </p>
                )}
                {customer.suspendedReason && (
                  <p className="text-sm text-yellow-700">
                    Reason: {customer.suspendedReason}
                  </p>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2"
                  onClick={handleActivate}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Account
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.internalNotes && (
                <div className="rounded-lg bg-muted p-3 text-sm whitespace-pre-wrap max-h-[200px] overflow-y-auto">
                  {customer.internalNotes}
                </div>
              )}
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this customer..."
                  className="min-h-[80px]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!newNote.trim() || savingNote}
                  onClick={handleSaveNote}
                >
                  {savingNote ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Add Note"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Has Account</span>
                  <span>{customer.hasAccount ? "Yes" : "No (Guest)"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tier Override</span>
                  <span>{customer.tierOverride ? "Yes (Manual)" : "No (Auto)"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Groups</span>
                  <span>{groups.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Lifetime Value</span>
                  <span className="text-green-600">
                    {formatPrice(totalSpent, "GBP")}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Dialogs */}
      <SendEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        customer={customerSummary}
        onSuccess={handleActionSuccess}
      />
      <SendGiftCardDialog
        open={giftCardDialogOpen}
        onOpenChange={setGiftCardDialogOpen}
        customer={customerSummary}
        onSuccess={handleActionSuccess}
      />
      <SuspendCustomerDialog
        open={suspendDialogOpen}
        onOpenChange={setSuspendDialogOpen}
        customer={customerSummary}
        onSuccess={handleActionSuccess}
      />
      <ChangeTierDialog
        open={changeTierDialogOpen}
        onOpenChange={setChangeTierDialogOpen}
        customer={customerSummary}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
