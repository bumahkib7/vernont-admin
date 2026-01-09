"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  MoreHorizontal,
  Plus,
  Search,
  Loader2,
  Mail,
  Pencil,
  Trash2,
  Archive,
  AlertTriangle,
  UserPlus,
  Shield,
  AlertCircle,
} from "lucide-react";
import {
  getInternalUsers,
  inviteInternalUser,
  updateInternalUser,
  archiveInternalUser,
  hardDeleteInternalUser,
  ApiError,
  type InternalUser,
  type InternalUserRole,
} from "@/lib/api";
import { getRoleBadgeColor, getRoleDisplayName } from "@/lib/auth";

const AVAILABLE_ROLES: { value: InternalUserRole; label: string; description: string }[] = [
  { value: "ADMIN", label: "Admin", description: "Full access to all features" },
  { value: "DEVELOPER", label: "Developer", description: "Developer access for integrations" },
  { value: "CUSTOMER_SERVICE", label: "Customer Service", description: "Manage orders and customers" },
  { value: "WAREHOUSE_MANAGER", label: "Warehouse Manager", description: "Manage inventory and fulfillment" },
];

export default function UsersSettingsPage() {
  const [users, setUsers] = useState<InternalUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Invite modal state
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteFirstName, setInviteFirstName] = useState("");
  const [inviteLastName, setInviteLastName] = useState("");
  const [inviteRoles, setInviteRoles] = useState<string[]>(["CUSTOMER_SERVICE"]);
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  // Edit modal state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<InternalUser | null>(null);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editRoles, setEditRoles] = useState<string[]>([]);
  const [editIsActive, setEditIsActive] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // Archive confirmation state
  const [isArchiveOpen, setIsArchiveOpen] = useState(false);
  const [archivingUser, setArchivingUser] = useState<InternalUser | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

  // Hard delete confirmation state (permanent)
  const [isHardDeleteOpen, setIsHardDeleteOpen] = useState(false);
  const [hardDeletingUser, setHardDeletingUser] = useState<InternalUser | null>(null);
  const [isHardDeleting, setIsHardDeleting] = useState(false);
  const [hardDeleteConfirmText, setHardDeleteConfirmText] = useState("");

  // Extract error message from API error
  const getErrorMessage = (err: unknown): string => {
    if (err instanceof ApiError) {
      // Use the human-readable message from the backend
      return err.message;
    }
    if (err instanceof Error) {
      return err.message;
    }
    return "An unexpected error occurred";
  };

  // Fetch users
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await getInternalUsers({ limit: 100 });
      setUsers(response.users || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Filter users by search
  const filteredUsers = users.filter((user) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    const fullName = `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase();
    return (
      fullName.includes(query) ||
      user.email.toLowerCase().includes(query) ||
      user.roles.some((r) => r.toLowerCase().includes(query))
    );
  });

  // Handle invite
  const handleInvite = async () => {
    if (!inviteEmail || inviteRoles.length === 0) {
      setInviteError("Email and at least one role are required");
      return;
    }

    try {
      setIsInviting(true);
      setInviteError(null);
      await inviteInternalUser({
        email: inviteEmail,
        firstName: inviteFirstName || undefined,
        lastName: inviteLastName || undefined,
        roles: inviteRoles,
      });
      setIsInviteOpen(false);
      resetInviteForm();
      fetchUsers();
    } catch (err) {
      setInviteError(getErrorMessage(err));
    } finally {
      setIsInviting(false);
    }
  };

  const resetInviteForm = () => {
    setInviteEmail("");
    setInviteFirstName("");
    setInviteLastName("");
    setInviteRoles(["CUSTOMER_SERVICE"]);
    setInviteError(null);
  };

  // Handle edit
  const openEditModal = (user: InternalUser) => {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditRoles(user.roles);
    setEditIsActive(user.isActive);
    setEditError(null);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingUser || editRoles.length === 0) {
      setEditError("At least one role is required");
      return;
    }

    try {
      setIsUpdating(true);
      setEditError(null);
      await updateInternalUser(editingUser.id, {
        firstName: editFirstName || undefined,
        lastName: editLastName || undefined,
        roles: editRoles,
        isActive: editIsActive,
      });
      setIsEditOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      setEditError(getErrorMessage(err));
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle archive (soft delete)
  const openArchiveConfirm = (user: InternalUser) => {
    setArchivingUser(user);
    setIsArchiveOpen(true);
  };

  const handleArchive = async () => {
    if (!archivingUser) return;

    try {
      setIsArchiving(true);
      await archiveInternalUser(archivingUser.id);
      setIsArchiveOpen(false);
      setArchivingUser(null);
      fetchUsers();
    } catch (err) {
      console.error("Failed to archive user:", err);
    } finally {
      setIsArchiving(false);
    }
  };

  // Handle hard delete (permanent)
  const openHardDeleteConfirm = (user: InternalUser) => {
    setHardDeletingUser(user);
    setHardDeleteConfirmText("");
    setIsHardDeleteOpen(true);
  };

  const handleHardDelete = async () => {
    if (!hardDeletingUser) return;

    try {
      setIsHardDeleting(true);
      await hardDeleteInternalUser(hardDeletingUser.id);
      setIsHardDeleteOpen(false);
      setHardDeletingUser(null);
      setHardDeleteConfirmText("");
      fetchUsers();
    } catch (err) {
      console.error("Failed to permanently delete user:", err);
    } finally {
      setIsHardDeleting(false);
    }
  };

  // Get user initials
  const getUserInitials = (user: InternalUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) return user.firstName[0].toUpperCase();
    return user.email[0].toUpperCase();
  };

  // Get user display name
  const getUserDisplayName = (user: InternalUser) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    return user.email.split("@")[0];
  };

  // Toggle role in list
  const toggleRole = (role: string, rolesList: string[], setRoles: (roles: string[]) => void) => {
    if (rolesList.includes(role)) {
      if (rolesList.length > 1) {
        setRoles(rolesList.filter((r) => r !== role));
      }
    } else {
      setRoles([...rolesList, role]);
    }
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
            <BreadcrumbPage>Users</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Users Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>The Team</CardTitle>
            <CardDescription>Manage users of your Vernont Store</CardDescription>
          </div>
          <Button className="gap-2" onClick={() => setIsInviteOpen(true)}>
            <Plus className="h-4 w-4" />
            Invite Users
          </Button>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                className="pl-8 w-[250px]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 p-4 mb-4 text-red-600 bg-red-50 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={fetchUsers} className="ml-auto">
                Retry
              </Button>
            </div>
          )}

          {/* Loading state */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Users Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role(s)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        {searchQuery ? "No users match your search" : "No users found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={user.avatarUrl || undefined} />
                              <AvatarFallback>{getUserInitials(user)}</AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{getUserDisplayName(user)}</span>
                          </div>
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge
                                key={role}
                                variant="secondary"
                                className={getRoleBadgeColor(role)}
                              >
                                {getRoleDisplayName(role)}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.inviteStatus === "PENDING" ? (
                            <Badge variant="outline" className="border-yellow-500 text-yellow-600">
                              Pending Invite
                            </Badge>
                          ) : user.inviteStatus === "ACCEPTED" ? (
                            <Badge variant="default" className="bg-green-600">
                              Active
                            </Badge>
                          ) : user.inviteStatus === "EXPIRED" ? (
                            <Badge variant="secondary" className="text-red-500">
                              Expired
                            </Badge>
                          ) : user.isActive ? (
                            <Badge variant="default">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {user.lastLoginAt
                            ? new Date(user.lastLoginAt).toLocaleDateString()
                            : "Never"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEditModal(user)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit User
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => openArchiveConfirm(user)}
                                className="text-amber-600"
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archive User
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openHardDeleteConfirm(user)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete Permanently
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
                {filteredUsers.length} member{filteredUsers.length === 1 ? "" : "s"}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={isInviteOpen} onOpenChange={(open) => {
        setIsInviteOpen(open);
        if (!open) resetInviteForm();
      }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Invite Team Member
            </DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new team member. They will receive a link to set up their account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {inviteError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {inviteError}
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="invite-email">Email *</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="colleague@company.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="invite-firstname">First Name</Label>
                <Input
                  id="invite-firstname"
                  placeholder="John"
                  value={inviteFirstName}
                  onChange={(e) => setInviteFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-lastname">Last Name</Label>
                <Input
                  id="invite-lastname"
                  placeholder="Doe"
                  value={inviteLastName}
                  onChange={(e) => setInviteLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles *
              </Label>
              <div className="grid gap-2 p-3 border rounded-lg">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start gap-3">
                    <Checkbox
                      id={`invite-role-${role.value}`}
                      checked={inviteRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value, inviteRoles, setInviteRoles)}
                    />
                    <div className="grid gap-0.5">
                      <Label
                        htmlFor={`invite-role-${role.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {role.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit User
            </DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {editError && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {editError}
              </div>
            )}

            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Avatar className="h-10 w-10">
                <AvatarImage src={editingUser?.avatarUrl || undefined} />
                <AvatarFallback>{editingUser ? getUserInitials(editingUser) : "?"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{editingUser?.email}</p>
                <p className="text-sm text-muted-foreground">User ID: {editingUser?.id.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-firstname">First Name</Label>
                <Input
                  id="edit-firstname"
                  value={editFirstName}
                  onChange={(e) => setEditFirstName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-lastname">Last Name</Label>
                <Input
                  id="edit-lastname"
                  value={editLastName}
                  onChange={(e) => setEditLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Roles *
              </Label>
              <div className="grid gap-2 p-3 border rounded-lg">
                {AVAILABLE_ROLES.map((role) => (
                  <div key={role.value} className="flex items-start gap-3">
                    <Checkbox
                      id={`edit-role-${role.value}`}
                      checked={editRoles.includes(role.value)}
                      onCheckedChange={() => toggleRole(role.value, editRoles, setEditRoles)}
                    />
                    <div className="grid gap-0.5">
                      <Label
                        htmlFor={`edit-role-${role.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {role.label}
                      </Label>
                      <span className="text-xs text-muted-foreground">{role.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg">
              <Checkbox
                id="edit-active"
                checked={editIsActive}
                onCheckedChange={(checked) => setEditIsActive(checked === true)}
              />
              <div className="grid gap-0.5">
                <Label htmlFor="edit-active" className="font-medium cursor-pointer">
                  Active
                </Label>
                <span className="text-xs text-muted-foreground">
                  Inactive users cannot log in to the admin dashboard
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={isUpdating}>
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

      {/* Archive Confirmation Dialog */}
      <AlertDialog open={isArchiveOpen} onOpenChange={setIsArchiveOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5 text-amber-600" />
              Archive User
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to archive <strong>{archivingUser?.email}</strong>?
              The user will no longer be able to access the admin dashboard, but their data will be preserved and they can be restored later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className="bg-amber-600 hover:bg-amber-700"
              disabled={isArchiving}
            >
              {isArchiving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                "Archive User"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hard Delete Confirmation Dialog - with type-to-confirm */}
      <AlertDialog open={isHardDeleteOpen} onOpenChange={(open) => {
        setIsHardDeleteOpen(open);
        if (!open) setHardDeleteConfirmText("");
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Permanently Delete User
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>
                You are about to <strong className="text-red-600">permanently delete</strong>{" "}
                <strong>{hardDeletingUser?.email}</strong>.
              </p>
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                <p className="font-semibold mb-1">This action cannot be undone!</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>All user data will be permanently removed</li>
                  <li>All role associations will be deleted</li>
                  <li>This user cannot be restored</li>
                </ul>
              </div>
              <div className="pt-2">
                <Label htmlFor="confirm-delete" className="text-sm font-medium">
                  Type <strong>DELETE</strong> to confirm:
                </Label>
                <Input
                  id="confirm-delete"
                  value={hardDeleteConfirmText}
                  onChange={(e) => setHardDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="mt-2"
                />
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleHardDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isHardDeleting || hardDeleteConfirmText !== "DELETE"}
            >
              {isHardDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
