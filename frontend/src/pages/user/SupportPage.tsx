import React, { useState } from "react";
import { LifeBuoy, Send } from "lucide-react";
import { supportAPI } from "../../services/api";
import { useToast } from "../../components/user/Toast";
import { useAuth } from "../../context/AuthContext";

const SupportPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: user?.email || "",
    fullName: user?.fullName || "",
    phone: "",
    subject: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. KIỂM TRA SỐ ĐIỆN THOẠI (Regex Việt Nam)
    const vnf_regex = /^(0|84|\+84)(3|5|7|8|9)([0-9]{8})$/;
    const phoneTrimmed = formData.phone.trim().replace(/\s/g, ""); // Chuẩn hóa xóa dấu cách

    if (phoneTrimmed && !vnf_regex.test(phoneTrimmed)) {
      showToast("error", "Số điện thoại hỗ trợ không đúng định dạng Việt Nam!");
      return;
    }

    setLoading(true);

    try {
      // Gửi dữ liệu đã chuẩn hóa phone đi
      await supportAPI.create({
        ...formData,
        phone: phoneTrimmed,
      });

      showToast("success", "Gửi yêu cầu hỗ trợ thành công");

      // Reset form
      setFormData({
        email: user?.email || "",
        fullName: user?.fullName || "",
        phone: "",
        subject: "",
        description: "",
      });
    } catch (error: any) {
      showToast(
        "error",
        error.response?.data?.message || "Gửi yêu cầu thất bại",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <LifeBuoy className="w-6 h-6 text-blue-500" />
          Hỗ trợ khách hàng
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Info */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Liên hệ với chúng tôi</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Hotline</p>
                <p className="text-gray-600">0123 456 789</p>
              </div>
              <div>
                <p className="font-medium">Email</p>
                <p className="text-gray-600">support@foodhub.com</p>
              </div>
              <div>
                <p className="font-medium">Giờ hoạt động</p>
                <p className="text-gray-600">8:00 - 22:00 (T2 - CN)</p>
              </div>
            </div>
          </div>

          {/* Create Ticket */}
          <div className="card">
            <h2 className="text-lg font-bold mb-4">Gửi yêu cầu hỗ trợ</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="input"
                  placeholder="Nhập email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Họ và tên
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nhập họ và tên"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  type="tel"
                  className="input"
                  placeholder="Ví dụ: 0912345678"
                  value={formData.phone}
                  maxLength={12} // Giới hạn nhập
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  required // Thêm nếu bạn muốn bắt buộc khách để lại SĐT
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="Nhập tiêu đề"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input"
                  rows={4}
                  placeholder="Mô tả vấn đề của bạn"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  required
                ></textarea>
              </div>
              <button
                type="submit"
                className="btn btn-primary w-full flex items-center justify-center gap-2"
                disabled={loading}
              >
                <Send className="w-4 h-4" />
                {loading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </form>
          </div>

          {/* FAQ */}
          <div className="card md:col-span-2">
            <h2 className="text-lg font-bold mb-4">Câu hỏi thường gặp</h2>
            <div className="space-y-4">
              <div>
                <p className="font-medium">Làm sao để đặt hàng?</p>
                <p className="text-gray-600 text-sm">
                  Chọn món ăn, thêm vào giỏ hàng và tiến hành thanh toán.
                </p>
              </div>
              <div>
                <p className="font-medium">Làm sao để hủy đơn hàng?</p>
                <p className="text-gray-600 text-sm">
                  Liên hệ hotline hoặc gửi yêu cầu hỗ trợ trước khi đơn được
                  giao.
                </p>
              </div>
              <div>
                <p className="font-medium">Phí vận chuyển bao nhiêu?</p>
                <p className="text-gray-600 text-sm">
                  Miễn phí vận chuyển cho đơn hàng từ 100,000 VND.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupportPage;
