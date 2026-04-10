import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold mb-6">Chính sách bảo mật</h1>

        <div className="card prose prose-sm max-w-none">
          <h2>1. Thu thập thông tin</h2>
          <p>
            FoodHub thu thập thông tin cá nhân của bạn bao gồm: họ tên, email, số điện thoại,
            địa chỉ giao hàng khi bạn đăng ký tài khoản và đặt hàng.
          </p>

          <h2>2. Sử dụng thông tin</h2>
          <p>
            Chúng tôi sử dụng thông tin của bạn để:
          </p>
          <ul>
            <li>Xử lý đơn hàng và giao hàng</li>
            <li>Gửi thông báo về đơn hàng</li>
            <li>Cải thiện dịch vụ và trải nghiệm người dùng</li>
            <li>Gửi các khuyến mãi và ưu đãi đặc biệt</li>
          </ul>

          <h2>3. Bảo vệ thông tin</h2>
          <p>
            Chúng tôi áp dụng các biện pháp bảo mật để bảo vệ thông tin cá nhân của bạn,
            bao gồm mã hóa mật khẩu và sử dụng giao thức bảo mật SSL.
          </p>

          <h2>4. Chia sẻ thông tin</h2>
          <p>
            Chúng tôi có thể chia sẻ thông tin với các đối tác vận chuyển để giao hàng.
            Không chia sẻ thông tin cá nhân với bên thứ ba cho mục đích tiếp thị.
          </p>

          <h2>5. Quyền của người dùng</h2>
          <p>
            Bạn có quyền truy cập, chỉnh sửa hoặc xóa thông tin cá nhân của mình.
            Liên hệ với chúng tôi để thực hiện các quyền này.
          </p>

          <h2>6. Cookies</h2>
          <p>
            Website sử dụng cookies để cải thiện trải nghiệm người dùng. Bạn có thể
            tắt cookies trong cài đặt trình duyệt.
          </p>

          <h2>7. Liên hệ</h2>
          <p>
            Nếu có câu hỏi về chính sách bảo mật, vui lòng liên hệ:
            privacy@foodhub.com
          </p>

          <p className="text-sm text-gray-500 mt-8">
            Cập nhật lần cuối: {new Date().toLocaleDateString('vi-VN')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
