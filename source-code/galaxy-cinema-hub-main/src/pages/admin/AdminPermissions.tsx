import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { permissionsService } from '@/services/permissions';
import type { Permission } from '@/types/permission';

const MODULE_COLORS: Record<string, string> = {
  movies: 'bg-purple-500',
  users: 'bg-blue-500',
  bookings: 'bg-green-500',
  tickets: 'bg-orange-500',
  reports: 'bg-pink-500',
  cinemas: 'bg-cyan-500',
  halls: 'bg-indigo-500',
  showtimes: 'bg-amber-500',
  transactions: 'bg-emerald-500',
  promotions: 'bg-rose-500',
  concessions: 'bg-violet-500',
  reviews: 'bg-lime-500',
  system: 'bg-red-500',
};

const AdminPermissions: React.FC = () => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});
  const [modules, setModules] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    module: '',
  });

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    try {
      setLoading(true);
      const response = await permissionsService.getAllPermissions();
      setPermissions(response.data.permissions);
      setGroupedPermissions(response.data.grouped);
      setModules(response.data.modules);
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tải danh sách permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.display_name || !formData.module) {
      toast({
        title: 'Lỗi',
        description: 'Vui lòng điền đầy đủ thông tin',
        variant: 'destructive',
      });
      return;
    }

    // Validate format: module.action
    if (!/^[a-z_]+\.[a-z_]+$/.test(formData.name)) {
      toast({
        title: 'Lỗi',
        description: 'Tên permission phải theo format: module.action (vd: movies.create)',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSubmitting(true);
      await permissionsService.createPermission(formData);
      toast({
        title: 'Thành công',
        description: 'Đã tạo permission mới',
      });
      setShowCreateDialog(false);
      resetForm();
      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể tạo permission',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedPermission) return;

    try {
      setSubmitting(true);
      await permissionsService.updatePermission(selectedPermission.id, {
        display_name: formData.display_name,
        description: formData.description,
        module: formData.module,
      });
      toast({
        title: 'Thành công',
        description: 'Đã cập nhật permission',
      });
      setShowEditDialog(false);
      resetForm();
      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể cập nhật permission',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;

    try {
      setSubmitting(true);
      await permissionsService.deletePermission(selectedPermission.id);
      toast({
        title: 'Thành công',
        description: 'Đã xóa permission',
      });
      setShowDeleteDialog(false);
      setSelectedPermission(null);
      loadPermissions();
    } catch (error: any) {
      toast({
        title: 'Lỗi',
        description: error.response?.data?.message || 'Không thể xóa permission',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setFormData({
      name: permission.name,
      display_name: permission.display_name,
      description: permission.description || '',
      module: permission.module,
    });
    setShowEditDialog(true);
  };

  const openDeleteDialog = (permission: Permission) => {
    setSelectedPermission(permission);
    setShowDeleteDialog(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      display_name: '',
      description: '',
      module: '',
    });
    setSelectedPermission(null);
  };

  const filteredPermissions = permissions.filter((perm) => {
    const matchesSearch =
      perm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.display_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = selectedModule === 'all' || perm.module === selectedModule;
    return matchesSearch && matchesModule;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Quản Lý Permissions
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý tất cả permissions trong hệ thống
          </p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo Permission
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng Permissions</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{permissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Module Lớn Nhất</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {modules.length > 0
                ? Object.entries(groupedPermissions).reduce((a, b) =>
                    a[1].length > b[1].length ? a : b
                  )[0]
                : '-'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
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
            <Select value={selectedModule} onValueChange={setSelectedModule}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Chọn module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả modules</SelectItem>
                {modules.map((module) => (
                  <SelectItem key={module} value={module}>
                    {module}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs View */}
      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Danh Sách</TabsTrigger>
          <TabsTrigger value="grouped">Theo Module</TabsTrigger>
        </TabsList>

        {/* List View */}
        <TabsContent value="list">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Tên Hiển Thị</TableHead>
                    <TableHead>Module</TableHead>
                    <TableHead>Mô Tả</TableHead>
                    <TableHead className="text-right">Thao Tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPermissions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Không tìm thấy permission nào
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredPermissions.map((permission) => (
                      <TableRow key={permission.id}>
                        <TableCell className="font-mono text-xs">{permission.id}</TableCell>
                        <TableCell className="font-mono text-sm">{permission.name}</TableCell>
                        <TableCell>{permission.display_name}</TableCell>
                        <TableCell>
                          <Badge
                            className={`${
                              MODULE_COLORS[permission.module] || 'bg-gray-500'
                            } text-white`}
                          >
                            {permission.module}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                          {permission.description || '-'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(permission)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteDialog(permission)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Grouped View */}
        <TabsContent value="grouped">
          <div className="grid grid-cols-1 gap-4">
            {modules
              .filter((module) => selectedModule === 'all' || module === selectedModule)
              .map((module) => (
                <Card key={module}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          MODULE_COLORS[module] || 'bg-gray-500'
                        }`}
                      />
                      {module}
                      <Badge variant="secondary" className="ml-auto">
                        {groupedPermissions[module]?.length || 0} permissions
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupedPermissions[module]
                        ?.filter(
                          (p) =>
                            !searchTerm ||
                            p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.display_name.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                          >
                            <div className="flex-1">
                              <div className="font-medium">{permission.display_name}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {permission.name}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openEditDialog(permission)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => openDeleteDialog(permission)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo Permission Mới</DialogTitle>
            <DialogDescription>
              Thêm permission mới vào hệ thống. Tên phải theo format: module.action
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">
                Tên Permission <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="vd: movies.export"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Format: module.action</p>
            </div>
            <div>
              <Label htmlFor="display_name">
                Tên Hiển Thị <span className="text-destructive">*</span>
              </Label>
              <Input
                id="display_name"
                placeholder="vd: Export danh sách phim"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="module">
                Module <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.module}
                onValueChange={(value) => setFormData({ ...formData, module: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn module" />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                  <SelectItem value="new">+ Module mới</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.module === 'new' && (
              <div>
                <Label htmlFor="new_module">Tên Module Mới</Label>
                <Input
                  id="new_module"
                  placeholder="vd: exports"
                  onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                />
              </div>
            )}
            <div>
              <Label htmlFor="description">Mô Tả</Label>
              <Textarea
                id="description"
                placeholder="Mô tả chi tiết về permission này"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleCreate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Tạo Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cập Nhật Permission</DialogTitle>
            <DialogDescription>
              Chỉnh sửa thông tin permission (không thể thay đổi tên)
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Tên Permission</Label>
              <Input value={formData.name} disabled className="bg-muted" />
              <p className="text-xs text-muted-foreground mt-1">Không thể thay đổi tên</p>
            </div>
            <div>
              <Label htmlFor="edit_display_name">Tên Hiển Thị</Label>
              <Input
                id="edit_display_name"
                value={formData.display_name}
                onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_module">Module</Label>
              <Select
                value={formData.module}
                onValueChange={(value) => setFormData({ ...formData, module: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {modules.map((module) => (
                    <SelectItem key={module} value={module}>
                      {module}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_description">Mô Tả</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Hủy
            </Button>
            <Button onClick={handleUpdate} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Cập Nhật
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Xác Nhận Xóa
            </DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa permission này không? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          {selectedPermission && (
            <div className="bg-muted p-4 rounded-lg">
              <div className="text-sm font-medium">{selectedPermission.display_name}</div>
              <div className="text-xs text-muted-foreground font-mono">
                {selectedPermission.name}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xóa Permission
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPermissions;
