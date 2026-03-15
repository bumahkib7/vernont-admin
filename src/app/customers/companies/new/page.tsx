"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { createCompany, CreateCompanyRequest } from "@/lib/api";

export default function NewCompanyPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  // Company info
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [taxId, setTaxId] = useState("");
  const [website, setWebsite] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");
  const [notes, setNotes] = useState("");

  // Primary contact
  const [contactFirstName, setContactFirstName] = useState("");
  const [contactLastName, setContactLastName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactRole, setContactRole] = useState("");

  // Billing address
  const [billingAddress1, setBillingAddress1] = useState("");
  const [billingAddress2, setBillingAddress2] = useState("");
  const [billingCity, setBillingCity] = useState("");
  const [billingProvince, setBillingProvince] = useState("");
  const [billingPostalCode, setBillingPostalCode] = useState("");
  const [billingCountryCode, setBillingCountryCode] = useState("");

  // Shipping address
  const [shippingAddress1, setShippingAddress1] = useState("");
  const [shippingAddress2, setShippingAddress2] = useState("");
  const [shippingCity, setShippingCity] = useState("");
  const [shippingProvince, setShippingProvince] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingCountryCode, setShippingCountryCode] = useState("");
  const [sameAsBilling, setSameAsBilling] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Company name is required");
      return;
    }

    setSaving(true);
    try {
      const data: CreateCompanyRequest = {
        name: name.trim(),
        industry: industry.trim() || undefined,
        taxId: taxId.trim() || undefined,
        website: website.trim() || undefined,
        paymentTerms: paymentTerms || undefined,
        notes: notes.trim() || undefined,
        status: "ACTIVE",
      };

      if (billingAddress1 || billingCity) {
        data.billingAddress = {
          address1: billingAddress1.trim() || undefined,
          address2: billingAddress2.trim() || undefined,
          city: billingCity.trim() || undefined,
          province: billingProvince.trim() || undefined,
          postalCode: billingPostalCode.trim() || undefined,
          countryCode: billingCountryCode.trim() || undefined,
        };
      }

      if (sameAsBilling) {
        data.shippingAddress = data.billingAddress;
      } else if (shippingAddress1 || shippingCity) {
        data.shippingAddress = {
          address1: shippingAddress1.trim() || undefined,
          address2: shippingAddress2.trim() || undefined,
          city: shippingCity.trim() || undefined,
          province: shippingProvince.trim() || undefined,
          postalCode: shippingPostalCode.trim() || undefined,
          countryCode: shippingCountryCode.trim() || undefined,
        };
      }

      if (contactFirstName || contactEmail) {
        data.primaryContact = {
          firstName: contactFirstName.trim(),
          lastName: contactLastName.trim(),
          email: contactEmail.trim(),
          phone: contactPhone.trim() || undefined,
          role: contactRole.trim() || undefined,
        };
      }

      const company = await createCompany(data);
      toast.success("Company created successfully");
      router.push(`/customers/companies/${company.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create company");
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
            <BreadcrumbLink href="/customers">Customers</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/customers/companies">Companies</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>New Company</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-semibold">Add Company</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Company Information */}
            <Card>
              <CardHeader>
                <CardTitle>Company Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Company Name *</Label>
                    <Input
                      id="name"
                      placeholder="Acme Corporation"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Input
                      id="industry"
                      placeholder="e.g. Retail, Manufacturing"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                    <Input
                      id="taxId"
                      placeholder="e.g. GB123456789"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      placeholder="https://example.com"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paymentTerms">Payment Terms</Label>
                  <Select value={paymentTerms} onValueChange={setPaymentTerms}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select payment terms" />
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
              </CardContent>
            </Card>

            {/* Primary Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Contact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactFirstName">First Name</Label>
                    <Input
                      id="contactFirstName"
                      placeholder="John"
                      value={contactFirstName}
                      onChange={(e) => setContactFirstName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactLastName">Last Name</Label>
                    <Input
                      id="contactLastName"
                      placeholder="Doe"
                      value={contactLastName}
                      onChange={(e) => setContactLastName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      placeholder="john@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Phone</Label>
                    <Input
                      id="contactPhone"
                      placeholder="+44 20 1234 5678"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactRole">Role / Title</Label>
                  <Input
                    id="contactRole"
                    placeholder="e.g. Purchasing Manager"
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Billing Address */}
            <Card>
              <CardHeader>
                <CardTitle>Billing Address</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="billingAddress1">Address Line 1</Label>
                  <Input
                    id="billingAddress1"
                    placeholder="123 Business St"
                    value={billingAddress1}
                    onChange={(e) => setBillingAddress1(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingAddress2">Address Line 2</Label>
                  <Input
                    id="billingAddress2"
                    placeholder="Suite 100"
                    value={billingAddress2}
                    onChange={(e) => setBillingAddress2(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="billingCity">City</Label>
                    <Input
                      id="billingCity"
                      placeholder="London"
                      value={billingCity}
                      onChange={(e) => setBillingCity(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingProvince">Province / State</Label>
                    <Input
                      id="billingProvince"
                      value={billingProvince}
                      onChange={(e) => setBillingProvince(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="billingPostalCode">Postal Code</Label>
                    <Input
                      id="billingPostalCode"
                      placeholder="SW1A 1AA"
                      value={billingPostalCode}
                      onChange={(e) => setBillingPostalCode(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingCountryCode">Country Code</Label>
                  <Input
                    id="billingCountryCode"
                    placeholder="GB"
                    maxLength={2}
                    value={billingCountryCode}
                    onChange={(e) => setBillingCountryCode(e.target.value.toUpperCase())}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Shipping Address */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Shipping Address</CardTitle>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sameAsBilling}
                      onChange={(e) => setSameAsBilling(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                    Same as billing
                  </label>
                </div>
              </CardHeader>
              {!sameAsBilling && (
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress1">Address Line 1</Label>
                    <Input
                      id="shippingAddress1"
                      placeholder="123 Warehouse Rd"
                      value={shippingAddress1}
                      onChange={(e) => setShippingAddress1(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingAddress2">Address Line 2</Label>
                    <Input
                      id="shippingAddress2"
                      value={shippingAddress2}
                      onChange={(e) => setShippingAddress2(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="shippingCity">City</Label>
                      <Input
                        id="shippingCity"
                        value={shippingCity}
                        onChange={(e) => setShippingCity(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingProvince">Province / State</Label>
                      <Input
                        id="shippingProvince"
                        value={shippingProvince}
                        onChange={(e) => setShippingProvince(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="shippingPostalCode">Postal Code</Label>
                      <Input
                        id="shippingPostalCode"
                        value={shippingPostalCode}
                        onChange={(e) => setShippingPostalCode(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="shippingCountryCode">Country Code</Label>
                    <Input
                      id="shippingCountryCode"
                      placeholder="GB"
                      maxLength={2}
                      value={shippingCountryCode}
                      onChange={(e) => setShippingCountryCode(e.target.value.toUpperCase())}
                    />
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Internal notes about this company..."
                  rows={5}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardContent className="pt-6 space-y-3">
                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Company
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push("/customers/companies")}
                >
                  Cancel
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}
