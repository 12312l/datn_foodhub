import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Search } from 'lucide-react';

const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <p className="text-2xl font-semibold text-gray-700 mt-4">Trang không tìm thấy</p>
        <p className="text-gray-500 mt-2">Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.</p>
        <div className="flex justify-center gap-4 mt-8">
          <Link to="/" className="btn btn-primary flex items-center gap-2">
            <Home className="w-5 h-5" />
            Về trang chủ
          </Link>
          <Link to="/products" className="btn btn-secondary flex items-center gap-2">
            <Search className="w-5 h-5" />
            Tìm kiếm món ăn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
