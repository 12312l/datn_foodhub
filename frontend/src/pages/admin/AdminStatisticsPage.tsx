import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import { TrendingDown, Users, ShoppingBag, DollarSign } from 'lucide-react';

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalUsers: number;
  newUsers: number;
  totalProducts: number;
  lowStockProducts: number;
  topProducts: Array<{ id: number; name: string; soldCount: number; revenue: number }>;
  topCategories: Array<{ id: number; name: string; count: number; revenue: number }>;
}

const AdminStatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('week');

  useEffect(() => {
    loadStats();
  }, [timeRange]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Use mock data if API fails
      setStats({
        totalRevenue: 125000000,
        todayRevenue: 8500000,
        totalOrders: 1250,
        todayOrders: 45,
        totalUsers: 850,
        newUsers: 25,
        totalProducts: 120,
        lowStockProducts: 8,
        topProducts: [
          { id: 1, name: 'Phở Bò', soldCount: 320, revenue: 48000000 },
          { id: 2, name: 'Bánh Mì', soldCount: 280, revenue: 28000000 },
          { id: 3, name: 'Cà Phê', soldCount: 250, revenue: 18750000 },
          { id: 4, name: 'Trà Đá', soldCount: 200, revenue: 10000000 },
          { id: 5, name: 'Gỏi Cuốn', soldCount: 180, revenue: 21600000 },
        ],
        topCategories: [
          { id: 1, name: 'Món Chính', count: 45, revenue: 85000000 },
          { id: 2, name: 'Đồ Uống', count: 35, revenue: 28750000 },
          { id: 3, name: 'Đồ Ăn Vặt', count: 25, revenue: 7500000 },
          { id: 4, name: 'Tráng Miệng', count: 15, revenue: 3750000 },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Không có dữ liệu</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Thống kê</h1>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="input w-40"
        >
          <option value="day">Hôm nay</option>
          <option value="week">Tuần này</option>
          <option value="month">Tháng này</option>
          <option value="year">Năm nay</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Doanh thu hôm nay</p>
              <p className="text-2xl font-bold text-primary-600">{stats.todayRevenue.toLocaleString('vi-VN')} đ</p>
            </div>
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Đơn hàng hôm nay</p>
              <p className="text-2xl font-bold text-blue-600">{stats.todayOrders}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Tổng người dùng</p>
              <p className="text-2xl font-bold text-green-600">{stats.totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Sản phẩm sắp hết</p>
              <p className="text-2xl font-bold text-red-600">{stats.lowStockProducts}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue & Orders */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Tổng quan</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tổng doanh thu</span>
              <span className="font-bold text-lg">{stats.totalRevenue.toLocaleString('vi-VN')} đ</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tổng đơn hàng</span>
              <span className="font-bold text-lg">{stats.totalOrders}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Người dùng mới</span>
              <span className="font-bold text-lg">+{stats.newUsers}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Tổng sản phẩm</span>
              <span className="font-bold text-lg">{stats.totalProducts}</span>
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Sản phẩm bán chạy</h2>
          <div className="space-y-3">
            {stats.topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.name}</p>
                  <p className="text-sm text-gray-500">{product.soldCount} đã bán</p>
                </div>
                <span className="font-medium">{product.revenue.toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4">Danh mục hot</h2>
          <div className="space-y-3">
            {stats.topCategories.map((category, index) => (
              <div key={category.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                  {index + 1}
                </span>
                <div className="flex-1">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-gray-500">{category.count} sản phẩm</p>
                </div>
                <span className="font-medium">{category.revenue.toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatisticsPage;
