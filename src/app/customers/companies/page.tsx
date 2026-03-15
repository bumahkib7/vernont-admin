"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search,
  Plus,
  X,
  ChevronDown,
  AlertCircle,
  RefreshCw,
  Building2,
  Users,
} from "lucide-react";
import {
  Company,
  CompanyStatus,
  getCompanies,
  getCompanyStatusDisplay,
} from "@/lib/api";

type Filter = {
  id: string;
  label: string;
  value: string;
};

function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const { label, color } = getCompanyStatusDisplay(status);
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilters, setActiveFilters] = useState<Filter[]>([]);
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    count: 0,
  });

  const fetchCompanies = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getCompanies({
        limit: pagination.limit,
        offset: pagination.offset,
        q: searchQuery || undefined,
      });
      setCompanies(response.companies || []);
      setPagination((prev) => ({ ...prev, count: response.count || 0 }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, [pagination.limit, pagination.offset]);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPagination((prev) => ({ ...prev, offset: 0 }));
      fetchCompanies();
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const addFilter = (filter: Filter) => {
    if (!activeFilters.find((f) => f.id === filter.id && f.value === filter.value)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  const removeFilter = (filterId: string, value: string) => {
    setActiveFilters(activeFilters.filter((f) => !(f.id === filterId && f.value === value)));
  };

  const clearFilters = () => {
    setActiveFilters([]);
  };

  const filteredCompanies = companies.filter((company) => {
    for (const filter of activeFilters) {
      if (filter.id === "status" && company.status !== filter.value) {
        return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(pagination.count / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const goToPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      offset: (page - 1) * prev.limit,
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-xl font-semibold">Companies</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={fetchCompanies} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button asChild>
              <Link href="/customers/companies/new">
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters Row */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add filter
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-0" align="start">
                  <div className="p-2">
                    <p className="text-sm font-medium mb-2 px-2">Filter by</p>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="w-full justify-between text-sm font-normal">
                          Status
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        {(["ACTIVE", "SUSPENDED", "INACTIVE"] as CompanyStatus[]).map((status) => (
                          <DropdownMenuCheckboxItem
                            key={status}
                            checked={activeFilters.some((f) => f.id === "status" && f.value === status)}
                            onCheckedChange={(checked) => {
                              if (checked) addFilter({ id: "status", label: `Status: ${getCompanyStatusDisplay(status).label}`, value: status });
                              else removeFilter("status", status);
                            }}
                          >
                            {getCompanyStatusDisplay(status).label}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </PopoverContent>
              </Popover>

              {activeFilters.map((filter) => (
                <div
                  key={`${filter.id}-${filter.value}`}
                  className="flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  <span>{filter.label}</span>
                  <button
                    onClick={() => removeFilter(filter.id, filter.value)}
                    className="ml-1 hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {activeFilters.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear all
                </Button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search companies..."
                  className="pl-8 w-[250px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Error State */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 bg-red-50 text-red-700 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={fetchCompanies} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading State */}
          {loading && companies.length === 0 ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20 ml-auto" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Payment Terms</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCompanies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        {companies.length === 0 ? "No companies yet" : "No companies match your filters"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCompanies.map((company) => (
                      <TableRow
                        key={company.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => (window.location.href = `/customers/companies/${company.id}`)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 bg-primary/10 rounded-lg flex items-center justify-center">
                              <Building2 className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.website && (
                                <p className="text-xs text-muted-foreground">{company.website}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {company.industry || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span className="text-sm">{company.contacts?.length || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {company.paymentTerms || "-"}
                        </TableCell>
                        <TableCell>
                          <CompanyStatusBadge status={company.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {pagination.count > 0 && (
                <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                  <span>
                    {pagination.offset + 1} — {Math.min(pagination.offset + pagination.limit, pagination.count)} of {pagination.count} results
                  </span>
                  <div className="flex items-center gap-2">
                    <span>
                      {currentPage} of {totalPages || 1} pages
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => goToPage(currentPage - 1)}
                    >
                      Prev
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => goToPage(currentPage + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
