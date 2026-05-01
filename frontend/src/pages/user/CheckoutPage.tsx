import React, { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { orderAPI, couponAPI, shippingSettingsAPI } from '../../services/api';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/user/Toast';
import { Coupon, ShippingSetting } from '../../types';
import axios from 'axios'; // Đảm bảo đã cài axios

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [couponCode, setCouponCode] = useState('');
  const [coupon, setCoupon] = useState<Coupon | null>(null);
  const [shippingSetting, setShippingSetting] = useState<ShippingSetting | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isHandlingVNPayReturn, setIsHandlingVNPayReturn] = useState(false);

  // ✅ THÊM STATE MỚI
  const [estimatedMinutes, setEstimatedMinutes] = useState<number>(0);
  const [calculatedShippingFee, setCalculatedShippingFee] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    recipientName: user?.fullName || '',
    shippingPhone: user?.phone || '',
    shippingEmail: user?.email || '',
    shippingAddress: user?.address || '',
    note: '',
    paymentMethod: 'COD',
  });

  // ✅ LOGIC TÍNH PHÍ SHIP: Ưu tiên phí từ API Google Maps, nếu chưa có thì dùng baseFee
  const baseFee = shippingSetting?.baseFee ?? 15000;
  const currentShippingFee = calculatedShippingFee !== null ? calculatedShippingFee : baseFee;

  const freeShippingThreshold = shippingSetting?.freeShippingThreshold ?? 100000;
  const freeShippingEnabled = shippingSetting?.freeShippingEnabled ?? true;
  const finalShippingFee = freeShippingEnabled && total >= freeShippingThreshold ? 0 : currentShippingFee;

  const discount = coupon ? Math.min(
    (total * coupon.discountPercent) / 100,
    coupon.maxDiscount || Infinity
  ) : 0;
  const grandTotal = total + finalShippingFee - discount;

  // Load cài đặt ship ban đầu
  useEffect(() => {
    const loadShippingSetting = async () => {
      try {
        const response = await shippingSettingsAPI.getCurrent();
        setShippingSetting(response.data);
      } catch (error) {
        console.error('Error loading shipping setting:', error);
      }
    };
    loadShippingSetting();
  }, []);

  // ✅ HÀM GỌI API TÍNH THỜI GIAN VÀ PHÍ SHIP
  const updateDeliveryInfo = useCallback(async (address: string) => {
    if (address.length < 10) return; // Chỉ gọi khi địa chỉ đủ chi tiết

    try {
      // Duy chỉnh lại URL này cho khớp với Backend của Duy nhé
      const response = await axios.get(`http://localhost:9090/api/v1/delivery/calculate`, {
        params: {
          address: address,
          userId: user?.id
        }
      });

      const { estimatedMinutes, shippingFee } = response.data;
      setEstimatedMinutes(estimatedMinutes);
      setCalculatedShippingFee(shippingFee);
    } catch (error: any) {
      console.error("Lỗi tính phí ship:", error.response?.data);
      // Nếu lỗi (địa chỉ quá xa) thì reset về mặc định
      setEstimatedMinutes(0);
      setCalculatedShippingFee(null);
    }
  }, [user?.id]);

  // ✅ DEBOUNCE: Đợi người dùng ngừng gõ 1 lúc mới gọi API để tiết kiệm lượt dùng Google Maps
  useEffect(() => {
    const timer = setTimeout(() => {
      updateDeliveryInfo(formData.shippingAddress);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData.shippingAddress, updateDeliveryInfo]);

  // Xử lý VNPay return (giữ nguyên logic cũ của Duy)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const txnRef = params.get('vnp_TxnRef');
    if (!txnRef || isHandlingVNPayReturn) return;

    const responseCode = params.get('vnp_ResponseCode');
    setIsHandlingVNPayReturn(true);

    if (responseCode === '00') {
      orderAPI.getById(Number(txnRef)).then((res) => {
        if (res.data.paymentStatus === 'PAID') {
          showToast('success', 'Thanh toán thành công!');
          void clearCart().finally(() => navigate('/profile/orders', { replace: true }));
        } else {
          showToast('info', 'Đang cập nhật trạng thái đơn hàng...');
          setTimeout(() => navigate('/profile/orders', { replace: true }), 2000);
        }
      }).catch(() => navigate('/profile/orders', { replace: true }));
      return;
    }
    showToast('error', `Thanh toán thất bại (Mã: ${responseCode})`);
    navigate('/checkout', { replace: true });
  }, [location.search, isHandlingVNPayReturn, showToast, clearCart, navigate]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      showToast('warning', 'Vui lòng nhập mã giảm giá');
      return;
    }
    try {
      const productIds = Array.from(new Set(items.map(item => item.productId)));
      const response = await couponAPI.validate(couponCode, total, productIds);
      setCoupon(response.data);
      showToast('success', 'Áp dụng mã giảm giá thành công!');
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Mã giảm giá không hợp lệ');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const vnf_regex = /^(0|84|\+84)(3|5|7|8|9)([0-9]{8})$/;
    const phoneTrimmed = formData.shippingPhone.trim().replace(/\s/g, '');

    if (!vnf_regex.test(phoneTrimmed)) {
      showToast('error', 'Số điện thoại không đúng định dạng!');
      return;
    }

    setIsLoading(true);
    try {
      const response = await orderAPI.create({
        ...formData,
        shippingPhone: phoneTrimmed,
        couponCode: coupon?.code,
      });

      if (formData.paymentMethod === 'VNPAY') {
        const vnpayRes = await orderAPI.createVNPayUrl(response.data.id);
        window.location.href = vnpayRes.data.url;
      } else {
        showToast('success', 'Đặt hàng thành công!');
        await clearCart();
        navigate('/profile/orders');
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Đặt hàng thất bại');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Thanh toán</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <h2 className="text-lg font-bold mb-4">Thông tin giao hàng</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tên người nhận *</label>
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                    className="input"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại *</label>
                    <input
                      type="tel"
                      value={formData.shippingPhone}
                      onChange={(e) => setFormData({ ...formData, shippingPhone: e.target.value })}
                      className="input"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.shippingEmail}
                      onChange={(e) => setFormData({ ...formData, shippingEmail: e.target.value })}
                      className="input"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Địa chỉ chi tiết *</label>
                  <textarea
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    className="input min-h-[100px]"
                    placeholder="Nhập địa chỉ để tính phí ship và thời gian giao hàng..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ghi chú</label>
                  <textarea
                    value={formData.note}
                    onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                    className="input min-h-[80px]"
                  />
                </div>
              </div>
            </div>

            <div className="card">
              <h2 className="text-lg font-bold mb-4">Phương thức thanh toán</h2>
              <div className="space-y-2">
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="COD"
                    checked={formData.paymentMethod === 'COD'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mr-3"
                  />
                  <span>Thanh toán khi nhận hàng (COD)</span>
                </label>
                <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="VNPAY"
                    checked={formData.paymentMethod === 'VNPAY'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="mr-3"
                  />
                  <span>Thanh toán qua VNPAY</span>
                </label>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-lg font-bold mb-4">Tổng quan đơn hàng</h2>

              <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div className="text-gray-600">
                      <p>{item.productName} x{item.quantity}</p>
                      <p className="text-xs text-gray-500">{item.variantAttributes || item.variantName}</p>
                    </div>
                    <span>{item.subtotal.toLocaleString('vi-VN')} đ</span>
                  </div>
                ))}
              </div>

              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="Mã giảm giá"
                    className="input flex-1"
                  />
                  <button type="button" onClick={handleApplyCoupon} className="btn btn-secondary">Áp dụng</button>
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{total.toLocaleString('vi-VN')} đ</span>
                </div>
                {coupon && (
                  <div className="flex justify-between text-green-600">
                    <span>Giảm giá</span>
                    <span>-{discount.toLocaleString('vi-VN')} đ</span>
                  </div>
                )}

                {/* HIỂN THỊ PHÍ SHIP */}
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span>{finalShippingFee === 0 ? 'Miễn phí' : `${finalShippingFee.toLocaleString('vi-VN')} đ`}</span>
                </div>

                {/* ✅ THÊM DÒNG HIỂN THỊ THỜI GIAN DỰ KIẾN Ở ĐÂY */}
                {estimatedMinutes > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 bg-blue-50 p-2 rounded-md border border-blue-100 mt-2">
                    <span className="flex items-center gap-1 font-medium">
                      🕒 Thời gian nhận dự kiến:
                    </span>
                    <span className="font-bold">~{estimatedMinutes} phút</span>
                  </div>
                )}

                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-500">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary w-full py-3 mt-4"
              >
                {isLoading ? 'Đang xử lý...' : 'Đặt hàng'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;