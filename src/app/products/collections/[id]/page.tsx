"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Package,
  Plus,
  Search,
  Upload,
  X,
  Copy,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import { StackedThumbnails } from "@/components/ui/thumbnail";

// Mock collection data
const mockCollections: Record<string, any> = {
  col_01: {
    id: "col_01",
    title: "New Arrivals",
    handle: "new-arrivals",
    description: "Latest additions to our collection. Fresh picks from top luxury brands.",
    thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&h=400&fit=crop",
    status: "published",
    createdAt: "Jan 1, 2026",
    updatedAt: "Jan 1, 2026",
    metadata: {},
    products: [
      {
        id: "PRD-001",
        name: "Hermès Birkin 25",
        images: ["https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop"],
        price: 12500,
        status: "active",
      },
      {
        id: "PRD-002",
        name: "Chanel Classic Flap",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop"],
        price: 8200,
        status: "active",
      },
      {
        id: "PRD-003",
        name: "Louis Vuitton Neverfull",
        images: ["https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop"],
        price: 2100,
        status: "active",
      },
    ],
  },
  col_02: {
    id: "col_02",
    title: "Best Sellers",
    handle: "best-sellers",
    description: "Our most popular items loved by customers worldwide.",
    thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400&h=400&fit=crop",
    status: "published",
    createdAt: "Dec 15, 2025",
    updatedAt: "Dec 28, 2025",
    metadata: {},
    products: [
      {
        id: "PRD-002",
        name: "Chanel Classic Flap",
        images: ["https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop"],
        price: 8200,
        status: "active",
      },
      {
        id: "PRD-005",
        name: "Dior Lady Dior",
        images: ["https://images.unsplash.com/photo-1591561954557-26941169b49e?w=100&h=100&fit=crop"],
        price: 5800,
        status: "active",
      },
    ],
  },
};

// Default collection for any other ID
const defaultCollection = {
  id: "default",
  title: "Sample Collection",
  handle: "sample-collection",
  description: "A sample collection for demonstration purposes.",
  thumbnail: null,
  status: "draft",
  createdAt: "Jan 1, 2026",
  updatedAt: "Jan 1, 2026",
  metadata: {},
  products: [],
};

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Published</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getProductStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Draft</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function CollectionDetailPage() {
  const params = useParams();
  const collectionId = params.id as string;
  const collection = mockCollections[collectionId] || defaultCollection;

  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addProductsModalOpen, setAddProductsModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: collection.title,
    handle: collection.handle,
    description: collection.description,
  });

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const handleSaveEdit = () => {
    console.log("Saving:", editForm);
    alert("Collection updated successfully!");
    setEditModalOpen(false);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update collection details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-handle">Handle</Label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                    /collections/
                  </span>
                  <Input
                    id="edit-handle"
                    className="rounded-l-none"
                    value={editForm.handle}
                    onChange={(e) => setEditForm({ ...editForm, handle: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                rows={3}
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Products Modal */}
      <Dialog open={addProductsModalOpen} onOpenChange={setAddProductsModalOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Add Products</DialogTitle>
            <DialogDescription>
              Search and add products to this collection
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search products..." className="pl-9" />
            </div>

            <div className="border rounded-lg p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-2">Search for products to add</p>
              <p className="text-xs text-muted-foreground">
                Products will appear here as you type
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddProductsModalOpen(false)}>
              Cancel
            </Button>
            <Button disabled>Add Selected</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/products">Products</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/products/collections">Collections</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{collection.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  {collection.thumbnail ? (
                    <img
                      src={collection.thumbnail}
                      alt={collection.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h1 className="text-2xl font-semibold">{collection.title}</h1>
                      {getStatusBadge(collection.status)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <code className="bg-muted px-1.5 py-0.5 rounded">/{collection.handle}</code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleCopy(collection.handle)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    {collection.description && (
                      <p className="text-sm text-muted-foreground mt-2 max-w-lg">
                        {collection.description}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View on Store
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>

          {/* Products Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  {collection.products.length} product{collection.products.length !== 1 ? "s" : ""} in this collection
                </CardDescription>
              </div>
              <Button onClick={() => setAddProductsModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Products
              </Button>
            </CardHeader>
            <CardContent>
              {collection.products.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">No products in this collection</p>
                  <Button variant="outline" onClick={() => setAddProductsModalOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add your first product
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collection.products.map((product: any) => (
                      <TableRow key={product.id}>
                        <TableCell>
                          <StackedThumbnails images={product.images} maxVisible={1} />
                        </TableCell>
                        <TableCell>
                          <Link href={`/products/${product.id}`} className="font-medium hover:underline">
                            {product.name}
                          </Link>
                        </TableCell>
                        <TableCell className="text-right">
                          ${product.price.toLocaleString()}
                        </TableCell>
                        <TableCell>{getProductStatusBadge(product.status)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/products/${product.id}`}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  View Product
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove from Collection
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Thumbnail Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Thumbnail</CardTitle>
              <Button variant="ghost" size="sm">
                <Pencil className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {collection.thumbnail ? (
                <img
                  src={collection.thumbnail}
                  alt={collection.title}
                  className="w-full aspect-square rounded-lg object-cover"
                />
              ) : (
                <label className="flex flex-col items-center justify-center w-full aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm text-muted-foreground">Upload thumbnail</span>
                  <input type="file" accept="image/*" className="hidden" />
                </label>
              )}
            </CardContent>
          </Card>

          {/* Details Card */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">{collection.createdAt}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Updated</span>
                <span className="text-sm">{collection.updatedAt}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                {getStatusBadge(collection.status)}
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Products</span>
                <span className="text-sm">{collection.products.length}</span>
              </div>
            </CardContent>
          </Card>

          {/* Metadata Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Metadata</CardTitle>
              <Button variant="ghost" size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {Object.keys(collection.metadata).length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No metadata added
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(collection.metadata).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key}</span>
                      <span>{String(value)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
