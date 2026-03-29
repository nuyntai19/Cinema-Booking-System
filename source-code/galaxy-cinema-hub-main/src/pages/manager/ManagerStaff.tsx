import React, { useState, useEffect, useCallback } from "react";
import {
  UserPlus, Search, RefreshCw, Mail, Phone,
  ShieldCheck, ShieldOff, Edit3, X, AlertTriangle,
  User, ChevronLeft, ChevronRight, Upload
} from "lucide-react";
import * as XLSX from "xlsx";
import { apiCall, API_ENDPOINTS } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface StaffMember {
  id: number; email: string; status: "Active" | "Banned";
  created_at: string; full_name: string; phone: string; avatar: string | null;
  joined_cinema_at?: string;
}
interface StaffFormData { email: string; password: string; full_name: string; phone: string; }

const EMPTY_FORM: StaffFormData = { email: "", password: "", full_name: "", phone: "" };

const getInitials = (name: string, email: string) => {
  const src = name || email || "?";
  return src.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
};

const avatarColors = [
  "from-orange-500 to-amber-500",
  "from-blue-500 to-indigo-500",
  "from-purple-500 to-violet-500",
  "from-emerald-500 to-teal-500",
  "from-pink-500 to-rose-500",
];
const getAvatarColor = (id: number) => avatarColors[id % avatarColors.length];

