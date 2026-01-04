"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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
import {
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Filter,
  Download,
} from "lucide-react";
import { StackedThumbnails } from "@/components/ui/thumbnail";
import { AddProductModal } from "@/components/products/add-product-modal";

// Mock data - products with multiple images
const products = [
  {
    id: "PRD-001",
    slug: "hermes-birkin-25",
    name: "Hermès Birkin 25",
    brand: "Hermès",
    category: "Handbags",
    price: 12500,
    originalPrice: 15000,
    stock: 3,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=100&h=100&fit=crop",
    ],
    condition: "Excellent",
  },
  {
    id: "PRD-002",
    slug: "chanel-classic-flap-medium",
    name: "Chanel Classic Flap Medium",
    brand: "Chanel",
    category: "Handbags",
    price: 8200,
    originalPrice: 9500,
    stock: 5,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    ],
    condition: "Very Good",
  },
  {
    id: "PRD-003",
    slug: "louis-vuitton-neverfull-mm",
    name: "Louis Vuitton Neverfull MM",
    brand: "Louis Vuitton",
    category: "Handbags",
    price: 2100,
    originalPrice: 2400,
    stock: 8,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    ],
    condition: "Good",
  },
  {
    id: "PRD-004",
    slug: "gucci-dionysus-small",
    name: "Gucci Dionysus Small",
    brand: "Gucci",
    category: "Handbags",
    price: 3450,
    originalPrice: 3900,
    stock: 0,
    status: "out_of_stock",
    images: [
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=100&h=100&fit=crop",
    ],
    condition: "Excellent",
  },
  {
    id: "PRD-005",
    slug: "dior-lady-dior-medium",
    name: "Dior Lady Dior Medium",
    brand: "Dior",
    category: "Handbags",
    price: 5800,
    originalPrice: 6500,
    stock: 2,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop",
    ],
    condition: "Very Good",
  },
  {
    id: "PRD-006",
    slug: "prada-re-edition-2005",
    name: "Prada Re-Edition 2005",
    brand: "Prada",
    category: "Handbags",
    price: 1950,
    originalPrice: 2200,
    stock: 12,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    ],
    condition: "Like New",
  },
  {
    id: "PRD-007",
    slug: "bottega-veneta-cassette",
    name: "Bottega Veneta Cassette",
    brand: "Bottega Veneta",
    category: "Handbags",
    price: 3200,
    originalPrice: 3800,
    stock: 4,
    status: "draft",
    images: [
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=100&h=100&fit=crop",
    ],
    condition: "Excellent",
  },
  {
    id: "PRD-008",
    slug: "celine-triomphe",
    name: "Celine Triomphe",
    brand: "Celine",
    category: "Handbags",
    price: 2800,
    originalPrice: 3200,
    stock: 6,
    status: "active",
    images: [
      "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop",
    ],
    condition: "Very Good",
  },
];

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    case "out_of_stock":
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Out of Stock</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getConditionBadge(condition: string) {
  switch (condition) {
    case "Like New":
      return <Badge variant="outline" className="border-green-500 text-green-600">Like New</Badge>;
    case "Excellent":
      return <Badge variant="outline" className="border-blue-500 text-blue-600">Excellent</Badge>;
    case "Very Good":
      return <Badge variant="outline" className="border-purple-500 text-purple-600">Very Good</Badge>;
    case "Good":
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600">Good</Badge>;
    default:
      return <Badge variant="outline">{condition}</Badge>;
  }
}

// Component to handle search params (needs Suspense)
function ProductsPageContent({ onOpenModal }: { onOpenModal: () => void }) {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (searchParams.get("action") === "add") {
      onOpenModal();
      router.replace("/products", { scroll: false });
    }
  }, [searchParams, router, onOpenModal]);

  return null;
}

export default function ProductsPage() {
  const [addProductOpen, setAddProductOpen] = useState(false);

  const handleProductSave = (data: any, isDraft: boolean) => {
    console.log("Product saved:", data, "Draft:", isDraft);
    alert(`Product "${data.title}" ${isDraft ? "saved as draft" : "created"} successfully!`);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Handle search params */}
      <Suspense fallback={null}>
        <ProductsPageContent onOpenModal={() => setAddProductOpen(true)} />
      </Suspense>

      {/* Add Product Modal */}
      <AddProductModal
        isOpen={addProductOpen}
        onClose={() => setAddProductOpen(false)}
        onSave={handleProductSave}
      />

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your product inventory and listings
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddProductOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-1 gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  className="pl-9"
                />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="handbags">Handbags</SelectItem>
                  <SelectItem value="shoes">Shoes</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Products</CardTitle>
          <CardDescription>
            {products.length} products in your inventory
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[100px]">Images</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-center">Stock</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/products/${product.slug}`}>
                      <StackedThumbnails images={product.images} maxVisible={3} />
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/${product.slug}`} className="flex flex-col">
                      <span className="font-medium hover:underline">{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {product.id} • {product.category}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{product.brand}</TableCell>
                  <TableCell>{getConditionBadge(product.condition)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        ${product.price.toLocaleString()}
                      </span>
                      {product.originalPrice > product.price && (
                        <span className="text-xs text-muted-foreground line-through">
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={product.stock === 0 ? "text-red-500" : ""}>
                      {product.stock}
                    </span>
                  </TableCell>
                  <TableCell>{getStatusBadge(product.status)}</TableCell>
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
                          <Link href={`/products/${product.slug}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/${product.slug}`}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
