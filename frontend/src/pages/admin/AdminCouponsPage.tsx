import React, { useState, useEffect } from 'react';
import { adminCouponAPI, adminProductAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Product } from '../../types';
import { Search, Plus, Edit, Trash2, Tag } from 'lucide-react';

interface Coupon {
  id: number;
  code: string;
  description?: string;
  discountPercent: number;
  maxDiscount?: number;
  minOrderAmount: number;
  usageLimit?: number;
  usageCount?: number;
  startDate?: string;
  expiryDate: string;
  isActive: boolean;
  productIds?: number[];
  applicableProducts?: Array<{ id: number; name: string }>;
}

const AdminCouponsPage: React.FC = () => {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    discountPercent: 10,
    maxDiscount: 50000,
    minOrderAmount: 0,
    startDate: '',
    endDate: '',
    usageLimit: 100,
    isActive: true,
    productIds: [] as number[],
  });

  useEffect(() => {
    loadCoupons();
    loadProducts();
  }, []);

  const loadCoupons = async () => {
    setIsLoading(true);
    try {
      const response = await adminCouponAPI.getAll();
      setCoupons(response.data);
    } catch (error) {
      console.error('Error loading coupons:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await adminProductAPI.getAll({ page: 0, size: 500 });
      setProducts(response.data?.content || response.data || []);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  };

  const filteredCoupons = coupons.filter(coupon =>
    coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const allProductIds = products.map((product) => product.id);
  const isAllProductsSelected =
    products.length > 0 && allProductIds.every((id) => formData.productIds.includes(id));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Map formData to API format
      const apiData = {
        code: formData.code,
        discountPercent: formData.discountPercent,
        minOrderAmount: formData.minOrderAmount || 0,
        maxDiscount: formData.maxDiscount,
        startDate: formData.startDate || null,
        expiryDate: formData.endDate,
        usageLimit: formData.usageLimit || null,
        productIds: formData.productIds,
      };
      if (editingCoupon) {
        await adminCouponAPI.update(editingCoupon.id, apiData);
        showToast('success', 'Cập nhật mã giảm giá thành công');
      } else {
        await adminCouponAPI.create(apiData);
        showToast('success', 'Thêm mã giảm giá thành công');
      }
      setShowModal(false);
      resetForm();
      loadCoupons();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Thao tác thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) return;
    setIsLoading(true);
    try {
      await adminCouponAPI.delete(id);
      showToast('success', 'Xóa mã giảm giá thành công');
      loadCoupons();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Xóa thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: number, isActive: boolean) => {
    try {
      await adminCouponAPI.update(id, { isActive: !isActive });
      showToast('success', 'Cập nhật trạng thái thành công');
      loadCoupons();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const openEditModal = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || '',
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount || 0,
      minOrderAmount: coupon.minOrderAmount || 0,
      startDate: coupon.startDate ? new Date(coupon.startDate).toISOString().split('T')[0] : '',
      endDate: coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().split('T')[0] : '',
      usageLimit: coupon.usageLimit || 0,
      isActive: coupon.isActive,
      productIds: coupon.productIds || coupon.applicableProducts?.map((p) => p.id) || [],
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingCoupon(null);
    setFormData({
      code: '',
      description: '',
      discountPercent: 10,
      maxDiscount: 50000,
      minOrderAmount: 0,
      startDate: '',
      endDate: '',
      usageLimit: 100,
      isActive: true,
      productIds: [],
    });
  };

  const handleToggleProduct = (productId: number) => {
    const selected = formData.productIds;
    const exists = selected.includes(productId);
    setFormData({
      ...formData,
      productIds: exists ? selected.filter((id) => id !== productId) : [...selected, productId],
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý khuyến mãi</h1>
        <button
          onClick={() => { resetForm(); setShowModal(true); }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Thêm mã giảm giá
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Tìm kiếm mã giảm giá..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-9"
          />
        </div>
      </div>

      {/* Coupons Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <div className="col-span-full text-center py-8 text-gray-500">Đang tải...</div>
        ) : filteredCoupons.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">Không có mã giảm giá nào</div>
        ) : (
          filteredCoupons.map((coupon) => (
            <div key={coupon.id} className="bg-white rounded-lg shadow-sm border p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary-500" />
                  <span className="font-bold text-lg">{coupon.code}</span>
                </div>
                <button
                  onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                  className={`px-2 py-1 rounded text-xs ${coupon.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}
                >
                  {coupon.isActive ? 'Hoạt động' : 'Tắt'}
                </button>
              </div>

              <p className="text-sm text-gray-600 mb-3">{coupon.description || 'Không có mô tả'}</p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Giảm giá</span>
                  <span className="font-medium text-primary-600">{coupon.discountPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Giảm tối đa</span>
                  <span className="font-medium">{(coupon.maxDiscount || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Đơn tối thiểu</span>
                  <span className="font-medium">{coupon.minOrderAmount.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Sử dụng</span>
                  <span className="font-medium">{coupon.usageCount || 0} / {coupon.usageLimit}</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-gray-500">Áp dụng cho</span>
                  <span className="font-medium text-xs text-gray-700">
                    {coupon.applicableProducts && coupon.applicableProducts.length > 0
                      ? `${coupon.applicableProducts.slice(0, 2).map((p) => p.name).join(', ')}${coupon.applicableProducts.length > 2 ? ` +${coupon.applicableProducts.length - 2}` : ''}`
                      : 'Tất cả sản phẩm'}
                  </span>
                </div>
                {coupon.startDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Bắt đầu</span>
                    <span className="font-medium">{new Date(coupon.startDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Hết hạn</span>
                  <span className="font-medium">{coupon.expiryDate ? new Date(coupon.expiryDate).toLocaleDateString('vi-VN') : 'Không giới hạn'}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                <button
                  onClick={() => openEditModal(coupon)}
                  className="btn btn-secondary flex items-center gap-1 text-sm"
                >
                  <Edit className="w-4 h-4" /> Sửa
                </button>
                <button
                  onClick={() => handleDelete(coupon.id)}
                  className="btn btn-secondary text-red-600 hover:bg-red-50 flex items-center gap-1 text-sm"
                >
                  <Trash2 className="w-4 h-4" /> Xóa
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4 h-[85vh] max-h-[760px] flex flex-col">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">{editingCoupon ? 'Sửa mã giảm giá' : 'Thêm mã giảm giá mới'}</h2>
            </div>
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mã giảm giá *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="input"
                    placeholder="VD: SUMMER2024"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phần trăm giảm *</label>
                    <input
                      type="number"
                      value={formData.discountPercent}
                      onChange={(e) => setFormData({ ...formData, discountPercent: parseInt(e.target.value) })}
                      className="input"
                      min="1"
                      max="100"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giảm tối đa *</label>
                    <input
                      type="number"
                      value={formData.maxDiscount}
                      onChange={(e) => setFormData({ ...formData, maxDiscount: parseInt(e.target.value) })}
                      className="input"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Đơn hàng tối thiểu</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày bắt đầu</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày kết thúc</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Số lần sử dụng tối đa</label>
                  <input
                    type="number"
                    value={formData.usageLimit}
                    onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) })}
                    className="input"
                    min="0"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Sản phẩm áp dụng</label>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, productIds: isAllProductsSelected ? [] : allProductIds })}
                      className="text-xs text-primary-600 hover:text-primary-700"
                    >
                      {isAllProductsSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
                    </button>
                  </div>
                  <div className="max-h-44 overflow-auto border rounded-lg p-2 space-y-1">
                    {products.length === 0 ? (
                      <p className="text-sm text-gray-500 px-2 py-1">Chưa có sản phẩm</p>
                    ) : (
                      products.map((product) => (
                        <label key={product.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={formData.productIds.includes(product.id)}
                            onChange={() => handleToggleProduct(product.id)}
                            className="w-4 h-4 text-primary-600"
                          />
                          <span className="text-sm text-gray-700 line-clamp-1">{product.name}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Để trống nghĩa là mã áp dụng cho tất cả sản phẩm.
                  </p>
                </div>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600"
                  />
                  <span className="text-sm">Kích hoạt ngay</span>
                </label>
              </div>

              <div className="p-6 pt-4 border-t bg-white flex justify-end gap-3 shrink-0">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" disabled={isLoading} className="btn btn-primary">
                  {isLoading ? 'Đang lưu...' : (editingCoupon ? 'Cập nhật' : 'Thêm mới')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCouponsPage;
