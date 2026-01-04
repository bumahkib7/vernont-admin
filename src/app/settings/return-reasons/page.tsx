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
  title: "Return Reasons - Settings",
};

// Mock data
const returnReasons = [
  {
    id: "1",
    value: "wrong_item",
    label: "Wrong Item",
    description: "Customer received the wrong item",
  },
  {
    id: "2",
    value: "damaged",
    label: "Damaged",
    description: "Item arrived damaged or defective",
  },
  {
    id: "3",
    value: "not_as_described",
    label: "Not as Described",
    description: "Item doesn't match the description",
  },
  {
    id: "4",
    value: "changed_mind",
    label: "Changed Mind",
    description: "Customer no longer wants the item",
  },
  {
    id: "5",
    value: "size_issue",
    label: "Size Issue",
    description: "Item doesn't fit as expected",
  },
];

export default function ReturnReasonsSettingsPage() {
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
            <BreadcrumbPage>Return Reasons</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Return Reasons Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Return Reasons</CardTitle>
            <CardDescription>Manage reasons for returned items</CardDescription>
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
              {returnReasons.map((reason) => (
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
