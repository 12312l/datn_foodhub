import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Search, Plus, Sparkles, Heart } from 'lucide-react';
import { productAPI, categoryAPI, favoriteAPI } from '../../services/api';
import { Product, Category } from '../../types';
import { jwtDecode } from 'jwt-decode'; // Thêm import này
import { useCart } from '../../context/CartContext';
import { useToast } from '../../components/user/Toast';
import { useAuth } from '../../context/AuthContext';

const HomePage: React.FC = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [newProducts, setNewProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]); // State mới cho món đã xem
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');


  // Giả sử bạn lưu thông tin user trong localStorage sau khi login
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  useEffect(() => {
    loadData();
  }, []);

  const { addItem } = useCart(); // Đảm bảo đã import useCart
  const { showToast } = useToast(); // Đảm bảo đã import useToast
  const { isAuthenticated } = useAuth(); // Đảm bảo đã import useAuth
  const [localFavorites, setLocalFavorites] = useState<number[]>([]);

  const handleToggleFavoriteQuick = async (productId: number) => {
    if (!isAuthenticated) {
      showToast('error', 'Vui lòng đăng nhập để yêu thích sản phẩm');
      return;
    }
    try {
      // Ở trang chủ, để đơn giản ta cứ gọi API add. 
      // Nếu Duy muốn check tim đầy/tim rỗng thì logic sẽ phức tạp hơn (cần lưu state list fav)
      await favoriteAPI.add(productId);
      setLocalFavorites(prev => [...prev, productId]);
      showToast('success', 'Đã thêm vào danh sách yêu thích!');
    } catch (error: any) {
      // Nếu app trả về lỗi do đã tồn tại thì ta báo bỏ yêu thích (tùy Backend xử lý)
      showToast('info', 'Sản phẩm đã có trong danh sách yêu thích');
      setLocalFavorites(prev => [...prev, productId]);
    }
  };

  const handleQuickAddToCart = async (product: any) => {
    try {
      // Với hàng gợi ý, ta thêm món mặc định (giá gốc và ảnh đầu tiên)
      await addItem(product.id, 1, {
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl || 'https://via.placeholder.com/300',
        originalPrice: product.originalPrice || product.price,
        // Nếu sản phẩm gợi ý có variant mặc định thì có thể thêm vào đây, 
        // nhưng thường ở trang chủ mình thêm nhanh món chính luôn
      });
      showToast('success', `Đã thêm ${product.name} vào giỏ hàng!`);
    } catch (error) {
      showToast('error', 'Không thể thêm vào giỏ hàng');
    }
  };

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      let userId: number | null = null;
      if (token) {
        try {
          const decoded: any = jwtDecode(token);
          userId = decoded.id;
        } catch (e) {
          console.error("Token invalid");
        }
      }

      // Gộp tất cả API vào một lượt nhưng xử lý lỗi riêng cho từng cái
      // Để nếu một cái lỗi (ví dụ AI chưa bật) thì trang web vẫn hiện
      const [featuredRes, newRes, categoriesRes] = await Promise.all([
        productAPI.getTopSelling(8).catch(err => ({ data: [] })),
        productAPI.getTopRated(8).catch(err => ({ data: [] })),
        categoryAPI.getAll().catch(err => ({ data: [] })),
      ]);

      setFeaturedProducts(featuredRes.data);
      setNewProducts(newRes.data);
      setCategories(categoriesRes.data);

      if (userId) {
        // Gọi API cá nhân hóa
        try {
          const [recentRes, recommendRes] = await Promise.all([
            productAPI.getRecentlyViewed(userId, { size: 4 }).catch(err => ({ data: { content: [] } })),
            productAPI.getAIRecommendations(userId).catch(err => {
              console.error("AI Server chưa phản hồi:", err);
              return { data: [] }; // Trả về mảng rỗng nếu AI lỗi
            })
          ]);

          if (recentRes.data && recentRes.data.content) {
            setRecentProducts(recentRes.data.content);
          }
          if (recommendRes.data) {
            const data = Array.isArray(recommendRes.data) ? recommendRes.data : (recommendRes.data.content || []);
            setRecommendedProducts(data);
          }
        } catch (innerError) {
          console.error("Lỗi dữ liệu cá nhân:", innerError);
        }
      }
    } catch (error) {
      console.error('Lỗi tổng hệ thống:', error);
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

      {/* AI Recommended Products - Bản an toàn chống lỗi trắng trang */}
      {Array.isArray(recommendedProducts) && recommendedProducts.length > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 border-t border-gray-100 bg-orange-50/30 rounded-3xl my-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Gợi ý món ngon hôm nay</h2>
              <p className="text-sm text-gray-500">Dựa trên sở thích và khẩu vị cá nhân của bạn</p>
            </div>
            <Link to="/products" className="text-primary-500 hover:underline flex items-center font-medium">
              Khám phá thêm <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {recommendedProducts.map((product) => (
              <Link
                key={`recommend-${product.id}`}
                to={`/products/${product.id}`}
                className="relative bg-white p-3 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 group border border-transparent hover:border-orange-100"
              >
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    handleToggleFavoriteQuick(product.id);
                  }}
                  // Class đổi màu nền linh hoạt: Nếu nằm trong danh sách yêu thích thì nền hồng, không thì trắng
                  className={`absolute top-5 left-5 z-20 p-2 backdrop-blur-sm rounded-full transition-all duration-300 shadow-md border 
    ${localFavorites.includes(product.id)
                      ? 'bg-red-50 border-red-100 text-red-500'
                      : 'bg-white/90 border-gray-100 text-gray-400 hover:text-red-500'
                    }`}
                  title="Thêm vào yêu thích"
                >
                  {/* Logic fill màu trái tim y hệt trang chi tiết */}
                  <Heart
                    className="w-4 h-4"
                    fill={localFavorites.includes(product.id) ? "currentColor" : "none"}
                    strokeWidth={localFavorites.includes(product.id) ? 0 : 2}
                  />
                </button>

                <div className="relative overflow-hidden rounded-xl mb-3">
                  {/* Ảnh sản phẩm */}
                  <img
                    src={product.imageUrl || 'https://via.placeholder.com/300'}
                    alt={product.name}
                    className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  {/* Tag AI bên phải (Giữ nguyên) */}
                  <div className="absolute top-2 right-2 z-10 bg-white/90 backdrop-blur-sm p-1.5 rounded-lg shadow-sm">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                  </div>
                </div>

                <h3 className="font-bold mb-1 truncate text-gray-800 group-hover:text-primary-600 transition-colors">
                  {product.name}
                </h3>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Star className="w-3.5 h-3.5 text-yellow-400 fill-current mr-1" />
                    <span className="text-xs text-gray-600 font-bold">{product.rating || 0}</span>
                    <span className="mx-1 text-gray-300">|</span>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">
                      {product.soldCount || 0} đã bán
                    </span>
                  </div>
                </div>

                <div className="mt-2 flex items-center justify-between">
                  <p className="text-primary-600 font-extrabold text-lg">
                    {/* Thêm dấu ? để tránh lỗi toLocaleString nếu price bị null */}
                    {product.price ? product.price.toLocaleString('vi-VN') : 0} đ
                  </p>
                  {/* Nút Giỏ hàng đã có hàm xử lý */}
                  <button
                    onClick={(e) => {
                      e.preventDefault(); // Ngăn việc bấm nút bị nhảy vào trang chi tiết sản phẩm
                      handleQuickAddToCart(product);
                    }}
                    className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl 
               group-hover:bg-primary-500 group-hover:text-white 
               transition-all duration-300 shadow-sm 
               hover:shadow-md hover:-translate-y-0.5 active:scale-95"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="8" cy="21" r="1"></circle>
                      <circle cx="19" cy="21" r="1"></circle>
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"></path>
                    </svg>
                  </button>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

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
