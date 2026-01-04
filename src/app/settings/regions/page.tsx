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
import { MoreHorizontal, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Regions - Settings",
};

// Mock data
const regions = [
  {
    id: "1",
    name: "North America",
    countries: ["United States", "Canada"],
    currency: "USD",
    paymentProviders: ["Stripe", "PayPal"],
    fulfillmentProviders: ["Manual"],
  },
  {
    id: "2",
    name: "Europe",
    countries: ["Germany", "France", "United Kingdom", "Italy", "Spain"],
    currency: "EUR",
    paymentProviders: ["Stripe"],
    fulfillmentProviders: ["Manual"],
  },
];

export default function RegionsSettingsPage() {
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
            <BreadcrumbPage>Regions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Regions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Regions</CardTitle>
            <CardDescription>Manage the markets you will operate within</CardDescription>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Region
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Countries</TableHead>
                <TableHead>Currency</TableHead>
                <TableHead>Payment Providers</TableHead>
                <TableHead>Fulfillment</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {region.countries.slice(0, 2).join(", ")}
                      {region.countries.length > 2 && ` +${region.countries.length - 2} more`}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{region.currency}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {region.paymentProviders.map((provider) => (
                        <Badge key={provider} variant="outline">
                          {provider}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {region.fulfillmentProviders.map((provider) => (
                        <Badge key={provider} variant="outline">
                          {provider}
                        </Badge>
                      ))}
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
        </CardContent>
      </Card>
    </div>
  );
}
