import { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  MoreHorizontal,
  Eye,
  Mail,
  Ban,
  UserPlus,
  Download,
  Users,
  Crown,
  Star,
  TrendingUp,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Customers",
};

// Mock data
const customers = [
  {
    id: "CUS-001",
    name: "Olivia Martin",
    email: "olivia@example.com",
    avatar: "",
    tier: "vip",
    totalOrders: 12,
    totalSpent: 45600,
    lastOrder: "2024-01-15",
    status: "active",
    joinDate: "2023-03-15",
  },
  {
    id: "CUS-002",
    name: "Jackson Lee",
    email: "jackson@example.com",
    avatar: "",
    tier: "gold",
    totalOrders: 8,
    totalSpent: 28400,
    lastOrder: "2024-01-14",
    status: "active",
    joinDate: "2023-05-22",
  },
  {
    id: "CUS-003",
    name: "Isabella Nguyen",
    email: "isabella@example.com",
    avatar: "",
    tier: "silver",
    totalOrders: 5,
    totalSpent: 12300,
    lastOrder: "2024-01-13",
    status: "active",
    joinDate: "2023-08-10",
  },
  {
    id: "CUS-004",
    name: "William Kim",
    email: "will@example.com",
    avatar: "",
    tier: "standard",
    totalOrders: 2,
    totalSpent: 4500,
    lastOrder: "2024-01-12",
    status: "active",
    joinDate: "2023-11-05",
  },
  {
    id: "CUS-005",
    name: "Sofia Davis",
    email: "sofia@example.com",
    avatar: "",
    tier: "gold",
    totalOrders: 7,
    totalSpent: 21800,
    lastOrder: "2024-01-11",
    status: "active",
    joinDate: "2023-04-18",
  },
  {
    id: "CUS-006",
    name: "Liam Johnson",
    email: "liam@example.com",
    avatar: "",
    tier: "standard",
    totalOrders: 1,
    totalSpent: 1950,
    lastOrder: "2024-01-10",
    status: "inactive",
    joinDate: "2023-12-01",
  },
  {
    id: "CUS-007",
    name: "Emma Wilson",
    email: "emma@example.com",
    avatar: "",
    tier: "silver",
    totalOrders: 4,
    totalSpent: 9800,
    lastOrder: "2024-01-09",
    status: "active",
    joinDate: "2023-06-14",
  },
  {
    id: "CUS-008",
    name: "Noah Brown",
    email: "noah@example.com",
    avatar: "",
    tier: "vip",
    totalOrders: 15,
    totalSpent: 58200,
    lastOrder: "2024-01-08",
    status: "active",
    joinDate: "2022-11-20",
  },
];

const customerStats = [
  { label: "Total Customers", value: "12,234", icon: Users, change: "+12%" },
  { label: "VIP Members", value: "142", icon: Crown, change: "+8%" },
  { label: "Avg. Order Value", value: "$3,245", icon: TrendingUp, change: "+15%" },
  { label: "Customer Rating", value: "4.8", icon: Star, change: "+0.2" },
];

function getTierBadge(tier: string) {
  switch (tier) {
    case "vip":
      return (
        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
          <Crown className="mr-1 h-3 w-3" /> VIP
        </Badge>
      );
    case "gold":
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Gold</Badge>;
    case "silver":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Silver</Badge>;
    default:
      return <Badge variant="outline">Standard</Badge>;
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "inactive":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Inactive</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <UserPlus className="h-4 w-4" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customer Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {customerStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className="rounded-full bg-muted p-2">
                <stat.icon className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <span className="text-xs text-green-500">{stat.change}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search customers..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Tier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tiers</SelectItem>
                <SelectItem value="vip">VIP</SelectItem>
                <SelectItem value="gold">Gold</SelectItem>
                <SelectItem value="silver">Silver</SelectItem>
                <SelectItem value="standard">Standard</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Customers</CardTitle>
          <CardDescription>
            {customers.length} customers in your database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={customer.avatar} alt={customer.name} />
                        <AvatarFallback className="bg-muted">
                          {getInitials(customer.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium hover:underline">{customer.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {customer.email}
                        </span>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>{getTierBadge(customer.tier)}</TableCell>
                  <TableCell className="text-center">{customer.totalOrders}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${customer.totalSpent.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.lastOrder}
                  </TableCell>
                  <TableCell>{getStatusBadge(customer.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/customers/${customer.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend Account
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
