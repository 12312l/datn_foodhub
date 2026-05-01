import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, Trash2, ShoppingCart, Clock } from 'lucide-react'; // Thêm icon Clock
import { useCart } from '../../context/CartContext';
import { shippingSettingsAPI } from '../../services/api';
import { ShippingSetting } from '../../types';

const CartPage: React.FC = () => {
  const { items, total, updateItem, removeItem, clearCart } = useCart();
  const [shippingSetting, setShippingSetting] = React.useState<ShippingSetting | null>(null);

  React.useEffect(() => {
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

  // ✅ LOGIC TÍNH THỜI GIAN CHẾ BIẾN DỰ KIẾN (Giống logic Backend Duy đã làm)
  const calculatePrepTime = () => {
    if (items.length === 0) return 0;

    // 1. Tìm món lâu nhất (Duy cần đảm bảo item trong CartContext có trường preparationTime)
    const maxBasePrepTime = Math.max(...items.map(item => item.preparationTime || 15));

    // 2. Tính tổng số lượng món
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // 3. Công thức: Món lâu nhất + (Tổng số lượng - 1) * 2 phút
    let finalPrepTime = maxBasePrepTime + (totalQuantity - 1) * 2;

    return Math.min(finalPrepTime, 120); // Giới hạn tối đa 120p
  };

  const estimatedPrepTime = calculatePrepTime();

  const baseFee = shippingSetting?.baseFee ?? 15000;
  const freeShippingThreshold = shippingSetting?.freeShippingThreshold ?? 100000;
  const freeShippingEnabled = shippingSetting?.freeShippingEnabled ?? true;
  const shippingFee = freeShippingEnabled && total >= freeShippingThreshold ? 0 : baseFee;
  const grandTotal = total + shippingFee;

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center py-12">
        <ShoppingCart className="w-24 h-24 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-4">Giỏ hàng trống</h2>
        <Link to="/products" className="btn btn-primary">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6">Giỏ hàng ({items.length} món)</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div key={item.id} className="card flex gap-4">
                <img
                  src={item.productImage || 'https://via.placeholder.com/100'}
                  alt={item.productName}
                  className="w-24 h-24 object-cover rounded-lg"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.productName}</h3>
                  {item.variantAttributes && (
                    <p className="text-xs text-gray-500">{item.variantAttributes}</p>
                  )}
                  {item.originalPrice && item.originalPrice > item.productPrice && (
                    <p className="text-sm text-gray-400 line-through">
                      {item.originalPrice.toLocaleString('vi-VN')} đ
                    </p>
                  )}
                  <p className="text-primary-500 font-bold">
                    {item.productPrice.toLocaleString('vi-VN')} đ
                  </p>
                  {/* Hiển thị thời gian chế biến riêng của từng món (nếu muốn) */}
                  <p className="text-[10px] text-gray-400">⏱ Chế biến: {item.preparationTime || 15}p</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateItem(item.id, item.quantity - 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateItem(item.id, item.quantity + 1)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right">
                  <p className="font-bold">{item.subtotal.toLocaleString('vi-VN')} đ</p>
                  <button
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 hover:text-red-700 mt-2"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="card sticky top-24">
              <h2 className="text-lg font-bold mb-4">Tổng quan đơn hàng</h2>

              {/* ✅ HIỂN THỊ THỜI GIAN CHẾ BIẾN TỔNG TẠI ĐÂY */}
              <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-lg mb-4 text-orange-700 text-sm">
                <Clock className="w-4 h-4" />
                <span>Thời gian chuẩn bị dự kiến: <strong>~{estimatedPrepTime} phút</strong></span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Tạm tính</span>
                  <span>{total.toLocaleString('vi-VN')} đ</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phí vận chuyển</span>
                  <span>{shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')} đ`}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg font-bold">
                  <span>Tổng cộng</span>
                  <span className="text-primary-500">{grandTotal.toLocaleString('vi-VN')} đ</span>
                </div>
              </div>
              {freeShippingEnabled && total < freeShippingThreshold && (
                <p className="text-sm text-gray-500 mb-4">
                  Mua thêm {(freeShippingThreshold - total).toLocaleString('vi-VN')} đ để được miễn phí vận chuyển
                </p>
              )}
              <Link to="/checkout" className="btn btn-primary w-full py-3 text-center block">
                Tiến hành thanh toán
              </Link>
              <button
                onClick={clearCart}
                className="w-full text-red-500 hover:text-red-700 mt-4 text-sm"
              >
                Xóa tất cả
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;