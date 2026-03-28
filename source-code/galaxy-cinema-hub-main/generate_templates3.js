import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, 'public/templates');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// 1. Movie Template
const movieData = [
  {
    "Tên phim": "Phim Mẫu 1",
    "Thời lượng (phút)": 120,
    "Phân loại (P/K/T13/T16/T18/C)": "T16",
    "Nguồn gốc (Vietnam/International)": "Vietnam",
    "Trạng thái (Now Showing/Coming Soon/Ended)": "Coming Soon",
    "Đạo diễn": "Nguyễn Văn A",
    "Diễn viên": "Trấn Thành, Lý Hải",
    "Ngày phát hành (YYYY-MM-DD)": "2024-05-30",
    "Tóm tắt phim": "Mô tả nội dung phim...",
    "Link Trailer (URL)": "https://youtube.com/...",
    "Link Poster (URL)": "https://..."
  }
];
const movieSheet = XLSX.utils.json_to_sheet(movieData);
const movieWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(movieWorkbook, movieSheet, "Movies");
XLSX.writeFile(movieWorkbook, path.join(publicDir, 'movies_template.xlsx'));

// 2. Concession Template
const concessionData = [
  {
    "Tên sản phẩm": "Combo Siêu To",
    "Giá (VNĐ)": 150000,
    "Danh mục (Combo/Drink/Snack)": "Combo",
    "Link Ảnh sản phẩm (URL)": "https://..."
  }
];
const concessionSheet = XLSX.utils.json_to_sheet(concessionData);
const concessionWorkbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(concessionWorkbook, concessionSheet, "Concessions");
XLSX.writeFile(concessionWorkbook, path.join(publicDir, 'concessions_template.xlsx'));

console.log("Templates generated at " + publicDir);
