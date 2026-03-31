import React, { useState, useEffect } from "react";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Ban,
  CheckCircle,
  Shield,
  Trophy,
  Calendar,
  Phone,
  Mail,
  Loader2,
  RefreshCw,
  Trash,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { API_ENDPOINTS } from "@/lib/api";

// Interface matching backend response
interface User {
  id: number;
  email: string;
  full_name: string;
  phone: string;
  dob: string | null;
  role_id: number;
  role_name: string;
  rank_name: string | null;
  status: string;
  current_points: number;
  created_at: string;
  avatar?: string | null;
  cinema_id?: number | null;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // API State
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });
  const [tierCounts, setTierCounts] = useState<Record<string, number>>({
    Bronze: 0,
    Silver: 0,
    Gold: 0,
    Platinum: 0,
  });
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({
    active: 0,
    banned: 0,
  });
  const [roles, setRoles] = useState<Array<{ id: number; name: string }>>([]);
  const [cinemas, setCinemas] = useState<
    Array<{
      id: number;
      name: string;
      manager_id?: number | null;
      manager_name?: string | null;
    }>
  >([]);

  // Fetch users from API
  const fetchUsers = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast({
          title: "Lỗi xác thực",
          description: "Vui lòng đăng nhập lại",
          variant: "destructive",
        });
        return;
      }

      const queryParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      if (searchQuery) {
        queryParams.append("search", searchQuery);
      }
      if (filterRole !== "all") queryParams.append("role_id", filterRole);
      if (filterStatus !== "all") queryParams.append("status", filterStatus);

      const apiUrl = `${API_ENDPOINTS.USERS}?${queryParams.toString()}`;

      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setUsers(data.data.users || []);
        if (data.data.pagination) {
          setPagination(data.data.pagination);
        }
        if (data.data.tier_counts) {
          setTierCounts(data.data.tier_counts);
        }
        if (data.data.status_counts) {
          setStatusCounts(data.data.status_counts);
        }
      } else {
        throw new Error(data.message || "Failed to fetch users");
      }
    } catch (error) {
      console.error("❌ Error fetching users:", error);
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể tải danh sách người dùng",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [
    pagination.page,
    pagination.limit,
    filterRole,
    filterStatus,
    searchQuery,
    toast,
  ]);

  // Fetch roles for dropdown
  const fetchRoles = React.useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const rolesUrl = `${API_ENDPOINTS.USERS.replace("/users", "/roles")}`;

      const response = await fetch(rolesUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        setRoles(
          (data.data.roles || []).filter(
            (r: { id: number; name: string }) =>
              r.name.toLowerCase() !== "guest",
          ),
        );
      }
    } catch (error) {
      console.error("❌ Error fetching roles:", error);
    }
  }, []);

  // Fetch cinemas for dropdown
  const fetchCinemas = React.useCallback(async () => {
    try {
      const response = await fetch(API_ENDPOINTS.CINEMAS);
      const data = await response.json();
      if (data.success) {
        setCinemas(data.data.cinemas || []);
      }
    } catch (error) {
      console.error("❌ Error fetching cinemas:", error);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchUsers();
    fetchRoles();
    fetchCinemas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Refetch when filters change (debounced)
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (!isLoading) {
        fetchUsers();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterRole, filterStatus, pagination.page]);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    dob: "",
    role_id: 2, // Member default
    password: "",
    cinema_id: "",
  });

  // Statistics (from global API counts, not page-local)
  const totalUsers = pagination.total;
  const activeUsers = statusCounts.active || 0;
  const bannedUsers = statusCounts.banned || 0;

  // Edit user handler
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      full_name: user.full_name,
      phone: user.phone || "",
      dob: user.dob || "",
      role_id: user.role_id,
      password: "",
      cinema_id: user.cinema_id ? user.cinema_id.toString() : "",
    });
    setIsEditDialogOpen(true);
  };

  // Update user via API
  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${API_ENDPOINTS.USERS}/${selectedUser.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            role_id: formData.role_id,
            ...(formData.cinema_id ? { cinema_id: formData.cinema_id } : {}),
            ...(formData.password ? { password: formData.password } : {}),
          }),
        },
      );

      const data = await response.json();

      if (data.success) {
        console.log("✅ User role updated successfully");

        // Update profile
        console.log("📝 Updating user profile...", {
          full_name: formData.full_name,
          phone: formData.phone,
          dob: formData.dob,
        });
        const profileResponse = await fetch(
          `${API_ENDPOINTS.USERS}/${selectedUser.id}/profile`,
          {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              full_name: formData.full_name,
              phone: formData.phone,
              dob: formData.dob || null,
            }),
          },
        );

        const profileData = await profileResponse.json();
        console.log("📦 Profile update response:", profileData);

        if (!profileData.success) {
          console.warn("⚠️ Profile update failed:", profileData.message);
        }

        toast({
          title: "Cập nhật thành công",
          description: `Đã cập nhật thông tin người dùng ${formData.full_name}`,
        });

        setIsEditDialogOpen(false);
        setSelectedUser(null);
        fetchUsers(); // Reload
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi cập nhật",
        description:
          error instanceof Error
            ? error.message
            : "Không thể cập nhật người dùng",
        variant: "destructive",
      });
    }
  };

  // Create user via API
  const handleCreateUser = async () => {
    const selectedRoleName = roles
      .find((r) => r.id === formData.role_id)
      ?.name?.toLowerCase();
    const isStaffOrManager =
      selectedRoleName === "staff" || selectedRoleName === "manager";

    if (
      !formData.email ||
      !formData.full_name ||
      !formData.password ||
      (isStaffOrManager && !formData.cinema_id)
    ) {
      toast({
        title: "Lỗi",
        description:
          "Vui lòng điền đầy đủ thông tin bắt buộc, bao gồm cả rạp chiếu nếu là nhân viên.",
        variant: "destructive",
      });
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Tạo thành công",
          description: `Đã tạo tài khoản cho ${formData.full_name}`,
        });

        setIsCreateDialogOpen(false);
        setFormData({
          email: "",
          full_name: "",
          phone: "",
          dob: "",
          role_id: 2,
          password: "",
          cinema_id: "",
        });
        fetchUsers(); // Reload
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi tạo người dùng",
        description:
          error instanceof Error
            ? error.message
            : "Không thể tạo người dùng mới",
        variant: "destructive",
      });
    }
  };

  // Toggle status (Ban/Unban)
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.status === "Active" ? "Banned" : "Active";

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ENDPOINTS.USERS}/${user.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: newStatus === "Banned" ? "Đã khóa tài khoản" : "Đã mở khóa",
          description: `${user.full_name} - ${user.email}`,
        });
        fetchUsers(); // Reload
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi",
        description:
          error instanceof Error
            ? error.message
            : "Không thể thay đổi trạng thái",
        variant: "destructive",
      });
    }
  };

  // Delete user via API
  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Bạn có chắc muốn xóa người dùng ${user.full_name}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_ENDPOINTS.USERS}/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Đã xóa",
          description: `Đã xóa người dùng ${user.full_name}`,
        });
        fetchUsers(); // Reload
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: "Lỗi xóa",
        description:
          error instanceof Error ? error.message : "Không thể xóa người dùng",
        variant: "destructive",
      });
    }
  };

  const getRoleBadge = (role_name: string) => {
    const configs: Record<string, { color: string; icon: React.ReactNode }> = {
      Admin: { color: "bg-red-500", icon: <Shield className="w-3 h-3" /> },
      Manager: {
        color: "bg-purple-500",
        icon: <Shield className="w-3 h-3" />,
      },
      Staff: { color: "bg-blue-500", icon: <Users className="w-3 h-3" /> },
      Member: { color: "bg-green-500", icon: <Users className="w-3 h-3" /> },
      Guest: { color: "bg-gray-500", icon: <Users className="w-3 h-3" /> },
    };
    const config = configs[role_name] || configs.Guest;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {role_name}
      </Badge>
    );
  };

  const getMembershipBadge = (rank_name: string | null) => {
    if (!rank_name) return <span className="text-muted-foreground">-</span>;

    const configs: Record<string, { color: string }> = {
      Platinum: { color: "bg-gradient-to-r from-purple-500 to-indigo-500" },
      Gold: { color: "bg-yellow-500" },
      Silver: { color: "bg-gray-400" },
      Bronze: { color: "bg-orange-600" },
    };
    const config = configs[rank_name];

    // Handle case when rank_name is not in configs
    if (!config) {
      console.warn(`⚠️ Unknown rank_name: ${rank_name}`);
      return <span className="text-muted-foreground">{rank_name}</span>;
    }

    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Trophy className="w-3 h-3" />
        {rank_name}
      </Badge>
    );
  };

  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Quản Lý Người Dùng</h1>
          <p className="text-muted-foreground">
            Quản lý tài khoản, phân quyền và hạng thành viên
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchUsers()}
            disabled={isLoading}
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Làm mới
          </Button>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" />
            Thêm Người Dùng
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Tổng Người Dùng
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">Tất cả tài khoản</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Đang Hoạt Động
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUsers}</div>
            <p className="text-xs text-muted-foreground">Active users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bị Khóa</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bannedUsers}</div>
            <p className="text-xs text-muted-foreground">Banned users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Hạng Thành Viên
            </CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-600"></span>
                <span className="text-sm">
                  Bronze: <strong>{tierCounts.Bronze}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span>
                <span className="text-sm">
                  Silver: <strong>{tierCounts.Silver}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                <span className="text-sm">
                  Gold: <strong>{tierCounts.Gold}</strong>
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"></span>
                <span className="text-sm">
                  Platinum: <strong>{tierCounts.Platinum}</strong>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Tìm theo tên, email, số điện thoại..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Vai trò" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả vai trò</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id.toString()}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Danh Sách Người Dùng ({pagination.total})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Đang tải dữ liệu...</span>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Không tìm thấy người dùng nào
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Người Dùng</TableHead>
                  <TableHead>Liên Hệ</TableHead>
                  <TableHead>Tuổi</TableHead>
                  <TableHead>Vai Trò</TableHead>
                  <TableHead>Hạng TV</TableHead>
                  <TableHead>Điểm Tích Lũy</TableHead>
                  <TableHead>Trạng Thái</TableHead>
                  <TableHead>Ngày Tạo</TableHead>
                  <TableHead className="text-right">Thao Tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage src={user.avatar || undefined} />
                          <AvatarFallback>
                            {user.full_name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{user.full_name}</p>
                          <p className="text-sm text-muted-foreground">
                            #{user.id}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-3 h-3" />
                          {user.phone || "-"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {user.dob ? (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          {calculateAge(user.dob)} tuổi
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getRoleBadge(user.role_name)}
                        {user.cinema_id && (
                          <span className="text-xs text-muted-foreground">
                            Rạp #{user.cinema_id}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{getMembershipBadge(user.rank_name)}</TableCell>
                    <TableCell className="font-medium">
                      {user.current_points?.toLocaleString("vi-VN") || 0} điểm
                    </TableCell>
                    <TableCell>
                      {user.status === "Active" ? (
                        <Badge className="bg-green-500 text-white">
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-red-500 text-white">Banned</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Thao tác</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleEditUser(user)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleToggleStatus(user)}
                          >
                            {user.status === "Active" ? (
                              <>
                                <Ban className="w-4 h-4 mr-2" />
                                Khóa tài khoản
                              </>
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Mở khóa
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user)}
                            className="text-red-600"
                          >
                            <Trash className="w-4 h-4 mr-2" />
                            Xóa tài khoản
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chỉnh Sửa Người Dùng</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin người dùng {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-fullName">Họ và Tên *</Label>
              <Input
                id="edit-fullName"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Số Điện Thoại</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-dob">Ngày Sinh</Label>
              <Input
                id="edit-dob"
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-password">Mật Khẩu Mới</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Để trống nếu không đổi (tối thiểu 6 ký tự)"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Vai Trò</Label>
              <Select
                value={formData.role_id.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role_id: parseInt(value),
                    cinema_id: "",
                  })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.name.toLowerCase() !== "guest")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {(roles
              .find((r) => r.id === formData.role_id)
              ?.name?.toLowerCase() === "staff" ||
              roles
                .find((r) => r.id === formData.role_id)
                ?.name?.toLowerCase() === "manager") && (
              <div className="space-y-2">
                <Label htmlFor="edit-cinema">Chi nhánh Rạp *</Label>
                <Select
                  value={formData.cinema_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cinema_id: value })
                  }
                >
                  <SelectTrigger id="edit-cinema">
                    <SelectValue placeholder="Chọn rạp..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cinemas.map((cinema) => {
                      const isManagerRole =
                        roles
                          .find((r) => r.id === formData.role_id)
                          ?.name?.toLowerCase() === "manager";
                      const isAlreadyAssigned = !!(
                        isManagerRole &&
                        cinema.manager_id &&
                        cinema.manager_id !== selectedUser?.id
                      );

                      return (
                        <SelectItem
                          key={cinema.id}
                          value={cinema.id.toString()}
                          disabled={isAlreadyAssigned}
                        >
                          {cinema.name}
                          {isAlreadyAssigned ? ` (Đã gán quản lý khác)` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleUpdateUser}>Cập Nhật</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create User Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Thêm Người Dùng Mới</DialogTitle>
            <DialogDescription>
              Tạo tài khoản mới cho hệ thống
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-email">Email *</Label>
              <Input
                id="create-email"
                type="email"
                placeholder="user@example.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-password">Mật Khẩu *</Label>
              <Input
                id="create-password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-fullName">Họ và Tên *</Label>
              <Input
                id="create-fullName"
                placeholder="Nguyễn Văn A"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-phone">Số Điện Thoại</Label>
              <Input
                id="create-phone"
                placeholder="0901234567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-dob">Ngày Sinh</Label>
              <Input
                id="create-dob"
                type="date"
                value={formData.dob}
                onChange={(e) =>
                  setFormData({ ...formData, dob: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="create-role">Vai Trò</Label>
              <Select
                value={formData.role_id.toString()}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    role_id: parseInt(value),
                    cinema_id: "",
                  })
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles
                    .filter((role) => role.name.toLowerCase() !== "guest")
                    .map((role) => (
                      <SelectItem key={role.id} value={role.id.toString()}>
                        {role.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {(roles
              .find((r) => r.id === formData.role_id)
              ?.name?.toLowerCase() === "staff" ||
              roles
                .find((r) => r.id === formData.role_id)
                ?.name?.toLowerCase() === "manager") && (
              <div className="space-y-2">
                <Label htmlFor="create-cinema">Chi nhánh Rạp *</Label>
                <Select
                  value={formData.cinema_id.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, cinema_id: value })
                  }
                >
                  <SelectTrigger id="create-cinema">
                    <SelectValue placeholder="Chọn rạp..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cinemas.map((cinema) => {
                      const isManagerRole =
                        roles
                          .find((r) => r.id === formData.role_id)
                          ?.name?.toLowerCase() === "manager";
                      const isAlreadyAssigned = !!(
                        isManagerRole && cinema.manager_id
                      );

                      return (
                        <SelectItem
                          key={cinema.id}
                          value={cinema.id.toString()}
                          disabled={isAlreadyAssigned}
                        >
                          {cinema.name}
                          {isAlreadyAssigned ? ` (Đã gán quản lý khác)` : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button onClick={handleCreateUser}>Tạo Tài Khoản</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Hiển thị {(pagination.page - 1) * pagination.limit + 1} -{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                trong tổng số {pagination.total} người dùng
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page - 1 })
                  }
                  disabled={pagination.page === 1 || isLoading}
                >
                  Trang trước
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from(
                    { length: Math.min(5, pagination.total_pages) },
                    (_, i) => {
                      let pageNumber;
                      if (pagination.total_pages <= 5) {
                        pageNumber = i + 1;
                      } else if (pagination.page <= 3) {
                        pageNumber = i + 1;
                      } else if (
                        pagination.page >=
                        pagination.total_pages - 2
                      ) {
                        pageNumber = pagination.total_pages - 4 + i;
                      } else {
                        pageNumber = pagination.page - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNumber}
                          variant={
                            pagination.page === pageNumber
                              ? "default"
                              : "outline"
                          }
                          size="sm"
                          onClick={() =>
                            setPagination({ ...pagination, page: pageNumber })
                          }
                          disabled={isLoading}
                        >
                          {pageNumber}
                        </Button>
                      );
                    },
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination({ ...pagination, page: pagination.page + 1 })
                  }
                  disabled={
                    pagination.page === pagination.total_pages || isLoading
                  }
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminUsers;
