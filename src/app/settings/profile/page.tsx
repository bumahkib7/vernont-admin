"use client";

import { useState } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Pencil,
  Loader2,
  AlertCircle,
  User,
  Key,
  Shield,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import {
  updateProfile,
  changePassword,
  getUserInitials,
  getRoleBadgeColor,
  getRoleDisplayName,
} from "@/lib/auth";
import { toast } from "sonner";

export default function ProfileSettingsPage() {
  const { user, refreshUser } = useAuth();

  // Edit profile dialog state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Change password dialog state
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Usage insights toggle (local state - could be persisted to backend)
  const [usageInsights, setUsageInsights] = useState(false);

  // Open edit dialog with current values
  const openEditDialog = () => {
    setEditFirstName(user?.firstName || "");
    setEditLastName(user?.lastName || "");
    setEditError(null);
    setIsEditOpen(true);
  };

  // Handle profile update
  const handleUpdateProfile = async () => {
    try {
      setIsUpdating(true);
      setEditError(null);

      await updateProfile({
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
      });

      // Refresh user data in context
      await refreshUser();

      toast.success("Profile updated successfully");
      setIsEditOpen(false);
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setIsUpdating(false);
    }
  };

  // Open password dialog
  const openPasswordDialog = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError(null);
    setIsPasswordOpen(true);
  };

  // Handle password change
  const handleChangePassword = async () => {
    // Validate
    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (!newPassword) {
      setPasswordError("New password is required");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    try {
      setIsChangingPassword(true);
      setPasswordError(null);

      await changePassword({
        currentPassword,
        newPassword,
      });

      toast.success("Password changed successfully");
      setIsPasswordOpen(false);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Display name
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email.split("@")[0]
    : "Loading...";

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
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Personal Information Card */}
      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
          <CardDescription>Manage your Vernont profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Separator />

          {/* User Profile Display */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Profile</h4>
              <Button variant="outline" size="sm" onClick={openEditDialog}>
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10">
                  {user ? getUserInitials(user) : "?"}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="font-medium text-lg">{displayName}</p>
                <p className="text-sm text-muted-foreground">{user?.email || "Loading..."}</p>
                {user?.role && (
                  <Badge className={getRoleBadgeColor(user.role)}>
                    {getRoleDisplayName(user.role)}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  First name
                </Label>
                <p className="font-medium">{user?.firstName || "Not set"}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">
                  Last name
                </Label>
                <p className="font-medium">{user?.lastName || "Not set"}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Security Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <h4 className="font-medium">Security</h4>
              </div>
              <Button variant="outline" size="sm" onClick={openPasswordDialog}>
                <Key className="h-4 w-4 mr-2" />
                Change Password
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep your account secure by using a strong password
            </p>
          </div>

          <Separator />

          {/* Usage Insights */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Usage insights</h4>
                <p className="text-sm text-muted-foreground">
                  Share usage insights and help us improve Vernont
                </p>
              </div>
              <Switch checked={usageInsights} onCheckedChange={setUsageInsights} />
            </div>
          </div>

          <Separator />

          {/* Language Preference */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Language</h4>
                <p className="text-sm text-muted-foreground">
                  Manage your language preferences
                </p>
              </div>
              <Button variant="outline" size="sm">
                English
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Profile
            </DialogTitle>
            <DialogDescription>
              Update your personal information
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="edit-first-name">First name</Label>
              <Input
                id="edit-first-name"
                placeholder="Enter your first name"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-last-name">Last name</Label>
              <Input
                id="edit-last-name"
                placeholder="Enter your last name"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label className="text-muted-foreground">Email</Label>
              <Input value={user?.email || ""} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact an administrator if needed.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProfile} disabled={isUpdating}>
              {isUpdating ? (
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

      {/* Change Password Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Change Password
            </DialogTitle>
            <DialogDescription>
              Enter your current password and choose a new one
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {passwordError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {passwordError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="Enter current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPasswordOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Changing...
                </>
              ) : (
                "Change Password"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
