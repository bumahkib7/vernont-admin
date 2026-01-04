"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  CreditCard,
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
} from "lucide-react";

// Mock customer data
const mockCustomer = {
  id: "CUS-001",
  firstName: "Olivia",
  lastName: "Martin",
  email: "olivia@example.com",
  phone: "+1 (555) 123-4567",
  avatar: "",
  tier: "vip",
  status: "active",
  createdAt: "2023-03-15",
  lastLogin: "2024-01-15T14:30:00Z",
  notes: "Prefers luxury handbags, especially Hermès and Chanel. Birthday discount sent annually.",
  stats: {
    totalOrders: 12,
    totalSpent: 45600,
    avgOrderValue: 3800,
    returnsCount: 1,
    wishlistItems: 8,
    reviewsCount: 5,
  },
  addresses: [
    {
      id: "addr-1",
      type: "shipping",
      isDefault: true,
      firstName: "Olivia",
      lastName: "Martin",
      address1: "123 Main Street",
      address2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      phone: "+1 (555) 123-4567",
    },
    {
      id: "addr-2",
      type: "billing",
      isDefault: true,
      firstName: "Olivia",
      lastName: "Martin",
      address1: "123 Main Street",
      address2: "Apt 4B",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
    },
  ],
  orders: [
    {
      id: "ORD-001",
      date: "2024-01-15",
      items: ["Hermès Birkin 25"],
      total: 12500,
      status: "processing",
      paymentStatus: "paid",
    },
    {
      id: "ORD-012",
      date: "2023-12-20",
      items: ["Chanel Classic Flap", "Chanel Wallet"],
      total: 9450,
      status: "completed",
      paymentStatus: "paid",
    },
    {
      id: "ORD-011",
      date: "2023-11-15",
      items: ["Louis Vuitton Neverfull"],
      total: 2100,
      status: "completed",
      paymentStatus: "paid",
    },
    {
      id: "ORD-010",
      date: "2023-10-28",
      items: ["Dior Lady Dior Medium"],
      total: 5800,
      status: "completed",
      paymentStatus: "paid",
    },
    {
      id: "ORD-009",
      date: "2023-09-10",
      items: ["Prada Re-Edition 2005"],
      total: 1950,
      status: "completed",
      paymentStatus: "paid",
    },
  ],
  activity: [
    {
      id: "act-1",
      type: "order",
      description: "Placed order #ORD-001",
      date: "2024-01-15T10:30:00Z",
    },
    {
      id: "act-2",
      type: "login",
      description: "Logged in from New York, NY",
      date: "2024-01-15T10:25:00Z",
    },
    {
      id: "act-3",
      type: "wishlist",
      description: "Added Gucci Dionysus to wishlist",
      date: "2024-01-14T16:45:00Z",
    },
    {
      id: "act-4",
      type: "review",
      description: "Left a 5-star review on Chanel Classic Flap",
      date: "2024-01-02T11:20:00Z",
    },
    {
      id: "act-5",
      type: "order",
      description: "Placed order #ORD-012",
      date: "2023-12-20T14:00:00Z",
    },
  ],
  paymentMethods: [
    {
      id: "pm-1",
      type: "card",
      brand: "Visa",
      last4: "4242",
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true,
    },
    {
      id: "pm-2",
      type: "card",
      brand: "Mastercard",
      last4: "8888",
      expiryMonth: 6,
      expiryYear: 2026,
      isDefault: false,
    },
  ],
};

