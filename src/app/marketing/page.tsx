"use client";

import Link from "next/link";
import {
  Megaphone,
  BarChart3,
  Share2,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Eye,
  MousePointer,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const stats = [
  {
    title: "Total Ad Spend",
    value: "$0.00",
    change: "No data yet",
    icon: DollarSign,
  },
  {
    title: "Impressions",
    value: "0",
    change: "No data yet",
    icon: Eye,
  },
  {
    title: "Clicks",
    value: "0",
    change: "No data yet",
    icon: MousePointer,
  },
  {
    title: "ROAS",
    value: "0.00x",
    change: "No data yet",
    icon: TrendingUp,
  },
];

const sections = [
  {
    title: "Ad Platforms",
    description: "Connect Google Ads, Meta Ads, and Pinterest to manage campaigns from one place.",
    icon: Share2,
    href: "/marketing/advertising",
    action: "Connect Platforms",
  },
  {
    title: "Campaigns",
    description: "Create and manage ad campaigns across all connected platforms.",
    icon: Megaphone,
    href: "/marketing/advertising/campaigns",
    action: "View Campaigns",
  },
  {
    title: "Performance",
    description: "Track cross-platform performance metrics, ROAS, and conversions.",
    icon: BarChart3,
    href: "/marketing/advertising/performance",
    action: "View Performance",
  },
  {
    title: "Product Catalog",
    description: "Sync your product catalog to ad platforms for shopping campaigns.",
    icon: ShoppingBag,
    href: "/marketing/advertising/catalogs",
    action: "Manage Catalog",
  },
];

export default function MarketingPage() {
  return (
    <div className="p-4 sm:p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Marketing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your advertising campaigns across multiple platforms.
        </p>
      </div>

      {/* Stats overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => (
          <Card key={section.title} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <section.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">{section.title}</CardTitle>
                  <CardDescription className="mt-1">
                    {section.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" asChild>
                <Link href={section.href}>
                  {section.action}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
