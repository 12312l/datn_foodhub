import React, { useState, useEffect } from 'react';
import { adminSupportAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Search, Eye, X, MessageSquare } from 'lucide-react';

interface SupportTicket {
  id: number;
  userId?: number | string;
  userName: string;
  userEmail?: string;
  subject: string;
  message: string;
  status: string;
  createdAt: string;
  reply?: string;
}

const statusColors: Record<string, string> = {
  OPEN: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  REPLIED: 'bg-blue-100 text-blue-800',
  CLOSED: 'bg-gray-100 text-gray-800',
};

const statusLabels: Record<string, string> = {
  OPEN: 'Mở',
  PENDING: 'Chờ trả lời',
  REPLIED: 'Đã trả lời',
  CLOSED: 'Đã đóng',
};

const AdminSupportPage: React.FC = () => {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    setIsLoading(true);
    try {
      const response = await adminSupportAPI.getAll();
      let ticketsData = response.data.content || response.data;

      if (statusFilter) {
        ticketsData = ticketsData.filter((t: SupportTicket) => t.status === statusFilter);
      }

      setTickets(ticketsData);
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (ticket.userName && ticket.userName.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (ticket.userEmail && ticket.userEmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleReply = async (ticketId: number) => {
    if (!replyText.trim()) {
      showToast('warning', 'Vui lòng nhập nội dung trả lời');
      return;
    }
    try {
      await adminSupportAPI.reply(ticketId, replyText);
      showToast('success', 'Gửi phản hồi thành công');
      setSelectedTicket(null);
      setReplyText('');
      loadTickets();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Gửi phản hồi thất bại');
    }
  };

  const handleClose = async (ticketId: number) => {
    try {
      await adminSupportAPI.close(ticketId);
      showToast('success', 'Đóng ticket thành công');
      loadTickets();
    } catch (error: any) {
      showToast('error', error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý hỗ trợ</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tiêu đề, người gửi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="PENDING">Chờ trả lời</option>
            <option value="REPLIED">Đã trả lời</option>
            <option value="CLOSED">Đã đóng</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Người gửi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tiêu đề</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Trạng thái</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày gửi</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-gray-500">Không có ticket nào</td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{ticket.userName}</p>
                        <p className="text-sm text-gray-500">{ticket.userEmail}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{ticket.subject}</p>
                      <p className="text-sm text-gray-500 truncate max-w-[200px]">{ticket.message}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${statusColors[ticket.status] || 'bg-gray-100 text-gray-800'}`}>
                        {statusLabels[ticket.status] || ticket.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {new Date(ticket.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => setSelectedTicket(ticket)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {ticket.status !== 'CLOSED' && (
                          <>
                            <button
                              onClick={() => handleClose(ticket.id)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                              title="Đóng ticket"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl m-4">
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Chi tiết yêu cầu hỗ trợ</h2>
              <button onClick={() => setSelectedTicket(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Người gửi</p>
                  <p className="font-medium">{selectedTicket.userName}</p>
                  <p className="text-sm text-gray-600">{selectedTicket.userEmail}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Trạng thái</p>
                  <span className={`px-2 py-1 rounded text-xs ${statusColors[selectedTicket.status]}`}>
                    {statusLabels[selectedTicket.status]}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tiêu đề</p>
                <p className="font-medium">{selectedTicket.subject}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Nội dung</p>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p>{(selectedTicket as any).description || selectedTicket.message}</p>
                </div>
              </div>
              {selectedTicket.reply && (
                <div>
                  <p className="text-sm text-gray-500">Phản hồi</p>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p>{selectedTicket.reply}</p>
                  </div>
                </div>
              )}
              {selectedTicket.status !== 'CLOSED' && (
                <div>
                  <p className="text-sm text-gray-500 mb-2">Phản hồi</p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="input min-h-[100px]"
                    placeholder="Nhập nội dung phản hồi..."
                  />
                  <button
                    onClick={() => handleReply(selectedTicket.id)}
                    className="btn btn-primary mt-2 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Gửi phản hồi
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSupportPage;