function getTierBadge(tier: string) {
  switch (tier) {
    case "vip":
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <Crown className="mr-1 h-3 w-3" /> VIP
        </Badge>
      );
    case "gold":
      return <Badge className="bg-yellow-100 text-yellow-800">Gold</Badge>;
    case "silver":
      return <Badge className="bg-gray-100 text-gray-800">Silver</Badge>;
    default:
      return <Badge variant="outline">Standard</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
    case "suspended":
      return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getOrderStatusBadge(status: string) {
  const styles: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    shipped: "bg-purple-100 text-purple-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return <Badge className={styles[status] || "bg-gray-100 text-gray-800"}>{status}</Badge>;
}

function getActivityIcon(type: string) {
  switch (type) {
    case "order":
      return <ShoppingBag className="h-4 w-4" />;
    case "login":
      return <Clock className="h-4 w-4" />;
    case "wishlist":
      return <Heart className="h-4 w-4" />;
    case "review":
      return <Star className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName[0]}${lastName[0]}`.toUpperCase();
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
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
  const [customer] = useState(mockCustomer);
  const [newNote, setNewNote] = useState("");

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
            <AvatarImage src={customer.avatar} alt={`${customer.firstName} ${customer.lastName}`} />
            <AvatarFallback className="bg-muted text-lg">
              {getInitials(customer.firstName, customer.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {customer.firstName} {customer.lastName}
              </h1>
              {getTierBadge(customer.tier)}
              {getStatusBadge(customer.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              Customer since {formatDate(customer.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Mail className="mr-2 h-4 w-4" />
            Send Email
          </Button>
          <Button variant="outline" size="sm">
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
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Crown className="mr-2 h-4 w-4" />
                Change Tier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Ban className="mr-2 h-4 w-4" />
                Suspend Account
              </DropdownMenuItem>
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
              <p className="text-2xl font-bold">{customer.stats.totalOrders}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-2">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Spent</p>
              <p className="text-2xl font-bold">${customer.stats.totalSpent.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
              <p className="text-2xl font-bold">${customer.stats.avgOrderValue.toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-pink-100 p-2">
              <Heart className="h-5 w-5 text-pink-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Wishlist Items</p>
              <p className="text-2xl font-bold">{customer.stats.wishlistItems}</p>
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
              <TabsTrigger value="orders">Orders</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="addresses">Addresses</TabsTrigger>
              <TabsTrigger value="payments">Payment Methods</TabsTrigger>
            </TabsList>

            {/* Orders Tab */}
            <TabsContent value="orders">
              <Card>
                <CardHeader>
                  <CardTitle>Order History</CardTitle>
                  <CardDescription>
                    {customer.stats.totalOrders} orders placed
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Items</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {customer.orders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>
                            <Link
                              href={`/orders/${order.id}`}
                              className="font-medium hover:underline"
                            >
                              {order.id}
                            </Link>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(order.date)}
                          </TableCell>
                          <TableCell>
                            <div>
                              <span>{order.items[0]}</span>
                              {order.items.length > 1 && (
                                <span className="text-xs text-muted-foreground block">
                                  +{order.items.length - 1} more
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            ${order.total.toLocaleString()}
                          </TableCell>
                          <TableCell>{getOrderStatusBadge(order.status)}</TableCell>
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
                  <div className="space-y-6">
                    {customer.activity.map((event, index) => (
                      <div key={event.id} className="flex gap-4">
                        <div className="relative">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full border bg-background">
                            {getActivityIcon(event.type)}
                          </div>
                          {index < customer.activity.length - 1 && (
                            <div className="absolute left-1/2 top-8 h-[calc(100%+16px)] w-px -translate-x-1/2 bg-border" />
                          )}
                        </div>
                        <div className="flex-1 pb-6">
                          <p className="text-sm">{event.description}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(event.date)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Addresses Tab */}
            <TabsContent value="addresses">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Addresses</CardTitle>
                    <CardDescription>Saved shipping and billing addresses</CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Add Address
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Address</DialogTitle>
                        <DialogDescription>
                          Add a new shipping or billing address
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>First Name</Label>
                            <Input placeholder="First name" />
                          </div>
                          <div className="space-y-2">
                            <Label>Last Name</Label>
                            <Input placeholder="Last name" />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Address Line 1</Label>
                          <Input placeholder="Street address" />
                        </div>
                        <div className="space-y-2">
                          <Label>Address Line 2</Label>
                          <Input placeholder="Apt, suite, etc. (optional)" />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label>City</Label>
                            <Input placeholder="City" />
                          </div>
                          <div className="space-y-2">
                            <Label>State</Label>
                            <Input placeholder="State" />
                          </div>
                          <div className="space-y-2">
                            <Label>ZIP Code</Label>
                            <Input placeholder="ZIP" />
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline">Cancel</Button>
                        <Button>Save Address</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2">
                    {customer.addresses.map((address) => (
                      <div
                        key={address.id}
                        className="relative rounded-lg border p-4"
                      >
                        <div className="absolute right-2 top-2 flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-600">
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="capitalize">
                            {address.type}
                          </Badge>
                          {address.isDefault && (
                            <Badge className="bg-green-100 text-green-800">Default</Badge>
                          )}
                        </div>
                        <div className="text-sm space-y-1">
                          <p className="font-medium">
                            {address.firstName} {address.lastName}
                          </p>
                          <p className="text-muted-foreground">{address.address1}</p>
                          {address.address2 && (
                            <p className="text-muted-foreground">{address.address2}</p>
                          )}
                          <p className="text-muted-foreground">
                            {address.city}, {address.state} {address.postalCode}
                          </p>
                          <p className="text-muted-foreground">{address.country}</p>
                          {address.phone && (
                            <p className="text-muted-foreground pt-2">{address.phone}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Payment Methods Tab */}
            <TabsContent value="payments">
              <Card>
                <CardHeader>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>Saved payment methods for this customer</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {customer.paymentMethods.map((method) => (
                      <div
                        key={method.id}
                        className="flex items-center justify-between rounded-lg border p-4"
                      >
                        <div className="flex items-center gap-4">
                          <div className="rounded-md border p-2">
                            <CreditCard className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {method.brand} ending in {method.last4}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Expires {method.expiryMonth}/{method.expiryYear}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {method.isDefault && (
                            <Badge className="bg-green-100 text-green-800">Default</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
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
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Phone</p>
                  <p className="text-sm text-muted-foreground">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Last Login</p>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(customer.lastLogin)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Default Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Default Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              {customer.addresses.find((a) => a.isDefault && a.type === "shipping") && (
                <div className="text-sm space-y-1">
                  {(() => {
                    const addr = customer.addresses.find(
                      (a) => a.isDefault && a.type === "shipping"
                    )!;
                    return (
                      <>
                        <p className="font-medium">
                          {addr.firstName} {addr.lastName}
                        </p>
                        <p className="text-muted-foreground">{addr.address1}</p>
                        {addr.address2 && (
                          <p className="text-muted-foreground">{addr.address2}</p>
                        )}
                        <p className="text-muted-foreground">
                          {addr.city}, {addr.state} {addr.postalCode}
                        </p>
                        <p className="text-muted-foreground">{addr.country}</p>
                      </>
                    );
                  })()}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Internal Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {customer.notes && (
                <div className="rounded-lg bg-muted p-3 text-sm">
                  {customer.notes}
                </div>
              )}
              <div className="space-y-2">
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note about this customer..."
                  className="min-h-[80px]"
                />
                <Button variant="outline" size="sm" disabled={!newNote.trim()}>
                  Add Note
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
                  <span className="text-muted-foreground">Returns</span>
                  <span>{customer.stats.returnsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reviews</span>
                  <span>{customer.stats.reviewsCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Wishlist</span>
                  <span>{customer.stats.wishlistItems} items</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm font-medium">
                  <span>Lifetime Value</span>
                  <span className="text-green-600">
                    ${customer.stats.totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
