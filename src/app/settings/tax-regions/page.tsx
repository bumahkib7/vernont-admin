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
  title: "Tax Regions - Settings",
};

// Mock data
const taxRegions = [
  {
    id: "1",
    name: "United States",
    taxRate: "0%",
    taxCode: "US",
    provinces: 50,
  },
  {
    id: "2",
    name: "European Union",
    taxRate: "20%",
    taxCode: "EU-VAT",
    provinces: 27,
  },
  {
    id: "3",
    name: "United Kingdom",
    taxRate: "20%",
    taxCode: "UK-VAT",
    provinces: 0,
  },
];

export default function TaxRegionsSettingsPage() {
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
            <BreadcrumbPage>Tax Regions</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Tax Regions Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Tax Regions</CardTitle>
            <CardDescription>Manage tax settings for different regions</CardDescription>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tax Region
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Region</TableHead>
                <TableHead>Default Tax Rate</TableHead>
                <TableHead>Tax Code</TableHead>
                <TableHead>Provinces/States</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {taxRegions.map((region) => (
                <TableRow key={region.id}>
                  <TableCell className="font-medium">{region.name}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{region.taxRate}</Badge>
                  </TableCell>
                  <TableCell>{region.taxCode}</TableCell>
                  <TableCell>
                    {region.provinces > 0 ? `${region.provinces} configured` : "-"}
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
