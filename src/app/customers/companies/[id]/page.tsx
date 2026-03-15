"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  AlertCircle,
  Building2,
  Edit3,
  Loader2,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  ShoppingCart,
  Trash2,
  User,
  Users,
  X,
  DollarSign,
  Percent,
  Package,
} from "lucide-react";
import { toast } from "sonner";
import {
  Company,
  CompanyContact,
  CompanyStatus,
  ContractPricingRule,
  getCompany,
  updateCompany,
  deleteCompany,
  addCompanyContact,
  removeCompanyContact,
  getContractPricing,
  setContractPricing,
  getCompanyStatusDisplay,
  formatPrice,
  formatDate,
} from "@/lib/api";

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const { label, color } = getCompanyStatusDisplay(status);
  return (
    <Badge variant="outline" className="gap-1 border-0">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </Badge>
  );
}

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editIndustry, setEditIndustry] = useState("");
  const [editTaxId, setEditTaxId] = useState("");
  const [editWebsite, setEditWebsite] = useState("");
  const [editPaymentTerms, setEditPaymentTerms] = useState("");
  const [editStatus, setEditStatus] = useState<CompanyStatus>("ACTIVE");
  const [editNotes, setEditNotes] = useState("");

  // Contact dialog
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactSaving, setContactSaving] = useState(false);
  const [newContactFirstName, setNewContactFirstName] = useState("");
  const [newContactLastName, setNewContactLastName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactRole, setNewContactRole] = useState("");

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Pricing
  const [pricingRules, setPricingRules] = useState<ContractPricingRule[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [pricingSaving, setPricingSaving] = useState(false);
  const [newPricingProductId, setNewPricingProductId] = useState("");
  const [newPricingProductTitle, setNewPricingProductTitle] = useState("");
  const [newPricingOverride, setNewPricingOverride] = useState("");
  const [newPricingDiscount, setNewPricingDiscount] = useState("");
  const [newPricingMinQty, setNewPricingMinQty] = useState("");

  const fetchCompany = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCompany(companyId);
      setCompany(data);
      populateEditFields(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load company");
    } finally {
      setLoading(false);
    }
  };

  const fetchPricing = async () => {
    setPricingLoading(true);
    try {
      const data = await getContractPricing(companyId);
      setPricingRules(data.rules || []);
    } catch {
      // Pricing may not exist yet
      setPricingRules([]);
    } finally {
      setPricingLoading(false);
    }
  };

  const populateEditFields = (c: Company) => {
    setEditName(c.name);
    setEditIndustry(c.industry || "");
    setEditTaxId(c.taxId || "");
    setEditWebsite(c.website || "");
    setEditPaymentTerms(c.paymentTerms || "");
    setEditStatus(c.status);
    setEditNotes(c.notes || "");
  };

  useEffect(() => {
    fetchCompany();
    fetchPricing();
  }, [companyId]);

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error("Company name is required");
      return;
    }
    setSaving(true);
    try {
      const updated = await updateCompany(companyId, {
        name: editName.trim(),
        industry: editIndustry.trim() || undefined,
        taxId: editTaxId.trim() || undefined,
        website: editWebsite.trim() || undefined,
        paymentTerms: editPaymentTerms || undefined,
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });
      setCompany(updated);
      setEditing(false);
      toast.success("Company updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update company");
    } finally {
      setSaving(false);
    }
  };

  const handleCancelEdit = () => {
    if (company) populateEditFields(company);
    setEditing(false);
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteCompany(companyId);
      toast.success("Company deleted");
      router.push("/customers/companies");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete company");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddContact = async () => {
    if (!newContactFirstName.trim() || !newContactEmail.trim()) {
      toast.error("First name and email are required");
      return;
    }
    setContactSaving(true);
    try {
      await addCompanyContact(companyId, {
        firstName: newContactFirstName.trim(),
        lastName: newContactLastName.trim(),
        email: newContactEmail.trim(),
        phone: newContactPhone.trim() || undefined,
        role: newContactRole.trim() || undefined,
      });
      await fetchCompany();
      setContactDialogOpen(false);
      resetContactForm();
      toast.success("Contact added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add contact");
    } finally {
      setContactSaving(false);
    }
  };

  const handleRemoveContact = async (contactId: string) => {
    try {
      await removeCompanyContact(companyId, contactId);
      await fetchCompany();
      toast.success("Contact removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove contact");
    }
  };

  const resetContactForm = () => {
    setNewContactFirstName("");
    setNewContactLastName("");
    setNewContactEmail("");
    setNewContactPhone("");
    setNewContactRole("");
  };

  const handleAddPricingRule = async () => {
    if (!newPricingProductId.trim()) {
      toast.error("Product ID is required");
      return;
    }
    setPricingSaving(true);
    try {
      const newRule: ContractPricingRule = {
        productId: newPricingProductId.trim(),
        productTitle: newPricingProductTitle.trim() || undefined,
        priceOverride: newPricingOverride ? parseFloat(newPricingOverride) * 100 : undefined,
        discountPercent: newPricingDiscount ? parseFloat(newPricingDiscount) : undefined,
        minQuantity: newPricingMinQty ? parseInt(newPricingMinQty) : undefined,
      };
      const updatedRules = [...pricingRules, newRule];
      const result = await setContractPricing(companyId, { rules: updatedRules });
      setPricingRules(result.rules || updatedRules);
      setPricingDialogOpen(false);
      resetPricingForm();
      toast.success("Pricing rule added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add pricing rule");
    } finally {
      setPricingSaving(false);
    }
  };

  const handleRemovePricingRule = async (index: number) => {
    try {
      const updatedRules = pricingRules.filter((_, i) => i !== index);
      const result = await setContractPricing(companyId, { rules: updatedRules });
      setPricingRules(result.rules || updatedRules);
      toast.success("Pricing rule removed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove pricing rule");
    }
  };

  const resetPricingForm = () => {
    setNewPricingProductId("");
    setNewPricingProductTitle("");
    setNewPricingOverride("");
    setNewPricingDiscount("");
    setNewPricingMinQty("");
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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
  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 p-12">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-xl font-semibold">Failed to load company</h2>
        <p className="text-muted-foreground">{error || "Company not found"}</p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/customers/companies")}>
            Back to Companies
          </Button>
          <Button onClick={fetchCompany}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/customers/companies">Companies</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{company.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Info Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  {editing ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="text-xl font-semibold h-8"
                    />
                  ) : (
                    <CardTitle className="text-xl">{company.name}</CardTitle>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Created {formatDate(company.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <CompanyStatusBadge status={company.status} />
                {editing ? (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelEdit}>
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                      Save
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditing(true)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Company
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setDeleteDialogOpen(true)}
                        className="text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Company
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editing ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Industry</Label>
                      <Input value={editIndustry} onChange={(e) => setEditIndustry(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax ID / VAT</Label>
                      <Input value={editTaxId} onChange={(e) => setEditTaxId(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input value={editWebsite} onChange={(e) => setEditWebsite(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Payment Terms</Label>
                      <Select value={editPaymentTerms} onValueChange={setEditPaymentTerms}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select terms" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DUE_ON_RECEIPT">Due on Receipt</SelectItem>
                          <SelectItem value="NET_15">Net 15</SelectItem>
                          <SelectItem value="NET_30">Net 30</SelectItem>
                          <SelectItem value="NET_60">Net 60</SelectItem>
                          <SelectItem value="NET_90">Net 90</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={editStatus} onValueChange={(v) => setEditStatus(v as CompanyStatus)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active</SelectItem>
                        <SelectItem value="SUSPENDED">Suspended</SelectItem>
                        <SelectItem value="INACTIVE">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes</Label>
                    <Textarea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} rows={3} />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Industry</span>
                    <p className="font-medium">{company.industry || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tax ID / VAT</span>
                    <p className="font-medium">{company.taxId || "-"}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Website</span>
                    <p className="font-medium">
                      {company.website ? (
                        <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {company.website}
                        </a>
                      ) : "-"}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Payment Terms</span>
                    <p className="font-medium">{company.paymentTerms?.replace(/_/g, " ") || "-"}</p>
                  </div>
                  {company.notes && (
                    <div className="col-span-2">
                      <span className="text-muted-foreground">Notes</span>
                      <p className="font-medium whitespace-pre-wrap">{company.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contacts Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Contacts</CardTitle>
                <Badge variant="secondary" className="ml-1">{company.contacts?.length || 0}</Badge>
              </div>
              <Button size="sm" onClick={() => setContactDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Contact
              </Button>
            </CardHeader>
            <CardContent>
              {(!company.contacts || company.contacts.length === 0) ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No contacts yet. Add a contact to get started.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {company.contacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">
                                {contact.firstName} {contact.lastName}
                              </p>
                              {contact.isPrimary && (
                                <Badge variant="secondary" className="text-xs mt-0.5">Primary</Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{contact.email}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{contact.phone || "-"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{contact.role || "-"}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleRemoveContact(contact.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Contract Pricing Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <CardTitle>Contract Pricing</CardTitle>
                <Badge variant="secondary" className="ml-1">{pricingRules.length}</Badge>
              </div>
              <Button size="sm" onClick={() => setPricingDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-1" />
                Add Rule
              </Button>
            </CardHeader>
            <CardContent>
              {pricingLoading ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : pricingRules.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No contract pricing rules. Add product-specific pricing overrides or volume discounts.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Price Override</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead>Min Qty</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pricingRules.map((rule, index) => (
                      <TableRow key={rule.id || index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{rule.productTitle || "Product"}</p>
                              <p className="text-xs text-muted-foreground font-mono">{rule.productId.slice(0, 12)}...</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {rule.priceOverride != null ? formatPrice(rule.priceOverride, rule.currencyCode || "GBP") : "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {rule.discountPercent != null ? (
                            <div className="flex items-center gap-1">
                              <Percent className="h-3 w-3 text-green-600" />
                              <span className="text-green-600">{rule.discountPercent}%</span>
                            </div>
                          ) : "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {rule.minQuantity || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-red-600"
                            onClick={() => handleRemovePricingRule(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Order History Placeholder */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <CardTitle>Order History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ShoppingCart className="h-10 w-10 mb-3 opacity-50" />
                <p className="text-sm font-medium">Coming soon</p>
                <p className="text-xs mt-1">Order history for this company will appear here.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Addresses */}
          {company.billingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Billing Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {company.billingAddress.address1 && <p>{company.billingAddress.address1}</p>}
                  {company.billingAddress.address2 && <p>{company.billingAddress.address2}</p>}
                  <p>
                    {company.billingAddress.city}
                    {company.billingAddress.province && `, ${company.billingAddress.province}`}
                    {company.billingAddress.postalCode && ` ${company.billingAddress.postalCode}`}
                  </p>
                  {company.billingAddress.countryCode && <p>{company.billingAddress.countryCode}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {company.shippingAddress && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Shipping Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground space-y-0.5">
                  {company.shippingAddress.address1 && <p>{company.shippingAddress.address1}</p>}
                  {company.shippingAddress.address2 && <p>{company.shippingAddress.address2}</p>}
                  <p>
                    {company.shippingAddress.city}
                    {company.shippingAddress.province && `, ${company.shippingAddress.province}`}
                    {company.shippingAddress.postalCode && ` ${company.shippingAddress.postalCode}`}
                  </p>
                  {company.shippingAddress.countryCode && <p>{company.shippingAddress.countryCode}</p>}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Contacts</span>
                <span className="font-medium">{company.contacts?.length || 0}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pricing Rules</span>
                <span className="font-medium">{pricingRules.length}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <CompanyStatusBadge status={company.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Last Updated</span>
                <span className="font-medium">{formatDate(company.updatedAt)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Contact Dialog */}
      <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>
              Add a new contact person to {company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  placeholder="John"
                  value={newContactFirstName}
                  onChange={(e) => setNewContactFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={newContactLastName}
                  onChange={(e) => setNewContactLastName(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input
                type="email"
                placeholder="john@example.com"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  placeholder="+44 20 1234 5678"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Input
                  placeholder="Purchasing Manager"
                  value={newContactRole}
                  onChange={(e) => setNewContactRole(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setContactDialogOpen(false); resetContactForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddContact} disabled={contactSaving}>
              {contactSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Pricing Rule Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Pricing Rule</DialogTitle>
            <DialogDescription>
              Create a product-specific pricing override or volume discount for {company.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Product ID *</Label>
              <Input
                placeholder="prod_01ABC..."
                value={newPricingProductId}
                onChange={(e) => setNewPricingProductId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Product Name</Label>
              <Input
                placeholder="Product display name"
                value={newPricingProductTitle}
                onChange={(e) => setNewPricingProductTitle(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Price Override (in currency units)</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 49.99"
                  value={newPricingOverride}
                  onChange={(e) => setNewPricingOverride(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount %</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  placeholder="e.g. 15"
                  value={newPricingDiscount}
                  onChange={(e) => setNewPricingDiscount(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Minimum Quantity</Label>
              <Input
                type="number"
                min="1"
                placeholder="e.g. 10"
                value={newPricingMinQty}
                onChange={(e) => setNewPricingMinQty(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPricingDialogOpen(false); resetPricingForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleAddPricingRule} disabled={pricingSaving}>
              {pricingSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Add Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Company</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <span className="font-medium">{company.name}</span>?
              This will remove all associated contacts and pricing rules. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete Company
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
