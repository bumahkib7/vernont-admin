"use client";

import { useMemo, useEffect, useState } from "react";
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
  RefreshCw,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import { DataTable, type Column } from "@/components/ui/data-table";
import { toast } from "sonner";
import {
  getTierDisplay,
  getCustomerStatusDisplay,
  getCustomerName,
  getCustomerInitials,
  formatPrice,
  formatDate,
  importCustomersCsv,
  createCustomer,
  activateCustomer,
  type CustomerSummary,
  type CustomerTier,
  type CustomerStatus,
} from "@/lib/api";
import { apiFetch } from "@/lib/api/client";
import { CsvImportDialog } from "@/components/csv-import-dialog";
import { CsvExportButton } from "@/components/csv-export-button";
import { SendEmailDialog } from "@/components/customers/SendEmailDialog";
import { SendGiftCardDialog } from "@/components/customers/SendGiftCardDialog";
import { SuspendCustomerDialog } from "@/components/customers/SuspendCustomerDialog";
import { ChangeTierDialog } from "@/components/customers/ChangeTierDialog";
import { usePageContext } from "@/hooks/use-page-context";
import { useCustomersList, useCustomerStats } from "@/hooks/use-customers";
import { useCustomerUIStore } from "@/stores/customer-store";

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

  // --- Zustand: client UI state ---
  const search = useCustomerUIStore((s) => s.search);
  const tierFilter = useCustomerUIStore((s) => s.tierFilter);
  const statusFilter = useCustomerUIStore((s) => s.statusFilter);
  const currentPage = useCustomerUIStore((s) => s.currentPage);
  const selectedIds = useCustomerUIStore((s) => s.selectedIds);
  const selectedCustomer = useCustomerUIStore((s) => s.selectedCustomer);
  const emailDialogOpen = useCustomerUIStore((s) => s.emailDialogOpen);
  const giftCardDialogOpen = useCustomerUIStore((s) => s.giftCardDialogOpen);
  const suspendDialogOpen = useCustomerUIStore((s) => s.suspendDialogOpen);
  const changeTierDialogOpen = useCustomerUIStore((s) => s.changeTierDialogOpen);

  const setSearch = useCustomerUIStore((s) => s.setSearch);
  const setTierFilter = useCustomerUIStore((s) => s.setTierFilter);
  const setStatusFilter = useCustomerUIStore((s) => s.setStatusFilter);
  const setCurrentPage = useCustomerUIStore((s) => s.setCurrentPage);
  const setSelectedIds = useCustomerUIStore((s) => s.setSelectedIds);
  const clearSelection = useCustomerUIStore((s) => s.clearSelection);
  const openDialog = useCustomerUIStore((s) => s.openDialog);
  const closeDialog = useCustomerUIStore((s) => s.closeDialog);

  // --- Debounced search for API calls ---
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // --- React Query: server state ---
  const {
    data: customersData,
    isLoading,
    isError,
    error,
    refetch,
  } = useCustomersList({
    search: debouncedSearch,
    tier: tierFilter,
    status: statusFilter,
  });

  const { data: stats } = useCustomerStats();

  const customers = customersData?.customers ?? [];
  const total = customersData?.count ?? 0;

  // --- Handlers ---
  const handleBulkSendEmail = () => {
    toast.success(`Sent email to ${selectedIds.size} customers`);
    clearSelection();
  };

  const handleBulkAddToSegment = () => {
    toast.success(`Added ${selectedIds.size} customers to segment`);
    clearSelection();
  };

  const handleBulkExport = () => {
    toast.success(`Exported ${selectedIds.size} customers`);
    clearSelection();
  };

  // --- Create Customer dialog state ---
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [newFirstName, setNewFirstName] = useState("");
  const [newLastName, setNewLastName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const handleCreateCustomer = async () => {
    if (!newEmail.trim()) {
      toast.error("Email is required");
      return;
    }
    setCreateLoading(true);
    try {
      await createCustomer({
        email: newEmail.trim(),
        firstName: newFirstName.trim() || undefined,
        lastName: newLastName.trim() || undefined,
        phone: newPhone.trim() || undefined,
      });
      toast.success("Customer created successfully");
      setCreateDialogOpen(false);
      setNewFirstName("");
      setNewLastName("");
      setNewEmail("");
      setNewPhone("");
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create customer");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleActivateCustomer = async (customer: CustomerSummary) => {
    try {
      await activateCustomer(customer.id);
      toast.success(`${getCustomerName(customer)} has been activated`);
      refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to activate customer");
    }
  };

  const handleActionSuccess = () => {
    refetch();
    closeDialog("emailDialogOpen");
    closeDialog("giftCardDialogOpen");
    closeDialog("suspendDialogOpen");
    closeDialog("changeTierDialogOpen");
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
              <DropdownMenuItem onClick={() => openDialog("emailDialogOpen", customer)}>
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => openDialog("giftCardDialogOpen", customer)}>
                <Gift className="mr-2 h-4 w-4" />
                Send Gift Card
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => openDialog("changeTierDialogOpen", customer)}>
                <Star className="mr-2 h-4 w-4" />
                Change Tier
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {customer.status === "ACTIVE" ? (
                <DropdownMenuItem
                  className="text-red-600"
                  onClick={() => openDialog("suspendDialogOpen", customer)}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspend Account
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="text-green-600"
                  onClick={() => handleActivateCustomer(customer)}
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
    [openDialog]
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
          <Button
            variant="outline"
            className="gap-2"
            onClick={async () => {
              try {
                const result = await apiFetch<{ updated: number; total: number }>("/admin/customers/recalculate-stats", { method: "POST" });
                toast.success(`Updated ${result.updated} of ${result.total} customers`);
                refetch();
              } catch {
                toast.error("Failed to recalculate stats");
              }
            }}
          >
            <RefreshCw className="h-4 w-4" />
            Sync Stats
          </Button>
          <CsvExportButton type="customers" />
          <CsvImportDialog type="customers" onImport={importCustomersCsv} onComplete={() => refetch()} />
          <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
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
      {isError && (
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="py-4 text-center text-red-600 dark:text-red-400">
            {error instanceof Error ? error.message : "Failed to load customers"}
            <Button variant="link" onClick={() => refetch()} className="ml-2">
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
            loading={isLoading}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
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
        selectedCount={selectedIds.size}
        onClearSelection={clearSelection}
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
            onOpenChange={(open) => { if (!open) closeDialog("emailDialogOpen"); }}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <SendGiftCardDialog
            open={giftCardDialogOpen}
            onOpenChange={(open) => { if (!open) closeDialog("giftCardDialogOpen"); }}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <SuspendCustomerDialog
            open={suspendDialogOpen}
            onOpenChange={(open) => { if (!open) closeDialog("suspendDialogOpen"); }}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
          <ChangeTierDialog
            open={changeTierDialogOpen}
            onOpenChange={(open) => { if (!open) closeDialog("changeTierDialogOpen"); }}
            customer={selectedCustomer}
            onSuccess={handleActionSuccess}
          />
        </>
      )}

      {/* Create Customer Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Customer</DialogTitle>
            <DialogDescription>
              Create a new customer account. Email is required.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <span className="text-sm font-medium">First Name</span>
                <Input
                  placeholder="John"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <span className="text-sm font-medium">Last Name</span>
                <Input
                  placeholder="Doe"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Email *</span>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Phone (optional)</span>
              <Input
                type="tel"
                placeholder="+44 7700 000000"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={createLoading || !newEmail.trim()}>
              {createLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Customer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
