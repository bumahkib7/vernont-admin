"use client";

import { useEffect, useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sparkles,
  Search,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Package,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  title: string;
  status: string;
  thumbnail?: string;
  hasContent: boolean;
}

export default function GenerateContentPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    fetchProductsNeedingContent();
  }, []);

  const fetchProductsNeedingContent = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/content/products-needing-content");
      if (response.ok) {
        const data = await response.json();
        // Backend returns a Spring Page object with 'content' array
        setProducts(Array.isArray(data) ? data : (data.content || []));
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectProduct = (productId: string) => {
    const newSelected = new Set(selectedProducts);
    if (newSelected.has(productId)) {
      newSelected.delete(productId);
    } else {
      newSelected.add(productId);
    }
    setSelectedProducts(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const handleGenerateContent = async () => {
    if (selectedProducts.size === 0) {
      toast.error("Please select at least one product");
      return;
    }

    setGenerating(true);
    const productIds = Array.from(selectedProducts);

    try {
      const response = await fetch("/api/admin/content/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productIds }),
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(
          `Content generation started for ${productIds.length} product(s)`,
          {
            description: "Check the dashboard for progress updates",
          }
        );
        setSelectedProducts(new Set());
        fetchProductsNeedingContent();
      } else {
        const error = await response.json();
        toast.error("Failed to start content generation", {
          description: error.message || "Please try again",
        });
      }
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Error starting content generation");
    } finally {
      setGenerating(false);
    }
  };

  const filteredProducts = products.filter((product) =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const productsWithoutContent = filteredProducts.filter((p) => !p.hasContent);
  const productsWithContent = filteredProducts.filter((p) => p.hasContent);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-primary" />
          Generate SEO Content
        </h1>
        <p className="text-muted-foreground mt-2">
          Select products to generate AI-powered SEO content
        </p>
      </div>

      {/* Search and Actions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Select Products</CardTitle>
              <CardDescription>
                {selectedProducts.size} product(s) selected
              </CardDescription>
            </div>
            <Button
              onClick={handleGenerateContent}
              disabled={selectedProducts.size === 0 || generating}
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate Content ({selectedProducts.size})
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search products..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Products Without Content ({productsWithoutContent.length})
          </CardTitle>
          <CardDescription>
            These products are missing AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <Sparkles className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : productsWithoutContent.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <p className="text-lg font-medium">All products have content!</p>
              <p className="text-muted-foreground mb-4">
                Every published product already has AI-generated content
              </p>
              <Link href="/content/list">
                <Button variant="outline">View All Content</Button>
              </Link>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]">
                    <Checkbox
                      checked={
                        selectedProducts.size > 0 &&
                        selectedProducts.size === productsWithoutContent.length
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithoutContent.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedProducts.has(product.id)}
                        onCheckedChange={() => handleSelectProduct(product.id)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        {product.thumbnail ? (
                          <img
                            src={product.thumbnail}
                            alt={product.title}
                            className="h-10 w-10 rounded object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span>{product.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        No Content
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Products with Content */}
      {productsWithContent.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              Products With Content ({productsWithContent.length})
            </CardTitle>
            <CardDescription>
              These products already have AI-generated content
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Content Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productsWithContent.slice(0, 10).map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="font-medium">
                      {product.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                        <CheckCircle2 className="mr-1 h-3 w-3" />
                        Has Content
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Link href="/content/list">
                        <Button variant="ghost" size="sm">
                          View Content
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
