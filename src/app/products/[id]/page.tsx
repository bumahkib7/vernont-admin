"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Trash2,
  Upload,
  Eye,
  Copy,
  Archive,
  Package,
  DollarSign,
  Tag,
  Layers,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

// Mock product data
const mockProduct = {
  id: "PRD-001",
  name: "Hermès Birkin 25",
  handle: "hermes-birkin-25",
  description: "The iconic Hermès Birkin bag in size 25. Crafted from premium Togo leather with palladium hardware. This pre-owned piece is in excellent condition with minimal signs of wear.",
  brand: "Hermès",
  category: "Handbags",
  subcategory: "Totes",
  status: "active",
  condition: "Excellent",
  price: 12500,
  compareAtPrice: 15000,
  costPrice: 9000,
  sku: "HB-25-BLK-001",
  barcode: "1234567890123",
  weight: 0.8,
  weightUnit: "kg",
  images: [
    { id: "1", url: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800", alt: "Front view", position: 0 },
    { id: "2", url: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800", alt: "Side view", position: 1 },
    { id: "3", url: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800", alt: "Interior", position: 2 },
    { id: "4", url: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=800", alt: "Details", position: 3 },
  ],
  variants: [
    { id: "v1", title: "Black / Gold Hardware", sku: "HB-25-BLK-GLD", price: 12500, stock: 2, options: { color: "Black", hardware: "Gold" } },
    { id: "v2", title: "Black / Palladium Hardware", sku: "HB-25-BLK-PAL", price: 12500, stock: 1, options: { color: "Black", hardware: "Palladium" } },
    { id: "v3", title: "Etoupe / Gold Hardware", sku: "HB-25-ETP-GLD", price: 13000, stock: 0, options: { color: "Etoupe", hardware: "Gold" } },
  ],
  options: [
    { name: "Color", values: ["Black", "Etoupe", "Gold", "Etain"] },
    { name: "Hardware", values: ["Gold", "Palladium", "Rose Gold"] },
  ],
  tags: ["luxury", "birkin", "hermes", "togo-leather", "pre-owned"],
  vendor: "Vernont Authenticated",
  collections: ["New Arrivals", "Hermès Collection", "Handbags"],
  seo: {
    title: "Hermès Birkin 25 - Pre-Owned Luxury | Vernont",
    description: "Shop authenticated pre-owned Hermès Birkin 25 at Vernont. Free authentication and shipping.",
  },
  createdAt: "2024-01-10",
  updatedAt: "2024-01-15",
};

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    case "draft":
      return <Badge className="bg-gray-100 text-gray-800">Draft</Badge>;
    case "archived":
      return <Badge className="bg-yellow-100 text-yellow-800">Archived</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function getConditionBadge(condition: string) {
  const colors: Record<string, string> = {
    "Like New": "border-green-500 text-green-600",
    "Excellent": "border-blue-500 text-blue-600",
    "Very Good": "border-purple-500 text-purple-600",
    "Good": "border-yellow-500 text-yellow-600",
  };
  return <Badge variant="outline" className={colors[condition] || ""}>{condition}</Badge>;
}

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [product] = useState(mockProduct);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">{product.name}</h1>
              {getStatusBadge(product.status)}
            </div>
            <p className="text-sm text-muted-foreground">
              {product.id} · Last updated {product.updatedAt}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button variant="outline" size="sm">
            <Copy className="mr-2 h-4 w-4" />
            Duplicate
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Archive className="mr-2 h-4 w-4" />
                Archive Product
              </DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Product
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button>Save Changes</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Product Name</Label>
                  <Input id="name" defaultValue={product.name} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle">Handle</Label>
                  <Input id="handle" defaultValue={product.handle} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  defaultValue={product.description}
                  className="min-h-[120px]"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="brand">Brand</Label>
                  <Input id="brand" defaultValue={product.brand} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select defaultValue={product.category}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Handbags">Handbags</SelectItem>
                      <SelectItem value="Shoes">Shoes</SelectItem>
                      <SelectItem value="Accessories">Accessories</SelectItem>
                      <SelectItem value="Clothing">Clothing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="condition">Condition</Label>
                  <Select defaultValue={product.condition}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Like New">Like New</SelectItem>
                      <SelectItem value="Excellent">Excellent</SelectItem>
                      <SelectItem value="Very Good">Very Good</SelectItem>
                      <SelectItem value="Good">Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Media
              </CardTitle>
              <CardDescription>
                Drag and drop to reorder images. First image is the thumbnail.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {/* Main Image */}
                <div className="relative aspect-square max-w-md overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].alt}
                    fill
                    className="object-cover"
                    sizes="400px"
                  />
                </div>
                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border-2 ${
                        selectedImage === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <Image
                        src={image.url}
                        alt={image.alt}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </button>
                  ))}
                  <button className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-md border-2 border-dashed hover:border-primary hover:bg-muted">
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="price" type="number" defaultValue={product.price} className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="compareAtPrice">Compare at Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="compareAtPrice" type="number" defaultValue={product.compareAtPrice} className="pl-7" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input id="costPrice" type="number" defaultValue={product.costPrice} className="pl-7" />
                  </div>
                </div>
              </div>
              <div className="mt-4 rounded-lg bg-muted p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Profit Margin</span>
                  <span className="font-medium text-green-600">
                    ${(product.price - product.costPrice).toLocaleString()} ({Math.round(((product.price - product.costPrice) / product.price) * 100)}%)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Variants
                </CardTitle>
                <CardDescription>
                  Manage product options and variants
                </CardDescription>
              </div>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Variant
              </Button>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="variants">
                <TabsList>
                  <TabsTrigger value="variants">Variants ({product.variants.length})</TabsTrigger>
                  <TabsTrigger value="options">Options ({product.options.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="variants" className="mt-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Variant</TableHead>
                        <TableHead>SKU</TableHead>
                        <TableHead className="text-right">Price</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.map((variant) => (
                        <TableRow key={variant.id}>
                          <TableCell className="font-medium">{variant.title}</TableCell>
                          <TableCell className="text-muted-foreground">{variant.sku}</TableCell>
                          <TableCell className="text-right">${variant.price.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={variant.stock > 0 ? "secondary" : "destructive"}>
                              {variant.stock}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TabsContent>
                <TabsContent value="options" className="mt-4 space-y-4">
                  {product.options.map((option, index) => (
                    <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="flex-1">
                        <p className="font-medium">{option.name}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {option.values.map((value) => (
                            <Badge key={value} variant="outline">{value}</Badge>
                          ))}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">Edit</Button>
                    </div>
                  ))}
                  <Button variant="outline" className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status */}
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Product Status</Label>
                <Select defaultValue={product.status}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Tag className="h-5 w-5" />
                Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Collections</Label>
                <div className="flex flex-wrap gap-2">
                  {product.collections.map((collection) => (
                    <Badge key={collection} variant="secondary">
                      {collection}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                  <Button variant="outline" size="sm" className="h-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label htmlFor="vendor">Vendor</Label>
                <Input id="vendor" defaultValue={product.vendor} />
              </div>
            </CardContent>
          </Card>

          {/* Inventory */}
          <Card>
            <CardHeader>
              <CardTitle>Inventory</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input id="sku" defaultValue={product.sku} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="barcode">Barcode</Label>
                  <Input id="barcode" defaultValue={product.barcode} />
                </div>
              </div>
              <div className="rounded-lg bg-muted p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Stock</span>
                  <span className="font-medium">
                    {product.variants.reduce((sum, v) => sum + v.stock, 0)} units
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight</Label>
                  <Input id="weight" type="number" defaultValue={product.weight} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weightUnit">Unit</Label>
                  <Select defaultValue={product.weightUnit}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="lb">lb</SelectItem>
                      <SelectItem value="oz">oz</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
