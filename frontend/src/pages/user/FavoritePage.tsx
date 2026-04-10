import React from 'react';
import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';

const FavoritePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Heart className="w-6 h-6 text-red-500" />
          Sản phẩm yêu thích
        </h1>

        <div className="text-center py-12">
          <Heart className="w-24 h-24 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">Bạn chưa có sản phẩm yêu thích nào</p>
          <Link to="/products" className="btn btn-primary">
            Khám phá món ăn
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FavoritePage;
