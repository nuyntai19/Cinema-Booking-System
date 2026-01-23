import React from 'react';
import { Link } from 'react-router-dom';
import { Film, MapPin, Phone, Mail, Facebook, Instagram, Youtube } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-secondary text-secondary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Film className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Galaxy Cinema</span>
            </Link>
            <p className="text-secondary-foreground/70 text-sm mb-4">
              Hệ thống rạp chiếu phim hiện đại với trải nghiệm điện ảnh đỉnh cao.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="w-9 h-9 rounded-full bg-secondary-foreground/10 flex items-center justify-center hover:bg-primary transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Khám Phá</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><Link to="/movies" className="hover:text-primary transition-colors">Phim Đang Chiếu</Link></li>
              <li><Link to="/movies?type=coming" className="hover:text-primary transition-colors">Phim Sắp Chiếu</Link></li>
              <li><Link to="/cinemas" className="hover:text-primary transition-colors">Hệ Thống Rạp</Link></li>
              <li><Link to="/promotions" className="hover:text-primary transition-colors">Khuyến Mãi</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Hỗ Trợ</h4>
            <ul className="space-y-2 text-sm text-secondary-foreground/70">
              <li><a href="#" className="hover:text-primary transition-colors">Câu Hỏi Thường Gặp</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Điều Khoản Sử Dụng</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Chính Sách Bảo Mật</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Liên Hệ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Liên Hệ</h4>
            <ul className="space-y-3 text-sm text-secondary-foreground/70">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>116 Nguyễn Du, Quận 1, TP.HCM</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 shrink-0" />
                <span>1900 2224</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 shrink-0" />
                <span>support@galaxycinema.vn</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/10 mt-8 pt-8 text-center text-sm text-secondary-foreground/50">
          <p>© 2024 Galaxy Cinema. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
