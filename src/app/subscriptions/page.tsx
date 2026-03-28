"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  MoreHorizontal,
  Trash2,
  Pause,
  Play,
  XCircle,
  Archive,
} from "lucide-react";
import { toast } from "sonner";
import {
  SubscriptionPlan,
  SubscriptionPlanStatus,
  Subscription,
  SubscriptionStatus,
  SubscriptionPlansResponse,
  SubscriptionsResponse,
  getSubscriptionPlans,
  getSubscriptions,
  deleteSubscriptionPlan,
  cancelSubscription,
  pauseSubscription,
  resumeSubscription,
  getSubscriptionStatusDisplay,
  getSubscriptionPlanStatusDisplay,
  formatPrice,
  formatDate,
  formatInterval,
} from "@/lib/api";

function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function SubscriptionsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("plans");

  // Plans state
  const [plansSearch, setPlansSearch] = useState("");
  const [plansPagination, setPlansPagination] = useState({
    limit: 20,
    offset: 0,
  });

  // Subscriptions state
  const [subsSearch, setSubsSearch] = useState("");
  const [subsPagination, setSubsPagination] = useState({
    limit: 20,
    offset: 0,
  });

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => Promise<void>;
    variant: "destructive" | "default";
  }>({
    open: false,
    title: "",
    description: "",
    action: async () => {},
    variant: "default",
  });
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Fetch plans via React Query
  const plansQuery = useQuery({
    queryKey: ["subscription-plans", plansPagination.limit, plansPagination.offset],
    queryFn: () => getSubscriptionPlans({
      limit: plansPagination.limit,
      offset: plansPagination.offset,
    }),
    staleTime: 30_000,
  });

  const plans = plansQuery.data?.plans || [];
  const plansLoading = plansQuery.isLoading;
  const plansError = plansQuery.error ? (plansQuery.error as Error).message : null;

  // Fetch subscriptions via React Query
  const subsQuery = useQuery({
    queryKey: ["subscriptions", subsPagination.limit, subsPagination.offset],
    queryFn: () => getSubscriptions({
      limit: subsPagination.limit,
      offset: subsPagination.offset,
    }),
    staleTime: 30_000,
  });

  const subscriptions = subsQuery.data?.subscriptions || [];
  const subsLoading = subsQuery.isLoading;
  const subsError = subsQuery.error ? (subsQuery.error as Error).message : null;

  // Delete plan mutation
  const deletePlanMutation = useMutation({
    mutationFn: (planId: string) => deleteSubscriptionPlan(planId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });
    },
  });

  // Subscription action mutations
  const pauseMutation = useMutation({
    mutationFn: (subId: string) => pauseSubscription(subId),
    onSuccess: () => {
      toast.success("Subscription paused");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to pause subscription");
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (subId: string) => resumeSubscription(subId),
    onSuccess: () => {
      toast.success("Subscription resumed");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
    onError: (err: Error) => {
      toast.error(err.message || "Failed to resume subscription");
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (subId: string) => cancelSubscription(subId),
    onSuccess: () => {
      toast.success("Subscription cancelled");
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  // Plan actions
  const handleDeletePlan = (plan: SubscriptionPlan) => {
    setConfirmDialog({
      open: true,
      title: "Delete Plan",
      description: `Are you sure you want to delete "${plan.name}"? This action cannot be undone.`,
      variant: "destructive",
      action: async () => {
        await deletePlanMutation.mutateAsync(plan.id);
        toast.success(`Plan "${plan.name}" deleted`);
      },
    });
  };

  // Subscription actions
  const handleCancelSubscription = (sub: Subscription) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Subscription",
      description: `Cancel subscription for ${sub.customerEmail}? The customer will lose access at the end of their current billing period.`,
      variant: "destructive",
      action: async () => {
        await cancelMutation.mutateAsync(sub.id);
      },
    });
  };

  const handlePauseSubscription = (sub: Subscription) => {
    pauseMutation.mutate(sub.id);
  };

  const handleResumeSubscription = (sub: Subscription) => {
    resumeMutation.mutate(sub.id);
  };

  const executeConfirmAction = async () => {
    setConfirmLoading(true);
    try {
      await confirmDialog.action();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Action failed");
    } finally {
      setConfirmLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  };

  // Filter plans by search
  const filteredPlans = plans.filter((plan) => {
    if (!plansSearch) return true;
    const q = plansSearch.toLowerCase();
    return (
      plan.name.toLowerCase().includes(q) ||
      plan.description?.toLowerCase().includes(q)
    );
  });

  // Filter subscriptions by search
  const filteredSubscriptions = subscriptions.filter((sub) => {
    if (!subsSearch) return true;
    const q = subsSearch.toLowerCase();
    return (
      sub.customerEmail.toLowerCase().includes(q) ||
      sub.customerName?.toLowerCase().includes(q) ||
      sub.planName.toLowerCase().includes(q)
    );
  });

  // Pagination helpers
  const plansCount = plansQuery.data?.count || 0;
  const subsCount = subsQuery.data?.count || 0;
  const plansTotalPages = Math.ceil(plansCount / plansPagination.limit);
  const plansCurrentPage = Math.floor(plansPagination.offset / plansPagination.limit) + 1;
  const subsTotalPages = Math.ceil(subsCount / subsPagination.limit);
  const subsCurrentPage = Math.floor(subsPagination.offset / subsPagination.limit) + 1;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <CardTitle className="text-xl font-semibold">Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="plans">Plans</TabsTrigger>
              <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
            </TabsList>

            {/* Plans Tab */}
            <TabsContent value="plans" className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search plans..."
                    className="pl-8 w-full sm:w-[200px]"
                    value={plansSearch}
                    onChange={(e) => setPlansSearch(e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => plansQuery.refetch()} disabled={plansLoading}>
                    <RefreshCw className={`h-4 w-4 ${plansLoading ? "animate-spin" : ""}`} />
                  </Button>
                  <Button asChild>
                    <Link href="/subscriptions/plans/new">
                      <Plus className="h-4 w-4 mr-2" />
                      Create Plan
                    </Link>
                  </Button>
                </div>
              </div>

              {plansError && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>{plansError}</span>
                  <Button variant="ghost" size="sm" onClick={() => plansQuery.refetch()} className="ml-auto">
                    Retry
                  </Button>
                </div>
              )}

              {plansLoading && plans.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead className="hidden sm:table-cell">Interval</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Subscribers</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPlans.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {plans.length === 0 ? "No subscription plans" : "No plans match your search"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPlans.map((plan) => {
                          const statusDisplay = getSubscriptionPlanStatusDisplay(plan.status);
                          return (
                            <TableRow key={plan.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{plan.name}</p>
                                  {plan.description && (
                                    <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                                      {plan.description}
                                    </p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatPrice(plan.price, plan.currency)}</TableCell>
                              <TableCell className="hidden sm:table-cell">{formatInterval(plan.interval)}</TableCell>
                              <TableCell>
                                <StatusBadge label={statusDisplay.label} color={statusDisplay.color} />
                              </TableCell>
                              <TableCell className="text-right">{plan.subscriberCount}</TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/subscriptions/plans/new?edit=${plan.id}`}>
                                        Edit
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-red-600"
                                      onClick={() => handleDeletePlan(plan)}
                                    >
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>

                  {plansCount > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-muted-foreground">
                      <span>
                        {plansPagination.offset + 1} — {Math.min(plansPagination.offset + plansPagination.limit, plansCount)} of {plansCount} results
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {plansCurrentPage} of {plansTotalPages || 1} pages
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={plansCurrentPage <= 1}
                          onClick={() =>
                            setPlansPagination((prev) => ({
                              ...prev,
                              offset: (plansCurrentPage - 2) * prev.limit,
                            }))
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={plansCurrentPage >= plansTotalPages}
                          onClick={() =>
                            setPlansPagination((prev) => ({
                              ...prev,
                              offset: plansCurrentPage * prev.limit,
                            }))
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>

            {/* Subscriptions Tab */}
            <TabsContent value="subscriptions" className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search subscriptions..."
                    className="pl-8 w-full sm:w-[250px]"
                    value={subsSearch}
                    onChange={(e) => setSubsSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="icon" onClick={() => subsQuery.refetch()} disabled={subsLoading}>
                  <RefreshCw className={`h-4 w-4 ${subsLoading ? "animate-spin" : ""}`} />
                </Button>
              </div>

              {subsError && (
                <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="h-5 w-5" />
                  <span>{subsError}</span>
                  <Button variant="ghost" size="sm" onClick={() => subsQuery.refetch()} className="ml-auto">
                    Retry
                  </Button>
                </div>
              )}

              {subsLoading && subscriptions.length === 0 ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-4 w-8 ml-auto" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Customer</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Current Period</TableHead>
                        <TableHead className="hidden md:table-cell">Next Billing</TableHead>
                        <TableHead className="w-[50px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredSubscriptions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            {subscriptions.length === 0 ? "No subscriptions" : "No subscriptions match your search"}
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredSubscriptions.map((sub) => {
                          const statusDisplay = getSubscriptionStatusDisplay(sub.status);
                          return (
                            <TableRow key={sub.id} className="hover:bg-muted/50">
                              <TableCell>
                                <div>
                                  <p className="font-medium">{sub.customerEmail}</p>
                                  {sub.customerName && (
                                    <p className="text-xs text-muted-foreground">{sub.customerName}</p>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{sub.planName}</TableCell>
                              <TableCell>
                                <StatusBadge label={statusDisplay.label} color={statusDisplay.color} />
                              </TableCell>
                              <TableCell className="hidden sm:table-cell">
                                <span className="text-sm">
                                  {formatDate(sub.currentPeriodStart)} — {formatDate(sub.currentPeriodEnd)}
                                </span>
                              </TableCell>
                              <TableCell className="hidden md:table-cell">
                                {sub.nextBillingDate ? formatDate(sub.nextBillingDate) : "—"}
                              </TableCell>
                              <TableCell>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                      <span className="sr-only">Open menu</span>
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    {sub.status === "ACTIVE" && (
                                      <DropdownMenuItem onClick={() => handlePauseSubscription(sub)}>
                                        <Pause className="h-4 w-4 mr-2" />
                                        Pause
                                      </DropdownMenuItem>
                                    )}
                                    {sub.status === "PAUSED" && (
                                      <DropdownMenuItem onClick={() => handleResumeSubscription(sub)}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Resume
                                      </DropdownMenuItem>
                                    )}
                                    {(sub.status === "ACTIVE" || sub.status === "PAUSED" || sub.status === "TRIALING") && (
                                      <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={() => handleCancelSubscription(sub)}
                                      >
                                        <XCircle className="h-4 w-4 mr-2" />
                                        Cancel
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                  </div>

                  {subsCount > 0 && (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-muted-foreground">
                      <span>
                        {subsPagination.offset + 1} — {Math.min(subsPagination.offset + subsPagination.limit, subsCount)} of {subsCount} results
                      </span>
                      <div className="flex items-center gap-2">
                        <span>
                          {subsCurrentPage} of {subsTotalPages || 1} pages
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={subsCurrentPage <= 1}
                          onClick={() =>
                            setSubsPagination((prev) => ({
                              ...prev,
                              offset: (subsCurrentPage - 2) * prev.limit,
                            }))
                          }
                        >
                          Prev
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={subsCurrentPage >= subsTotalPages}
                          onClick={() =>
                            setSubsPagination((prev) => ({
                              ...prev,
                              offset: subsCurrentPage * prev.limit,
                            }))
                          }
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <Dialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialog.title}</DialogTitle>
            <DialogDescription>{confirmDialog.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
              disabled={confirmLoading}
            >
              Cancel
            </Button>
            <Button
              variant={confirmDialog.variant === "destructive" ? "destructive" : "default"}
              onClick={executeConfirmAction}
              disabled={confirmLoading}
            >
              {confirmLoading ? "Processing..." : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
