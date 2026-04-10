import axios from 'axios';

const API_URL = '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const requestUrl = String(error.config?.url || '');
    const isLoginRequest = requestUrl.includes('/auth/login');
    const isOnLoginPage = window.location.pathname === '/login';

    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem('token');
      if (!isOnLoginPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  register: (data: { fullName: string; email: string; phone: string; password: string; confirmPassword: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  sendVerification: (email: string) =>
    api.post('/auth/send-verification', { email }),
  verifyCode: (email: string, code: string) =>
    api.post('/auth/verify', { email, code }),
};

// Products API
export const productAPI = {
  getAll: (params?: { page?: number; size?: number; sortBy?: string; sortDir?: string }) =>
    api.get('/products', { params }),
  getById: (id: number) => api.get(`/products/${id}`),
  getByCategory: (categoryId: number, params?: { page?: number; size?: number }) =>
    api.get(`/products/category/${categoryId}`, { params }),
  getFeatured: (params?: { page?: number; size?: number }) =>
    api.get('/products/featured', { params }),
  getNew: (params?: { page?: number; size?: number }) =>
    api.get('/products/new', { params }),
  search: (keyword: string, params?: { page?: number; size?: number }) =>
    api.get('/products/search', { params: { keyword, ...params } }),
  getTopSelling: (limit?: number) => api.get('/products/top-selling', { params: { limit } }),
  getTopRated: (limit?: number) => api.get('/products/top-rated', { params: { limit } }),
  getRecommended: (userId?: number) => api.get('/products/recommended', { params: { userId } }),
};

// Admin Products API
export const adminProductAPI = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/admin/products', { params }),
  getById: (id: number) => api.get(`/admin/products/${id}`),
  getByCategory: (categoryId: number, params?: { page?: number; size?: number }) =>
    api.get(`/admin/products/category/${categoryId}`, { params }),
  search: (keyword: string, params?: { page?: number; size?: number }) =>
    api.get('/admin/products/search', { params: { keyword, ...params } }),
  create: (data: any) => api.post('/admin/products', data),
  update: (id: number, data: any) => api.put(`/admin/products/${id}`, data),
  delete: (id: number) => api.delete(`/admin/products/${id}`),
  uploadImage: (formData: FormData) =>
    api.post('/admin/products/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

// Categories API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id: number) => api.get(`/categories/${id}`),
  create: (data: any) => api.post('/categories', data),
  update: (id: number, data: any) => api.put(`/categories/${id}`, data),
  delete: (id: number) => api.delete(`/categories/${id}`),
};

// Admin Categories API
export const adminCategoryAPI = {
  getAll: () => api.get('/admin/categories'),
  getById: (id: number) => api.get(`/admin/categories/${id}`),
  create: (data: any) => api.post('/admin/categories', data),
  update: (id: number, data: any) => api.put(`/admin/categories/${id}`, data),
  delete: (id: number) => api.delete(`/admin/categories/${id}`),
  uploadImage: (formData: FormData) => api.post('/admin/categories/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Cart API
export const cartAPI = {
  getItems: () => api.get('/cart'),
  addItem: (productId: number, quantity?: number, variantId?: number) =>
    api.post('/cart/add', null, { params: { productId, quantity, variantId } }),
  updateItem: (cartItemId: number, quantity: number) =>
    api.put('/cart/update', null, { params: { cartItemId, quantity } }),
  removeItem: (cartItemId: number) =>
    api.delete('/cart/remove', { params: { cartItemId } }),
  clear: () => api.delete('/cart/clear'),
  getTotal: () => api.get('/cart/total'),
};

// Orders API
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getById: (id: number) => api.get(`/orders/${id}`),
  getMyOrders: () => api.get('/orders/my-orders'),
  getByUser: () => api.get('/orders/my-orders'),
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/orders', { params }),
  updateStatus: (id: number, status: string) =>
    api.put(`/orders/${id}/status`, null, { params: { status } }),
  cancel: (id: number) => api.put(`/orders/${id}/cancel`),
  createVNPayUrl: (id: number) => api.post(`/orders/${id}/vnpay`),
};

// Admin Orders API
export const adminOrderAPI = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/admin/orders', { params }),
  getById: (id: number) => api.get(`/admin/orders/${id}`),
  update: (id: number, data: any) => api.put(`/admin/orders/${id}`, data),
  delete: (id: number) => api.delete(`/admin/orders/${id}`),
  updateStatus: (id: number, status: string) =>
    api.put(`/admin/orders/${id}/status`, null, { params: { status } }),
  cancel: (id: number) => api.put(`/admin/orders/${id}/cancel`),
  createVNPayUrl: (id: number) => api.post(`/admin/orders/${id}/vnpay`),
  getShippingSettings: () => api.get('/admin/orders/shipping-settings'),
  updateShippingSettings: (data: { baseFee: number; freeShippingThreshold?: number; freeShippingEnabled: boolean }) =>
    api.put('/admin/orders/shipping-settings', data),
};

export const shippingSettingsAPI = {
  getCurrent: () => api.get('/shipping-settings'),
};

// Reviews API
export const reviewAPI = {
  create: (productId: number, data: { rating: number; comment?: string }) =>
    api.post(`/reviews/product/${productId}`, data),
  getByProduct: (productId: number, params?: { page?: number; size?: number }) =>
    api.get(`/reviews/product/${productId}`, { params }),
  delete: (id: number) => api.delete(`/reviews/${id}`),
};

// Admin Reviews API
export const adminReviewAPI = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/admin/reviews', { params }),
  reply: (id: number, reply: string) =>
    api.put(`/admin/reviews/${id}/reply`, { reply }),
  delete: (id: number) => api.delete(`/admin/reviews/${id}`),
};

// Users API
export const userAPI = {
  getCurrentUser: () => api.get('/users/me'),
  updateProfile: (data: any) => api.put('/users/me', data),
  changePassword: (data: { oldPassword: string; newPassword: string; confirmPassword: string }) =>
    api.put('/users/me/password', data),
  uploadAvatar: (formData: FormData) =>
    api.post('/users/me/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  getAll: (params?: { page?: number; size?: number }) => api.get('/users', { params }),
  getById: (id: number) => api.get(`/users/${id}`),
  deactivate: (id: number) => api.put(`/users/${id}/deactivate`),
  activate: (id: number) => api.put(`/users/${id}/activate`),
  updateStatus: (id: number, isActive: boolean) => api.put(`/users/${id}/status`, { isActive }),
  delete: (id: number) => api.delete(`/users/${id}`),
};

// Admin Users API
export const adminUserAPI = {
  getAll: (params?: { page?: number; size?: number }) => api.get('/admin/users', { params }),
  getById: (id: number) => api.get(`/admin/users/${id}`),
  create: (data: { email: string; password: string; fullName: string; phone?: string; role: string }) =>
    api.post('/admin/users', data),
  update: (id: number, data: { fullName: string; email: string; phone?: string; address?: string; role?: string; password?: string }) =>
    api.put(`/admin/users/${id}`, data),
  deactivate: (id: number) => api.put(`/admin/users/${id}/deactivate`),
  activate: (id: number) => api.put(`/admin/users/${id}/activate`),
  delete: (id: number) => api.delete(`/admin/users/${id}`),
};

// Coupons API
export const couponAPI = {
  getAll: () => api.get('/coupons'),
  validate: (code: string, orderAmount: number, productIds?: number[]) =>
    api.get('/coupons/validate', {
      params: { code, orderAmount, ...(productIds && productIds.length ? { productIds } : {}) },
      paramsSerializer: { indexes: null },
    }),
  create: (data: any) => api.post('/coupons', data),
  update: (id: number, data: any) => api.put(`/coupons/${id}`, data),
  delete: (id: number) => api.delete(`/coupons/${id}`),
};

// Admin Coupons API
export const adminCouponAPI = {
  getAll: () => api.get('/admin/coupons'),
  getById: (id: number) => api.get(`/admin/coupons/${id}`),
  create: (data: any) => api.post('/admin/coupons', data),
  update: (id: number, data: any) => api.put(`/admin/coupons/${id}`, data),
  delete: (id: number) => api.delete(`/admin/coupons/${id}`),
};

// Support API
export const supportAPI = {
  getAll: () => api.get('/support'),
  getById: (id: number) => api.get(`/support/${id}`),
  create: (data: any) => api.post('/support/tickets', data),
  reply: (id: number, reply: string) => api.put(`/support/${id}/reply`, { reply }),
  close: (id: number) => api.put(`/support/${id}/close`),
};

// Admin Support API
export const adminSupportAPI = {
  getAll: (params?: { page?: number; size?: number }) =>
    api.get('/admin/support/tickets', { params }),
  getById: (id: number) => api.get(`/admin/support/tickets/${id}`),
  getMessages: (ticketId: number, params?: { page?: number; size?: number }) =>
    api.get(`/admin/support/tickets/${ticketId}/messages`, { params }),
  reply: (ticketId: number, message: string) =>
    api.post(`/admin/support/tickets/${ticketId}/messages`, { message }),
  close: (ticketId: number) =>
    api.put(`/admin/support/tickets/${ticketId}/status`, { status: 'RESOLVED' }),
  updateStatus: (ticketId: number, status: string) =>
    api.put(`/admin/support/tickets/${ticketId}/status`, { status }),
  getStats: () => api.get('/admin/support/stats'),
};

// Admin API
export const adminAPI = {
  getStats: () => api.get('/admin/dashboard/stats'),
  getTodayRevenue: () => api.get('/admin/dashboard/revenue/today'),
  getRevenueByDate: (date: string) =>
    api.get('/admin/dashboard/revenue/date', { params: { date } }),
  getRevenueByRange: (startDate: string, endDate: string) =>
    api.get('/admin/dashboard/revenue/range', { params: { startDate, endDate } }),
  getRevenueByMonth: (year: number, month: number) =>
    api.get('/admin/dashboard/revenue/month', { params: { year, month } }),
  getRevenueByYear: (year: number) =>
    api.get('/admin/dashboard/revenue/year', { params: { year } }),
  getTopProducts: (limit?: number) =>
    api.get('/admin/dashboard/top-products', { params: { limit } }),
};

// AI API
export const aiAPI = {
  chat: (message: string, userId?: number) =>
    api.post('/ai/chat', { message }, { params: { userId } }).catch(err => {
      console.error('AI API error:', err);
      throw err;
    }),
};

// Favorites API
export const favoriteAPI = {
  getAll: () => api.get('/favorites'),
  add: (productId: number) => api.post(`/favorites/${productId}`),
  remove: (productId: number) => api.delete(`/favorites/${productId}`),
  check: (productId: number) => api.get(`/favorites/check/${productId}`),
};

// Notifications API
export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  getUnreadCount: () => api.get('/notifications/unread-count'),
  markAsRead: (id: number) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
};

// Admin Notifications API
export const adminNotificationAPI = {
  getAll: (userId?: number) => api.get('/admin/notifications', { params: { userId } }),
  send: (data: { userId: number; title: string; content: string; type: string }) =>
    api.post('/admin/notifications', data),
  broadcast: (data: { title: string; content: string; type: string }) =>
    api.post('/admin/notifications/broadcast', data),
};

// Chat API
export const chatAPI = {
  getConversations: (params?: { page?: number; size?: number; status?: string; userId?: number }) =>
    api.get('/chat/conversations', { params }),
  getMessages: (conversationId: number, params?: { page?: number; size?: number }) =>
    api.get(`/chat/conversations/${conversationId}/messages`, { params }),
  sendMessage: (conversationId: number, data: { senderId: number; content: string }) =>
    api.post(`/chat/conversations/${conversationId}/messages`, data),
  startConversation: (userId: number) =>
    api.post('/chat/start', null, { params: { userId } }),
};
