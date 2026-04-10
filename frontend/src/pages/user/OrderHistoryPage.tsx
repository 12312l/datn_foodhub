import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, MapPin, Phone, User, ChevronRight } from 'lucide-react';
import { orderAPI } from '../../services/api';
import { Order } from '../../types';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getMyOrders();
      const normalizedOrders = response.data.map((order: Order) => ({
        ...order,
        orderStatus: order.orderStatus || order.status,
      }));
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOrderStatus = (order: Order) => order.orderStatus || order.status || 'PENDING';

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'SHIPPING': return 'Đang giao';
      case 'DELIVERED': return 'Đã giao';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-700';
      case 'SHIPPING': return 'bg-purple-100 text-purple-700';
      case 'DELIVERED': return 'bg-green-100 text-green-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusText = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PAID': return 'Đã thanh toán';
      case 'FAILED': return 'Thanh toán thất bại';
      default: return 'Chưa thanh toán';
    }
  };

  const getPaymentStatusColor = (paymentStatus: string) => {
    switch (paymentStatus) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const canCancelOrder = (order: Order) => {
    const status = getOrderStatus(order);
    return status !== 'DELIVERED' && status !== 'CANCELLED';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Lịch sử đơn hàng</h1>

        {orders.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 text-lg mb-4">Bạn chưa có đơn hàng nào</p>
            <Link to="/products" className="btn btn-primary">Mua sắm ngay</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="card">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-lg">Đơn hàng #{order.id}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2 md:mt-0">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getOrderStatus(order))}`}>
                        {getStatusText(getOrderStatus(order))}
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="space-y-2 mb-4">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex justify-between text-sm gap-4">
                        <div>
                          <p>{item.productName} x{item.quantity}</p>
                          {item.variantName && <p className="text-xs text-gray-500">Biến thể: {item.variantName}</p>}
                        </div>
                        <span>{item.subtotal.toLocaleString('vi-VN')} đ</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500">...và {order.items.length - 3} sản phẩm khác</p>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row md:items-center justify-between pt-4 border-t">
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Phương thức: {order.paymentMethod}</p>
                      <div className="flex items-center gap-2">
                        <span>Trạng thái thanh toán:</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {getPaymentStatusText(order.paymentStatus)}
                        </span>
                      </div>
                      <p>Địa chỉ: {order.shippingAddress}</p>
                    </div>
                    <div className="mt-2 md:mt-0 text-right">
                      <p className="text-lg font-bold text-primary-500">
                        {order.totalAmount.toLocaleString('vi-VN')} đ
                      </p>
                      {canCancelOrder(order) && (
                        <button
                          onClick={async () => {
                            if (confirm('Bạn có chắc muốn hủy đơn hàng?')) {
                              try {
                                await orderAPI.cancel(order.id);
                                if (selectedOrder?.id === order.id) {
                                  setSelectedOrder(null);
                                }
                                loadOrders();
                              } catch (error) {
                                console.error('Error cancelling order:', error);
                                alert('Không thể hủy đơn hàng này');
                              }
                            }
                          }}
                          className="text-red-500 text-sm hover:underline mt-1"
                        >
                          Hủy đơn hàng
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-primary-500 text-sm hover:underline mt-1 ml-2 flex items-center gap-1"
                      >
                        Xem chi tiết <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-xl font-bold">Chi tiết đơn hàng #{selectedOrder.id}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(selectedOrder.createdAt).toLocaleString('vi-VN')}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(getOrderStatus(selectedOrder))}`}>
                  {getStatusText(getOrderStatus(selectedOrder))}
                </span>
              </div>

              {/* Customer Info */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold mb-3">Thông tin người nhận</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.recipientName || 'Không có thông tin'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.recipientPhone || selectedOrder.shippingPhone || 'Không có thông tin'}</span>
                  </div>
                  <div className="flex items-center gap-2 md:col-span-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedOrder.shippingAddress || 'Không có thông tin'}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Sản phẩm</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg">
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
                      <p className="font-semibold">{item.subtotal.toLocaleString('vi-VN')} đ</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Thanh toán</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                    {getPaymentStatusText(selectedOrder.paymentStatus)}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{(selectedOrder.totalAmount - (selectedOrder.shippingFee || 0)).toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span>{(selectedOrder.shippingFee || 0).toLocaleString('vi-VN')} đ</span>
                </div>
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">Giảm giá</span>
                    <span className="text-green-600">-{selectedOrder.discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Tổng cộng</span>
                  <span className="text-primary-500">{selectedOrder.totalAmount.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2">
                {canCancelOrder(selectedOrder) && (
                  <button
                    onClick={async () => {
                      if (confirm('Bạn có chắc muốn hủy đơn hàng?')) {
                        try {
                          await orderAPI.cancel(selectedOrder.id);
                          setSelectedOrder(null);
                          loadOrders();
                        } catch (error) {
                          console.error('Error cancelling order:', error);
                          alert('Không thể hủy đơn hàng này');
                        }
                      }
                    }}
                    className="btn text-red-600 border border-red-200 hover:bg-red-50"
                  >
                    Hủy đơn
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="btn btn-secondary"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
