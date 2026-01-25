import React, { useState } from "react";
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

interface User {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  dob: string;
  role: "Guest" | "Member" | "Staff" | "Manager" | "Admin";
  membership: "Bronze" | "Silver" | "Gold" | null;
  status: "Active" | "Banned";
  totalSpending: number;
  createdAt: string;
  avatar?: string;
}

const AdminUsers: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Mock data
  const [users, setUsers] = useState<User[]>([
    {
      id: 1,
      email: "admin@galaxy.vn",
      fullName: "Nguyễn Văn Admin",
      phone: "0901234567",
      dob: "1990-01-15",
      role: "Admin",
      membership: null,
      status: "Active",
      totalSpending: 0,
      createdAt: "2024-01-01",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    {
      id: 2,
      email: "manager@galaxy.vn",
      fullName: "Trần Thị Manager",
      phone: "0912345678",
      dob: "1992-05-20",
      role: "Manager",
      membership: null,
      status: "Active",
      totalSpending: 0,
      createdAt: "2024-02-01",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    {
      id: 3,
      email: "staff1@galaxy.vn",
      fullName: "Lê Văn Staff",
      phone: "0923456789",
      dob: "1995-08-10",
      role: "Staff",
      membership: null,
      status: "Active",
      totalSpending: 0,
      createdAt: "2024-03-01",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    {
      id: 4,
      email: "customer1@gmail.com",
      fullName: "Phạm Thị Hoa",
      phone: "0934567890",
      dob: "1998-12-25",
      role: "Member",
      membership: "Gold",
      status: "Active",
      totalSpending: 5500000,
      createdAt: "2024-06-15",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    {
      id: 5,
      email: "customer2@gmail.com",
      fullName: "Hoàng Văn Nam",
      phone: "0945678901",
      dob: "2000-03-14",
      role: "Member",
      membership: "Silver",
      status: "Active",
      totalSpending: 2200000,
      createdAt: "2024-07-20",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    {
      id: 6,
      email: "customer3@gmail.com",
      fullName: "Vũ Thị Lan",
      phone: "0956789012",
      dob: "2002-11-08",
      role: "Member",
      membership: "Bronze",
      status: "Active",
      totalSpending: 850000,
      createdAt: "2024-09-10",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    {
      id: 7,
      email: "banned@gmail.com",
      fullName: "Người Dùng Vi Phạm",
      phone: "0967890123",
      dob: "1999-07-22",
      role: "Member",
      membership: null,
      status: "Banned",
      totalSpending: 0,
      createdAt: "2024-08-05",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
  ]);

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    dob: "",
    role: "Member" as User["role"],
    password: "",
  });

  // Statistics
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === "Active").length;
  const bannedUsers = users.filter((u) => u.status === "Banned").length;
  const goldMembers = users.filter((u) => u.membership === "Gold").length;

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.phone.includes(searchQuery);

    const matchesRole = filterRole === "all" || user.role === filterRole;
    const matchesStatus =
      filterStatus === "all" || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      fullName: user.fullName,
      phone: user.phone,
      dob: user.dob,
      role: user.role,
      password: "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!selectedUser) return;

    setUsers(
      users.map((u) =>
        u.id === selectedUser.id
          ? {
              ...u,
              fullName: formData.fullName,
              phone: formData.phone,
              dob: formData.dob,
              role: formData.role,
            }
          : u,
      ),
    );

    toast({
      title: "Cập nhật thành công",
      description: `Đã cập nhật thông tin người dùng ${formData.fullName}`,
    });

    setIsEditDialogOpen(false);
    setSelectedUser(null);
  };

  const handleCreateUser = () => {
    if (!formData.email || !formData.fullName || !formData.password) {
      toast({
        title: "Lỗi",
        description: "Vui lòng điền đầy đủ thông tin bắt buộc",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      id: users.length + 1,
      email: formData.email,
      fullName: formData.fullName,
      phone: formData.phone,
      dob: formData.dob,
      role: formData.role,
      membership: formData.role === "Member" ? "Bronze" : null,
      status: "Active",
      totalSpending: 0,
      createdAt: new Date().toISOString().split("T")[0],
    };

    setUsers([...users, newUser]);

    toast({
      title: "Tạo thành công",
      description: `Đã tạo tài khoản cho ${formData.fullName}`,
    });

    setIsCreateDialogOpen(false);
    setFormData({
      email: "",
      fullName: "",
      phone: "",
      dob: "",
      role: "Member",
      password: "",
    });
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = user.status === "Active" ? "Banned" : "Active";

    setUsers(
      users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u)),
    );

    toast({
      title: newStatus === "Banned" ? "Đã khóa tài khoản" : "Đã mở khóa",
      description: `${user.fullName} - ${user.email}`,
    });
  };

  const getRoleBadge = (role: string) => {
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
    const config = configs[role] || configs.Guest;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        {config.icon}
        {role}
      </Badge>
    );
  };

  const getMembershipBadge = (membership: string | null) => {
    if (!membership) return <span className="text-muted-foreground">-</span>;

    const configs: Record<string, { color: string }> = {
      Gold: { color: "bg-yellow-500" },
      Silver: { color: "bg-gray-400" },
      Bronze: { color: "bg-orange-600" },
    };
    const config = configs[membership];
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Trophy className="w-3 h-3" />
        {membership}
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
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <UserPlus className="w-4 h-4 mr-2" />
          Thêm Người Dùng
        </Button>
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
            <CardTitle className="text-sm font-medium">Gold Members</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{goldMembers}</div>
            <p className="text-xs text-muted-foreground">VIP customers</p>
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
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Manager">Manager</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
                <SelectItem value="Member">Member</SelectItem>
                <SelectItem value="Guest">Guest</SelectItem>
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
          <CardTitle>Danh Sách Người Dùng ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người Dùng</TableHead>
                <TableHead>Liên Hệ</TableHead>
                <TableHead>Tuổi</TableHead>
                <TableHead>Vai Trò</TableHead>
                <TableHead>Hạng TV</TableHead>
                <TableHead>Tổng Chi Tiêu</TableHead>
                <TableHead>Trạng Thái</TableHead>
                <TableHead>Ngày Tạo</TableHead>
                <TableHead className="text-right">Thao Tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>
                          {user.fullName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{user.fullName}</p>
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
                        {user.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      {calculateAge(user.dob)} tuổi
                    </div>
                  </TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>{getMembershipBadge(user.membership)}</TableCell>
                  <TableCell className="font-medium">
                    {user.totalSpending.toLocaleString("vi-VN")}đ
                  </TableCell>
                  <TableCell>
                    {user.status === "Active" ? (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    ) : (
                      <Badge className="bg-red-500 text-white">Banned</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
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
                        <DropdownMenuItem onClick={() => handleEditUser(user)}>
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
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
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
              <Label htmlFor="edit-role">Vai Trò</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as User["role"] })
                }
              >
                <SelectTrigger id="edit-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
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
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value as User["role"] })
                }
              >
                <SelectTrigger id="create-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Admin">Admin</SelectItem>
                  <SelectItem value="Manager">Manager</SelectItem>
                  <SelectItem value="Staff">Staff</SelectItem>
                  <SelectItem value="Member">Member</SelectItem>
                  <SelectItem value="Guest">Guest</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
    </div>
  );
};

export default AdminUsers;
