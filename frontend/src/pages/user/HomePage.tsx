import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Search } from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import { Product, Category } from '../../types';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        productAPI.getTopSelling(8),
        productAPI.getTopRated(8),
        categoryAPI.getAll(),
      ]);
      setFeaturedProducts(featuredRes.data);
      setNewProducts(newRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      window.location.href = `/products?search=${encodeURIComponent(searchKeyword)}`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-8 md:mb-0">
              <h1 className="text-4xl md:text-5xl font-bold mb-4">
                Đặt món ăn yêu thích
                <span className="block text-yellow-300">Trong vài giây</span>
              </h1>
              <p className="text-lg mb-6 opacity-90">
                Với AI thông minh, chúng tôi gợi ý món ăn phù hợp với khẩu vị của bạn
              </p>
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm món ăn..."
                    value={searchKeyword}
                    onChange={(e) => setSearchKeyword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg text-gray-900"
                  />
                </div>
                <button type="submit" className="btn bg-white text-primary-500 hover:bg-gray-100 px-6">
                  Tìm kiếm
                </button>
              </form>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600"
                alt="Food"
                className="rounded-full w-64 h-64 object-cover shadow-2xl"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-2xl font-bold mb-6">Danh mục món ăn</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="card hover:shadow-lg transition text-center"
            >
              <img
                src={category.imageUrl || 'https://via.placeholder.com/150'}
                alt={category.name}
                className="w-full h-24 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold">{category.name}</h3>
              <p className="text-sm text-gray-500">{category.productCount} món</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-gray-50">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Món ăn nổi bật</h2>
          <Link to="/products?sort=soldCount&sortDir=desc" className="text-primary-500 hover:underline flex items-center">
            Xem thêm <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {featuredProducts.slice(0, 8).map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-lg transition">
              <img
                src={product.imageUrl || 'https://via.placeholder.com/300'}
                alt={product.name}
                className="w-full h-40 object-cover rounded-lg mb-3"
              />
              <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm text-gray-600">{product.rating}</span>
                <span className="text-sm text-gray-400 ml-2">| {product.soldCount} đã bán</span>
              </div>
              <p className="text-primary-500 font-bold">{product.price.toLocaleString('vi-VN')} đ</p>
            </Link>
          ))}
        </div>
      </div>

      {/* New Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Món ăn mới</h2>
          <Link to="/products?sort=createdAt&sortDir=desc" className="text-primary-500 hover:underline flex items-center">
            Xem thêm <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {newProducts.slice(0, 8).map((product) => (
            <Link key={product.id} to={`/products/${product.id}`} className="card hover:shadow-lg transition">
              <div className="relative">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-40 object-cover rounded-lg mb-3"
                />
                <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
                  Mới
                </span>
              </div>
              <h3 className="font-semibold mb-1 truncate">{product.name}</h3>
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm text-gray-600">{product.rating}</span>
              </div>
              <p className="text-primary-500 font-bold">{product.price.toLocaleString('vi-VN')} đ</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
