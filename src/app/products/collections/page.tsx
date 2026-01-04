"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus,
  Search,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
  Package,
  Tags,
  Image as ImageIcon,
  Upload,
  X,
  Info,
} from "lucide-react";

// Mock data for collections
const collections = [
  {
    id: "col_01",
    title: "New Arrivals",
    handle: "new-arrivals",
    description: "Latest additions to our collection",
    productsCount: 24,
    thumbnail: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    status: "published",
    createdAt: "Jan 1, 2026",
    updatedAt: "Jan 1, 2026",
  },
  {
    id: "col_02",
    title: "Best Sellers",
    handle: "best-sellers",
    description: "Our most popular items",
    productsCount: 18,
    thumbnail: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=100&h=100&fit=crop",
    status: "published",
    createdAt: "Dec 15, 2025",
    updatedAt: "Dec 28, 2025",
  },
  {
    id: "col_03",
    title: "Sale",
    handle: "sale",
    description: "Special discounts and offers",
    productsCount: 12,
    thumbnail: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=100&h=100&fit=crop",
    status: "published",
    createdAt: "Dec 10, 2025",
    updatedAt: "Dec 25, 2025",
  },
  {
    id: "col_04",
    title: "Hermès Collection",
    handle: "hermes-collection",
    description: "Authentic Hermès luxury items",
    productsCount: 8,
    thumbnail: "https://images.unsplash.com/photo-1594223274512-ad4803739b7c?w=100&h=100&fit=crop",
    status: "published",
    createdAt: "Nov 20, 2025",
    updatedAt: "Dec 20, 2025",
  },
  {
    id: "col_05",
    title: "Chanel Exclusives",
    handle: "chanel-exclusives",
    description: "Curated Chanel pieces",
    productsCount: 6,
    thumbnail: "https://images.unsplash.com/photo-1591561954557-26941169b49e?w=100&h=100&fit=crop",
    status: "draft",
    createdAt: "Nov 15, 2025",
    updatedAt: "Nov 15, 2025",
  },
  {
    id: "col_06",
    title: "Winter Favorites",
    handle: "winter-favorites",
    description: "Perfect picks for the cold season",
    productsCount: 15,
    thumbnail: null,
    status: "published",
    createdAt: "Oct 1, 2025",
    updatedAt: "Dec 1, 2025",
  },
];

type CollectionFormData = {
  title: string;
  handle: string;
  description: string;
  thumbnail: File | null;
};

const initialFormData: CollectionFormData = {
  title: "",
  handle: "",
  description: "",
  thumbnail: null,
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

export default function CollectionsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [formData, setFormData] = useState<CollectionFormData>(initialFormData);
  const [searchQuery, setSearchQuery] = useState("");

  const generateHandle = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  };

  const handleClose = () => {
    setAddModalOpen(false);
    setFormData(initialFormData);
  };

  const handleSave = () => {
    console.log("Saving collection:", formData);
    alert(`Collection "${formData.title}" created successfully!`);
    handleClose();
  };

  const filteredCollections = collections.filter((col) =>
    col.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    col.handle.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Add Collection Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="max-w-4xl w-full">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Add a new collection to organize your products
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* General */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">General</h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Summer Collection"
                    value={formData.title}
                    onChange={(e) => {
                      setFormData({
                        ...formData,
                        title: e.target.value,
                        handle: formData.handle || generateHandle(e.target.value),
                      });
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="handle" className="flex items-center gap-1">
                    Handle
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 border border-r-0 rounded-l-md bg-muted text-muted-foreground text-sm">
                      /collections/
                    </span>
                    <Input
                      id="handle"
                      placeholder="summer-collection"
                      className="rounded-l-none"
                      value={formData.handle}
                      onChange={(e) => setFormData({ ...formData, handle: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">
                  Description <span className="text-muted-foreground text-xs">(Optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="A collection of summer essentials..."
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            {/* Thumbnail */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Thumbnail</h3>

              {formData.thumbnail ? (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden bg-muted">
                  <img
                    src={URL.createObjectURL(formData.thumbnail)}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setFormData({ ...formData, thumbnail: null })}
                    className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-muted-foreground/50 transition-colors">
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-xs text-muted-foreground">Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setFormData({ ...formData, thumbnail: e.target.files[0] });
                      }
                    }}
                  />
                </label>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!formData.title}>
              Create Collection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Collections</h1>
          <p className="text-muted-foreground">
            Organize products into collections for easier discovery
          </p>
        </div>
        <Button className="gap-2" onClick={() => setAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Create Collection
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Collections
            </CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{collections.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections.filter((c) => c.status === "published").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Products
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {collections.reduce((acc, c) => acc + c.productsCount, 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search collections..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Collections Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Collections</CardTitle>
          <CardDescription>
            {filteredCollections.length} collection{filteredCollections.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Collection</TableHead>
                <TableHead>Handle</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCollections.map((collection) => (
                <TableRow key={collection.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <Link href={`/products/collections/${collection.id}`}>
                      {collection.thumbnail ? (
                        <img
                          src={collection.thumbnail}
                          alt={collection.title}
                          className="h-10 w-10 rounded-md object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center">
                          <ImageIcon className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/products/collections/${collection.id}`} className="flex flex-col">
                      <span className="font-medium hover:underline">{collection.title}</span>
                      {collection.description && (
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {collection.description}
                        </span>
                      )}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      /{collection.handle}
                    </code>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{collection.productsCount}</Badge>
                  </TableCell>
                  <TableCell>{getStatusBadge(collection.status)}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {collection.updatedAt}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/products/collections/${collection.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/products/collections/${collection.id}`}>
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
              {filteredCollections.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Tags className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No collections found</p>
                      <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
                        Create your first collection
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