const ManagerStaff: React.FC = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<StaffFormData>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toggleConfirm, setToggleConfirm] = useState<StaffMember | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSubmitting(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array', codepage: 65001 });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "", raw: false });
      
      if (!jsonData || jsonData.length === 0) {
        throw new Error("File Excel rỗng hoặc không có dữ liệu");
      }

      const res = await apiCall<{success: boolean; data: {message: string, success_count: number, errors: string[]}}>(
        API_ENDPOINTS.MANAGER_STAFF_IMPORT, 
        { method: "POST", body: JSON.stringify(jsonData) }
      );
      
      if (res.data?.message) {
        toast({ 
          title: res.data?.success_count > 0 ? "✅ Import hoàn tất" : "⚠️ Cảnh báo", 
          description: res.data?.message,
          duration: 5000
        });
        if (res.data?.errors && res.data.errors.length > 0) {
          console.warn("Import lỗi một số dòng:", res.data.errors);
        }
      }
      void fetchStaff();
    } catch (err: any) {
      toast({ title: "Lỗi", description: err.message || "Không thể xử lý file Excel", variant: "destructive" });
    } finally {
      setSubmitting(false);
      e.target.value = "";
    }
  };

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      params.set("page", String(page));
      params.set("limit", "10");
      const res = await apiCall<{
        success: boolean;
        data: { staff: StaffMember[]; pagination: { total: number; total_pages: number } }
      }>(`${API_ENDPOINTS.MANAGER_STAFF}?${params.toString()}`);
      if (res.success) {
        setStaff(res.data.staff ?? []);
        setTotal(res.data.pagination?.total ?? 0);
        setTotalPages(res.data.pagination?.total_pages ?? 1);
      }
    } catch (e: unknown) {
      toast({ title: "Lỗi", description: e instanceof Error ? e.message : "Không thể tải dữ liệu", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page, toast]);

  useEffect(() => {
    const t = setTimeout(() => { void fetchStaff(); }, 300);
    return () => clearTimeout(t);
  }, [fetchStaff]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSubmitting(true);
    try {
      if (editingId) {
        await apiCall(API_ENDPOINTS.MANAGER_STAFF_DETAIL(editingId), {
          method: "PUT", body: JSON.stringify({ full_name: form.full_name, phone: form.phone }),
        });
        toast({ title: "✅ Thành công", description: "Cập nhật nhân viên thành công" });
      } else {
        await apiCall(API_ENDPOINTS.MANAGER_STAFF, { method: "POST", body: JSON.stringify(form) });
        toast({ title: "✅ Thành công", description: "Tạo tài khoản nhân viên thành công" });
      }
      setShowForm(false); setForm(EMPTY_FORM); setEditingId(null);
      void fetchStaff();
    } catch (e: unknown) {
      toast({ title: "❌ Lỗi", description: e instanceof Error ? e.message : "Thao tác thất bại", variant: "destructive" });
    } finally { setSubmitting(false); }
  };

  const handleToggle = async (member: StaffMember) => {
    try {
      const res = await apiCall<{ success: boolean; data: { new_status: string; message: string } }>(
        API_ENDPOINTS.MANAGER_STAFF_TOGGLE(member.id), { method: "PATCH" }
      );
      if (res.success) {
        toast({ title: "✅ Thành công", description: res.data.message });
        setToggleConfirm(null); void fetchStaff();
      }
    } catch (e: unknown) {
      toast({ title: "❌ Lỗi", description: e instanceof Error ? e.message : "Thao tác thất bại", variant: "destructive" });
    }
  };

  const handleEdit = (member: StaffMember) => {
    setForm({ email: member.email, password: "", full_name: member.full_name || "", phone: member.phone || "" });
    setEditingId(member.id); setShowForm(true);
  };

  const activeCount = staff.filter(s => s.status === "Active").length;
  const bannedCount = staff.filter(s => s.status === "Banned").length;

  return (
    <div className="p-4 lg:p-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-white">Quản Lý Nhân Viên</h1>
          <p className="text-sm text-white/40 mt-0.5">Quản lý tài khoản nhân viên của rạp</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".xlsx, .xls, .csv"
            className="hidden"
            id="excel-upload"
            onChange={handleFileUpload}
          />
          <label
            htmlFor="excel-upload"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/20 bg-white/5 text-white font-medium text-sm hover:bg-white/10 transition-all cursor-pointer shadow-lg"
          >
            <Upload className="w-4 h-4" /> Nhập Excel
          </label>
          <button
            onClick={() => { setShowForm(true); setForm(EMPTY_FORM); setEditingId(null); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 transition-all shadow-lg shadow-orange-500/20 hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" /> Thêm Nhân Viên
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Tổng nhân viên", value: total, color: "text-white" },
          { label: "Đang hoạt động", value: activeCount, color: "text-emerald-400" },
          { label: "Vô hiệu hóa", value: bannedCount, color: "text-red-400" },
        ].map(s => (
          <div key={s.label} className="p-4 rounded-2xl border border-white/8 bg-white/3 text-center">
            <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
            <p className="text-xs text-white/40 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center p-4 rounded-2xl border border-white/8 bg-white/3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            placeholder="Tìm theo tên, email, SĐT..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="h-9 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-orange-500/50 transition-colors [&>option]:bg-[#1a1a2e]"
        >
          <option value="">Tất cả trạng thái</option>
          <option value="Active">Đang hoạt động</option>
          <option value="Banned">Vô hiệu hóa</option>
        </select>
        {(search || statusFilter) && (
          <button onClick={() => { setSearch(""); setStatusFilter(""); }}
            className="px-3 h-9 rounded-xl text-xs text-white/50 hover:text-white hover:bg-white/8 transition-colors">
            Xóa lọc
          </button>
        )}
      </div>

      {/* Staff List */}
      <div className="rounded-2xl border border-white/8 bg-white/3">
        <div className="flex items-center justify-between p-4 border-b border-white/8">
          <div className="flex items-center gap-3">
            <User className="w-4 h-4 text-orange-400" />
            <span className="text-sm font-semibold text-white">Danh Sách Nhân Viên</span>
            {!loading && (
              <span className="px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-400 text-xs font-medium">{total} người</span>
            )}
          </div>
          {loading && <RefreshCw className="w-4 h-4 animate-spin text-white/30" />}
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : staff.length === 0 ? (
            <div className="py-16 text-center">
              <User className="w-10 h-10 mx-auto mb-3 text-white/20" />
              <p className="text-white/30 text-sm">Không tìm thấy nhân viên nào</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map(member => (
                <div
                  key={member.id}
                  className={cn(
                    "flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border transition-all gap-3 group",
                    member.status === "Active"
                      ? "border-white/6 bg-white/2 hover:bg-white/5 hover:border-white/12"
                      : "border-white/4 bg-white/1 opacity-60 hover:opacity-80"
                  )}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={cn("w-11 h-11 rounded-xl bg-gradient-to-br flex items-center justify-center shrink-0 shadow-lg", getAvatarColor(member.id))}>
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.full_name} className="w-full h-full rounded-xl object-cover" />
                      ) : (
                        <span className="text-sm font-bold text-white">{getInitials(member.full_name, member.email)}</span>
                      )}
                    </div>
                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-white">{member.full_name || "Chưa có tên"}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-full text-xs font-medium",
                          member.status === "Active"
                            ? "bg-emerald-500/15 text-emerald-400"
                            : "bg-red-500/15 text-red-400"
                        )}>
                          {member.status === "Active" ? "● Hoạt động" : "○ Vô hiệu hóa"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="text-xs text-white/40 flex items-center gap-1">
                          <Mail className="w-3 h-3" />{member.email}
                        </span>
                        {member.phone && (
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Phone className="w-3 h-3" />{member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 transition-opacity">
                    <button
                      onClick={() => handleEdit(member)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/80 hover:text-white hover:bg-white/20 transition-all border border-white/20"
                    >
                      <Edit3 className="w-3 h-3" /> Sửa
                    </button>
                    <button
                      onClick={() => setToggleConfirm(member)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all border",
                        member.status === "Active"
                          ? "text-amber-400 hover:bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40"
                          : "text-emerald-400 hover:bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40"
                      )}
                    >
                      {member.status === "Active"
                        ? <><ShieldOff className="w-3 h-3" /> Vô hiệu hóa</>
                        : <><ShieldCheck className="w-3 h-3" /> Kích hoạt</>
                      }
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 pb-4 pt-2 border-t border-white/8">
            <span className="text-xs text-white/40">Trang {page} / {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white disabled:opacity-30 transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-white/10">
              <h2 className="font-semibold text-white">
                {editingId ? "Sửa Thông Tin Nhân Viên" : "Thêm Nhân Viên Mới"}
              </h2>
              <button onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={e => void handleSubmit(e)} className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Họ tên *</label>
                <input
                  placeholder="Nguyễn Văn A"
                  value={form.full_name}
                  onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Email *</label>
                  <input
                    type="email" placeholder="nhanvien@galaxy.com"
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    required
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Số điện thoại *</label>
                <input
                  placeholder="0901234567"
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  required
                  className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              {!editingId && (
                <div>
                  <label className="text-xs font-medium text-white/60 mb-1.5 block uppercase tracking-wide">Mật khẩu *</label>
                  <input
                    type="password" placeholder="Tối thiểu 6 ký tự"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    required minLength={6}
                    className="w-full h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
                  />
                </div>
              )}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 h-10 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm transition-all">
                  Hủy
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-10 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-medium text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-orange-500/20">
                  {submitting ? <RefreshCw className="w-4 h-4 animate-spin mx-auto" /> : editingId ? "Cập nhật" : "Tạo tài khoản"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toggle Status Confirm */}
      {toggleConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#1a1a2e] shadow-2xl p-6 text-center">
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border",
              toggleConfirm.status === "Active"
                ? "bg-amber-500/10 border-amber-500/20"
                : "bg-emerald-500/10 border-emerald-500/20"
            )}>
              {toggleConfirm.status === "Active"
                ? <ShieldOff className="w-6 h-6 text-amber-400" />
                : <ShieldCheck className="w-6 h-6 text-emerald-400" />
              }
            </div>
            <h3 className="font-semibold text-white mb-1">
              {toggleConfirm.status === "Active" ? "Vô hiệu hóa tài khoản?" : "Kích hoạt tài khoản?"}
            </h3>
            <p className="text-sm text-white/50 mb-5">{toggleConfirm.full_name || toggleConfirm.email}</p>
            <div className="flex gap-3">
              <button onClick={() => setToggleConfirm(null)}
                className="flex-1 h-10 rounded-xl border border-white/15 text-white/60 hover:text-white text-sm transition-all">
                Hủy
              </button>
              <button
                onClick={() => void handleToggle(toggleConfirm)}
                className={cn(
                  "flex-1 h-10 rounded-xl text-white font-medium text-sm transition-all shadow-lg",
                  toggleConfirm.status === "Active"
                    ? "bg-amber-500/80 hover:bg-amber-500 shadow-amber-500/20"
                    : "bg-emerald-500/80 hover:bg-emerald-500 shadow-emerald-500/20"
                )}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerStaff;
