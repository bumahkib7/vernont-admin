"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Loader2,
  Search,
  X,
  User,
  Plus,
} from "lucide-react";
import {
  createTicket,
  searchCustomersForSupport,
  getAssignableUsers,
  type TicketCustomer,
  type TicketPriority,
  type TicketCategory,
  type CreateTicketInput,
} from "@/lib/api";

const PRIORITIES: { value: TicketPriority; label: string; color: string }[] = [
  { value: "LOW", label: "Low", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  { value: "MEDIUM", label: "Medium", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  { value: "URGENT", label: "Urgent", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
];

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "ORDER_ISSUE", label: "Order Issue" },
  { value: "PRODUCT_INQUIRY", label: "Product Inquiry" },
  { value: "RETURN_REQUEST", label: "Return Request" },
  { value: "SHIPPING", label: "Shipping" },
  { value: "BILLING", label: "Billing" },
  { value: "ACCOUNT", label: "Account" },
  { value: "OTHER", label: "Other" },
];

export default function NewTicketPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Customer selection
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState<TicketCustomer[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<TicketCustomer | null>(null);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [manualEmail, setManualEmail] = useState("");
  const [manualName, setManualName] = useState("");
  const [isManualEntry, setIsManualEntry] = useState(false);

  // Form fields
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [category, setCategory] = useState<TicketCategory>("ORDER_ISSUE");
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  // Fetch assignable users
  const assignableUsersQuery = useQuery({
    queryKey: ["assignable-users"],
    queryFn: getAssignableUsers,
    staleTime: 60_000,
  });

  const assignableUsers = assignableUsersQuery.data ?? [];

  // Customer search with debounce
  const searchCustomers = useCallback(async (query: string) => {
    if (query.length < 2) {
      setCustomerResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchCustomersForSupport(query);
      setCustomerResults(results);
      setShowCustomerDropdown(true);
    } catch {
      setCustomerResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (customerSearch && !selectedCustomer) {
        searchCustomers(customerSearch);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch, selectedCustomer, searchCustomers]);

  const selectCustomer = (customer: TicketCustomer) => {
    setSelectedCustomer(customer);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
    setIsManualEntry(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerSearch("");
    setManualEmail("");
    setManualName("");
    setIsManualEntry(false);
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async () => {
    // Validate
    const email = selectedCustomer?.email || manualEmail.trim();
    if (!email) {
      setError("Customer email is required");
      return;
    }
    if (!subject.trim()) {
      setError("Subject is required");
      return;
    }
    if (!description.trim()) {
      setError("Description is required");
      return;
    }

    setSaving(true);
    setError(null);

    const input: CreateTicketInput = {
      customerEmail: email,
      customerName: selectedCustomer
        ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}`
        : manualName.trim() || undefined,
      subject: subject.trim(),
      description: description.trim(),
      priority,
      category,
      assigneeId: assigneeId || undefined,
      orderNumber: orderNumber.trim() || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    try {
      const result = await createTicket(input);
      router.push(`/support/tickets/${result.id}`);
    } catch (err) {
      console.error("Failed to create ticket:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create ticket. Please try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/support">Customer Support</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/support/tickets">Tickets</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Ticket</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold tracking-tight">Create Ticket</h1>
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Customer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
              <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {selectedCustomer.firstName} {selectedCustomer.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={clearCustomer}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : isManualEntry ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">New customer details</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsManualEntry(false)}
                >
                  Search existing
                </Button>
              </div>
              <div>
                <label className="text-sm font-medium">Email *</label>
                <Input
                  value={manualEmail}
                  onChange={(e) => setManualEmail(e.target.value)}
                  placeholder="customer@example.com"
                  type="email"
                  className="mt-1.5"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Customer name (optional)"
                  className="mt-1.5"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name..."
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="pl-9"
                  onFocus={() => {
                    if (customerResults.length > 0) setShowCustomerDropdown(true);
                  }}
                  onBlur={() => {
                    // Delay to allow click on dropdown items
                    setTimeout(() => setShowCustomerDropdown(false), 200);
                  }}
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {showCustomerDropdown && customerResults.length > 0 && (
                  <div className="absolute z-10 mt-1 w-full bg-popover border rounded-md shadow-md max-h-48 overflow-auto">
                    {customerResults.map((customer) => (
                      <button
                        key={customer.id}
                        type="button"
                        className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-accent transition-colors"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => selectCustomer(customer)}
                      >
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {customer.firstName} {customer.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {customer.email}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => setIsManualEntry(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Enter email manually
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Details */}
      <Card>
        <CardHeader>
          <CardTitle>Ticket Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Subject *</label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief summary of the issue"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description *</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the issue in detail..."
              rows={5}
              className="mt-1.5"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Priority *</label>
              <Select value={priority} onValueChange={(v) => setPriority(v as TicketPriority)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRIORITIES.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <span className="flex items-center gap-2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${
                            p.value === "LOW"
                              ? "bg-gray-400"
                              : p.value === "MEDIUM"
                              ? "bg-blue-500"
                              : p.value === "HIGH"
                              ? "bg-orange-500"
                              : "bg-red-500"
                          }`}
                        />
                        {p.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Category *</label>
              <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
                <SelectTrigger className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Assign To</label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger className="mt-1.5">
                <SelectValue placeholder="Unassigned" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Unassigned</SelectItem>
                {assignableUsers.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.firstName} {user.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Optional Fields */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Link to Order</label>
            <Input
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Order number (optional)"
              className="mt-1.5"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Tags</label>
            <div className="flex items-center gap-2 mt-1.5">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder="Type a tag and press Enter"
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTag}
                disabled={!tagInput.trim()}
              >
                Add
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
          Create Ticket
        </Button>
      </div>
    </div>
  );
}
