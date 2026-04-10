import React, { useEffect, useMemo, useState } from 'react';
import { Package, Users, ShoppingBag, DollarSign, Download } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Product } from '../../types';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import * as XLSX from 'xlsx';

type DashboardStats = {
  totalRevenue: number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
};

type FilterType = 'day' | 'week' | 'month' | 'year';

const toAmount = (value: unknown): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toDateInputValue = (date: Date) => {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getISOWeekValue = (date: Date) => {
  const target = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNumber = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - dayNumber);
  const yearStart = new Date(Date.UTC(target.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((target.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${target.getUTCFullYear()}-W${`${weekNo}`.padStart(2, '0')}`;
};

const getStartOfIsoWeek = (year: number, week: number) => {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Day = jan4.getUTCDay() || 7;
  const mondayWeek1 = new Date(jan4);
  mondayWeek1.setUTCDate(jan4.getUTCDate() - (jan4Day - 1));
  const start = new Date(mondayWeek1);
  start.setUTCDate(mondayWeek1.getUTCDate() + (week - 1) * 7);
  return start;
};

const toShortDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
};

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
  });
  const [topProducts, setTopProducts] = useState<Product[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('day');
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(new Date()));
  const [selectedWeek, setSelectedWeek] = useState(getISOWeekValue(new Date()));
  const [selectedMonth, setSelectedMonth] = useState(toDateInputValue(new Date()).slice(0, 7));
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filteredRevenue, setFilteredRevenue] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [statsRes, topProductsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getTopProducts(5),
      ]);
      setStats(statsRes.data);
      setTopProducts(topProductsRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadFilteredRevenue();
  }, [filterType, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const loadFilteredRevenue = async () => {
    try {
      if (filterType === 'day') {
        const res = await adminAPI.getRevenueByDate(selectedDate);
        setFilteredRevenue(toAmount(res.data));
        return;
      }

      if (filterType === 'week') {
        const [yearText, weekText] = selectedWeek.split('-W');
        const year = Number.parseInt(yearText, 10);
        const week = Number.parseInt(weekText, 10);
        if (Number.isNaN(year) || Number.isNaN(week)) {
          setFilteredRevenue(0);
          return;
        }

        const weekStart = getStartOfIsoWeek(year, week);
        const weekEnd = new Date(weekStart);
        weekEnd.setUTCDate(weekStart.getUTCDate() + 6);

        const startDate = toDateInputValue(weekStart);
        const endDate = toDateInputValue(weekEnd);
        const res = await adminAPI.getRevenueByRange(startDate, endDate);
        setFilteredRevenue(toAmount(res.data));
        return;
      }

      if (filterType === 'month') {
        const [yearText, monthText] = selectedMonth.split('-');
        const year = Number.parseInt(yearText, 10);
        const month = Number.parseInt(monthText, 10);
        if (Number.isNaN(year) || Number.isNaN(month)) {
          setFilteredRevenue(0);
          return;
        }
        const res = await adminAPI.getRevenueByMonth(year, month);
        setFilteredRevenue(toAmount(res.data));
        return;
      }

      const res = await adminAPI.getRevenueByYear(selectedYear);
      setFilteredRevenue(toAmount(res.data));
    } catch (error) {
      console.error('Error loading filtered revenue:', error);
      setFilteredRevenue(0);
    }
  };

  const filterLabel = useMemo(() => {
    if (filterType === 'day') {
      return `Ngày ${toShortDate(selectedDate)}`;
    }
    if (filterType === 'week') {
      const [yearText, weekText] = selectedWeek.split('-W');
      return `Tuần ${weekText}/${yearText}`;
    }
    if (filterType === 'month') {
      const [yearText, monthText] = selectedMonth.split('-');
      return `Tháng ${monthText}/${yearText}`;
    }
    return `Năm ${selectedYear}`;
  }, [filterType, selectedDate, selectedWeek, selectedMonth, selectedYear]);

  const exportExcel = async () => {
    setIsExporting(true);
    try {
      const summaryRows = [
        { 'Chỉ số': 'Bộ lọc', 'Giá trị': filterLabel },
        { 'Chỉ số': 'Doanh thu theo bộ lọc (VNĐ)', 'Giá trị': filteredRevenue },
        { 'Chỉ số': 'Tổng doanh thu (VNĐ)', 'Giá trị': stats.totalRevenue },
        { 'Chỉ số': 'Tổng đơn hàng', 'Giá trị': stats.totalOrders },
        { 'Chỉ số': 'Tổng người dùng', 'Giá trị': stats.totalUsers },
        { 'Chỉ số': 'Tổng món ăn', 'Giá trị': stats.totalProducts },
      ];

      const topProductsRows = topProducts.map((product, index) => ({
        'STT': index + 1,
        'Tên món': product.name,
        'Giá': product.price,
        'Đã bán': product.soldCount || 0,
        'Đánh giá': product.rating,
      }));

      const workbook = XLSX.utils.book_new();
      const summarySheet = XLSX.utils.json_to_sheet(summaryRows);
      const topProductsSheet = XLSX.utils.json_to_sheet(topProductsRows.length > 0 ? topProductsRows : [{ 'STT': '-', 'Tên món': 'Chưa có dữ liệu', 'Giá': '', 'Đã bán': '', 'Đánh giá': '' }]);

      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Tong quan');
      XLSX.utils.book_append_sheet(workbook, topProductsSheet, 'Top mon ban chay');
      XLSX.writeFile(workbook, `dashboard-${Date.now()}.xlsx`);
    } catch (error) {
      console.error('Error exporting excel:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const revenueChartData = [{ name: filterLabel, revenue: filteredRevenue }];

  const productSalesChartData = topProducts.map((product) => ({
    name: product.name.length > 14 ? `${product.name.slice(0, 14)}...` : product.name,
    sold: product.soldCount || 0,
  }));

  const systemOverviewData = [
    { name: 'Đơn hàng', value: stats.totalOrders, color: '#3B82F6' },
    { name: 'Người dùng', value: stats.totalUsers, color: '#22C55E' },
    { name: 'Món ăn', value: stats.totalProducts, color: '#A855F7' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Lọc theo</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as FilterType)}
            className="input min-w-[140px]"
          >
            <option value="day">Ngày</option>
            <option value="week">Tuần</option>
            <option value="month">Tháng</option>
            <option value="year">Năm</option>
          </select>
        </div>

        {filterType === 'day' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn ngày</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="input"
            />
          </div>
        )}

        {filterType === 'week' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn tuần</label>
            <input
              type="week"
              value={selectedWeek}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="input"
            />
          </div>
        )}

        {filterType === 'month' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn tháng</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="input"
            />
          </div>
        )}

        {filterType === 'year' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Chọn năm</label>
            <input
              type="number"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number.parseInt(e.target.value || '0', 10) || new Date().getFullYear())}
              className="input w-[140px]"
              min={2020}
            />
          </div>
        )}

        <div className="ml-auto">
          <button
            type="button"
            onClick={exportExcel}
            disabled={isExporting}
            className="btn btn-primary flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Đang export...' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng doanh thu</p>
              <p className="text-2xl font-bold text-primary-500">
                {stats.totalRevenue.toLocaleString('vi-VN')} đ
              </p>
            </div>
            <DollarSign className="w-10 h-10 text-primary-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng đơn hàng</p>
              <p className="text-2xl font-bold text-blue-500">{stats.totalOrders}</p>
            </div>
            <ShoppingBag className="w-10 h-10 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng người dùng</p>
              <p className="text-2xl font-bold text-green-500">{stats.totalUsers}</p>
            </div>
            <Users className="w-10 h-10 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Tổng món ăn</p>
              <p className="text-2xl font-bold text-purple-500">{stats.totalProducts}</p>
            </div>
            <Package className="w-10 h-10 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-5 xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Doanh thu theo bộ lọc</h2>
            <span className="text-sm text-gray-500">Đơn vị: VNĐ</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${Number(value).toLocaleString('vi-VN')}`}
                />
                <Tooltip formatter={(value) => `${Number(value).toLocaleString('vi-VN')} đ`} />
                <Bar dataKey="revenue" fill="#F97316" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-5">
          <h2 className="text-lg font-bold mb-4">Cơ cấu hệ thống</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={systemOverviewData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                >
                  {systemOverviewData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value}`, name]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {systemOverviewData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-gray-600">{item.name}</span>
                </div>
                <span className="font-semibold text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-5 mb-6">
        <h2 className="text-lg font-bold mb-4">Top món bán chạy</h2>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={productSalesChartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip formatter={(value) => [`${value} món`, 'Đã bán']} />
              <Bar dataKey="sold" fill="#2563EB" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-5">
        <h2 className="text-lg font-bold mb-4">Món ăn bán chạy</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 text-sm font-medium text-gray-500">STT</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Tên món</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Giá</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Đã bán</th>
                <th className="text-left py-3 text-sm font-medium text-gray-500">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="py-3">{index + 1}</td>
                    <td className="py-3 font-medium">{product.name}</td>
                    <td className="py-3">{product.price.toLocaleString('vi-VN')} đ</td>
                    <td className="py-3">{product.soldCount}</td>
                    <td className="py-3">{product.rating}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Chưa có dữ liệu
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
