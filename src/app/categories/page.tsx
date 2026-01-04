"use client";

import { useState } from "react";
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
  Search,
  Plus,
  MoreHorizontal,
  Edit,
  Trash2,
  ChevronRight,
  Folder,
  FolderOpen,
  GripVertical,
  Eye,
  EyeOff,
  Package,
  Layers,
} from "lucide-react";

// Mock data - hierarchical categories
const categories = [
  {
    id: "cat-1",
    name: "Handbags",
    slug: "handbags",
    description: "Luxury handbags and totes",
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=100&h=100&fit=crop",
    productsCount: 45,
    isActive: true,
    children: [
      {
        id: "cat-1-1",
        name: "Totes",
        slug: "totes",
        description: "Classic tote bags",
        productsCount: 15,
        isActive: true,
        children: [],
      },
      {
        id: "cat-1-2",
        name: "Crossbody",
        slug: "crossbody",
        description: "Crossbody and shoulder bags",
        productsCount: 12,
        isActive: true,
        children: [],
      },
      {
        id: "cat-1-3",
        name: "Clutches",
        slug: "clutches",
        description: "Evening clutches and minaudieres",
        productsCount: 8,
        isActive: true,
        children: [],
      },
      {
        id: "cat-1-4",
        name: "Top Handle",
        slug: "top-handle",
        description: "Classic top handle bags",
        productsCount: 10,
        isActive: true,
        children: [],
      },
    ],
  },
  {
    id: "cat-2",
    name: "Shoes",
    slug: "shoes",
    description: "Designer footwear",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=100&h=100&fit=crop",
    productsCount: 32,
    isActive: true,
    children: [
      {
        id: "cat-2-1",
        name: "Heels",
        slug: "heels",
        description: "High heels and pumps",
        productsCount: 12,
        isActive: true,
        children: [],
      },
      {
        id: "cat-2-2",
        name: "Flats",
        slug: "flats",
        description: "Ballet flats and loafers",
        productsCount: 8,
        isActive: true,
        children: [],
      },
      {
        id: "cat-2-3",
        name: "Sneakers",
        slug: "sneakers",
        description: "Luxury sneakers",
        productsCount: 7,
        isActive: true,
        children: [],
      },
      {
        id: "cat-2-4",
        name: "Boots",
        slug: "boots",
        description: "Ankle and knee-high boots",
        productsCount: 5,
        isActive: false,
        children: [],
      },
    ],
  },
  {
    id: "cat-3",
    name: "Accessories",
    slug: "accessories",
    description: "Luxury accessories",
    image: "https://images.unsplash.com/photo-1606760227091-3dd870d97f1d?w=100&h=100&fit=crop",
    productsCount: 28,
    isActive: true,
    children: [
      {
        id: "cat-3-1",
        name: "Wallets",
        slug: "wallets",
        description: "Leather wallets and card holders",
        productsCount: 10,
        isActive: true,
        children: [],
      },
      {
        id: "cat-3-2",
        name: "Belts",
        slug: "belts",
        description: "Designer belts",
        productsCount: 8,
        isActive: true,
        children: [],
      },
      {
        id: "cat-3-3",
        name: "Scarves",
        slug: "scarves",
        description: "Silk scarves and shawls",
        productsCount: 6,
        isActive: true,
        children: [],
      },
      {
        id: "cat-3-4",
        name: "Sunglasses",
        slug: "sunglasses",
        description: "Designer sunglasses",
        productsCount: 4,
        isActive: true,
        children: [],
      },
    ],
  },
  {
    id: "cat-4",
    name: "Clothing",
    slug: "clothing",
    description: "Designer clothing",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100&h=100&fit=crop",
    productsCount: 18,
    isActive: true,
    children: [
      {
        id: "cat-4-1",
        name: "Dresses",
        slug: "dresses",
        description: "Designer dresses",
        productsCount: 8,
        isActive: true,
        children: [],
      },
      {
        id: "cat-4-2",
        name: "Tops",
        slug: "tops",
        description: "Blouses and tops",
        productsCount: 6,
        isActive: true,
        children: [],
      },
      {
        id: "cat-4-3",
        name: "Outerwear",
        slug: "outerwear",
        description: "Jackets and coats",
        productsCount: 4,
        isActive: true,
        children: [],
      },
    ],
  },
  {
    id: "cat-5",
    name: "Watches",
    slug: "watches",
    description: "Luxury timepieces",
    image: "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=100&h=100&fit=crop",
    productsCount: 12,
    isActive: false,
    children: [],
  },
  {
    id: "cat-6",
    name: "Jewelry",
    slug: "jewelry",
    description: "Fine jewelry",
    image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=100&h=100&fit=crop",
    productsCount: 8,
    isActive: true,
    children: [],
  },
];

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productsCount: number;
  isActive: boolean;
  children: Category[];
};

function CategoryRow({
  category,
  level = 0,
  expanded,
  onToggle,
}: {
  category: Category;
  level?: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = category.children && category.children.length > 0;
  const isExpanded = expanded.has(category.id);

  return (
    <>
      <TableRow className="group">
        <TableCell>
          <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
            <GripVertical className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 cursor-grab" />
            {hasChildren ? (
              <button
                onClick={() => onToggle(category.id)}
                className="flex items-center justify-center"
              >
                <ChevronRight
                  className={`h-4 w-4 text-muted-foreground transition-transform ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              </button>
            ) : (
              <span className="w-4" />
            )}
            {category.image && level === 0 ? (
              <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
                <Image
                  src={category.image}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-muted">
                {hasChildren ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Folder className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            )}
            <div>
              <span className="font-medium">{category.name}</span>
              {category.description && (
                <p className="text-xs text-muted-foreground">{category.description}</p>
              )}
            </div>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{category.slug}</TableCell>
        <TableCell className="text-center">{category.productsCount}</TableCell>
        <TableCell>
          {category.isActive ? (
            <Badge className="bg-green-100 text-green-800">Active</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
          )}
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
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Edit className="mr-2 h-4 w-4" />
                Edit Category
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Plus className="mr-2 h-4 w-4" />
                Add Subcategory
              </DropdownMenuItem>
              <DropdownMenuItem>
                {category.isActive ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" />
                    Deactivate
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Category
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {hasChildren &&
        isExpanded &&
        category.children.map((child) => (
          <CategoryRow
            key={child.id}
            category={child}
            level={level + 1}
            expanded={expanded}
            onToggle={onToggle}
          />
        ))}
    </>
  );
}

export default function CategoriesPage() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const totalProducts = categories.reduce((acc, cat) => acc + cat.productsCount, 0);
  const activeCategories = categories.filter((c) => c.isActive).length;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Organize your products into categories
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-blue-100 p-2">
              <Layers className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Categories</p>
              <p className="text-2xl font-bold">{categories.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-green-100 p-2">
              <Folder className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Active Categories</p>
              <p className="text-2xl font-bold">{activeCategories}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="rounded-full bg-purple-100 p-2">
              <Package className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Products</p>
              <p className="text-2xl font-bold">{totalProducts}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search categories..." className="pl-9" />
          </div>
        </CardContent>
      </Card>

      {/* Categories Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Categories</CardTitle>
          <CardDescription>
            Drag and drop to reorder. Click the arrow to expand subcategories.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[400px]">Category</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Products</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((category) => (
                <CategoryRow
                  key={category.id}
                  category={category}
                  expanded={expanded}
                  onToggle={toggleExpanded}
                />
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
