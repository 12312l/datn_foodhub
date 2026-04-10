import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Điều khoản sử dụng</h1>

        <div className="card prose prose-sm max-w-none">
          <h2>1. Chấp nhận điều khoản</h2>
          <p>
            Bằng việc truy cập và sử dụng website FoodHub, bạn đồng ý chịu ràng buộc
            bởi các điều khoản và điều kiện được nêu trong tài liệu này.
          </p>

          <h2>2. Mô tả dịch vụ</h2>
          <p>
            FoodHub là nền tảng đặt đồ ăn trực tuyến, kết nối người dùng với các nhà hàng
            và cửa hàng thực phẩm. Chúng tôi cung cấp dịch vụ gợi ý món ăn thông minh bằng AI.
          </p>

          <h2>3. Tài khoản người dùng</h2>
          <p>
            Khi đăng ký tài khoản, bạn cam kết cung cấp thông tin chính xác và cập nhật.
            Bạn chịu trách nhiệm bảo mật tài khoản và mật khẩu của mình.
          </p>

          <h2>4. Đặt hàng và thanh toán</h2>
          <p>
            Khi đặt hàng, bạn đồng ý thanh toán đầy đủ cho đơn hàng. Chúng tôi hỗ trợ
            thanh toán COD và VNPAY.
          </p>

          <h2>5. Chính sách hủy đơn</h2>
          <p>
            Đơn hàng có thể hủy trước khi được xác nhận. Sau khi đã xác nhận, vui lòng
            liên hệ hotline để được hỗ trợ.
          </p>

          <h2>6. Giới hạn trách nhiệm</h2>
          <p>
            FoodHub không chịu trách nhiệm về chất lượng sản phẩm từ các nhà hàng đối tác.
            Mọi khiếu nại vui lòng liên hệ trực tiếp với nhà hàng.
          </p>

          <h2>7. Sở hữu trí tuệ</h2>
          <p>
            Tất cả nội dung trên website FoodHub bao gồm logo, hình ảnh, văn bản đều
            thuộc quyền sở hữu của chúng tôi.
          </p>

          <h2>8. Thay đổi điều khoản</h2>
          <p>
            Chúng tôi có quyền thay đổi điều khoản sử dụng bất cứ lúc nào. Việc tiếp
            tục sử dụng sau khi thay đổi được coi là chấp nhận các điều khoản mới.
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;
