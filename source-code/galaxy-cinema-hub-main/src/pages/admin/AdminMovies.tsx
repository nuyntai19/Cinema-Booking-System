import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Eye, Flag } from 'lucide-react';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { movies as mockMovies } from '@/data/mockData';
import { cn } from '@/lib/utils';

const AdminMovies: React.FC = () => {
  const [movies, setMovies] = useState(mockMovies);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredMovies = movies.filter(m =>
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getAgeRatingClass = (rating: string) => {
    const classes: Record<string, string> = {
      'P': 'bg-green-500',
      'T13': 'bg-yellow-500',
      'T16': 'bg-orange-500',
      'T18': 'bg-red-500',
      'C': 'bg-gray-500',
    };
    return classes[rating] || 'bg-gray-500';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quản Lý Phim</h1>
          <p className="text-muted-foreground">Danh sách và quản lý phim đang chiếu</p>
        </div>
        <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Thêm Phim Mới
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Thêm Phim Mới</DialogTitle>
              <DialogDescription>
                Điền thông tin phim để thêm vào hệ thống
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tên phim</Label>
                <Input id="title" placeholder="VD: Mai" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="duration">Thời lượng (phút)</Label>
                  <Input id="duration" type="number" placeholder="120" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ageRating">Phân loại</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">P - Phổ biến</SelectItem>
                      <SelectItem value="T13">T13 - Từ 13 tuổi</SelectItem>
                      <SelectItem value="T16">T16 - Từ 16 tuổi</SelectItem>
                      <SelectItem value="T18">T18 - Từ 18 tuổi</SelectItem>
                      <SelectItem value="C">C - Cấm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Nguồn gốc</Label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="origin" value="VN" className="text-primary" />
                    <span>🇻🇳 Việt Nam</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="origin" value="INT" className="text-primary" />
                    <span>🌍 Quốc tế</span>
                  </label>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="trailer">Link Trailer (YouTube)</Label>
                <Input id="trailer" placeholder="https://youtube.com/..." />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowAddModal(false)}>Hủy</Button>
              <Button className="bg-primary hover:bg-primary/90">Thêm Phim</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm phim..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Movies Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Poster</TableHead>
                <TableHead>Tên phim</TableHead>
                <TableHead className="w-[100px]">Thời lượng</TableHead>
                <TableHead className="w-[80px]">Phân loại</TableHead>
                <TableHead className="w-[100px]">Nguồn gốc</TableHead>
                <TableHead className="w-[100px]">Trạng thái</TableHead>
                <TableHead className="w-[120px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMovies.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Không tìm thấy phim nào
                  </TableCell>
                </TableRow>
              ) : (
                filteredMovies.map((movie) => (
                  <TableRow key={movie.id}>
                    <TableCell>
                      <img
                        src={movie.poster}
                        alt={movie.title}
                        className="w-12 h-18 object-cover rounded"
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{movie.title}</p>
                        <p className="text-sm text-muted-foreground">{movie.genre.join(', ')}</p>
                      </div>
                    </TableCell>
                    <TableCell>{movie.duration} phút</TableCell>
                    <TableCell>
                      <Badge className={cn('text-white', getAgeRatingClass(movie.ageRating))}>
                        {movie.ageRating}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {movie.origin === 'VN' ? (
                        <Badge variant="outline" className="border-red-500 text-red-600">
                          <Flag className="w-3 h-3 mr-1" />
                          Việt Nam
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Quốc tế</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={movie.isNowShowing ? 'default' : 'secondary'}>
                        {movie.isNowShowing ? 'Đang chiếu' : 'Sắp chiếu'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
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
    </div>
  );
};

export default AdminMovies;
