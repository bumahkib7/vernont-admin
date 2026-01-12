"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  MoreHorizontal,
  Plus,
  Loader2,
  Pencil,
  Trash2,
  AlertCircle,
  Warehouse,
  Truck,
  Wifi,
  WifiOff,
  MapPin,
} from "lucide-react";
import {
  getStockLocations,
  createStockLocation,
  updateStockLocation,
  deleteStockLocation,
  getShippingProfiles,
  createShippingProfile,
  updateShippingProfile,
  deleteShippingProfile,
  ApiError,
  type StockLocation,
  type ShippingProfile,
  type CreateStockLocationInput,
  type UpdateStockLocationInput,
  type CreateShippingProfileInput,
  type UpdateShippingProfileInput,
} from "@/lib/api";
import { useWebSocket } from "@/hooks/use-websocket";

export default function LocationsSettingsPage() {
  // Stock Locations state
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);
  const [locationsError, setLocationsError] = useState<string | null>(null);

  // Shipping Profiles state
  const [profiles, setProfiles] = useState<ShippingProfile[]>([]);
  const [isLoadingProfiles, setIsLoadingProfiles] = useState(true);
  const [profilesError, setProfilesError] = useState<string | null>(null);

  // WebSocket for real-time updates
  const { isConnected, subscribe } = useWebSocket();

  // Create Location modal state
  const [isCreateLocationOpen, setIsCreateLocationOpen] = useState(false);
  const [createLocationName, setCreateLocationName] = useState("");
  const [createLocationAddress, setCreateLocationAddress] = useState("");
  const [createLocationCity, setCreateLocationCity] = useState("");
  const [createLocationProvince, setCreateLocationProvince] = useState("");
  const [createLocationPostalCode, setCreateLocationPostalCode] = useState("");
  const [createLocationCountryCode, setCreateLocationCountryCode] = useState("");
  const [createLocationPhone, setCreateLocationPhone] = useState("");
  const [createLocationPriority, setCreateLocationPriority] = useState("0");
  const [createLocationFulfillment, setCreateLocationFulfillment] = useState(true);
  const [isCreatingLocation, setIsCreatingLocation] = useState(false);
  const [createLocationError, setCreateLocationError] = useState<string | null>(null);

  // Edit Location modal state
  const [isEditLocationOpen, setIsEditLocationOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<StockLocation | null>(null);
  const [editLocationName, setEditLocationName] = useState("");
  const [editLocationAddress, setEditLocationAddress] = useState("");
  const [editLocationCity, setEditLocationCity] = useState("");
  const [editLocationProvince, setEditLocationProvince] = useState("");
  const [editLocationPostalCode, setEditLocationPostalCode] = useState("");
  const [editLocationCountryCode, setEditLocationCountryCode] = useState("");
  const [editLocationPhone, setEditLocationPhone] = useState("");
  const [editLocationPriority, setEditLocationPriority] = useState("");
  const [editLocationFulfillment, setEditLocationFulfillment] = useState(true);
  const [isUpdatingLocation, setIsUpdatingLocation] = useState(false);
  const [editLocationError, setEditLocationError] = useState<string | null>(null);

  // Delete Location confirmation state
  const [isDeleteLocationOpen, setIsDeleteLocationOpen] = useState(false);
  const [deletingLocation, setDeletingLocation] = useState<StockLocation | null>(null);
  const [isDeletingLocation, setIsDeletingLocation] = useState(false);

  // Create Profile modal state
  const [isCreateProfileOpen, setIsCreateProfileOpen] = useState(false);
  const [createProfileName, setCreateProfileName] = useState("");
  const [createProfileType, setCreateProfileType] = useState("default");
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [createProfileError, setCreateProfileError] = useState<string | null>(null);

  // Edit Profile modal state
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<ShippingProfile | null>(null);
  const [editProfileName, setEditProfileName] = useState("");
  const [editProfileType, setEditProfileType] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editProfileError, setEditProfileError] = useState<string | null>(null);

  // Delete Profile confirmation state
  const [isDeleteProfileOpen, setIsDeleteProfileOpen] = useState(false);
  const [deletingProfile, setDeletingProfile] = useState<ShippingProfile | null>(null);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  // Extract error message from API error
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "An unexpected error occurred";
  };

  // Fetch stock locations
  const fetchLocations = useCallback(async () => {
    try {
      setIsLoadingLocations(true);
      setLocationsError(null);
      const response = await getStockLocations({ limit: 100 });
      setLocations(response.locations || []);
    } catch (err) {
      setLocationsError(getErrorMessage(err));
    } finally {
      setIsLoadingLocations(false);
    }
  }, []);

  // Fetch shipping profiles
  const fetchProfiles = useCallback(async () => {
    try {
      setIsLoadingProfiles(true);
      setProfilesError(null);
      const response = await getShippingProfiles({ limit: 100 });
      setProfiles(response.profiles || []);
    } catch (err) {
      setProfilesError(getErrorMessage(err));
    } finally {
      setIsLoadingProfiles(false);
    }
  }, []);

  useEffect(() => {
    fetchLocations();
    fetchProfiles();
  }, [fetchLocations, fetchProfiles]);

  // Subscribe to WebSocket for real-time updates
  useEffect(() => {
    if (!isConnected) return;

    const subscription = subscribe("/topic/auditlog", (message) => {
      const auditLog = message as {
        entityType?: string;
        action?: string;
      };

      // Refetch on StockLocation or ShippingProfile changes
      if (auditLog.entityType === "StockLocation") {
        fetchLocations();
      }
      if (auditLog.entityType === "ShippingProfile") {
        fetchProfiles();
      }
    });

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [isConnected, subscribe, fetchLocations, fetchProfiles]);

  // =========================================================================
  // Stock Location Handlers
  // =========================================================================

  const handleCreateLocation = async () => {
    if (!createLocationName) {
      setCreateLocationError("Name is required");
      return;
    }

    try {
      setIsCreatingLocation(true);
      setCreateLocationError(null);

      const data: CreateStockLocationInput = {
        name: createLocationName,
        address: createLocationAddress || undefined,
        city: createLocationCity || undefined,
        province: createLocationProvince || undefined,
        postalCode: createLocationPostalCode || undefined,
        countryCode: createLocationCountryCode || undefined,
        phone: createLocationPhone || undefined,
        priority: createLocationPriority ? parseInt(createLocationPriority) : 0,
        fulfillmentEnabled: createLocationFulfillment,
      };

      await createStockLocation(data);
      setIsCreateLocationOpen(false);
      resetCreateLocationForm();
      fetchLocations();
    } catch (err) {
      setCreateLocationError(getErrorMessage(err));
    } finally {
      setIsCreatingLocation(false);
    }
  };

  const resetCreateLocationForm = () => {
    setCreateLocationName("");
    setCreateLocationAddress("");
    setCreateLocationCity("");
    setCreateLocationProvince("");
    setCreateLocationPostalCode("");
    setCreateLocationCountryCode("");
    setCreateLocationPhone("");
    setCreateLocationPriority("0");
    setCreateLocationFulfillment(true);
    setCreateLocationError(null);
  };

  const openEditLocationModal = (location: StockLocation) => {
    setEditingLocation(location);
    setEditLocationName(location.name);
    setEditLocationAddress(location.address || location.address_1 || "");
    setEditLocationCity(location.city || "");
    setEditLocationProvince(location.province || "");
    setEditLocationPostalCode(location.postal_code || "");
    setEditLocationCountryCode(location.country_code || "");
    setEditLocationPhone(location.phone || "");
    setEditLocationPriority(location.priority?.toString() || "0");
    setEditLocationFulfillment(location.fulfillment_enabled);
    setEditLocationError(null);
    setIsEditLocationOpen(true);
  };

  const handleUpdateLocation = async () => {
    if (!editingLocation || !editLocationName) {
      setEditLocationError("Name is required");
      return;
    }

    try {
      setIsUpdatingLocation(true);
      setEditLocationError(null);

      const data: UpdateStockLocationInput = {
        name: editLocationName,
        address: editLocationAddress || undefined,
        city: editLocationCity || undefined,
        province: editLocationProvince || undefined,
        postalCode: editLocationPostalCode || undefined,
        countryCode: editLocationCountryCode || undefined,
        phone: editLocationPhone || undefined,
        priority: editLocationPriority ? parseInt(editLocationPriority) : undefined,
        fulfillmentEnabled: editLocationFulfillment,
      };

      await updateStockLocation(editingLocation.id, data);
      setIsEditLocationOpen(false);
      setEditingLocation(null);
      fetchLocations();
    } catch (err) {
      setEditLocationError(getErrorMessage(err));
    } finally {
      setIsUpdatingLocation(false);
    }
  };

  const openDeleteLocationConfirm = (location: StockLocation) => {
    setDeletingLocation(location);
    setIsDeleteLocationOpen(true);
  };

  const handleDeleteLocation = async () => {
    if (!deletingLocation) return;

    try {
      setIsDeletingLocation(true);
      await deleteStockLocation(deletingLocation.id);
      setIsDeleteLocationOpen(false);
      setDeletingLocation(null);
      fetchLocations();
    } catch (err) {
      console.error("Failed to delete location:", err);
    } finally {
      setIsDeletingLocation(false);
    }
  };

  // =========================================================================
  // Shipping Profile Handlers
  // =========================================================================

  const handleCreateProfile = async () => {
    if (!createProfileName) {
      setCreateProfileError("Name is required");
      return;
    }

    try {
      setIsCreatingProfile(true);
      setCreateProfileError(null);

      const data: CreateShippingProfileInput = {
        name: createProfileName,
        type: createProfileType || "default",
      };

      await createShippingProfile(data);
      setIsCreateProfileOpen(false);
      resetCreateProfileForm();
      fetchProfiles();
    } catch (err) {
      setCreateProfileError(getErrorMessage(err));
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const resetCreateProfileForm = () => {
    setCreateProfileName("");
    setCreateProfileType("default");
    setCreateProfileError(null);
  };

  const openEditProfileModal = (profile: ShippingProfile) => {
    setEditingProfile(profile);
    setEditProfileName(profile.name);
    setEditProfileType(profile.type);
    setEditProfileError(null);
    setIsEditProfileOpen(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile || !editProfileName) {
      setEditProfileError("Name is required");
      return;
    }

    try {
      setIsUpdatingProfile(true);
      setEditProfileError(null);

      const data: UpdateShippingProfileInput = {
        name: editProfileName,
        type: editProfileType || undefined,
      };

      await updateShippingProfile(editingProfile.id, data);
      setIsEditProfileOpen(false);
      setEditingProfile(null);
      fetchProfiles();
    } catch (err) {
      setEditProfileError(getErrorMessage(err));
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const openDeleteProfileConfirm = (profile: ShippingProfile) => {
    setDeletingProfile(profile);
    setIsDeleteProfileOpen(true);
  };

  const handleDeleteProfile = async () => {
    if (!deletingProfile) return;

    try {
      setIsDeletingProfile(true);
      await deleteShippingProfile(deletingProfile.id);
      setIsDeleteProfileOpen(false);
      setDeletingProfile(null);
      fetchProfiles();
    } catch (err) {
      console.error("Failed to delete profile:", err);
    } finally {
      setIsDeletingProfile(false);
    }
  };

  // Format address display
  const formatAddress = (location: StockLocation): string => {
    const parts = [
      location.address || location.address_1,
      location.city,
      location.province,
      location.postal_code,
      location.country_code,
    ].filter(Boolean);
    return parts.join(", ") || "No address";
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Locations & Shipping</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Stock Locations Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Stock Locations
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-gray-500 gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Manage your inventory locations</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateLocationOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Location
          </Button>
        </CardHeader>
        <CardContent>
          {/* Error state */}
          {locationsError && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{locationsError}</span>
              <Button variant="outline" size="sm" onClick={fetchLocations} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoadingLocations ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Address</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {locations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No locations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    locations.map((location) => (
                      <TableRow key={location.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Warehouse className="h-4 w-4 text-muted-foreground" />
                            {location.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {formatAddress(location)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{location.priority}</Badge>
                        </TableCell>
                        <TableCell>
                          {location.fulfillment_enabled ? (
                            <Badge className="bg-green-100 text-green-800">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Disabled</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditLocationModal(location)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Location
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteLocationConfirm(location)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Location
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {locations.length} location{locations.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Shipping Profiles Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Shipping Profiles
              {isConnected ? (
                <Badge variant="outline" className="text-green-600 border-green-600 gap-1">
                  <Wifi className="h-3 w-3" />
                  Live
                </Badge>
              ) : (
                <Badge variant="outline" className="text-gray-500 border-gray-500 gap-1">
                  <WifiOff className="h-3 w-3" />
                  Offline
                </Badge>
              )}
            </CardTitle>
            <CardDescription>Manage how products are shipped</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsCreateProfileOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Profile
          </Button>
        </CardHeader>
        <CardContent>
          {/* Error state */}
          {profilesError && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{profilesError}</span>
              <Button variant="outline" size="sm" onClick={fetchProfiles} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoadingProfiles ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No shipping profiles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    profiles.map((profile) => (
                      <TableRow key={profile.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-muted-foreground" />
                            {profile.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{profile.type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {profile.product_count} products
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditProfileModal(profile)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit Profile
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openDeleteProfileConfirm(profile)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Profile
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              <div className="mt-4 text-sm text-muted-foreground">
                {profiles.length} profile{profiles.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* =========================================================================
          Create Location Dialog
          ========================================================================= */}
      <Dialog
        open={isCreateLocationOpen}
        onOpenChange={(open) => {
          setIsCreateLocationOpen(open);
          if (!open) resetCreateLocationForm();
        }}
      >
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Warehouse className="h-5 w-5" />
              Create Stock Location
            </DialogTitle>
            <DialogDescription>
              Add a new inventory location for fulfillment.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createLocationError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createLocationError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-location-name">Name *</Label>
              <Input
                id="create-location-name"
                placeholder="e.g., Main Warehouse"
                value={createLocationName}
                onChange={(e) => setCreateLocationName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-location-address">Address</Label>
              <Input
                id="create-location-address"
                placeholder="Street address"
                value={createLocationAddress}
                onChange={(e) => setCreateLocationAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-location-city">City</Label>
                <Input
                  id="create-location-city"
                  placeholder="City"
                  value={createLocationCity}
                  onChange={(e) => setCreateLocationCity(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-location-province">Province/State</Label>
                <Input
                  id="create-location-province"
                  placeholder="Province"
                  value={createLocationProvince}
                  onChange={(e) => setCreateLocationProvince(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-location-postal">Postal Code</Label>
                <Input
                  id="create-location-postal"
                  placeholder="Postal code"
                  value={createLocationPostalCode}
                  onChange={(e) => setCreateLocationPostalCode(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-location-country">Country Code</Label>
                <Input
                  id="create-location-country"
                  placeholder="e.g., US"
                  value={createLocationCountryCode}
                  onChange={(e) => setCreateLocationCountryCode(e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="create-location-phone">Phone</Label>
                <Input
                  id="create-location-phone"
                  placeholder="Phone number"
                  value={createLocationPhone}
                  onChange={(e) => setCreateLocationPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="create-location-priority">Priority</Label>
                <Input
                  id="create-location-priority"
                  type="number"
                  placeholder="0"
                  value={createLocationPriority}
                  onChange={(e) => setCreateLocationPriority(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="create-location-fulfillment" className="font-medium">
                  Fulfillment Enabled
                </Label>
                <span className="text-xs text-muted-foreground">
                  Allow orders to be fulfilled from this location
                </span>
              </div>
              <Switch
                id="create-location-fulfillment"
                checked={createLocationFulfillment}
                onCheckedChange={setCreateLocationFulfillment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateLocationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateLocation} disabled={isCreatingLocation}>
              {isCreatingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Location"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Edit Location Dialog
          ========================================================================= */}
      <Dialog open={isEditLocationOpen} onOpenChange={setIsEditLocationOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Stock Location
            </DialogTitle>
            <DialogDescription>Update location details and settings.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editLocationError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editLocationError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-location-name">Name *</Label>
              <Input
                id="edit-location-name"
                value={editLocationName}
                onChange={(e) => setEditLocationName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-location-address">Address</Label>
              <Input
                id="edit-location-address"
                value={editLocationAddress}
                onChange={(e) => setEditLocationAddress(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-location-city">City</Label>
                <Input
                  id="edit-location-city"
                  value={editLocationCity}
                  onChange={(e) => setEditLocationCity(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location-province">Province/State</Label>
                <Input
                  id="edit-location-province"
                  value={editLocationProvince}
                  onChange={(e) => setEditLocationProvince(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-location-postal">Postal Code</Label>
                <Input
                  id="edit-location-postal"
                  value={editLocationPostalCode}
                  onChange={(e) => setEditLocationPostalCode(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location-country">Country Code</Label>
                <Input
                  id="edit-location-country"
                  value={editLocationCountryCode}
                  onChange={(e) => setEditLocationCountryCode(e.target.value.toUpperCase())}
                  maxLength={2}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-location-phone">Phone</Label>
                <Input
                  id="edit-location-phone"
                  value={editLocationPhone}
                  onChange={(e) => setEditLocationPhone(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-location-priority">Priority</Label>
                <Input
                  id="edit-location-priority"
                  type="number"
                  value={editLocationPriority}
                  onChange={(e) => setEditLocationPriority(e.target.value)}
                  min="0"
                />
              </div>
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="grid gap-0.5">
                <Label htmlFor="edit-location-fulfillment" className="font-medium">
                  Fulfillment Enabled
                </Label>
                <span className="text-xs text-muted-foreground">
                  Allow orders to be fulfilled from this location
                </span>
              </div>
              <Switch
                id="edit-location-fulfillment"
                checked={editLocationFulfillment}
                onCheckedChange={setEditLocationFulfillment}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditLocationOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateLocation} disabled={isUpdatingLocation}>
              {isUpdatingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Delete Location Confirmation Dialog
          ========================================================================= */}
      <AlertDialog open={isDeleteLocationOpen} onOpenChange={setIsDeleteLocationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Stock Location
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingLocation?.name}</strong>? This action
              cannot be undone. Any inventory associated with this location may be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLocation}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingLocation}
            >
              {isDeletingLocation ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Location"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* =========================================================================
          Create Shipping Profile Dialog
          ========================================================================= */}
      <Dialog
        open={isCreateProfileOpen}
        onOpenChange={(open) => {
          setIsCreateProfileOpen(open);
          if (!open) resetCreateProfileForm();
        }}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Create Shipping Profile
            </DialogTitle>
            <DialogDescription>
              Add a new shipping profile to manage how products are shipped.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {createProfileError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {createProfileError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="create-profile-name">Name *</Label>
              <Input
                id="create-profile-name"
                placeholder="e.g., Standard Shipping"
                value={createProfileName}
                onChange={(e) => setCreateProfileName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="create-profile-type">Type</Label>
              <Input
                id="create-profile-type"
                placeholder="e.g., default, gift_card"
                value={createProfileType}
                onChange={(e) => setCreateProfileType(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProfile} disabled={isCreatingProfile}>
              {isCreatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Edit Shipping Profile Dialog
          ========================================================================= */}
      <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Shipping Profile
            </DialogTitle>
            <DialogDescription>Update shipping profile details.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editProfileError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editProfileError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-profile-name">Name *</Label>
              <Input
                id="edit-profile-name"
                value={editProfileName}
                onChange={(e) => setEditProfileName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-profile-type">Type</Label>
              <Input
                id="edit-profile-type"
                value={editProfileType}
                onChange={(e) => setEditProfileType(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditProfileOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdatingProfile}>
              {isUpdatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          Delete Shipping Profile Confirmation Dialog
          ========================================================================= */}
      <AlertDialog open={isDeleteProfileOpen} onOpenChange={setIsDeleteProfileOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Delete Shipping Profile
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{deletingProfile?.name}</strong>? This action
              cannot be undone. Products using this profile will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeletingProfile}
            >
              {isDeletingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Profile"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
