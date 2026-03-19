"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  CheckCircle,
  UsersRound,
} from "lucide-react";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { toast } from "sonner";
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
  importCustomersCsv,
} from "@/lib/api";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { CsvExportButton } from "@/components/csv-export-button";
import { SendEmailDialog } from "@/components/customers/SendEmailDialog";
import { SendGiftCardDialog } from "@/components/customers/SendGiftCardDialog";
import { SuspendCustomerDialog } from "@/components/customers/SuspendCustomerDialog";
import { ChangeTierDialog } from "@/components/customers/ChangeTierDialog";
import { usePageContext } from "@/hooks/use-page-context";

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
  usePageContext("customers");
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [stats, setStats] = useState<CustomerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const [selectedCustomers, setSelectedCustomers] = useState<Set<string>>(new Set());

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

  const handleBulkSendEmail = async () => {
    toast.success(`Sent email to ${selectedCustomers.size} customers`);
    setSelectedCustomers(new Set());
  };

  const handleBulkAddToSegment = async () => {
    toast.success(`Added ${selectedCustomers.size} customers to segment`);
    setSelectedCustomers(new Set());
  };

  const handleBulkExport = async () => {
    toast.success(`Exported ${selectedCustomers.size} customers`);
    setSelectedCustomers(new Set());
  };

  const handleActionSuccess = () => {
    fetchCustomers();
    fetchStats();
    setSelectedCustomer(null);
  };

  const columns: Column<CustomerSummary>[] = useMemo(
    () => [
      {
        id: "customer",
        header: "Customer",
        cell: (customer) => (
          <Link href={`/customers/${customer.id}`} className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
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
        ),
      },
      {
        id: "tier",
        header: "Tier",
        cell: (customer) => getTierBadge(customer.tier),
      },
      {
        id: "orders",
        header: "Orders",
        cell: (customer) => <>{customer.orderCount}</>,
        className: "text-center",
        hideOnMobile: true,
      },
      {
        id: "totalSpent",
        header: "Total Spent",
        cell: (customer) => (
          <span className="font-medium">{formatPrice(customer.totalSpent, "GBP")}</span>
        ),
        className: "text-right",
        hideOnMobile: true,
      },
      {
        id: "joined",
        header: "Joined",
        cell: (customer) => (
          <span className="text-muted-foreground">{formatDate(customer.createdAt)}</span>
        ),
        hideOnTablet: true,
      },
      {
        id: "status",
        header: "Status",
        cell: (customer) => getStatusBadge(customer.status),
      },
      {
        id: "actions",
        header: "",
        className: "w-[50px]",
        cell: (customer) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
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
                    toast.info("Customer activation coming soon");
                  }}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Activate Account
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

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
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <CsvExportButton type="customers" />
          <CsvImportDialog type="customers" onImport={importCustomersCsv} onComplete={() => window.location.reload()} />
          <Button className="gap-2" onClick={() => toast.info("Add customer coming soon")}>
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
              <SelectTrigger className="w-full sm:w-[140px]">
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
              <SelectTrigger className="w-full sm:w-[140px]">
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
          <DataTable
            columns={columns}
            data={customers}
            loading={loading}
            selectable
            selectedIds={selectedCustomers}
            onSelectionChange={setSelectedCustomers}
            getRowId={(c) => c.id}
            onRowClick={(c) => router.push(`/customers/${c.id}`)}
            pagination={{
              page: currentPage,
              pageSize: 20,
              total: total,
              onPageChange: setCurrentPage,
            }}
            emptyIcon={<Users className="h-10 w-10 opacity-40" />}
            emptyTitle="No customers found"
            emptyDescription="Customers will appear here when they register or place orders"
          />
        </CardContent>
      </Card>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCustomers.size}
        onClearSelection={() => setSelectedCustomers(new Set())}
        actions={[
          { label: "Send Email", icon: <Mail className="h-4 w-4" />, onClick: handleBulkSendEmail },
          { label: "Add to Segment", icon: <UsersRound className="h-4 w-4" />, onClick: handleBulkAddToSegment, variant: "outline" },
          { label: "Export", icon: <Download className="h-4 w-4" />, onClick: handleBulkExport, variant: "outline" },
        ]}
      />

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
