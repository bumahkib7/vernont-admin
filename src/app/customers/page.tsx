"use client";

import { useEffect, useState, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  UserPlus,
  Download,
  Users,
  Crown,
  Star,
  TrendingUp,
  Gift,
  Edit,
  CheckCircle,
  Loader2,
} from "lucide-react";
import {
  getCustomers,
  getCustomerStats,
  getTierDisplay,
  getCustomerStatusDisplay,
  getCustomerName,
  getCustomerInitials,
  formatPrice,
  formatDate,
  type CustomerSummary,
  type CustomerTier,
  type CustomerStatus,
  type CustomerStats,
} from "@/lib/api";
import { SendEmailDialog } from "@/components/customers/SendEmailDialog";
import { SendGiftCardDialog } from "@/components/customers/SendGiftCardDialog";
import { SuspendCustomerDialog } from "@/components/customers/SuspendCustomerDialog";
import { ChangeTierDialog } from "@/components/customers/ChangeTierDialog";

function getTierBadge(tier: CustomerTier) {
  const display = getTierDisplay(tier);
  if (tier === "PLATINUM") {
    return (
      <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
        <Crown className="mr-1 h-3 w-3" /> {display.label}
      </Badge>
    );
  }
  return <Badge className={display.color}>{display.label}</Badge>;
}

function getStatusBadge(status: CustomerStatus) {
  const display = getCustomerStatusDisplay(status);
  return <Badge className={display.color}>{display.label}</Badge>;
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);

  // Dialog state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [giftCardDialogOpen, setGiftCardDialogOpen] = useState(false);
  const [suspendDialogOpen, setSuspendDialogOpen] = useState(false);
  const [changeTierDialogOpen, setChangeTierDialogOpen] = useState(false);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const params: {
        limit?: number;
        q?: string;
        tier?: CustomerTier;
        status?: CustomerStatus;
      } = { limit: 50 };

      if (search) params.q = search;
      if (tierFilter !== "all") params.tier = tierFilter as CustomerTier;
      if (statusFilter !== "all") params.status = statusFilter as CustomerStatus;

      const response = await getCustomers(params);
      setCustomers(response.customers);
      setTotal(response.count);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load customers");
    } finally {
      setLoading(false);
    }
  }, [search, tierFilter, statusFilter]);

  const fetchStats = useCallback(async () => {
    try {
      const statsData = await getCustomerStats();
      setStats(statsData);
    } catch (err) {
      console.error("Failed to load stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
    fetchStats();
  }, [fetchCustomers, fetchStats]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCustomers();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchCustomers]);

  const handleActionSuccess = () => {
    fetchCustomers();
    fetchStats();
    setSelectedCustomer(null);
  };

  const customerStats = [
    {
      label: "Total Customers",
      value: stats?.totalCustomers?.toLocaleString() ?? "...",
      icon: Users,
    },
    {
      label: "VIP Members",
      value: stats ? (stats.customersByTier?.GOLD ?? 0) + (stats.customersByTier?.PLATINUM ?? 0) : "...",
      icon: Crown,
    },
    {
      label: "Active",
      value: stats?.activeCustomers?.toLocaleString() ?? "...",
      icon: CheckCircle,
    },
    {
      label: "Total Revenue",
      value: stats ? formatPrice(stats.totalRevenue, "GBP") : "...",
      icon: TrendingUp,
    },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {customerStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-muted p-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="PLATINUM">Platinum</SelectItem>
                <SelectItem value="GOLD">Gold</SelectItem>
                <SelectItem value="SILVER">Silver</SelectItem>
                <SelectItem value="BRONZE">Bronze</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="BANNED">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4 text-center text-red-600">
            {error}
            <Button variant="link" onClick={fetchCustomers} className="ml-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {total} customers in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead className="text-center">Orders</TableHead>
                  <TableHead className="text-right">Total Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => (
                  <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                    <TableCell>
                      <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-muted">
                            {getCustomerInitials(customer)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium hover:underline">
                            {getCustomerName(customer)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {customer.email}
                          </span>
                        </div>
                      </Link>
                    </TableCell>
                    <TableCell>{getTierBadge(customer.tier)}</TableCell>
                    <TableCell className="text-center">{customer.orderCount}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatPrice(customer.totalSpent, "GBP")}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(customer.createdAt)}
                    </TableCell>
                    <TableCell>{getStatusBadge(customer.status)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem asChild>
                            <Link href={`/customers/${customer.id}`}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setEmailDialogOpen(true);
                            }}
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setGiftCardDialogOpen(true);
                            }}
                          >
                            <Gift className="mr-2 h-4 w-4" />
                            Send Gift Card
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCustomer(customer);
                              setChangeTierDialogOpen(true);
                            }}
                          >
                            <Star className="mr-2 h-4 w-4" />
                            Change Tier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {customer.status === "ACTIVE" ? (
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => {
                                setSelectedCustomer(customer);
                                setSuspendDialogOpen(true);
                              }}
                            >
                              <Ban className="mr-2 h-4 w-4" />
                              Suspend Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              className="text-green-600"
                              onClick={() => {
                                // TODO: Activate customer
                              }}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Activate Account
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      {selectedCustomer && (
        <>
          <SendEmailDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <SendGiftCardDialog
            open={giftCardDialogOpen}
            onOpenChange={setGiftCardDialogOpen}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <SuspendCustomerDialog
            open={suspendDialogOpen}
            onOpenChange={setSuspendDialogOpen}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <ChangeTierDialog
            open={changeTierDialogOpen}
            onOpenChange={setChangeTierDialogOpen}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
        </>
      )}
    </div>
  );
}
