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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertCircle,
  Building2,
  Globe,
  Settings,
  FileText,
  ShoppingCart,
  Truck,
  Search as SearchIcon,
  Pencil,
  RefreshCw,
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Linkedin,
  ExternalLink,
  Plus,
  Store as StoreIcon,
  ArrowLeft,
  ChevronRight,
  Palette,
} from "lucide-react";
import {
  getStores,
  createStore,
  getStoreSettings,
  updateStoreBusinessInfo,
  updateStoreLocalization,
  updateStoreFeatures,
  updateStorePolicies,
  updateStoreCheckoutSettings,
  updateStoreShippingSettings,
  updateStoreSeoSettings,
  updateStoreThemeSettings,
  initializeStoreSettings,
  type Store,
  type StoreSettings,
  type SocialLinks,
  type StorePolicies,
  type CheckoutSettings,
  type ShippingSettings,
  type SeoSettings,
  type ThemeSettings,
} from "@/lib/api";

export default function StoreSettingsPage() {
  // State for store selection
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [loadingStores, setLoadingStores] = useState(true);

  // State for settings
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Create store dialog
  const [createStoreOpen, setCreateStoreOpen] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreCurrency, setNewStoreCurrency] = useState("GBP");
  const [creatingStore, setCreatingStore] = useState(false);

  // Dialog states for settings
  const [businessInfoOpen, setBusinessInfoOpen] = useState(false);
  const [localizationOpen, setLocalizationOpen] = useState(false);
  const [featuresOpen, setFeaturesOpen] = useState(false);
  const [policiesOpen, setPoliciesOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  const [seoOpen, setSeoOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  // Form states
  const [businessForm, setBusinessForm] = useState({
    description: "",
    logoUrl: "",
    faviconUrl: "",
    contactEmail: "",
    contactPhone: "",
    legalBusinessName: "",
    taxId: "",
    socialLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      tiktok: "",
      youtube: "",
      pinterest: "",
      linkedin: "",
    } as SocialLinks,
  });

  const [localizationForm, setLocalizationForm] = useState({
    timezone: "",
    defaultLocale: "",
    dateFormat: "",
    currencyDisplayFormat: "",
  });

  const [featuresForm, setFeaturesForm] = useState({
    reviewsEnabled: false,
    wishlistEnabled: false,
    giftCardsEnabled: false,
    customerTiersEnabled: false,
    guestCheckoutEnabled: false,
    newsletterEnabled: false,
    productComparisonEnabled: false,
  });

  const [policiesForm, setPoliciesForm] = useState<StorePolicies>({
    returnPolicyUrl: "",
    returnPolicySummary: "",
    shippingPolicyUrl: "",
    shippingPolicySummary: "",
    termsAndConditionsUrl: "",
    privacyPolicyUrl: "",
    cookiePolicyUrl: "",
    refundPolicyUrl: "",
    returnWindowDays: 30,
    exchangeWindowDays: 30,
  });

  const [checkoutForm, setCheckoutForm] = useState<CheckoutSettings>({
    acceptedPaymentMethods: [],
    checkoutFlow: "MULTI_STEP",
    requirePhone: false,
    requireCompany: false,
    showOrderNotes: true,
    autoCapture: false,
    minimumOrderAmount: undefined,
    maximumOrderAmount: undefined,
  });

  const [shippingForm, setShippingForm] = useState<ShippingSettings>({
    freeShippingThreshold: undefined,
    internationalShippingEnabled: false,
    defaultShippingMethodId: "",
    estimatedDeliveryDaysMin: 3,
    estimatedDeliveryDaysMax: 7,
    internationalDeliveryDaysMin: 7,
    internationalDeliveryDaysMax: 21,
    allowedCountries: [],
    blockedCountries: [],
  });

  const [seoForm, setSeoForm] = useState<SeoSettings>({
    metaTitle: "",
    metaDescription: "",
    ogImage: "",
    googleAnalyticsId: "",
    facebookPixelId: "",
    enableStructuredData: false,
  });

  const [themeForm, setThemeForm] = useState<ThemeSettings>({
    primaryColor: "#1A1A1A",
    primaryForeground: "#FDFBF7",
    secondaryColor: "#F5F0E8",
    secondaryForeground: "#1A1A1A",
    accentColor: "#D4AF37",
    accentForeground: "#1A1A1A",
    backgroundColor: "#FDFBF7",
    foregroundColor: "#1A1A1A",
    cardColor: "#FFFFFF",
    cardForeground: "#1A1A1A",
    mutedColor: "#F5F0E8",
    mutedForeground: "#6B6B6B",
    borderColor: "#E5E0D8",
    inputColor: "#E5E0D8",
    ringColor: "#D4AF37",
    goldColor: "#D4AF37",
    champagneColor: "#F7E7CE",
    roseGoldColor: "#B76E79",
    destructiveColor: "#DC2626",
    headingFont: "Playfair Display",
    bodyFont: "Crimson Pro",
    accentFont: "Cormorant Garamond",
    borderRadius: "0.5rem",
  });

  // Fetch stores
  const fetchStores = useCallback(async () => {
    setLoadingStores(true);
    setError(null);
    try {
      const response = await getStores({ limit: 100 });
      setStores(response.stores);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load stores");
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Fetch settings for selected store
  const fetchSettings = useCallback(async (storeId: string) => {
    setLoadingSettings(true);
    setError(null);
    try {
      const response = await getStoreSettings(storeId);
      setSettings(response.storeSettings);
      populateForms(response.storeSettings);
    } catch {
      // Try to initialize settings if they don't exist
      try {
        const initResponse = await initializeStoreSettings(storeId);
        setSettings(initResponse.storeSettings);
        populateForms(initResponse.storeSettings);
      } catch (initErr) {
        setError(initErr instanceof Error ? initErr.message : "Failed to load store settings");
      }
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const populateForms = (s: StoreSettings) => {
    setBusinessForm({
      description: s.description || "",
      logoUrl: s.logoUrl || "",
      faviconUrl: s.faviconUrl || "",
      contactEmail: s.contactEmail || "",
      contactPhone: s.contactPhone || "",
      legalBusinessName: s.legalBusinessName || "",
      taxId: s.taxId || "",
      socialLinks: s.socialLinks || {
        facebook: "",
        instagram: "",
        twitter: "",
        tiktok: "",
        youtube: "",
        pinterest: "",
        linkedin: "",
      },
    });

    setLocalizationForm({
      timezone: s.timezone || "UTC",
      defaultLocale: s.defaultLocale || "en",
      dateFormat: s.dateFormat || "DD_MM_YYYY",
      currencyDisplayFormat: s.currencyDisplayFormat || "SYMBOL_BEFORE",
    });

    setFeaturesForm({
      reviewsEnabled: s.reviewsEnabled,
      wishlistEnabled: s.wishlistEnabled,
      giftCardsEnabled: s.giftCardsEnabled,
      customerTiersEnabled: s.customerTiersEnabled,
      guestCheckoutEnabled: s.guestCheckoutEnabled,
      newsletterEnabled: s.newsletterEnabled,
      productComparisonEnabled: s.productComparisonEnabled,
    });

    if (s.policies) {
      setPoliciesForm(s.policies);
    }

    if (s.checkoutSettings) {
      setCheckoutForm(s.checkoutSettings);
    }

    if (s.shippingSettings) {
      setShippingForm(s.shippingSettings);
    }

    if (s.seoSettings) {
      setSeoForm(s.seoSettings);
    }

    if (s.themeSettings) {
      setThemeForm(s.themeSettings);
    }
  };

  useEffect(() => {
    fetchStores();
  }, [fetchStores]);

  // Handle store selection
  const handleSelectStore = (store: Store) => {
    setSelectedStore(store);
    fetchSettings(store.id);
  };

  // Handle back to stores list
  const handleBackToStores = () => {
    setSelectedStore(null);
    setSettings(null);
  };

  // Handle create store
  const handleCreateStore = async () => {
    if (!newStoreName.trim()) return;

    setCreatingStore(true);
    try {
      const response = await createStore({
        name: newStoreName.trim(),
        default_currency_code: newStoreCurrency,
      });
      setStores([...stores, response.store]);
      setCreateStoreOpen(false);
      setNewStoreName("");
      setNewStoreCurrency("GBP");
      // Auto-select the new store
      handleSelectStore(response.store);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create store");
    } finally {
      setCreatingStore(false);
    }
  };

  // Save handlers
  const handleSaveBusinessInfo = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreBusinessInfo(selectedStore.id, {
        description: businessForm.description || undefined,
        logoUrl: businessForm.logoUrl || undefined,
        faviconUrl: businessForm.faviconUrl || undefined,
        contactEmail: businessForm.contactEmail || undefined,
        contactPhone: businessForm.contactPhone || undefined,
        legalBusinessName: businessForm.legalBusinessName || undefined,
        taxId: businessForm.taxId || undefined,
        socialLinks: businessForm.socialLinks,
      });
      setSettings(response.storeSettings);
      setBusinessInfoOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save business info");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLocalization = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreLocalization(selectedStore.id, {
        timezone: localizationForm.timezone || undefined,
        defaultLocale: localizationForm.defaultLocale || undefined,
        dateFormat: localizationForm.dateFormat || undefined,
        currencyDisplayFormat: localizationForm.currencyDisplayFormat || undefined,
      });
      setSettings(response.storeSettings);
      setLocalizationOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save localization");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFeatures = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreFeatures(selectedStore.id, featuresForm);
      setSettings(response.storeSettings);
      setFeaturesOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save features");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePolicies = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStorePolicies(selectedStore.id, { policies: policiesForm });
      setSettings(response.storeSettings);
      setPoliciesOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save policies");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCheckout = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreCheckoutSettings(selectedStore.id, { checkoutSettings: checkoutForm });
      setSettings(response.storeSettings);
      setCheckoutOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save checkout settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveShipping = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreShippingSettings(selectedStore.id, { shippingSettings: shippingForm });
      setSettings(response.storeSettings);
      setShippingOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save shipping settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSeo = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreSeoSettings(selectedStore.id, { seoSettings: seoForm });
      setSettings(response.storeSettings);
      setSeoOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save SEO settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTheme = async () => {
    if (!selectedStore) return;
    setSaving(true);
    try {
      const response = await updateStoreThemeSettings(selectedStore.id, { themeSettings: themeForm });
      setSettings(response.storeSettings);
      setThemeOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save theme settings");
    } finally {
      setSaving(false);
    }
  };

  // Loading skeleton for stores
  if (loadingStores) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/settings">Settings</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Stores</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Stores list view
  if (!selectedStore) {
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
              <BreadcrumbPage>Stores</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Stores</h1>
            <p className="text-sm text-muted-foreground">
              Manage your stores and their settings
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={fetchStores}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button onClick={() => setCreateStoreOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Store
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setError(null)}
              className="ml-auto"
            >
              Dismiss
            </Button>
          </div>
        )}

        {/* Stores List */}
        {stores.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <StoreIcon className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No stores yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create your first store to get started
              </p>
              <Button onClick={() => setCreateStoreOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Store
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {stores.map((store) => (
              <Card
                key={store.id}
                className="cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => handleSelectStore(store)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <StoreIcon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{store.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Currency: {store.default_currency_code} &middot; ID: {store.id.slice(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Store Dialog */}
        <Dialog open={createStoreOpen} onOpenChange={setCreateStoreOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Store</DialogTitle>
              <DialogDescription>
                Add a new store to manage products, orders, and settings.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={newStoreName}
                  onChange={(e) => setNewStoreName(e.target.value)}
                  placeholder="My Store"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storeCurrency">Default Currency</Label>
                <Select value={newStoreCurrency} onValueChange={setNewStoreCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateStoreOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateStore} disabled={creatingStore || !newStoreName.trim()}>
                {creatingStore ? "Creating..." : "Create Store"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Store settings view
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
            <BreadcrumbLink className="cursor-pointer" onClick={handleBackToStores}>
              Stores
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{selectedStore.name}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleBackToStores}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{selectedStore.name}</h1>
            <p className="text-sm text-muted-foreground">
              Configure store settings and preferences
            </p>
          </div>
        </div>
        <Button variant="outline" size="icon" onClick={() => fetchSettings(selectedStore.id)}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto"
          >
            Dismiss
          </Button>
        </div>
      )}

      {/* Loading settings */}
      {loadingSettings ? (
        <div className="grid gap-6 md:grid-cols-2">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Store Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>{selectedStore.name}</CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span>Store ID: {selectedStore.id}</span>
                <Badge variant="secondary">{selectedStore.default_currency_code}</Badge>
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Settings Grid */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Business Info Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Business Information</CardTitle>
                    <CardDescription>Contact details and branding</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setBusinessInfoOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {settings?.description && (
                    <div>
                      <span className="text-muted-foreground">Description:</span>
                      <p className="line-clamp-2">{settings.description}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Email</span>
                    <span>{settings?.contactEmail || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contact Phone</span>
                    <span>{settings?.contactPhone || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Legal Name</span>
                    <span>{settings?.legalBusinessName || "-"}</span>
                  </div>
                  {settings?.socialLinks && Object.values(settings.socialLinks).some(Boolean) && (
                    <div className="flex gap-2 pt-2">
                      {settings.socialLinks.facebook && (
                        <a href={settings.socialLinks.facebook} target="_blank" rel="noopener noreferrer">
                          <Facebook className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                      {settings.socialLinks.instagram && (
                        <a href={settings.socialLinks.instagram} target="_blank" rel="noopener noreferrer">
                          <Instagram className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                      {settings.socialLinks.twitter && (
                        <a href={settings.socialLinks.twitter} target="_blank" rel="noopener noreferrer">
                          <Twitter className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                      {settings.socialLinks.youtube && (
                        <a href={settings.socialLinks.youtube} target="_blank" rel="noopener noreferrer">
                          <Youtube className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                      {settings.socialLinks.linkedin && (
                        <a href={settings.socialLinks.linkedin} target="_blank" rel="noopener noreferrer">
                          <Linkedin className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Localization Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Localization</CardTitle>
                    <CardDescription>Regional settings</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setLocalizationOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timezone</span>
                    <Badge variant="secondary">{settings?.timezone || "UTC"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Default Locale</span>
                    <Badge variant="secondary">{settings?.defaultLocale || "en"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date Format</span>
                    <span>{settings?.dateFormat || "DD/MM/YYYY"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Currency Format</span>
                    <span>{settings?.currencyDisplayFormat || "SYMBOL_BEFORE"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Features Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Features</CardTitle>
                    <CardDescription>Enable or disable store features</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFeaturesOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.reviewsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Reviews</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.wishlistEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Wishlist</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.giftCardsEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Gift Cards</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.guestCheckoutEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Guest Checkout</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.newsletterEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Newsletter</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.productComparisonEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Comparison</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`h-2 w-2 rounded-full ${settings?.customerTiersEnabled ? "bg-green-500" : "bg-gray-300"}`} />
                    <span>Customer Tiers</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Policies Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Policies</CardTitle>
                    <CardDescription>Store policies and legal info</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setPoliciesOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Return Window</span>
                    <span>{settings?.policies?.returnWindowDays || 30} days</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Exchange Window</span>
                    <span>{settings?.policies?.exchangeWindowDays || 30} days</span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {settings?.policies?.returnPolicyUrl && (
                      <Badge variant="outline" className="gap-1">
                        Returns <ExternalLink className="h-3 w-3" />
                      </Badge>
                    )}
                    {settings?.policies?.shippingPolicyUrl && (
                      <Badge variant="outline" className="gap-1">
                        Shipping <ExternalLink className="h-3 w-3" />
                      </Badge>
                    )}
                    {settings?.policies?.privacyPolicyUrl && (
                      <Badge variant="outline" className="gap-1">
                        Privacy <ExternalLink className="h-3 w-3" />
                      </Badge>
                    )}
                    {settings?.policies?.termsAndConditionsUrl && (
                      <Badge variant="outline" className="gap-1">
                        Terms <ExternalLink className="h-3 w-3" />
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Checkout Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Checkout</CardTitle>
                    <CardDescription>Checkout flow configuration</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setCheckoutOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Checkout Flow</span>
                    <Badge variant="secondary">{settings?.checkoutSettings?.checkoutFlow || "MULTI_STEP"}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Require Phone</span>
                    <span>{settings?.checkoutSettings?.requirePhone ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Order Notes</span>
                    <span>{settings?.checkoutSettings?.showOrderNotes ? "Enabled" : "Disabled"}</span>
                  </div>
                  {settings?.checkoutSettings?.minimumOrderAmount && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Min Order</span>
                      <span>${settings.checkoutSettings.minimumOrderAmount}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Shipping Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Shipping</CardTitle>
                    <CardDescription>Delivery settings</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShippingOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {settings?.shippingSettings?.freeShippingThreshold && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Free Shipping</span>
                      <span>Over ${settings.shippingSettings.freeShippingThreshold}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">International</span>
                    <span>{settings?.shippingSettings?.internationalShippingEnabled ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Est. Delivery</span>
                    <span>
                      {settings?.shippingSettings?.estimatedDeliveryDaysMin || 3}-
                      {settings?.shippingSettings?.estimatedDeliveryDaysMax || 7} days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SEO Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <SearchIcon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">SEO</CardTitle>
                    <CardDescription>Search engine optimization</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSeoOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  {settings?.seoSettings?.metaTitle && (
                    <div>
                      <span className="text-muted-foreground">Meta Title:</span>
                      <p className="line-clamp-1">{settings.seoSettings.metaTitle}</p>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Structured Data</span>
                    <span>{settings?.seoSettings?.enableStructuredData ? "Enabled" : "Disabled"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Google Analytics</span>
                    <span>{settings?.seoSettings?.googleAnalyticsId ? "Configured" : "Not set"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Facebook Pixel</span>
                    <span>{settings?.seoSettings?.facebookPixelId ? "Configured" : "Not set"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Theme Card */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <CardTitle className="text-lg">Theme</CardTitle>
                    <CardDescription>Storefront colors and fonts</CardDescription>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setThemeOpen(true)}>
                  <Pencil className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Primary:</span>
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: settings?.themeSettings?.primaryColor || "#1A1A1A" }}
                    />
                    <span className="font-mono text-xs">{settings?.themeSettings?.primaryColor || "#1A1A1A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Accent:</span>
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: settings?.themeSettings?.accentColor || "#D4AF37" }}
                    />
                    <span className="font-mono text-xs">{settings?.themeSettings?.accentColor || "#D4AF37"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Gold:</span>
                    <div
                      className="w-5 h-5 rounded border"
                      style={{ backgroundColor: settings?.themeSettings?.goldColor || "#D4AF37" }}
                    />
                    <span className="font-mono text-xs">{settings?.themeSettings?.goldColor || "#D4AF37"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Heading Font</span>
                    <span>{settings?.themeSettings?.headingFont || "Playfair Display"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Business Info Dialog */}
      <Dialog open={businessInfoOpen} onOpenChange={setBusinessInfoOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business Information</DialogTitle>
            <DialogDescription>Update your store&apos;s business details and contact information.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={businessForm.description}
                onChange={(e) => setBusinessForm({ ...businessForm, description: e.target.value })}
                placeholder="Tell customers about your store..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="logoUrl">Logo URL</Label>
                <Input
                  id="logoUrl"
                  value={businessForm.logoUrl}
                  onChange={(e) => setBusinessForm({ ...businessForm, logoUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="faviconUrl">Favicon URL</Label>
                <Input
                  id="faviconUrl"
                  value={businessForm.faviconUrl}
                  onChange={(e) => setBusinessForm({ ...businessForm, faviconUrl: e.target.value })}
                  placeholder="https://..."
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contactEmail">Contact Email</Label>
                <Input
                  id="contactEmail"
                  type="email"
                  value={businessForm.contactEmail}
                  onChange={(e) => setBusinessForm({ ...businessForm, contactEmail: e.target.value })}
                  placeholder="support@store.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone">Contact Phone</Label>
                <Input
                  id="contactPhone"
                  value={businessForm.contactPhone}
                  onChange={(e) => setBusinessForm({ ...businessForm, contactPhone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalBusinessName">Legal Business Name</Label>
                <Input
                  id="legalBusinessName"
                  value={businessForm.legalBusinessName}
                  onChange={(e) => setBusinessForm({ ...businessForm, legalBusinessName: e.target.value })}
                  placeholder="Company Ltd."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="taxId">Tax ID</Label>
                <Input
                  id="taxId"
                  value={businessForm.taxId}
                  onChange={(e) => setBusinessForm({ ...businessForm, taxId: e.target.value })}
                  placeholder="VAT/Tax ID"
                />
              </div>
            </div>
            <div className="space-y-4">
              <Label>Social Links</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="facebook" className="text-xs text-muted-foreground">Facebook</Label>
                  <Input
                    id="facebook"
                    value={businessForm.socialLinks.facebook || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, facebook: e.target.value }
                    })}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-xs text-muted-foreground">Instagram</Label>
                  <Input
                    id="instagram"
                    value={businessForm.socialLinks.instagram || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, instagram: e.target.value }
                    })}
                    placeholder="https://instagram.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="twitter" className="text-xs text-muted-foreground">Twitter/X</Label>
                  <Input
                    id="twitter"
                    value={businessForm.socialLinks.twitter || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, twitter: e.target.value }
                    })}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="text-xs text-muted-foreground">YouTube</Label>
                  <Input
                    id="youtube"
                    value={businessForm.socialLinks.youtube || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, youtube: e.target.value }
                    })}
                    placeholder="https://youtube.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin" className="text-xs text-muted-foreground">LinkedIn</Label>
                  <Input
                    id="linkedin"
                    value={businessForm.socialLinks.linkedin || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, linkedin: e.target.value }
                    })}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tiktok" className="text-xs text-muted-foreground">TikTok</Label>
                  <Input
                    id="tiktok"
                    value={businessForm.socialLinks.tiktok || ""}
                    onChange={(e) => setBusinessForm({
                      ...businessForm,
                      socialLinks: { ...businessForm.socialLinks, tiktok: e.target.value }
                    })}
                    placeholder="https://tiktok.com/..."
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBusinessInfoOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveBusinessInfo} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Localization Dialog */}
      <Dialog open={localizationOpen} onOpenChange={setLocalizationOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Localization Settings</DialogTitle>
            <DialogDescription>Configure regional and language preferences.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Select
                value={localizationForm.timezone}
                onValueChange={(value) => setLocalizationForm({ ...localizationForm, timezone: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timezone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                  <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                  <SelectItem value="Europe/London">London (GMT)</SelectItem>
                  <SelectItem value="Europe/Paris">Paris (CET)</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo (JST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="defaultLocale">Default Locale</Label>
              <Select
                value={localizationForm.defaultLocale}
                onValueChange={(value) => setLocalizationForm({ ...localizationForm, defaultLocale: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="it">Italian</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="ja">Japanese</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateFormat">Date Format</Label>
              <Select
                value={localizationForm.dateFormat}
                onValueChange={(value) => setLocalizationForm({ ...localizationForm, dateFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="DD_MM_YYYY">DD/MM/YYYY</SelectItem>
                  <SelectItem value="MM_DD_YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="YYYY_MM_DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="DD_MON_YYYY">DD Mon YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currencyDisplayFormat">Currency Display</Label>
              <Select
                value={localizationForm.currencyDisplayFormat}
                onValueChange={(value) => setLocalizationForm({ ...localizationForm, currencyDisplayFormat: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SYMBOL_BEFORE">$100.00</SelectItem>
                  <SelectItem value="SYMBOL_AFTER">100.00$</SelectItem>
                  <SelectItem value="CODE_BEFORE">USD 100.00</SelectItem>
                  <SelectItem value="CODE_AFTER">100.00 USD</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLocalizationOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveLocalization} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Features Dialog */}
      <Dialog open={featuresOpen} onOpenChange={setFeaturesOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Store Features</DialogTitle>
            <DialogDescription>Enable or disable features for your storefront.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Product Reviews</Label>
                <p className="text-xs text-muted-foreground">Allow customers to leave reviews</p>
              </div>
              <Switch
                checked={featuresForm.reviewsEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, reviewsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Wishlist</Label>
                <p className="text-xs text-muted-foreground">Let customers save products</p>
              </div>
              <Switch
                checked={featuresForm.wishlistEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, wishlistEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Gift Cards</Label>
                <p className="text-xs text-muted-foreground">Sell and redeem gift cards</p>
              </div>
              <Switch
                checked={featuresForm.giftCardsEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, giftCardsEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Guest Checkout</Label>
                <p className="text-xs text-muted-foreground">Allow checkout without account</p>
              </div>
              <Switch
                checked={featuresForm.guestCheckoutEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, guestCheckoutEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Newsletter</Label>
                <p className="text-xs text-muted-foreground">Show newsletter signup</p>
              </div>
              <Switch
                checked={featuresForm.newsletterEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, newsletterEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Product Comparison</Label>
                <p className="text-xs text-muted-foreground">Compare products side by side</p>
              </div>
              <Switch
                checked={featuresForm.productComparisonEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, productComparisonEnabled: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Customer Tiers</Label>
                <p className="text-xs text-muted-foreground">Loyalty tiers and benefits</p>
              </div>
              <Switch
                checked={featuresForm.customerTiersEnabled}
                onCheckedChange={(checked) => setFeaturesForm({ ...featuresForm, customerTiersEnabled: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeaturesOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveFeatures} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policies Dialog */}
      <Dialog open={policiesOpen} onOpenChange={setPoliciesOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Store Policies</DialogTitle>
            <DialogDescription>Configure policy URLs and return windows.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="returnWindowDays">Return Window (Days)</Label>
                <Input
                  id="returnWindowDays"
                  type="number"
                  min="0"
                  value={policiesForm.returnWindowDays}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, returnWindowDays: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="exchangeWindowDays">Exchange Window (Days)</Label>
                <Input
                  id="exchangeWindowDays"
                  type="number"
                  min="0"
                  value={policiesForm.exchangeWindowDays}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, exchangeWindowDays: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnPolicyUrl">Return Policy URL</Label>
              <Input
                id="returnPolicyUrl"
                value={policiesForm.returnPolicyUrl || ""}
                onChange={(e) => setPoliciesForm({ ...policiesForm, returnPolicyUrl: e.target.value })}
                placeholder="https://yourstore.com/returns"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="returnPolicySummary">Return Policy Summary</Label>
              <Textarea
                id="returnPolicySummary"
                value={policiesForm.returnPolicySummary || ""}
                onChange={(e) => setPoliciesForm({ ...policiesForm, returnPolicySummary: e.target.value })}
                placeholder="Brief summary of your return policy..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shippingPolicyUrl">Shipping Policy URL</Label>
              <Input
                id="shippingPolicyUrl"
                value={policiesForm.shippingPolicyUrl || ""}
                onChange={(e) => setPoliciesForm({ ...policiesForm, shippingPolicyUrl: e.target.value })}
                placeholder="https://yourstore.com/shipping"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termsAndConditionsUrl">Terms & Conditions URL</Label>
              <Input
                id="termsAndConditionsUrl"
                value={policiesForm.termsAndConditionsUrl || ""}
                onChange={(e) => setPoliciesForm({ ...policiesForm, termsAndConditionsUrl: e.target.value })}
                placeholder="https://yourstore.com/terms"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="privacyPolicyUrl">Privacy Policy URL</Label>
              <Input
                id="privacyPolicyUrl"
                value={policiesForm.privacyPolicyUrl || ""}
                onChange={(e) => setPoliciesForm({ ...policiesForm, privacyPolicyUrl: e.target.value })}
                placeholder="https://yourstore.com/privacy"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPoliciesOpen(false)}>Cancel</Button>
            <Button onClick={handleSavePolicies} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Checkout Settings</DialogTitle>
            <DialogDescription>Configure your checkout experience.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="checkoutFlow">Checkout Flow</Label>
              <Select
                value={checkoutForm.checkoutFlow}
                onValueChange={(value: "SINGLE_PAGE" | "MULTI_STEP" | "EXPRESS") => setCheckoutForm({ ...checkoutForm, checkoutFlow: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select checkout flow" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SINGLE_PAGE">Single Page</SelectItem>
                  <SelectItem value="MULTI_STEP">Multi-Step</SelectItem>
                  <SelectItem value="EXPRESS">Express</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Phone Number</Label>
                <p className="text-xs text-muted-foreground">Make phone required at checkout</p>
              </div>
              <Switch
                checked={checkoutForm.requirePhone}
                onCheckedChange={(checked) => setCheckoutForm({ ...checkoutForm, requirePhone: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Company</Label>
                <p className="text-xs text-muted-foreground">Make company field required</p>
              </div>
              <Switch
                checked={checkoutForm.requireCompany}
                onCheckedChange={(checked) => setCheckoutForm({ ...checkoutForm, requireCompany: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Show Order Notes</Label>
                <p className="text-xs text-muted-foreground">Allow customers to add notes</p>
              </div>
              <Switch
                checked={checkoutForm.showOrderNotes}
                onCheckedChange={(checked) => setCheckoutForm({ ...checkoutForm, showOrderNotes: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto Capture Payments</Label>
                <p className="text-xs text-muted-foreground">Capture payments automatically</p>
              </div>
              <Switch
                checked={checkoutForm.autoCapture}
                onCheckedChange={(checked) => setCheckoutForm({ ...checkoutForm, autoCapture: checked })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minimumOrderAmount">Min Order Amount</Label>
                <Input
                  id="minimumOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={checkoutForm.minimumOrderAmount || ""}
                  onChange={(e) => setCheckoutForm({
                    ...checkoutForm,
                    minimumOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maximumOrderAmount">Max Order Amount</Label>
                <Input
                  id="maximumOrderAmount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={checkoutForm.maximumOrderAmount || ""}
                  onChange={(e) => setCheckoutForm({
                    ...checkoutForm,
                    maximumOrderAmount: e.target.value ? parseFloat(e.target.value) : undefined
                  })}
                  placeholder="No limit"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCheckoutOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCheckout} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shipping Dialog */}
      <Dialog open={shippingOpen} onOpenChange={setShippingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Shipping Settings</DialogTitle>
            <DialogDescription>Configure shipping and delivery options.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="freeShippingThreshold">Free Shipping Threshold</Label>
              <Input
                id="freeShippingThreshold"
                type="number"
                min="0"
                step="0.01"
                value={shippingForm.freeShippingThreshold || ""}
                onChange={(e) => setShippingForm({
                  ...shippingForm,
                  freeShippingThreshold: e.target.value ? parseFloat(e.target.value) : undefined
                })}
                placeholder="e.g., 50.00 for free shipping over $50"
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>International Shipping</Label>
                <p className="text-xs text-muted-foreground">Enable shipping worldwide</p>
              </div>
              <Switch
                checked={shippingForm.internationalShippingEnabled}
                onCheckedChange={(checked) => setShippingForm({ ...shippingForm, internationalShippingEnabled: checked })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDaysMin">Domestic Delivery Min (Days)</Label>
                <Input
                  id="estimatedDeliveryDaysMin"
                  type="number"
                  min="1"
                  value={shippingForm.estimatedDeliveryDaysMin}
                  onChange={(e) => setShippingForm({
                    ...shippingForm,
                    estimatedDeliveryDaysMin: parseInt(e.target.value) || 1
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedDeliveryDaysMax">Domestic Delivery Max (Days)</Label>
                <Input
                  id="estimatedDeliveryDaysMax"
                  type="number"
                  min="1"
                  value={shippingForm.estimatedDeliveryDaysMax}
                  onChange={(e) => setShippingForm({
                    ...shippingForm,
                    estimatedDeliveryDaysMax: parseInt(e.target.value) || 7
                  })}
                />
              </div>
            </div>
            {shippingForm.internationalShippingEnabled && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="internationalDeliveryDaysMin">International Min (Days)</Label>
                  <Input
                    id="internationalDeliveryDaysMin"
                    type="number"
                    min="1"
                    value={shippingForm.internationalDeliveryDaysMin}
                    onChange={(e) => setShippingForm({
                      ...shippingForm,
                      internationalDeliveryDaysMin: parseInt(e.target.value) || 7
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="internationalDeliveryDaysMax">International Max (Days)</Label>
                  <Input
                    id="internationalDeliveryDaysMax"
                    type="number"
                    min="1"
                    value={shippingForm.internationalDeliveryDaysMax}
                    onChange={(e) => setShippingForm({
                      ...shippingForm,
                      internationalDeliveryDaysMax: parseInt(e.target.value) || 21
                    })}
                  />
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShippingOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveShipping} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SEO Dialog */}
      <Dialog open={seoOpen} onOpenChange={setSeoOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit SEO Settings</DialogTitle>
            <DialogDescription>Optimize your store for search engines.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="metaTitle">Meta Title</Label>
              <Input
                id="metaTitle"
                value={seoForm.metaTitle || ""}
                onChange={(e) => setSeoForm({ ...seoForm, metaTitle: e.target.value })}
                placeholder="Your Store - Tagline"
              />
              <p className="text-xs text-muted-foreground">Recommended: 50-60 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="metaDescription">Meta Description</Label>
              <Textarea
                id="metaDescription"
                value={seoForm.metaDescription || ""}
                onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
                placeholder="Brief description of your store..."
              />
              <p className="text-xs text-muted-foreground">Recommended: 150-160 characters</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ogImage">Open Graph Image URL</Label>
              <Input
                id="ogImage"
                value={seoForm.ogImage || ""}
                onChange={(e) => setSeoForm({ ...seoForm, ogImage: e.target.value })}
                placeholder="https://yourstore.com/og-image.jpg"
              />
              <p className="text-xs text-muted-foreground">Image shown when shared on social media (1200x630px recommended)</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
                <Input
                  id="googleAnalyticsId"
                  value={seoForm.googleAnalyticsId || ""}
                  onChange={(e) => setSeoForm({ ...seoForm, googleAnalyticsId: e.target.value })}
                  placeholder="G-XXXXXXXXXX"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facebookPixelId">Facebook Pixel ID</Label>
                <Input
                  id="facebookPixelId"
                  value={seoForm.facebookPixelId || ""}
                  onChange={(e) => setSeoForm({ ...seoForm, facebookPixelId: e.target.value })}
                  placeholder="123456789012345"
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Enable Structured Data</Label>
                <p className="text-xs text-muted-foreground">Add JSON-LD for rich search results</p>
              </div>
              <Switch
                checked={seoForm.enableStructuredData}
                onCheckedChange={(checked) => setSeoForm({ ...seoForm, enableStructuredData: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSeoOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSeo} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Theme Dialog */}
      <Dialog open={themeOpen} onOpenChange={setThemeOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Theme Settings</DialogTitle>
            <DialogDescription>Customize your storefront appearance. Changes will apply to your storefront.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* Core Colors */}
            <div>
              <h4 className="font-medium mb-3">Core Colors</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primaryColor"
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.primaryColor}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryColor: e.target.value })}
                      placeholder="#1A1A1A"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryForeground">Primary Foreground</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="primaryForeground"
                      value={themeForm.primaryForeground}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryForeground: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.primaryForeground}
                      onChange={(e) => setThemeForm({ ...themeForm, primaryForeground: e.target.value })}
                      placeholder="#FDFBF7"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="accentColor"
                      value={themeForm.accentColor}
                      onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.accentColor}
                      onChange={(e) => setThemeForm({ ...themeForm, accentColor: e.target.value })}
                      placeholder="#D4AF37"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backgroundColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="backgroundColor"
                      value={themeForm.backgroundColor}
                      onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.backgroundColor}
                      onChange={(e) => setThemeForm({ ...themeForm, backgroundColor: e.target.value })}
                      placeholder="#FDFBF7"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Brand Colors */}
            <div>
              <h4 className="font-medium mb-3">Brand Colors</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="goldColor">Gold</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="goldColor"
                      value={themeForm.goldColor}
                      onChange={(e) => setThemeForm({ ...themeForm, goldColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.goldColor}
                      onChange={(e) => setThemeForm({ ...themeForm, goldColor: e.target.value })}
                      placeholder="#D4AF37"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="champagneColor">Champagne</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="champagneColor"
                      value={themeForm.champagneColor}
                      onChange={(e) => setThemeForm({ ...themeForm, champagneColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.champagneColor}
                      onChange={(e) => setThemeForm({ ...themeForm, champagneColor: e.target.value })}
                      placeholder="#F7E7CE"
                      className="font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="roseGoldColor">Rose Gold</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      id="roseGoldColor"
                      value={themeForm.roseGoldColor}
                      onChange={(e) => setThemeForm({ ...themeForm, roseGoldColor: e.target.value })}
                      className="w-12 h-10 p-1 cursor-pointer"
                    />
                    <Input
                      value={themeForm.roseGoldColor}
                      onChange={(e) => setThemeForm({ ...themeForm, roseGoldColor: e.target.value })}
                      placeholder="#B76E79"
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Typography */}
            <div>
              <h4 className="font-medium mb-3">Typography</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="headingFont">Heading Font</Label>
                  <Input
                    id="headingFont"
                    value={themeForm.headingFont}
                    onChange={(e) => setThemeForm({ ...themeForm, headingFont: e.target.value })}
                    placeholder="Playfair Display"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bodyFont">Body Font</Label>
                  <Input
                    id="bodyFont"
                    value={themeForm.bodyFont}
                    onChange={(e) => setThemeForm({ ...themeForm, bodyFont: e.target.value })}
                    placeholder="Crimson Pro"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accentFont">Accent Font</Label>
                  <Input
                    id="accentFont"
                    value={themeForm.accentFont}
                    onChange={(e) => setThemeForm({ ...themeForm, accentFont: e.target.value })}
                    placeholder="Cormorant Garamond"
                  />
                </div>
              </div>
            </div>

            {/* Border Radius */}
            <div className="space-y-2">
              <Label htmlFor="borderRadius">Border Radius</Label>
              <Input
                id="borderRadius"
                value={themeForm.borderRadius}
                onChange={(e) => setThemeForm({ ...themeForm, borderRadius: e.target.value })}
                placeholder="0.5rem"
                className="max-w-xs"
              />
              <p className="text-xs text-muted-foreground">CSS value for rounded corners (e.g., 0.5rem, 8px)</p>
            </div>

            {/* Preview */}
            <div className="border rounded-lg p-4">
              <h4 className="font-medium mb-3">Preview</h4>
              <div
                className="p-4 rounded-lg"
                style={{ backgroundColor: themeForm.backgroundColor, color: themeForm.foregroundColor }}
              >
                <div
                  className="inline-block px-4 py-2 rounded mb-2"
                  style={{ backgroundColor: themeForm.primaryColor, color: themeForm.primaryForeground }}
                >
                  Primary Button
                </div>
                <div
                  className="inline-block px-4 py-2 rounded ml-2 mb-2"
                  style={{ backgroundColor: themeForm.accentColor, color: themeForm.accentForeground }}
                >
                  Accent Button
                </div>
                <div
                  className="inline-block px-4 py-2 rounded ml-2"
                  style={{ backgroundColor: themeForm.goldColor, color: "#1A1A1A" }}
                >
                  Gold Button
                </div>
                <p className="mt-3" style={{ fontFamily: themeForm.bodyFont }}>
                  Body text in {themeForm.bodyFont}
                </p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setThemeOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveTheme} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
