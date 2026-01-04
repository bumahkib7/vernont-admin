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
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Plus } from "lucide-react";

export const metadata: Metadata = {
  title: "Refund Reasons - Settings",
};

// Mock data
const refundReasons = [
  {
    id: "1",
    value: "product_issue",
    label: "Product Issue",
    description: "Product defect or quality issue",
  },
  {
    id: "2",
    value: "shipping_damage",
    label: "Shipping Damage",
    description: "Item damaged during shipping",
  },
  {
    id: "3",
    value: "wrong_item_shipped",
    label: "Wrong Item Shipped",
    description: "Incorrect item was shipped",
  },
  {
    id: "4",
    value: "customer_request",
    label: "Customer Request",
    description: "Customer requested refund",
  },
];

export default function RefundReasonsSettingsPage() {
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
            <BreadcrumbPage>Refund Reasons</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Refund Reasons Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Refund Reasons</CardTitle>
            <CardDescription>Manage reasons for order refunds</CardDescription>
          </div>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Reason
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Label</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {refundReasons.map((reason) => (
                <TableRow key={reason.id}>
                  <TableCell className="font-medium">{reason.label}</TableCell>
                  <TableCell className="font-mono text-sm text-muted-foreground">
                    {reason.value}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {reason.description}
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
