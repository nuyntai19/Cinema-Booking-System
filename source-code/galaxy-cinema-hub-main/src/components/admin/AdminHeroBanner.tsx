import React, { useState, useEffect, useRef } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Image as ImageIcon, Plus, Trash2, Edit, Upload, GripVertical, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiCall } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/api";

interface Poster {
  id: number;
  title: string | null;
  image_url: string;
  target_url: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
}

export const AdminHeroBanner: React.FC = () => {
  const { toast } = useToast();
  const [posters, setPosters] = useState<Poster[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingPoster, setEditingPoster] = useState<Poster | null>(null);
  
  // Form states
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchPosters();
  }, []);

  const fetchPosters = async () => {
    try {
      setLoading(true);
      const res = await apiCall<{ success: boolean; data: { posters: Poster[] } }>(API_ENDPOINTS.POSTERS);
      if (res.success && res.data?.posters) {
        setPosters(res.data.posters);
      }
    } catch (error) {
      toast({
        title: "Lỗi tải dữ liệu",
        description: "Không thể lấy danh sách banner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.type.startsWith("image/")) {
        toast({ title: "Lỗi", description: "Vui lòng chọn file hình ảnh hợp lệ", variant: "destructive" });
        return;
      }
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const openAddModal = () => {
    setEditingPoster(null);
    setTitle("");
    setTargetUrl("");
    setIsActive(true);
    setFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const openEditModal = (poster: Poster) => {
    setEditingPoster(poster);
    setTitle(poster.title || "");
    setTargetUrl(poster.target_url || "");
    setIsActive(poster.is_active);
    setFile(null);
    setPreviewUrl(poster.image_url);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setShowModal(true);
  };

  const savePoster = async () => {
    if (!editingPoster && !file) {
      toast({ title: "Lỗi", description: "Vui lòng tải lên một ảnh", variant: "destructive" });
      return;
    }

    try {
      setActionLoading(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("target_url", targetUrl);
      formData.append("is_active", isActive ? "1" : "0");
      if (file) {
        formData.append("poster_image", file);
      }

      let res;
      if (editingPoster) {
        formData.append("display_order", editingPoster.display_order.toString());
        // For PUT with FormData, we need to POST and spoof or use specific backend handling
        // We registered POST to /api/posters/:id to handle multipart/form-data for updates
        res = await apiCall<{ success: boolean }>(`${API_ENDPOINTS.POSTERS}/${editingPoster.id}`, {
          method: "POST", // using POST due to PHP multipart handling
          body: formData,
          // Do not stringify formData, apiCall handles it if we adjust or fetch handles FormData natively
        });
      } else {
        const nextOrder = posters.length > 0 ? Math.max(...posters.map(p => p.display_order)) + 1 : 1;
        formData.append("display_order", nextOrder.toString());
        res = await apiCall<{ success: boolean }>(API_ENDPOINTS.POSTERS, {
          method: "POST",
          body: formData,
        });
      }

      if (res.success) {
        toast({ title: "Thành công", description: editingPoster ? "Đã cập nhật banner" : "Đã thêm banner mới" });
        setShowModal(false);
        fetchPosters();
      }
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Đã xảy ra lỗi khi lưu", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (poster: Poster, checked: boolean) => {
    try {
      const res = await apiCall<{ success: boolean }>(`${API_ENDPOINTS.POSTERS}/${poster.id}`, {
        method: "PUT",
        body: JSON.stringify({ is_active: checked }),
      });
      if (res.success) {
        setPosters(posters.map(p => p.id === poster.id ? { ...p, is_active: checked } : p));
      }
    } catch (error) {
       toast({ title: "Lỗi", description: "Không thể thay đổi trạng thái", variant: "destructive" });
    }
  };

  const deletePoster = async (id: number) => {
    if (!confirm("Bạn có chắc chắn muốn xóa banner này?")) return;
    try {
      setActionLoading(true);
      const res = await apiCall<{ success: boolean }>(`${API_ENDPOINTS.POSTERS}/${id}`, {
        method: "DELETE",
      });
      if (res.success) {
        toast({ title: "Thành công", description: "Đã xóa banner" });
        fetchPosters();
      }
    } catch (error: any) {
      toast({ title: "Lỗi", description: error.message || "Không thể xóa banner", variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Quản Lý Banner Trang Chủ</CardTitle>
              <CardDescription>Upload và quản lý các ảnh Slider xuất hiện ở đầu trang</CardDescription>
            </div>
          </div>
          <Button onClick={openAddModal} className="shrink-0"><Plus className="w-4 h-4 mr-2" /> Thêm Banner</Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
        ) : posters.length === 0 ? (
          <div className="text-center p-8 text-muted-foreground bg-muted/20 rounded-lg">
            Chưa có banner nào. Hãy thêm banner đầu tiên!
          </div>
        ) : (
          <div className="space-y-4">
             {posters.map((poster, idx) => (
                <div key={poster.id} className="flex gap-4 p-4 border rounded-lg bg-card items-center shadow-sm relative overflow-hidden">
                  <div className="w-6 h-6 flex items-center justify-center bg-muted rounded-full text-xs font-bold shrink-0">{idx + 1}</div>
                  <div className="h-20 w-48 shrink-0 bg-muted rounded overflow-hidden shadow-inner hidden sm:block">
                     <img src={poster.image_url} alt="Banner" className={`w-full h-full object-cover ${!poster.is_active && 'opacity-50 grayscale'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-semibold truncate ${!poster.is_active && 'text-muted-foreground'}`}>{poster.title || "Không có tiêu đề"}</h4>
                    <a href={poster.target_url || "#"} target="_blank" className="text-sm text-blue-500 hover:underline truncate block">
                      {poster.target_url || "Không có đường dẫn"}
                    </a>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                     <div className="flex items-center gap-2">
                       <Label className="text-xs text-muted-foreground cursor-pointer" htmlFor={`switch-${poster.id}`}>
                         {poster.is_active ? 'Đang bật' : 'Đang tắt'}
                       </Label>
                       <Switch id={`switch-${poster.id}`} checked={poster.is_active} onCheckedChange={(c) => toggleStatus(poster, c)} />
                     </div>
                     <div className="w-px h-8 bg-border"></div>
                     <Button variant="ghost" size="icon" onClick={() => openEditModal(poster)} disabled={actionLoading}>
                        <Edit className="w-4 h-4 text-blue-600" />
                     </Button>
                     <Button variant="ghost" size="icon" onClick={() => deletePoster(poster.id)} disabled={actionLoading}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                     </Button>
                  </div>
                </div>
             ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{editingPoster ? "Sửa Banner" : "Thêm Banner Mới"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
             
             {/* Image Upload Area */}
             <div className="grid gap-2">
                <Label>Hình ảnh Banner *</Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors relative ${previewUrl ? 'border-primary/50' : 'border-border hover:border-primary/50'}`}
                  onClick={() => fileInputRef.current?.click()}
                >
                    {previewUrl ? (
                      <div className="relative w-full aspect-[21/9] rounded overflow-hidden shadow-md">
                         <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <Upload className="w-8 h-8 text-white mb-2" />
                            <span className="text-white font-medium text-sm">Bấm để thay đổi ảnh</span>
                         </div>
                      </div>
                    ) : (
                      <div className="py-8 flex flex-col items-center justify-center">
                         <div className="w-12 h-12 bg-primary/10 rounded-full flex flex-center items-center justify-center mb-3">
                            <Upload className="w-6 h-6 text-primary" />
                         </div>
                         <h3 className="font-semibold text-sm">Nhấn để tải ảnh lên</h3>
                         <p className="text-xs text-muted-foreground mt-1 text-center max-w-[250px]">
                           Nên sử dụng ảnh ngang (tỷ lệ 21:9) chất lượng cao hiển thị ở đầu trang
                         </p>
                      </div>
                    )}
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                    />
                </div>
             </div>

             <div className="grid gap-2">
                <Label>Tên / Tiêu đề (tùy chọn)</Label>
                <Input placeholder="Nhập để dễ quản lý..." value={title} onChange={e => setTitle(e.target.value)} />
             </div>
             
             <div className="grid gap-2">
                <Label>Đường dẫn khi click (tùy chọn)</Label>
                <Input placeholder="https://..." value={targetUrl} onChange={e => setTargetUrl(e.target.value)} />
                <p className="text-xs text-muted-foreground">Khách hàng sẽ được chuyển đến trang này khi click vào banner.</p>
             </div>

             <div className="flex items-center gap-2 mt-2">
                <Switch id="active-switch" checked={isActive} onCheckedChange={setIsActive} />
                <Label htmlFor="active-switch">Bật hiển thị banner này trên trang chủ</Label>
             </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)} disabled={actionLoading}>Hủy</Button>
            <Button onClick={savePoster} disabled={actionLoading}>
               {actionLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
               Lưu Banner
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
