import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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
import { Progress } from "@/components/ui/progress";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  MoreHorizontal,
  Plus,
  Minus,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowUpDown,
  Download,
  Upload,
  RefreshCcw,
  Filter,
  Box,
  Warehouse,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Inventory",
};

// Mock inventory data
const inventoryItems = [
  {
    id: "INV-001",
    productId: "PRD-001",
    productName: "Hermès Birkin 25",
    sku: "HB-25-BLK-GLD",
    variant: "Black / Gold Hardware",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    inStock: 2,
    reserved: 1,
    available: 1,
    reorderPoint: 2,
    status: "low_stock",
    location: "Warehouse A - Shelf B3",
    lastUpdated: "2024-01-15",
  },
  {
    id: "INV-002",
    productId: "PRD-001",
    productName: "Hermès Birkin 25",
    sku: "HB-25-BLK-PAL",
    variant: "Black / Palladium Hardware",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    inStock: 1,
    reserved: 0,
    available: 1,
    reorderPoint: 2,
    status: "low_stock",
    location: "Warehouse A - Shelf B3",
    lastUpdated: "2024-01-15",
  },
  {
    id: "INV-003",
    productId: "PRD-002",
    productName: "Chanel Classic Flap Medium",
    sku: "CCF-MED-BLK",
    variant: "Black Caviar",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    inStock: 5,
    reserved: 2,
    available: 3,
    reorderPoint: 3,
    status: "in_stock",
    location: "Warehouse A - Shelf C1",
    lastUpdated: "2024-01-14",
  },
  {
    id: "INV-004",
    productId: "PRD-003",
    productName: "Louis Vuitton Neverfull MM",
    sku: "LV-NF-MM-MON",
    variant: "Monogram",
    image: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop",
    inStock: 8,
    reserved: 1,
    available: 7,
    reorderPoint: 5,
    status: "in_stock",
    location: "Warehouse A - Shelf A2",
    lastUpdated: "2024-01-13",
  },
  {
    id: "INV-005",
    productId: "PRD-004",
    productName: "Gucci Dionysus Small",
    sku: "GD-SM-BLK",
    variant: "Black Leather",
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=100&h=100&fit=crop",
    inStock: 0,
    reserved: 0,
    available: 0,
    reorderPoint: 2,
    status: "out_of_stock",
    location: "Warehouse A - Shelf D4",
    lastUpdated: "2024-01-12",
  },
  {
    id: "INV-006",
    productId: "PRD-005",
    productName: "Dior Lady Dior Medium",
    sku: "LD-MED-BLK",
    variant: "Black Cannage",
    image: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=100&h=100&fit=crop",
    inStock: 2,
    reserved: 0,
    available: 2,
    reorderPoint: 2,
    status: "in_stock",
    location: "Warehouse B - Shelf A1",
    lastUpdated: "2024-01-11",
  },
  {
    id: "INV-007",
    productId: "PRD-006",
    productName: "Prada Re-Edition 2005",
    sku: "PR-RE05-BLK",
    variant: "Black Nylon",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    inStock: 12,
    reserved: 3,
    available: 9,
    reorderPoint: 5,
    status: "in_stock",
    location: "Warehouse B - Shelf B2",
    lastUpdated: "2024-01-10",
  },
  {
    id: "INV-008",
    productId: "PRD-007",
    productName: "Bottega Veneta Cassette",
    sku: "BV-CAS-GRN",
    variant: "Bottega Green",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    inStock: 4,
    reserved: 1,
    available: 3,
    reorderPoint: 2,
    status: "in_stock",
    location: "Warehouse B - Shelf C3",
    lastUpdated: "2024-01-09",
  },
];

const stockMovements = [
  {
    id: "MOV-001",
    type: "received",
    productName: "Hermès Birkin 25",
    sku: "HB-25-BLK-GLD",
    quantity: 2,
    date: "2024-01-15T10:30:00Z",
    user: "Admin",
    note: "New stock arrival",
  },
  {
    id: "MOV-002",
    type: "sold",
    productName: "Chanel Classic Flap Medium",
    sku: "CCF-MED-BLK",
    quantity: 1,
    date: "2024-01-14T15:45:00Z",
    user: "System",
    note: "Order #ORD-001",
  },
  {
    id: "MOV-003",
    type: "adjustment",
    productName: "Louis Vuitton Neverfull MM",
    sku: "LV-NF-MM-MON",
    quantity: -1,
    date: "2024-01-13T11:20:00Z",
    user: "Admin",
    note: "Inventory count correction",
  },
  {
    id: "MOV-004",
    type: "returned",
    productName: "Dior Lady Dior Medium",
    sku: "LD-MED-BLK",
    quantity: 1,
    date: "2024-01-12T09:00:00Z",
    user: "System",
    note: "Return #RET-005",
  },
];

