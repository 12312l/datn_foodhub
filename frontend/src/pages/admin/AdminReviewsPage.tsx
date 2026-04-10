import React, { useCallback, useEffect, useState } from 'react';
import { MessageSquareText, Search, Star, Trash2, X } from 'lucide-react';
import { adminReviewAPI } from '../../services/api';
import { useToast } from '../../components/user/Toast';
import { Review } from '../../types';

const AdminReviewsPage: React.FC = () => {
  const { showToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [replyingReview, setReplyingReview] = useState<Review | null>(null);
  const [replyText, setReplyText] = useState('');
  const [savingReply, setSavingReply] = useState(false);

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await adminReviewAPI.getAll({ page: currentPage, size: 10 });
      const data = response.data;
      setReviews(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (error) {
      console.error('Error loading reviews:', error);
      showToast('error', 'Không thể tải danh sách đánh giá');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, showToast]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  useEffect(() => {
    let result = [...reviews];

    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      result = result.filter((review) =>
        (review.productName || '').toLowerCase().includes(keyword) ||
        (review.userName || '').toLowerCase().includes(keyword) ||
        (review.comment || '').toLowerCase().includes(keyword)
      );
    }

    if (ratingFilter) {
      result = result.filter((review) => String(review.rating) === ratingFilter);
    }

    setFilteredReviews(result);
  }, [reviews, searchTerm, ratingFilter]);

  const handleDelete = async (id: number) => {
    if (!confirm('Bạn có chắc muốn xóa đánh giá này?')) return;

    try {
      await adminReviewAPI.delete(id);
      showToast('success', 'Xóa đánh giá thành công');
      loadReviews();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      showToast('error', apiError.response?.data?.message || 'Xóa đánh giá thất bại');
    }
  };

  const openReplyModal = (review: Review) => {
    setReplyingReview(review);
    setReplyText(review.adminReply || '');
  };

  const handleSaveReply = async () => {
    if (!replyingReview) return;
    if (!replyText.trim()) {
      showToast('warning', 'Vui lòng nhập nội dung phản hồi');
      return;
    }

    try {
      setSavingReply(true);
      await adminReviewAPI.reply(replyingReview.id, replyText.trim());
      showToast('success', 'Đã lưu phản hồi thành công');
      setReplyingReview(null);
      setReplyText('');
      loadReviews();
    } catch (error: unknown) {
      const apiError = error as { response?: { data?: { message?: string } } };
      showToast('error', apiError.response?.data?.message || 'Lưu phản hồi thất bại');
    } finally {
      setSavingReply(false);
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((value) => (
        <Star
          key={value}
          className={`w-4 h-4 ${value <= rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Quản lý đánh giá</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm theo sản phẩm, người dùng, nội dung..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-9"
            />
          </div>
          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className="input w-48"
          >
            <option value="">Tất cả số sao</option>
            <option value="5">5 sao</option>
            <option value="4">4 sao</option>
            <option value="3">3 sao</option>
            <option value="2">2 sao</option>
            <option value="1">1 sao</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">ID</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Sản phẩm</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Người đánh giá</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Số sao</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nội dung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Phản hồi admin</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Ngày tạo</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Đang tải...</td>
                </tr>
              ) : filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Không có đánh giá nào</td>
                </tr>
              ) : (
                filteredReviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">#{review.id}</td>
                    <td className="px-4 py-3">{review.productName || `#${review.productId}`}</td>
                    <td className="px-4 py-3">{review.userName}</td>
                    <td className="px-4 py-3">{renderStars(review.rating)}</td>
                    <td className="px-4 py-3 max-w-[320px] truncate" title={review.comment || ''}>
                      {review.comment || 'Không có nội dung'}
                    </td>
                    <td className="px-4 py-3 max-w-[280px]">
                      {review.adminReply ? (
                        <div>
                          <p className="text-sm text-gray-800 line-clamp-2" title={review.adminReply}>{review.adminReply}</p>
                          {review.repliedAt && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(review.repliedAt).toLocaleString('vi-VN')}
                            </p>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">Chưa phản hồi</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(review.createdAt).toLocaleString('vi-VN')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openReplyModal(review)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                          title={review.adminReply ? 'Sửa phản hồi' : 'Trả lời phản hồi'}
                        >
                          <MessageSquareText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(review.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Xóa đánh giá"
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

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <p className="text-sm text-gray-500">Trang {currentPage + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
                disabled={currentPage === 0}
                className="btn btn-secondary disabled:opacity-50"
              >
                Trước
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(totalPages - 1, prev + 1))}
                disabled={currentPage >= totalPages - 1}
                className="btn btn-secondary disabled:opacity-50"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {replyingReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-xl">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">
                {replyingReview.adminReply ? 'Sửa phản hồi' : 'Trả lời đánh giá'} #{replyingReview.id}
              </h3>
              <button
                onClick={() => setReplyingReview(null)}
                className="p-1 text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div className="bg-gray-50 border rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Đánh giá của khách:</p>
                <p className="text-sm text-gray-800">{replyingReview.comment || 'Không có nội dung'}</p>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Nhập phản hồi của admin..."
                className="w-full min-h-[120px] border rounded-lg p-3 text-sm"
              />
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setReplyingReview(null)}
                className="btn btn-secondary"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveReply}
                disabled={savingReply}
                className="btn btn-primary"
              >
                {savingReply ? 'Đang lưu...' : 'Lưu phản hồi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviewsPage;
