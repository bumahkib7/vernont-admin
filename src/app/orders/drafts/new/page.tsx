"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
import {
  Search,
  Plus,
  Trash2,
  Loader2,
  Package,
  User,
} from "lucide-react";
import { toast } from "sonner";
import {
  createDraftOrder,
  getCustomers,
  getProducts,
  formatPrice,
  CustomerSummary,
  ProductSummary,
  Product,
  getProduct,
  CreateDraftOrderItemInput,
} from "@/lib/api";

interface DraftItem extends CreateDraftOrderItemInput {
  _key: string; // local key for React rendering
}

export default function CreateDraftOrderPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Customer
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [customerEmail, setCustomerEmail] = useState("");
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);

  // Products
  const [productSearch, setProductSearch] = useState("");
  const [debouncedProductSearch, setDebouncedProductSearch] = useState("");
  const [showProductSearch, setShowProductSearch] = useState(false);

  // Items
  const [items, setItems] = useState<DraftItem[]>([]);

  // Addresses
  const [shippingAddress, setShippingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    countryCode: "",
    phone: "",
  });
  const [billingAddress, setBillingAddress] = useState({
    firstName: "",
    lastName: "",
    address1: "",
    address2: "",
    city: "",
    province: "",
    postalCode: "",
    countryCode: "",
    phone: "",
  });
  const [sameAsShipping, setSameAsShipping] = useState(true);

  // Note
  const [note, setNote] = useState("");

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounce product search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedProductSearch(productSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [productSearch]);

  // Customer search via React Query
  const customerSearchQuery = useQuery({
    queryKey: ["draft-customer-search", debouncedCustomerSearch],
    queryFn: () => getCustomers({ q: debouncedCustomerSearch, limit: 5 }),
    enabled: debouncedCustomerSearch.length >= 2,
    staleTime: 10_000,
  });

  const customerResults = debouncedCustomerSearch.length >= 2
    ? (customerSearchQuery.data?.customers ?? [])
    : [];
  const customerLoading = customerSearchQuery.isFetching;

  // Product search via React Query
  const productSearchQuery = useQuery({
    queryKey: ["draft-product-search", debouncedProductSearch],
    queryFn: () => getProducts({ q: debouncedProductSearch, end: 10 }),
    enabled: debouncedProductSearch.length >= 2,
    staleTime: 10_000,
  });

  const productResults = debouncedProductSearch.length >= 2
    ? (productSearchQuery.data?.content ?? [])
    : [];
  const productLoading = productSearchQuery.isFetching;

  const selectCustomer = (customer: CustomerSummary) => {
    setSelectedCustomer(customer);
    setCustomerEmail(customer.email);
    setCustomerSearch("");
    setShowCustomerSearch(false);
  };

  const clearCustomer = () => {
    setSelectedCustomer(null);
    setCustomerEmail("");
  };

  const addProductAsItem = async (product: ProductSummary) => {
    try {
      // Fetch full product to get variant prices
      const fullProduct = await getProduct(product.id);
      const variant = fullProduct.variants?.[0];
      const price = variant?.prices?.[0]?.amount ?? 0;

      const newItem: DraftItem = {
        _key: `${Date.now()}-${Math.random()}`,
        productId: product.id,
        variantId: variant?.id,
        title: product.title,
        sku: variant?.sku || undefined,
        quantity: 1,
        unitPrice: price,
      };
      setItems((prev) => [...prev, newItem]);
    } catch {
      // Fallback: add with no price
      const newItem: DraftItem = {
        _key: `${Date.now()}-${Math.random()}`,
        productId: product.id,
        title: product.title,
        quantity: 1,
        unitPrice: 0,
      };
      setItems((prev) => [...prev, newItem]);
    }
    setProductSearch("");
    setShowProductSearch(false);
  };

  const addCustomItem = () => {
    const newItem: DraftItem = {
      _key: `${Date.now()}-${Math.random()}`,
      title: "",
      quantity: 1,
      unitPrice: 0,
    };
    setItems((prev) => [...prev, newItem]);
  };

  const updateItem = (key: string, updates: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((item) => (item._key === key ? { ...item, ...updates } : item))
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((item) => item._key !== key));
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const total = subtotal; // Tax/shipping/discounts calculated server-side

  const handleSubmit = async () => {
    if (items.length === 0) {
      toast.error("Add at least one item to the draft order");
      return;
    }

    setSaving(true);
    try {
      const itemsPayload = items.map(({ _key, ...rest }) => rest);
      const hasShippingAddress = shippingAddress.address1 || shippingAddress.city;
      const hasBillingAddress = !sameAsShipping && (billingAddress.address1 || billingAddress.city);

      const draft = await createDraftOrder({
        customerEmail: customerEmail || undefined,
        customerId: selectedCustomer?.id || undefined,
        note: note || undefined,
        items: itemsPayload,
        shippingAddress: hasShippingAddress ? shippingAddress : undefined,
        billingAddress: hasBillingAddress ? billingAddress : (hasShippingAddress ? shippingAddress : undefined),
      });

      toast.success("Draft order created");
      router.push(`/orders/drafts/${draft.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create draft order");
    } finally {
      setSaving(false);
    }
  };

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
            <BreadcrumbLink href="/orders/drafts">Draft Orders</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Draft Order</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Items</CardTitle>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={addCustomItem}>
                  <Plus className="h-4 w-4 mr-1" />
                  Custom Item
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Product Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search products to add..."
                  className="pl-8"
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowProductSearch(true);
                  }}
                  onFocus={() => setShowProductSearch(true)}
                />
                {showProductSearch && (productResults.length > 0 || productLoading) && (
                  <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                    {productLoading ? (
                      <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Searching...
                      </div>
                    ) : (
                      productResults.map((product) => (
                        <button
                          key={product.id}
                          className="w-full flex items-center gap-3 p-3 hover:bg-muted text-left"
                          onClick={() => addProductAsItem(product)}
                        >
                          <div className="h-8 w-8 bg-muted rounded flex items-center justify-center overflow-hidden">
                            {product.thumbnail ? (
                              <img
                                src={product.thumbnail}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{product.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {product.variantCount} variant{product.variantCount !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Items Table */}
              {items.length > 0 && (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item</TableHead>
                      <TableHead className="w-24">Qty</TableHead>
                      <TableHead className="w-32">Unit Price</TableHead>
                      <TableHead className="w-28 text-right">Total</TableHead>
                      <TableHead className="w-10" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item._key}>
                        <TableCell>
                          {item.productId ? (
                            <div>
                              <p className="text-sm font-medium">{item.title}</p>
                              {item.sku && (
                                <p className="text-xs text-muted-foreground">SKU: {item.sku}</p>
                              )}
                            </div>
                          ) : (
                            <Input
                              placeholder="Item title"
                              value={item.title}
                              onChange={(e) => updateItem(item._key, { title: e.target.value })}
                              className="h-8"
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="numeric"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(item._key, { quantity: Math.max(1, parseInt(e.target.value) || 1) })
                            }
                            className="h-8 w-20"
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="text"
                            inputMode="decimal"
                            value={(item.unitPrice / 100).toFixed(2)}
                            onChange={(e) =>
                              updateItem(item._key, {
                                unitPrice: Math.round(parseFloat(e.target.value || "0") * 100),
                              })
                            }
                            className="h-8 w-28"
                          />
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatPrice(item.unitPrice * item.quantity, "GBP")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => removeItem(item._key)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {items.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Search for products above or add a custom item</p>
                </div>
              )}

              {/* Running Total */}
              {items.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(subtotal, "GBP")}</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Tax</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Shipping</span>
                      <span>Calculated at checkout</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-medium">
                      <span>Estimated Total</span>
                      <span>{formatPrice(total, "GBP")}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Shipping Address Card */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Address</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">First Name</label>
                  <Input
                    value={shippingAddress.firstName}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, firstName: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Last Name</label>
                  <Input
                    value={shippingAddress.lastName}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, lastName: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Address Line 1</label>
                  <Input
                    value={shippingAddress.address1}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, address1: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Address Line 2</label>
                  <Input
                    value={shippingAddress.address2}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, address2: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">City</label>
                  <Input
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, city: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Province / State</label>
                  <Input
                    value={shippingAddress.province}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, province: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Postal Code</label>
                  <Input
                    value={shippingAddress.postalCode}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Country Code</label>
                  <Input
                    placeholder="e.g. GB"
                    value={shippingAddress.countryCode}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, countryCode: e.target.value }))
                    }
                  />
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-sm font-medium">Phone</label>
                  <Input
                    value={shippingAddress.phone}
                    onChange={(e) =>
                      setShippingAddress((prev) => ({ ...prev, phone: e.target.value }))
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Billing Address</CardTitle>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={sameAsShipping}
                  onChange={(e) => setSameAsShipping(e.target.checked)}
                  className="rounded"
                />
                Same as shipping
              </label>
            </CardHeader>
            {!sameAsShipping && (
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">First Name</label>
                    <Input
                      value={billingAddress.firstName}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, firstName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Last Name</label>
                    <Input
                      value={billingAddress.lastName}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, lastName: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Address Line 1</label>
                    <Input
                      value={billingAddress.address1}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, address1: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Address Line 2</label>
                    <Input
                      value={billingAddress.address2}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, address2: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">City</label>
                    <Input
                      value={billingAddress.city}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, city: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Province / State</label>
                    <Input
                      value={billingAddress.province}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, province: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Postal Code</label>
                    <Input
                      value={billingAddress.postalCode}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, postalCode: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Country Code</label>
                    <Input
                      placeholder="e.g. GB"
                      value={billingAddress.countryCode}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, countryCode: e.target.value }))
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-2">
                    <label className="text-sm font-medium">Phone</label>
                    <Input
                      value={billingAddress.phone}
                      onChange={(e) =>
                        setBillingAddress((prev) => ({ ...prev, phone: e.target.value }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Customer Card */}
          <Card>
            <CardHeader>
              <CardTitle>Customer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {selectedCustomer.firstName} {selectedCustomer.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={clearCustomer}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search customers..."
                      className="pl-8"
                      value={customerSearch}
                      onChange={(e) => {
                        setCustomerSearch(e.target.value);
                        setShowCustomerSearch(true);
                      }}
                      onFocus={() => setShowCustomerSearch(true)}
                    />
                    {showCustomerSearch && (customerResults.length > 0 || customerLoading) && (
                      <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-auto">
                        {customerLoading ? (
                          <div className="flex items-center gap-2 p-3 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Searching...
                          </div>
                        ) : (
                          customerResults.map((customer) => (
                            <button
                              key={customer.id}
                              className="w-full flex items-center gap-2 p-3 hover:bg-muted text-left"
                              onClick={() => selectCustomer(customer)}
                            >
                              <div>
                                <p className="text-sm font-medium">
                                  {customer.firstName} {customer.lastName}
                                </p>
                                <p className="text-xs text-muted-foreground">{customer.email}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-muted-foreground">Or enter email directly</label>
                    <Input
                      type="email"
                      placeholder="customer@example.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Note Card */}
          <Card>
            <CardHeader>
              <CardTitle>Note</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add a note to this draft order..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Actions Card */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Button className="w-full" onClick={handleSubmit} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Create Draft Order
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => router.push("/orders/drafts")}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
