import React, { useState, useEffect } from 'react';
import { adminOrderAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Search, Eye, Check, X, Truck, Package, Edit, Trash2, Settings2 } from 'lucide-react';

interface OrderItem {
  id: number;
  productId?: number;
  productName: string;
  variantId?: number;
  variantName?: string;
  variantAttributes?: string;
  originalPrice?: number;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

interface Order {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  recipientName: string;
  shippingPhone: string;
  shippingAddress: string;
  totalAmount: number;
  status?: string;
  orderStatus?: string;
  paymentMethod: string;
  paymentStatus: string;
  createdAt: string;
  items?: OrderItem[];
}

interface ShippingSetting {
  id: number;
  baseFee: number;
  freeShippingThreshold?: number;
  freeShippingEnabled: boolean;
}

const getOrderStatus = (order: Order) => order.orderStatus || order.status || 'PENDING';

const statusColors: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  SHIPPING: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  SHIPPING: 'Đang giao',
  DELIVERED: 'Đã giao',
  CANCELLED: 'Đã hủy',
};

const AdminOrdersPage: React.FC = () => {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [shippingSetting, setShippingSetting] = useState<ShippingSetting | null>(null);
  const [showShippingConfig, setShowShippingConfig] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    baseFee: 15000,
    freeShippingThreshold: 100000,
    freeShippingEnabled: true,
  });
  const [isSavingShipping, setIsSavingShipping] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    shippingAddress: '',
    shippingPhone: '',
    recipientName: '',
    status: 'PENDING',
  });

  useEffect(() => {
    loadOrders();
  }, [currentPage, statusFilter]);

  useEffect(() => {
    loadShippingSettings();
  }, []);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const response = await adminOrderAPI.getAll({ page: currentPage, size: 10 });
      let ordersData = response.data.content || response.data;

      if (statusFilter) {
        ordersData = ordersData.filter((o: Order) => getOrderStatus(o) === statusFilter);
      }

      setOrders(ordersData);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShippingSettings = async () => {
    try {
      const response = await adminOrderAPI.getShippingSettings();
      const data = response.data;
      setShippingSetting(data);
      setShippingForm({
        baseFee: Number(data.baseFee) || 0,
        freeShippingThreshold: Number(data.freeShippingThreshold) || 0,
        freeShippingEnabled: Boolean(data.freeShippingEnabled),
      });
    } catch (error) {
      console.error('Error loading shipping settings:', error);
    }
  };

  const handleSaveShippingSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingShipping(true);
    try {
      const response = await adminOrderAPI.updateShippingSettings({
        baseFee: Number(shippingForm.baseFee) || 0,
        freeShippingThreshold: Number(shippingForm.freeShippingThreshold) || 0,
        freeShippingEnabled: shippingForm.freeShippingEnabled,
      });
      setShippingSetting(response.data);
      showToast('success', 'Cập nhật cấu hình vận chuyển thành công');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Không thể cập nhật cấu hình vận chuyển');
    } finally {
      setIsSavingShipping(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      loadOrders();
      return;
    }
    setIsLoading(true);
    try {
      // Search by order ID or user name
      const response = await adminOrderAPI.getAll({ page: 0, size: 100 });
      const allOrders = response.data.content || response.data;
      const filtered = allOrders.filter((o: Order) =>
        o.id.toString().includes(searchTerm) ||
        o.recipientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.userName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setOrders(filtered);
      setTotalPages(1);
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
      await adminOrderAPI.updateStatus(orderId, newStatus);
      showToast('success', 'Cập nhật trạng thái thành công');
      loadOrders();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleCancelOrder = async (orderId: number) => {
    if (!confirm('Bạn có chắc chắn muốn hủy đơn hàng này?')) return;
    try {
      await adminOrderAPI.cancel(orderId);
      showToast('success', 'Hủy đơn hàng thành công');
      loadOrders();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Hủy đơn hàng thất bại');
    }
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      shippingAddress: order.shippingAddress || '',
      shippingPhone: order.shippingPhone || '',
      recipientName: order.recipientName || '',
      status: getOrderStatus(order),
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;
    try {
      // Update order info
      await adminOrderAPI.update(editingOrder.id, {
        ...editForm,
        paymentMethod: editingOrder.paymentMethod,
      });
      // Update status if changed
      if (editForm.status !== getOrderStatus(editingOrder)) {
        await adminOrderAPI.updateStatus(editingOrder.id, editForm.status);
      }
      showToast('success', 'Cập nhật đơn hàng thành công');
      setShowEditModal(false);
      loadOrders();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const handleDeleteOrder = async (orderId: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa đơn hàng này?')) return;
    try {
      await adminOrderAPI.delete(orderId);
      showToast('success', 'Xóa đơn hàng thành công');
      loadOrders();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Xóa thất bại');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đơn hàng</h1>
        <button
          type="button"
          onClick={() => setShowShippingConfig((prev) => !prev)}
          className={`p-2 rounded-lg border transition-colors ${showShippingConfig ? 'bg-primary-50 border-primary-200 text-primary-600' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          title={showShippingConfig ? 'Ẩn cấu hình vận chuyển' : 'Hiện cấu hình vận chuyển'}
        >
          <Settings2 className="w-5 h-5" />
        </button>
      </div>

      {showShippingConfig && (
        <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Cấu hình giá vận chuyển</h2>
          <form onSubmit={handleSaveShippingSettings} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phí vận chuyển cơ bản (đ)</label>
              <input
                type="number"
                min="0"
                value={shippingForm.baseFee}
                onChange={(e) => setShippingForm((prev) => ({ ...prev, baseFee: Number(e.target.value) || 0 }))}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ngưỡng miễn phí ship (đ)</label>
              <input
                type="number"
                min="0"
                value={shippingForm.freeShippingThreshold}
                onChange={(e) => setShippingForm((prev) => ({ ...prev, freeShippingThreshold: Number(e.target.value) || 0 }))}
                className="input"
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={shippingForm.freeShippingEnabled}
                onChange={(e) => setShippingForm((prev) => ({ ...prev, freeShippingEnabled: e.target.checked }))}
              />
              Bật miễn phí vận chuyển
            </label>
            <button type="submit" className="btn btn-primary" disabled={isSavingShipping}>
              {isSavingShipping ? 'Đang lưu...' : 'Lưu cấu hình'}
            </button>
          </form>
          {shippingSetting && (
            <p className="text-xs text-gray-500 mt-3">
              Hiện tại: phí cơ bản {Number(shippingSetting.baseFee).toLocaleString('vi-VN')} đ
              {shippingSetting.freeShippingEnabled
                ? `, miễn phí từ ${Number(shippingSetting.freeShippingThreshold || 0).toLocaleString('vi-VN')} đ`
                : ', miễn phí vận chuyển đang tắt'}
            </p>
          )}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn, tên người nhận..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(0); }}
            className="input w-48"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ xác nhận</option>
            <option value="CONFIRMED">Đã xác nhận</option>
            <option value="SHIPPING">Đang giao</option>
            <option value="DELIVERED">Đã giao</option>
            <option value="CANCELLED">Đã hủy</option>
          </select>
          <button onClick={handleSearch} className="btn btn-primary">
            Tìm kiếm
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Mã đơn</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Người đặt</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Người nhận</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Địa chỉ</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tổng tiền</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày đặt</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8 text-center text-gray-500">Không có đơn hàng nào</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{order.id}</td>
                    <td className="px-4 py-3">{order.userName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{order.userEmail}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{order.recipientName || order.userName}</p>
                        <p className="text-sm text-gray-500">{order.shippingPhone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-[150px] truncate" title={order.shippingAddress}>
                      {order.shippingAddress}
                    </td>
                    <td className="px-4 py-3 font-medium">{Number(order.totalAmount).toLocaleString('vi-VN')} đ</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[getOrderStatus(order)] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[getOrderStatus(order)] || getOrderStatus(order)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {getOrderStatus(order) === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'CONFIRMED')}
                              className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                              title="Xác nhận"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Hủy đơn"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {getOrderStatus(order) === 'CONFIRMED' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'SHIPPING')}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded"
                            title="Giao hàng"
                          >
                            <Truck className="w-4 h-4" />
                          </button>
                        )}
                        {getOrderStatus(order) === 'SHIPPING' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'DELIVERED')}
                            className="p-1.5 text-green-600 hover:bg-green-50 rounded"
                            title="Xác nhận đã giao"
                          >
                            <Package className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                          title="Sửa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">
              Trang {currentPage + 1} / {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Chi tiết đơn hàng #{selectedOrder.id}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Người đặt</p>
                  <p className="font-medium">{selectedOrder.userName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Người nhận</p>
                  <p className="font-medium">{selectedOrder.recipientName}</p>
                  <p className="text-sm text-gray-600">{selectedOrder.shippingPhone}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Địa chỉ giao hàng</p>
                <p className="font-medium">{selectedOrder.shippingAddress}</p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[getOrderStatus(selectedOrder)]}`}>
                    {statusLabels[getOrderStatus(selectedOrder)]}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phương thức thanh toán</p>
                  <p className="font-medium">{selectedOrder.paymentMethod}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Ngày đặt</p>
                  <p className="font-medium">{new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm text-gray-500 mb-2">Sản phẩm</p>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item) => (
                    <div key={item.id} className="flex justify-between p-2 bg-gray-50 rounded gap-4">
                      <div>
                        <p className="font-medium">{item.productName} x{item.quantity}</p>
                        {item.variantAttributes && (
                          <p className="text-xs text-gray-500">{item.variantAttributes}</p>
                        )}
                        {item.originalPrice && item.originalPrice > item.unitPrice && (
                          <p className="text-xs text-gray-400 line-through">
                            Giá gốc: {item.originalPrice.toLocaleString('vi-VN')} đ
                          </p>
                        )}
                      </div>
                      <p className="font-medium">{item.subtotal.toLocaleString('vi-VN')} đ</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4 flex justify-between text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-primary-500">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditModal && editingOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Sửa đơn hàng #{editingOrder.id}</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tên người nhận</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.recipientName}
                  onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Số điện thoại</label>
                <input
                  type="text"
                  className="input"
                  value={editForm.shippingPhone}
                  onChange={(e) => setEditForm({ ...editForm, shippingPhone: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Địa chỉ giao hàng</label>
                <textarea
                  className="input"
                  rows={2}
                  value={editForm.shippingAddress}
                  onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Trạng thái</label>
                <select
                  className="input"
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="PENDING">Chờ xác nhận</option>
                  <option value="CONFIRMED">Đã xác nhận</option>
                  <option value="SHIPPING">Đang giao</option>
                  <option value="DELIVERED">Đã giao</option>
                  <option value="CANCELLED">Đã hủy</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end pt-4">
                <button type="button" onClick={() => setShowEditModal(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
