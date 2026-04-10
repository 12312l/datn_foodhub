import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, ShoppingBag, Heart, Lock, LogOut, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileSidebarProps {
  children?: React.ReactNode;
}

const ProfileSidebar: React.FC<ProfileSidebarProps> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();

  const menuItems = [
    { path: '/profile', icon: User, label: 'Thông tin tài khoản' },
    { path: '/orders', icon: ShoppingBag, label: 'Đơn hàng của tôi' },
    { path: '/favorites', icon: Heart, label: 'Sản phẩm yêu thích' },
    { path: '/profile/change-password', icon: Lock, label: 'Đổi mật khẩu' },
    { path: '/profile/settings', icon: Settings, label: 'Cài đặt' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* User Info */}
              <div className="p-6 text-center border-b">
                <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-primary-100 flex items-center justify-center">
                  {user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.fullName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-primary-500" />
                  )}
                </div>
                <h3 className="font-semibold text-lg">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Menu */}
              <nav className="p-2">
                {menuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
                <button
                  onClick={logout}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Đăng xuất</span>
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSidebar;