const inventoryStats = [
  {
    label: "Total Items",
    value: inventoryItems.reduce((acc, item) => acc + item.inStock, 0),
    icon: Box,
    color: "bg-blue-100 text-blue-600",
  },
  {
    label: "Available",
    value: inventoryItems.reduce((acc, item) => acc + item.available, 0),
    icon: Package,
    color: "bg-green-100 text-green-600",
  },
  {
    label: "Reserved",
    value: inventoryItems.reduce((acc, item) => acc + item.reserved, 0),
    icon: Warehouse,
    color: "bg-purple-100 text-purple-600",
  },
  {
    label: "Low Stock",
    value: inventoryItems.filter((item) => item.status === "low_stock").length,
    icon: AlertTriangle,
    color: "bg-yellow-100 text-yellow-600",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "in_stock":
      return <Badge className="bg-green-100 text-green-800">In Stock</Badge>;
    case "low_stock":
      return <Badge className="bg-yellow-100 text-yellow-800">Low Stock</Badge>;
    case "out_of_stock":
      return <Badge className="bg-red-100 text-red-800">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getMovementBadge(type: string) {
  switch (type) {
    case "received":
      return (
        <Badge className="bg-green-100 text-green-800">
          <Plus className="mr-1 h-3 w-3" />
          Received
        </Badge>
      );
    case "sold":
      return (
        <Badge className="bg-blue-100 text-blue-800">
          <Minus className="mr-1 h-3 w-3" />
          Sold
        </Badge>
      );
    case "adjustment":
      return (
        <Badge className="bg-gray-100 text-gray-800">
          <RefreshCcw className="mr-1 h-3 w-3" />
          Adjustment
        </Badge>
      );
    case "returned":
      return (
        <Badge className="bg-purple-100 text-purple-800">
          <ArrowUpDown className="mr-1 h-3 w-3" />
          Returned
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">
            Track and manage your stock levels
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            Add Stock
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {inventoryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div className={`rounded-full p-2 ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Low Stock Alert */}
      {inventoryItems.some((item) => item.status === "low_stock" || item.status === "out_of_stock") && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-yellow-100 p-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-yellow-800">Low Stock Alert</p>
              <p className="text-sm text-yellow-700">
                {inventoryItems.filter((item) => item.status === "low_stock" || item.status === "out_of_stock").length} items need attention
              </p>
            </div>
            <Button variant="outline" size="sm" className="border-yellow-300 text-yellow-800 hover:bg-yellow-100">
              View Items
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="inventory" className="space-y-4">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
        </TabsList>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search by product, SKU..." className="pl-9" />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="in_stock">In Stock</SelectItem>
                    <SelectItem value="low_stock">Low Stock</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="warehouse-a">Warehouse A</SelectItem>
                    <SelectItem value="warehouse-b">Warehouse B</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="icon">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Stock Levels</CardTitle>
              <CardDescription>
                {inventoryItems.length} items in inventory
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">In Stock</TableHead>
                    <TableHead className="text-center">Reserved</TableHead>
                    <TableHead className="text-center">Available</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inventoryItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                            <Image
                              src={item.image}
                              alt={item.productName}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          </div>
                          <div>
                            <Link
                              href={`/products/${item.productId}`}
                              className="font-medium hover:underline"
                            >
                              {item.productName}
                            </Link>
                            <p className="text-xs text-muted-foreground">{item.variant}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {item.sku}
                      </TableCell>
                      <TableCell className="text-center font-medium">{item.inStock}</TableCell>
                      <TableCell className="text-center text-muted-foreground">{item.reserved}</TableCell>
                      <TableCell className="text-center">
                        <span className={item.available <= item.reorderPoint ? "text-yellow-600 font-medium" : ""}>
                          {item.available}
                        </span>
                      </TableCell>
                      <TableCell>{getStatusBadge(item.status)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.location}</TableCell>
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
                            <DropdownMenuItem>
                              <Plus className="mr-2 h-4 w-4" />
                              Add Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Minus className="mr-2 h-4 w-4" />
                              Remove Stock
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <RefreshCcw className="mr-2 h-4 w-4" />
                              Adjust Inventory
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <ArrowUpDown className="mr-2 h-4 w-4" />
                              View History
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
        </TabsContent>

        {/* Stock Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
              <CardDescription>
                Track all inventory changes and adjustments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Quantity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.map((movement) => (
                    <TableRow key={movement.id}>
                      <TableCell>{getMovementBadge(movement.type)}</TableCell>
                      <TableCell className="font-medium">{movement.productName}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {movement.sku}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={movement.quantity > 0 ? "text-green-600" : "text-red-600"}>
                          {movement.quantity > 0 ? `+${movement.quantity}` : movement.quantity}
                        </span>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDateTime(movement.date)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{movement.user}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{movement.note}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
