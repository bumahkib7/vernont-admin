import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MoreHorizontal, ExternalLink, Search, SlidersHorizontal } from "lucide-react";

export const metadata: Metadata = {
  title: "Store Settings",
};

// Mock data - replace with actual API calls
const storeDetails = {
  name: "Vernont Store",
  defaultCurrency: { code: "USD", name: "US Dollar" },
  defaultRegion: "-",
  defaultSalesChannel: "Default Sales Channel",
  defaultLocation: "Main Warehouse",
};

const currencies = [
  { code: "USD", name: "US Dollar", taxInclusivePricing: false },
  { code: "EUR", name: "Euro", taxInclusivePricing: false },
  { code: "GBP", name: "British Pound", taxInclusivePricing: false },
];

export default function StoreSettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Store</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Store Details Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Store</CardTitle>
            <CardDescription>Manage your store&apos;s details</CardDescription>
          </div>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="divide-y">
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{storeDetails.name}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Default currency</span>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{storeDetails.defaultCurrency.code}</Badge>
                <span className="text-sm">{storeDetails.defaultCurrency.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Default region</span>
              <span className="text-sm">{storeDetails.defaultRegion}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Default sales channel</span>
              <Badge variant="secondary">{storeDetails.defaultSalesChannel}</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-sm text-muted-foreground">Default location</span>
              <Badge variant="secondary">{storeDetails.defaultLocation}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Currencies Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Currencies</CardTitle>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search and Filter */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search"
                className="pl-8 w-[200px]"
              />
            </div>
            <Button variant="outline" size="icon">
              <SlidersHorizontal className="h-4 w-4" />
            </Button>
          </div>

          {/* Currencies Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Tax inclusive pricing</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currencies.map((currency) => (
                <TableRow key={currency.code}>
                  <TableCell className="font-medium">{currency.code}</TableCell>
                  <TableCell>{currency.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div
                        className={`h-2 w-2 rounded-full ${
                          currency.taxInclusivePricing ? "bg-green-500" : "bg-gray-400"
                        }`}
                      />
                      <span>{currency.taxInclusivePricing ? "True" : "False"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <span>1 — {currencies.length} of {currencies.length} results</span>
            <div className="flex items-center gap-2">
              <span>1 of 1 pages</span>
              <Button variant="ghost" size="sm" disabled>
                Prev
              </Button>
              <Button variant="ghost" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Metadata Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Metadata</CardTitle>
            <Badge variant="secondary">0 keys</Badge>
          </div>
          <Button variant="ghost" size="icon">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardHeader>
      </Card>
    </div>
  );
}
