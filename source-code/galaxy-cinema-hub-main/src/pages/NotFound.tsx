import { Link } from "react-router-dom";
import { Home, Film } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center max-w-md animate-fade-in">
        <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-6">
          <Film className="w-16 h-16 text-primary" />
        </div>
        <h1 className="text-6xl font-bold text-muted-foreground mb-4">404</h1>
        <p className="text-xl text-foreground mb-2">Không Tìm Thấy Trang</p>
        <p className="text-muted-foreground mb-8">Trang bạn đang tìm kiếm không tồn tại.</p>
        <Link to="/">
          <Button className="bg-primary hover:bg-primary/90">
            <Home className="w-4 h-4 mr-2" />
            Về Trang Chủ
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
