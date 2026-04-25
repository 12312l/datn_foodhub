import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShoppingCart, User, LogOut, Menu, X, Bell, Package, ChevronDown, ChefHat, Heart, Lock, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { notificationAPI } from '../../services/api';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState(''); // Thêm dòng này cạnh các state khác

  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const historyRef = useRef<HTMLDivElement>(null);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);



  // Load notifications
  useEffect(() => {
    if (isAuthenticated) {
      loadNotifications();
    }
  }, [isAuthenticated, location.pathname]);

  const loadNotifications = async () => {
    try {
      const [notiRes, countRes] = await Promise.all([
        notificationAPI.getAll(),
        notificationAPI.getUnreadCount(),
      ]);
      setNotifications(notiRes.data);
      setUnreadCount(countRes.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsProfileOpen(false);
  };

  //search history
  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
  //     setIsMenuOpen(false); // Đóng menu nếu đang ở mobile
  //   }
  // };

  // Load lịch sử từ localStorage khi trang web vừa mở
  useEffect(() => {
    const savedHistory = localStorage.getItem('searchHistory');
    if (savedHistory) {
      setSearchHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Đóng lịch sử khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (historyRef.current && !historyRef.current.contains(event.target as Node)) {
        setIsHistoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      // Cập nhật lịch sử
      const newHistory = [query, ...searchHistory.filter(h => h !== query)].slice(0, 5);
      setSearchHistory(newHistory);
      localStorage.setItem('searchHistory', JSON.stringify(newHistory));

      navigate(`/products?search=${encodeURIComponent(query)}`);
      setIsHistoryOpen(false);
    }
  };

  const removeHistoryItem = (item: string) => {
    const newHistory = searchHistory.filter(h => h !== item);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <ChefHat className="w-8 h-8 text-primary-500" />
            <span className="text-2xl font-bold text-primary-500">FoodHub</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-500 transition">
              Trang chủ
            </Link>
            <Link to="/products" className="text-gray-700 hover:text-primary-500 transition">
              Menu
            </Link>
            <Link to="/support" className="text-gray-700 hover:text-primary-500 transition">
              Hỗ trợ
            </Link>
            <Link to="/terms" className="text-gray-700 hover:text-primary-500 transition">
              Chính sách
            </Link>
          </div>

          {/* Right Menu */}
          <div className="hidden md:flex items-center space-x-4">
            <div className="relative hidden lg:block mr-2" ref={historyRef}>
              <form onSubmit={handleSearch} className="relative">
                <input
                  type="text"
                  placeholder="Tìm món ăn..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setIsHistoryOpen(true)} // Mở khi click vào ô input
                  className="w-48 xl:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:border-primary-500 transition-all"
                />
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              </form>

              {/* Dropdown Lịch sử */}
              {isHistoryOpen && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border rounded-xl shadow-xl z-50 overflow-hidden">
                  <div className="p-2 border-b text-xs text-gray-400 font-medium">Lịch sử tìm kiếm</div>
                  {searchHistory.map((item, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center px-4 py-2 hover:bg-gray-50 cursor-pointer group"
                    >
                      <span
                        className="text-sm text-gray-700 flex-1"
                        onClick={() => {
                          setSearchQuery(item);
                          navigate(`/products?search=${encodeURIComponent(item)}`);
                          setIsHistoryOpen(false);
                        }}
                      >
                        {item}
                      </span>
                      <button
                        onClick={() => removeHistoryItem(item)}
                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => {
                      setSearchHistory([]);
                      localStorage.removeItem('searchHistory');
                    }}
                    className="w-full py-2 text-xs text-center text-gray-400 hover:text-primary-500 border-t"
                  >
                    Xóa tất cả
                  </button>
                </div>
              )}
            </div>

            {/* Biểu tượng Search cho màn hình Tablet/Mobile (Ẩn ô input, chỉ hiện icon) */}
            <button
              className="lg:hidden p-2 text-gray-700 hover:text-primary-500"
              onClick={() => navigate('/products')} // Chuyển sang trang menu để khách tự lọc
            >
              <Search className="w-6 h-6" />
            </button>
            {/* Cart - Always visible */}
            <Link to="/cart" className="relative p-2 text-gray-700 hover:text-primary-500">
              <ShoppingCart className="w-6 h-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                {/* Notification Dropdown */}
                <div className="relative" ref={notificationRef}>
                  <button
                    onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                    className="relative p-2 text-gray-700 hover:text-primary-500"
                  >
                    <Bell className="w-6 h-6" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {isNotificationOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 border max-h-96 flex flex-col">
                      <div className="px-4 py-2 border-b flex justify-between items-center flex-shrink-0">
                        <p className="font-semibold">Thông báo</p>
                        {unreadCount > 0 && (
                          <button
                            onClick={async () => {
                              await notificationAPI.markAllAsRead();
                              loadNotifications();
                            }}
                            className="text-xs text-primary-500 hover:underline"
                          >
                            Đánh dấu đã đọc
                          </button>
                        )}
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {notifications.length === 0 ? (
                          <p className="px-4 py-8 text-center text-gray-500">Không có thông báo</p>
                        ) : (
                          notifications.map((noti) => (
                            <div
                              key={noti.id}
                              className={`px-4 py-3 border-b hover:bg-gray-50 cursor-pointer ${!noti.isRead ? 'bg-blue-50' : ''
                                }`}
                              onClick={() => handleMarkAsRead(noti.id)}
                            >
                              <p className="font-medium text-sm">{noti.title}</p>
                              <p className="text-xs text-gray-500 truncate">{noti.content}</p>
                              <p className="text-xs text-gray-400 mt-1">
                                {new Date(noti.createdAt).toLocaleDateString('vi-VN')}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                      {notifications.length > 0 && (
                        <Link
                          to="/notifications"
                          className="block px-4 py-3 text-center text-primary-500 hover:bg-gray-100 font-medium border-t flex-shrink-0"
                          onClick={() => setIsNotificationOpen(false)}
                        >
                          Xem tất cả
                        </Link>
                      )}
                    </div>
                  )}
                </div>

                {/* Profile Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-gray-700 hover:text-primary-500"
                  >
                    <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white font-medium overflow-hidden">
                      {user?.avatar && !avatarError ? (
                        <img
                          src={user.avatar}
                          alt={user.fullName || 'Avatar'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        user?.fullName?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                      </div>
                      <Link
                        to="/profile"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <User className="w-4 h-4 mr-2" />
                        Thông tin cá nhân
                      </Link>
                      <Link
                        to="/orders"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Đơn hàng của tôi
                      </Link>
                      <Link
                        to="/profile/favorites"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Heart className="w-4 h-4 mr-2" />
                        Sản phẩm yêu thích
                      </Link>
                      <Link
                        to="/profile/change-password"
                        className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        <Lock className="w-4 h-4 mr-2" />
                        Đổi mật khẩu
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          <User className="w-4 h-4 mr-2" />
                          Quản trị
                        </Link>
                      )}
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-red-500 hover:bg-gray-100"
                      >
                        <LogOut className="w-4 h-4 mr-2" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link to="/login" className="text-gray-700 hover:text-primary-500">
                  Đăng nhập
                </Link>
                <Link to="/register" className="btn btn-primary">
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden pb-4">
            <div className="flex flex-col space-y-3">
              <Link to="/" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                Trang chủ
              </Link>
              <Link to="/products" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                Menu
              </Link>
              <Link to="/support" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                Hỗ trợ
              </Link>
              <Link to="/terms" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                Chính sách
              </Link>
              <Link to="/cart" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                Giỏ hàng ({itemCount})
              </Link>
              {isAuthenticated ? (
                <>
                  <Link to="/profile" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                    Thông tin cá nhân
                  </Link>
                  <Link to="/orders" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                    Đơn hàng của tôi
                  </Link>
                  <Link to="/profile/favorites" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                    Sản phẩm yêu thích
                  </Link>
                  <Link to="/profile/change-password" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                    Đổi mật khẩu
                  </Link>
                  {isAdmin && (
                    <Link to="/admin" className="text-gray-700 hover:text-primary-500" onClick={() => setIsMenuOpen(false)}>
                      Quản trị
                    </Link>
                  )}
                  <button onClick={handleLogout} className="text-red-500 text-left">
                    Đăng xuất
                  </button>
                </>
              ) : (
                <div className="flex space-x-4">
                  <Link to="/login" className="text-gray-700">
                    Đăng nhập
                  </Link>
                  <Link to="/register" className="btn btn-primary inline-block text-center">
                    Đăng ký
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
