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
import { MoreHorizontal, Search, Play, Pause } from "lucide-react";

export const metadata: Metadata = {
  title: "Workflows - Settings",
};

// Mock data
const workflows = [
  {
    id: "1",
    name: "Order Created",
    description: "Triggered when a new order is placed",
    status: "active",
    lastRun: "2 minutes ago",
    executions: 1234,
  },
  {
    id: "2",
    name: "Payment Captured",
    description: "Triggered when payment is captured",
    status: "active",
    lastRun: "5 minutes ago",
    executions: 1189,
  },
  {
    id: "3",
    name: "Order Fulfilled",
    description: "Triggered when order is fulfilled",
    status: "active",
    lastRun: "1 hour ago",
    executions: 892,
  },
  {
    id: "4",
    name: "Return Requested",
    description: "Triggered when a return is requested",
    status: "paused",
    lastRun: "2 days ago",
    executions: 45,
  },
];

export default function WorkflowsSettingsPage() {
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
            <BreadcrumbPage>Workflows</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Workflows Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>
              Manage automated workflows and their executions
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search workflows" className="pl-8 w-[200px]" />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Executions</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workflows.map((workflow) => (
                <TableRow key={workflow.id}>
                  <TableCell className="font-medium">{workflow.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {workflow.description}
                  </TableCell>
                  <TableCell>
                    {workflow.status === "active" ? (
                      <Badge className="gap-1">
                        <Play className="h-3 w-3" />
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="gap-1">
                        <Pause className="h-3 w-3" />
                        Paused
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {workflow.lastRun}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {workflow.executions.toLocaleString()}
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
