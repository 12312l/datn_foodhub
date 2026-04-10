import React, { useState, useEffect } from 'react';
import { adminNotificationAPI, adminUserAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Bell, Send, X } from 'lucide-react';

interface Notification {
  id: number;
  userId: number;
  userName?: string;
  userEmail?: string;
  title: string;
  content: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

interface User {
  id: number;
  fullName: string;
  email: string;
}

const AdminNotificationsPage: React.FC = () => {
  const { showToast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [formData, setFormData] = useState({
    userId: '',
    title: '',
    content: '',
    type: 'SYSTEM',
  });

  useEffect(() => {
    loadNotifications();
    loadUsers();
  }, []);

  const loadNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await adminNotificationAPI.getAll();
      setNotifications(response.data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await adminUserAPI.getAll({ page: 0, size: 100 });
      setUsers(response.data.content || response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      if (formData.userId) {
        await adminNotificationAPI.send({
          userId: parseInt(formData.userId),
          title: formData.title,
          content: formData.content,
          type: formData.type,
        });
        showToast('success', 'Gửi thông báo thành công');
      } else {
        await adminNotificationAPI.broadcast({
          title: formData.title,
          content: formData.content,
          type: formData.type,
        });
        showToast('success', 'Gửi thông báo cho tất cả người dùng');
      }
      setShowModal(false);
      setFormData({ userId: '', title: '', content: '', type: 'SYSTEM' });
      loadNotifications();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Gửi thất bại');
    } finally {
      setIsSending(false);
    }
  };

  const typeColors: Record<string, string> = {
    ORDER: 'bg-blue-100 text-blue-800',
    REVIEW: 'bg-green-100 text-green-800',
    SYSTEM: 'bg-gray-100 text-gray-800',
    PROMOTION: 'bg-purple-100 text-purple-800',
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý thông báo</h1>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          Gửi thông báo
        </button>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-lg font-semibold">Gửi thông báo mới</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Người nhận (để trống = gửi tất cả)</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.userId}
                  onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                >
                  <option value="">Tất cả người dùng</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Loại thông báo</label>
                <select
                  className="w-full p-2 border rounded-lg"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="SYSTEM">Hệ thống</option>
                  <option value="ORDER">Đơn hàng</option>
                  <option value="PROMOTION">Khuyến mãi</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  className="w-full p-2 border rounded-lg"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nội dung</label>
                <textarea
                  className="w-full p-2 border rounded-lg"
                  rows={3}
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="btn btn-primary flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSending ? 'Đang gửi...' : 'Gửi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Notifications List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Bell className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Chưa có thông báo nào</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Người nhận</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Nội dung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Loại</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Ngày tạo</th>
              </tr>
            </thead>
            <tbody>
              {notifications.map((noti) => (
                <tr key={noti.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{noti.userName || 'Tất cả'}</p>
                    <p className="text-xs text-gray-500">{noti.userEmail}</p>
                  </td>
                  <td className="px-4 py-3 font-medium">{noti.title}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{noti.content}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${typeColors[noti.type] || 'bg-gray-100'}`}>
                      {noti.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(noti.createdAt).toLocaleDateString('vi-VN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminNotificationsPage;
