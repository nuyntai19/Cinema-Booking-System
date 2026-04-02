import React, { useState, useEffect } from "react";
import {
  Shield,
  Users,
  CheckCircle,
  Circle,
  Loader2,
  Save,
  RotateCcw,
  Search,
  Info,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { permissionsService } from "@/services/permissions";
import type { Permission, Role } from "@/types/permission";

const ROLES = [
  { id: 1, name: "Guest", color: "bg-gray-500", description: "Khách vãng lai" },
  {
    id: 2,
    name: "Member",
    color: "bg-blue-500",
    description: "Thành viên đã đăng ký",
  },
  {
    id: 3,
    name: "Staff",
    color: "bg-green-500",
    description: "Nhân viên quầy",
  },
  {
    id: 4,
    name: "Manager",
    color: "bg-purple-500",
    description: "Quản lý rạp",
  },
];

const MODULE_COLORS: Record<string, string> = {
  movies: "bg-purple-500",
  users: "bg-blue-500",
  bookings: "bg-green-500",
  tickets: "bg-orange-500",
  reports: "bg-pink-500",
  cinemas: "bg-cyan-500",
  halls: "bg-indigo-500",
  showtimes: "bg-amber-500",
  transactions: "bg-emerald-500",
  promotions: "bg-rose-500",
  concessions: "bg-violet-500",
  reviews: "bg-lime-500",
  system: "bg-red-500",
};

// Hard-restrict: mỗi role chỉ được gán những permissions phù hợp cấp bậc
const ROLE_ALLOWED_PERMISSIONS: Record<number, string[] | "all"> = {
  // Guest: chỉ xem nội dung công khai
  1: [
    "movies.view",
    "cinemas.view",
    "showtimes.view",
    "promotions.view",
    "concessions.view",
    "reviews.view",
  ],
  // Member: Guest + thao tác cá nhân (đặt vé, review, xem profile)
  2: [
    "movies.view",
    "cinemas.view",
    "showtimes.view",
    "promotions.view",
    "concessions.view",
    "reviews.view",
    "users.view_own",
    "bookings.view_own",
    "bookings.create",
    "bookings.cancel",
    "transactions.view_own",
    "transactions.process",
    "reviews.create",
    "reviews.update_own",
    "reviews.delete_own",
  ],
  // Staff: Member + vận hành (POS, scan vé, xem tất cả bookings/tickets)
  3: [
    "movies.view",
    "cinemas.view",
    "showtimes.view",
    "promotions.view",
    "concessions.view",
    "reviews.view",
    "users.view_own",
    "bookings.view_own",
    "bookings.create",
    "bookings.cancel",
    "bookings.view_all",
    "bookings.pos",
    "tickets.view_own",
    "tickets.view_all",
    "tickets.scan",
    "tickets.approve_entry",
    "transactions.view_own",
    "transactions.process",
    "reviews.create",
    "reviews.update_own",
    "reviews.delete_own",
  ],
  // Manager: Staff + quản lý nội dung, báo cáo, CRUD phim/suất chiếu/KM
  4: [
    "movies.view",
    "movies.create",
    "movies.update",
    "movies.delete",
    "movies.upload_poster",
    "movies.import",
    "cinemas.update",
    "halls.view",
    "halls.create",
    "halls.update",
    "halls.delete",
    "halls.manage_layout",
    "showtimes.view",
    "showtimes.create",
    "showtimes.update",
    "showtimes.delete",
    "showtimes.auto_generate",
    "concessions.view",
    "concessions.update",
    "reviews.view",
    "reviews.view_all",
    "reviews.create",
    "reviews.update_own",
    "reviews.delete_own",
    "users.view_own",
    "bookings.view_own",
    "bookings.view_all",
    "bookings.create",
    "bookings.cancel",
    "bookings.update",
    "bookings.refund",
    "transactions.view_own",
    "transactions.view_all",
    "transactions.process",
    "reports.dashboard",
    "reports.revenue",
    "reports.occupancy",
    "reports.export",
  ],
  // Admin: toàn quyền - không giới hạn
  5: "all",
};

// Lọc grouped permissions theo role được chọn
const filterPermissionsByRole = (
  grouped: Record<string, Permission[]>,
  roleId: number,
): Record<string, Permission[]> => {
  const allowed = ROLE_ALLOWED_PERMISSIONS[roleId];
  if (allowed === "all") return grouped;

  const allowedSet = new Set(allowed);
  const filtered: Record<string, Permission[]> = {};
  for (const [module, perms] of Object.entries(grouped)) {
    const moduleFiltered = perms.filter((p) => allowedSet.has(p.name));
    if (moduleFiltered.length > 0) {
      filtered[module] = moduleFiltered;
    }
  }
  return filtered;
};

const AdminRolePermissions: React.FC = () => {
  const { toast } = useToast();
  const [selectedRoleId, setSelectedRoleId] = useState<number>(2); // Default: Member
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<
    Record<string, Permission[]>
  >({});
  const [rolePermissions, setRolePermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<number>
  >(new Set());
  const [originalPermissionIds, setOriginalPermissionIds] = useState<
    Set<number>
  >(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Lọc permissions theo role đang chọn
  const allowedGroupedPermissions = filterPermissionsByRole(
    groupedPermissions,
    selectedRoleId,
  );
  const allowedPermissions = Object.values(allowedGroupedPermissions).flat();

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRoleId]);

  useEffect(() => {
    // Check if there are changes
    const current = Array.from(selectedPermissionIds).sort();
    const original = Array.from(originalPermissionIds).sort();
    setHasChanges(JSON.stringify(current) !== JSON.stringify(original));
  }, [selectedPermissionIds, originalPermissionIds]);

  const loadData = async () => {
    try {
      setLoading(true);

      // Load all permissions
      const allPermsResponse = await permissionsService.getAllPermissions();
      setAllPermissions(allPermsResponse.data.permissions);
      setGroupedPermissions(allPermsResponse.data.grouped);

      // Load role's current permissions
      const rolePermsResponse =
        await permissionsService.getRolePermissions(selectedRoleId);
      setRolePermissions(rolePermsResponse.data.permissions);

      // Set selected IDs
      const permIds = new Set(
        rolePermsResponse.data.permissions.map((p) => p.id),
      );
      setSelectedPermissionIds(permIds);
      setOriginalPermissionIds(new Set(permIds));
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Không thể tải dữ liệu";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePermission = (permissionId: number) => {
    const newSet = new Set(selectedPermissionIds);
    if (newSet.has(permissionId)) {
      newSet.delete(permissionId);
    } else {
      newSet.add(permissionId);
    }
    setSelectedPermissionIds(newSet);
  };

  const handleToggleModule = (module: string) => {
    const modulePerms = allowedGroupedPermissions[module] || [];
    const modulePermIds = modulePerms.map((p) => p.id);
    const allSelected = modulePermIds.every((id) =>
      selectedPermissionIds.has(id),
    );

    const newSet = new Set(selectedPermissionIds);
    if (allSelected) {
      // Unselect all in module
      modulePermIds.forEach((id) => newSet.delete(id));
    } else {
      // Select all in module
      modulePermIds.forEach((id) => newSet.add(id));
    }
    setSelectedPermissionIds(newSet);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await permissionsService.syncPermissions(selectedRoleId, {
        permission_ids: Array.from(selectedPermissionIds),
      });

      toast({
        title: "Thành công",
        description: `Đã cập nhật permissions cho role ${ROLES.find((r) => r.id === selectedRoleId)?.name}`,
      });

      // Reload to sync
      await loadData();
    } catch (error: unknown) {
      const msg =
        error instanceof Error ? error.message : "Không thể lưu thay đổi";
      toast({
        title: "Lỗi",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setSelectedPermissionIds(new Set(originalPermissionIds));
  };

  const handleSelectAll = () => {
    setSelectedPermissionIds(new Set(allowedPermissions.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPermissionIds(new Set());
  };

  const selectedRole = ROLES.find((r) => r.id === selectedRoleId);

  const filteredModules = Object.keys(allowedGroupedPermissions).filter(
    (module) => {
      if (!searchTerm) return true;
      const modulePerms = allowedGroupedPermissions[module];
      return modulePerms.some(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.display_name.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    },
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Phân Quyền Cho Roles
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý permissions cho từng role trong hệ thống
          </p>
        </div>
        {hasChanges && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleReset}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Save className="h-4 w-4 mr-2" />
              Lưu Thay Đổi
            </Button>
          </div>
        )}
      </div>

      {/* Role Selector */}
      <Card>
        <CardHeader>
          <CardTitle>Chọn Role</CardTitle>
          <CardDescription>
            Chọn role để xem và chỉnh sửa permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {ROLES.map((role) => (
              <Card
                key={role.id}
                className={`cursor-pointer transition-all ${
                  selectedRoleId === role.id
                    ? "ring-2 ring-primary shadow-lg"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedRoleId(role.id)}
              >
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`w-12 h-12 rounded-full ${role.color} flex items-center justify-center text-white`}
                    >
                      <Shield className="h-6 w-6" />
                    </div>
                    <div className="font-semibold">{role.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {role.description}
                    </div>
                    {selectedRoleId === role.id && (
                      <Badge variant="default">
                        {selectedPermissionIds.size} permissions
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Đã Chọn</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {selectedPermissionIds.size}
            </div>
            <p className="text-xs text-muted-foreground">
              / {allowedPermissions.length} permissions
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Thay Đổi</CardTitle>
            <Info className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.abs(
                selectedPermissionIds.size - originalPermissionIds.size,
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {hasChanges ? "Chưa lưu" : "Không có thay đổi"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Phần Trăm</CardTitle>
            <Shield className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(
                (selectedPermissionIds.size / allowedPermissions.length) * 100,
              )}
              %
            </div>
            <p className="text-xs text-muted-foreground">Của tổng số</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {
                Object.keys(allowedGroupedPermissions).filter((module) => {
                  const modulePerms = allowedGroupedPermissions[module];
                  return modulePerms.some((p) =>
                    selectedPermissionIds.has(p.id),
                  );
                }).length
              }
            </div>
            <p className="text-xs text-muted-foreground">
              / {Object.keys(allowedGroupedPermissions).length} modules
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm kiếm permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Button variant="outline" onClick={handleSelectAll}>
              Chọn Tất Cả
            </Button>
            <Button variant="outline" onClick={handleDeselectAll}>
              Bỏ Chọn Tất Cả
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Permissions List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Permissions cho {selectedRole?.name}
            <Badge variant="secondary" className="ml-2">
              {selectedPermissionIds.size} / {allowedPermissions.length}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {filteredModules.map((module) => {
              const modulePerms = allowedGroupedPermissions[module].filter(
                (p) =>
                  !searchTerm ||
                  p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  p.display_name
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase()),
              );
              const selectedInModule = modulePerms.filter((p) =>
                selectedPermissionIds.has(p.id),
              ).length;
              const allSelected = modulePerms.length === selectedInModule;

              return (
                <AccordionItem key={module} value={module}>
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => handleToggleModule(module)}
                    />
                    <AccordionTrigger className="flex-1 py-4">
                      <div className="flex items-center gap-3 w-full">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            MODULE_COLORS[module] || "bg-gray-500"
                          }`}
                        />
                        <span className="font-semibold">{module}</span>
                        <Badge variant="secondary" className="ml-auto mr-4">
                          {selectedInModule} / {modulePerms.length}
                        </Badge>
                      </div>
                    </AccordionTrigger>
                  </div>
                  <AccordionContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-8 pt-2">
                      {modulePerms.map((permission) => (
                        <div
                          key={permission.id}
                          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-accent cursor-pointer"
                          onClick={() => handleTogglePermission(permission.id)}
                        >
                          <Checkbox
                            checked={selectedPermissionIds.has(permission.id)}
                            onCheckedChange={() =>
                              handleTogglePermission(permission.id)
                            }
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">
                              {permission.display_name}
                            </div>
                            <div className="text-xs text-muted-foreground font-mono">
                              {permission.name}
                            </div>
                            {permission.description && (
                              <div className="text-xs text-muted-foreground mt-1">
                                {permission.description}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </CardContent>
      </Card>

      {/* Save Button (Fixed at bottom) */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 z-50">
          <Card className="shadow-lg">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <div className="text-sm">
                  <div className="font-medium">Có thay đổi chưa lưu</div>
                  <div className="text-muted-foreground">
                    {selectedPermissionIds.size - originalPermissionIds.size > 0
                      ? "+"
                      : ""}
                    {selectedPermissionIds.size - originalPermissionIds.size}{" "}
                    permissions
                  </div>
                </div>
                <Button variant="outline" onClick={handleReset}>
                  Hủy
                </Button>
                <Button onClick={handleSave} disabled={saving}>
                  {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Lưu Ngay
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AdminRolePermissions;
