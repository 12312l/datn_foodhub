import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Search } from 'lucide-react';
import { productAPI, categoryAPI } from '../../services/api';
import { Product, Category } from '../../types';
import { jwtDecode } from 'jwt-decode'; // Thêm import này

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]); // State mới cho món đã xem
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');

  // Giả sử bạn lưu thông tin user trong localStorage sau khi login
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useEffect(() => {
    loadData();
  }, []);

  // const loadData = async () => {
  //   try {
  //     const [featuredRes, newRes, categoriesRes] = await Promise.all([
  //       productAPI.getTopSelling(8),
  //       productAPI.getTopRated(8),
  //       categoryAPI.getAll(),
  //     ]);
  //     setFeaturedProducts(featuredRes.data);
  //     setNewProducts(newRes.data);
  //     setCategories(categoriesRes.data);

  //     // Chỉ gọi API món đã xem nếu User đã đăng nhập
  //     if (user && user.id) {
  //       const recentRes = await productAPI.getRecentlyViewed(user.id, { size: 4 });
  //       console.log("Dữ liệu món đã xem:", recentRes.data); // Xem nó hiện ra gì ở Tab Console
  //       setRecentProducts(recentRes.data.content); // Lấy từ .content vì Backend trả về Page
  //     }

  //   } catch (error) {
  //     console.error('Error loading data:', error);
  //   }
  // };

  const loadData = async () => {
    try {
      // 1. Lấy và giải mã Token để có userId
      const token = localStorage.getItem('token');
      let userId: number | null = null;
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          userId = decoded.id; // Field 'id' chúng ta vừa thêm ở Backend
        } catch (e) {
          console.error("Token invalid");
        }
      }

      // 2. Gọi song song các API mặc định
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        productAPI.getTopSelling(8),
        productAPI.getTopRated(8),
        categoryAPI.getAll(),
      ]);

      setFeaturedProducts(featuredRes.data);
      setNewProducts(newRes.data);
      setCategories(categoriesRes.data);

      // 3. Gọi API món đã xem nếu user đã login
      if (userId) {
        const recentRes = await productAPI.getRecentlyViewed(userId, { size: 4 });
        if (recentRes.data && recentRes.data.content) {
          setRecentProducts(recentRes.data.content);
        }
      }
    } catch (error) {
      console.error('Error loading home data:', error);
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

    {/* History Products */}
    {recentProducts && recentProducts.length > 0 && (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Món bạn vừa xem</h2>
            <p className="text-sm text-gray-500">Dựa trên lịch sử duyệt web của bạn</p>
          </div>
          <Link to="/products" className="text-primary-500 hover:underline flex items-center font-medium">
            Xem thực đơn <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {recentProducts.map((product) => (
            <Link 
              key={`recent-${product.id}`} 
              to={`/products/${product.id}`} 
              className="card hover:shadow-lg transition-all duration-300 group"
            >
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={product.imageUrl || 'https://via.placeholder.com/300'}
                  alt={product.name}
                  className="w-full h-40 object-cover mb-3 group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <h3 className="font-semibold mb-1 truncate text-gray-800">{product.name}</h3>
              <div className="flex items-center mb-2">
                <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                <span className="text-sm text-gray-600 font-medium">{product.rating || 0}</span>
              </div>
              <p className="text-primary-600 font-bold">
                {product.price ? product.price.toLocaleString('vi-VN') : 0} đ
              </p>
            </Link>
          ))}
        </div>
      </div>
    )}
        </div>
      );
    };

export default HomePage;
