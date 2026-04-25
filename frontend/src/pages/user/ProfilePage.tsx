import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { User, ShoppingBag, Heart, Lock, LogOut, Camera, MapPin, Phone, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { userAPI, orderAPI, favoriteAPI, reviewAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Order } from '../../types';

const ProfilePage: React.FC = () => {
  const { user, updateUser, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { showToast } = useToast();

  // Determine active tab based on URL
  const getActiveTab = (): 'info' | 'orders' | 'favorites' | 'change-password' => {
    const path = location.pathname;
    if (path.includes('/orders')) return 'orders';
    if (path.includes('/favorites')) return 'favorites';
    if (path.includes('/change-password')) return 'change-password';
    return 'info';
  };

  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'favorites' | 'change-password'>(getActiveTab());

  // Update activeTab when URL changes
  useEffect(() => {
    setActiveTab(getActiveTab());
  }, [location.pathname]);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    address: '',
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [reviewingProductId, setReviewingProductId] = useState<number | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewedProductIds, setReviewedProductIds] = useState<Record<number, boolean>>({});

  // Update formData when user is loaded
  useEffect(() => {
    console.log('User in ProfilePage:', user);
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        address: user.address || '',
      });
    }
  }, [user]);

  // Load orders when tab is orders
  useEffect(() => {
    if (activeTab === 'orders') {
      loadOrders();
    }
    if (activeTab === 'favorites') {
      loadFavorites();
    }
  }, [activeTab]);

  const loadFavorites = async () => {
    setFavoritesLoading(true);
    try {
      const response = await favoriteAPI.getAll();
      setFavorites(response.data);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setFavoritesLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const response = await orderAPI.getByUser();
      const normalizedOrders = response.data.map((order: Order) => ({
        ...order,
        orderStatus: order.orderStatus || order.status,
      }));
      setOrders(normalizedOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const getOrderStatus = (order: Order) => order.orderStatus || order.status || 'PENDING';

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ xác nhận';
      case 'CONFIRMED': return 'Đã xác nhận';
      case 'SHIPPING': return 'Đang giao';
      case 'DELIVERED': return 'Hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'SHIPPING': return 'bg-purple-100 text-purple-800';
      default: return 'bg-yellow-100 text-yellow-800';
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

  const canReviewOrder = (order: Order) => getOrderStatus(order) === 'DELIVERED';

  const getEffectivePaymentStatus = (order: Order) => {
    return getOrderStatus(order) === 'DELIVERED' ? 'PAID' : order.paymentStatus;
  };

  const handleOpenReview = (productId: number) => {
    setReviewingProductId(productId);
    setReviewRating(5);
    setReviewComment('');
  };

  const handleSubmitReview = async (productId: number) => {
    if (reviewSubmitting) return;
    if (reviewRating < 1 || reviewRating > 5) {
      showToast('warning', 'Vui lòng chọn số sao từ 1 đến 5');
      return;
    }

    try {
      setReviewSubmitting(true);
      await reviewAPI.create(productId, {
        rating: reviewRating,
        comment: reviewComment.trim() || undefined,
      });

      setReviewedProductIds((prev) => ({ ...prev, [productId]: true }));
      setReviewingProductId(null);
      setReviewComment('');
      setReviewRating(5);
      showToast('success', 'Đánh giá sản phẩm thành công');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Không thể gửi đánh giá');
    } finally {
      setReviewSubmitting(false);
    }
  };

  useEffect(() => {
    const loadReviewedProducts = async () => {
      if (!selectedOrder || !user || !canReviewOrder(selectedOrder)) {
        setReviewedProductIds({});
        return;
      }

      try {
        const checks = await Promise.all(
          selectedOrder.items.map(async (item) => {
            try {
              const response = await reviewAPI.getByProduct(item.productId, { page: 0, size: 100 });
              const reviews = response.data?.content || [];
              const hasReviewed = reviews.some((review: any) => review.userId === user.id);
              return { productId: item.productId, hasReviewed };
            } catch {
              return { productId: item.productId, hasReviewed: false };
            }
          })
        );

        const reviewedMap: Record<number, boolean> = {};
        checks.forEach((item) => {
          reviewedMap[item.productId] = item.hasReviewed;
        });
        setReviewedProductIds(reviewedMap);
      } catch {
        setReviewedProductIds({});
      }
    };

    loadReviewedProducts();
  }, [selectedOrder, user]);

  const menuItems = [
    { key: 'info', path: '/profile', icon: User, label: 'Thông tin tài khoản' },
    { key: 'orders', path: '/profile/orders', icon: ShoppingBag, label: 'Đơn hàng của tôi' },
    { key: 'favorites', path: '/profile/favorites', icon: Heart, label: 'Sản phẩm yêu thích' },
    { key: 'change-password', path: '/profile/change-password', icon: Lock, label: 'Đổi mật khẩu' },
  ];

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await userAPI.uploadAvatar(formData);
      updateUser({ ...user, avatar: response.data.url } as any);
      showToast('success', 'Cập nhật ảnh đại diện thành công!');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Upload ảnh thất bại');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await userAPI.updateProfile(formData);
      updateUser({ ...user, ...formData } as any);
      showToast('success', 'Cập nhật thông tin thành công!');
      setIsEditing(false);
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* User Info */}
              <div className="p-6 text-center border-b">
                <div className="relative w-20 h-20 mx-auto mb-3">
                  <div className="w-full h-full rounded-full bg-primary-100 flex items-center justify-center overflow-hidden">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary-500" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-600 transition-colors">
                    <Camera className="w-4 h-4 text-white" />
                    <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={isUploading} />
                  </label>
                </div>
                <h3 className="font-semibold text-lg">{user?.fullName || 'User'}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
              </div>

              {/* Menu */}
              <nav className="p-2">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    onClick={() => {
                      setActiveTab(item.key as any);
                      navigate(item.path);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors w-full text-left ${activeTab === item.key
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-600 hover:bg-gray-50'
                      }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </button>
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

          {/* Main Content */}
          <div className="flex-1">
            {activeTab === 'info' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Thông tin tài khoản</h1>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-primary-500 hover:underline"
                  >
                    {isEditing ? 'Hủy' : 'Chỉnh sửa'}
                  </button>
                </div>

                <form onSubmit={handleUpdateProfile}>
                  <div className="space-y-4 max-w-md">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Họ tên</label>
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        disabled
                        className="input bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ</label>
                      <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        disabled={!isEditing}
                        className="input"
                      />
                    </div>
                    {isEditing && (
                      <button type="submit" className="btn btn-primary">
                        Lưu thay đổi
                      </button>
                    )}
                  </div>
                </form>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-bold mb-6">Đơn hàng của tôi</h1>
                {orders.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có đơn hàng nào</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-semibold">Đơn hàng #{order.id}</span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${getStatusColor(getOrderStatus(order))}`}>
                              {getStatusText(getOrderStatus(order))}
                            </span>
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${getPaymentStatusColor(getEffectivePaymentStatus(order))}`}>
                              {getPaymentStatusText(getEffectivePaymentStatus(order))}
                            </span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString('vi-VN')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-primary-500 font-semibold">
                            {order.totalAmount?.toLocaleString('vi-VN')} đ
                          </div>
                          <div className="flex items-center gap-3">
                            {canCancelOrder(order) && (
                              <button
                                onClick={async () => {
                                  if (!confirm('Bạn có chắc muốn hủy đơn hàng?')) return;
                                  try {
                                    await orderAPI.cancel(order.id);
                                    showToast('success', `Đã hủy đơn hàng #${order.id}`);
                                    loadOrders();
                                  } catch (error: any) {
                                    showToast('error', error.response?.data?.message || 'Không thể hủy đơn hàng này');
                                  }
                                }}
                                className="text-sm text-red-500 hover:underline"
                              >
                                Hủy đơn
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setReviewingProductId(null);
                                setSelectedOrder(order);
                              }}
                              className="text-sm text-primary-500 hover:underline"
                            >
                              Xem chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

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



                    <div className="mb-6">
                      <h3 className="font-semibold mb-3">Sản phẩm</h3>
                      <div className="space-y-3">
                        {selectedOrder.items?.map((item) => (
                          <div key={item.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                            <div>
                              {/* Click vào tên sản phẩm để điều hướng về trang chi tiết */}
                              <Link
                                to={`/products/${item.productId}`}
                                className="font-medium text-gray-900 hover:text-primary-600 hover:underline transition-colors block cursor-pointer"
                              >
                                {item.productName} x{item.quantity}
                              </Link>

                              {item.variantAttributes && (
                                <p className="text-xs text-gray-500">{item.variantAttributes}</p>
                              )}

                              {canReviewOrder(selectedOrder) && (
                                <div className="mt-2">
                                  {reviewedProductIds[item.productId] ? (
                                    <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                      <Star className="w-3 h-3 fill-current" />
                                      Đã đánh giá
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleOpenReview(item.productId)}
                                      className="text-xs text-primary-600 hover:underline"
                                    >
                                      Đánh giá sản phẩm
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                            <p className="font-semibold">{item.subtotal?.toLocaleString('vi-VN')} đ</p>
                          </div>
                        ))}
                      </div>

                      {/* Phần Form Đánh giá giữ nguyên logic của bạn */}
                      {canReviewOrder(selectedOrder) && reviewingProductId && (
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                          <h4 className="font-medium mb-3">Đánh giá sản phẩm</h4>
                          <div className="flex items-center gap-1 mb-3">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setReviewRating(value)}
                                className="text-yellow-500"
                              >
                                <Star className={`w-5 h-5 ${value <= reviewRating ? 'fill-current' : ''}`} />
                              </button>
                            ))}
                          </div>
                          <textarea
                            value={reviewComment}
                            onChange={(e) => setReviewComment(e.target.value)}
                            placeholder="Chia sẻ cảm nhận của bạn về món ăn này"
                            className="w-full border rounded-lg p-2 text-sm min-h-[90px] focus:ring-1 focus:ring-primary-500 outline-none"
                          />
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              onClick={() => setReviewingProductId(null)}
                              className="px-3 py-1.5 border rounded-md text-sm hover:bg-gray-100"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSubmitReview(reviewingProductId)}
                              disabled={reviewSubmitting}
                              className="px-3 py-1.5 bg-primary-500 text-white rounded-md text-sm hover:bg-primary-600 disabled:opacity-60"
                            >
                              {reviewSubmitting ? 'Đang gửi...' : 'Gửi đánh giá'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-4">
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-600">Thanh toán</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusColor(getEffectivePaymentStatus(selectedOrder))}`}>
                          {getPaymentStatusText(getEffectivePaymentStatus(selectedOrder))}
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
                        <span className="text-primary-500">{selectedOrder.totalAmount?.toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>

                    <div className="mt-6 flex justify-end gap-2">
                      {canCancelOrder(selectedOrder) && (
                        <button
                          onClick={async () => {
                            if (!confirm('Bạn có chắc muốn hủy đơn hàng?')) return;
                            try {
                              await orderAPI.cancel(selectedOrder.id);
                              setSelectedOrder(null);
                              showToast('success', `Đã hủy đơn hàng #${selectedOrder.id}`);
                              loadOrders();
                            } catch (error: any) {
                              showToast('error', error.response?.data?.message || 'Không thể hủy đơn hàng này');
                            }
                          }}
                          className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                        >
                          Hủy đơn
                        </button>
                      )}
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                      >
                        Đóng
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'favorites' && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h1 className="text-2xl font-bold mb-6">Sản phẩm yêu thích</h1>
                {favoritesLoading ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
                  </div>
                ) : favorites.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>Chưa có sản phẩm yêu thích</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((item) => (
                      <div key={item.id} className="border rounded-lg p-4 flex gap-4">
                        <img
                          src={item.productImage || '/placeholder-food.png'}
                          alt={item.productName}
                          className="w-20 h-20 object-cover rounded-lg"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-food.png';
                          }}
                        />
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.productName}</h3>
                          <p className="text-primary-500 font-bold">
                            {item.productPrice?.toLocaleString('vi-VN')} đ
                          </p>
                          <button
                            onClick={async () => {
                              try {
                                await favoriteAPI.remove(item.productId);
                                loadFavorites();
                                showToast('success', 'Đã xóa khỏi yêu thích');
                              } catch (error) {
                                showToast('error', 'Xóa thất bại');
                              }
                            }}
                            className="text-red-500 text-sm hover:underline mt-1"
                          >
                            Xóa
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
