import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './components/user/Toast';
import ScrollToTop from './components/user/ScrollToTop';
import Navbar from './components/user/Navbar';
import Footer from './components/user/Footer';
import ChatWidget from './components/user/ChatWidget';
import HomePage from './pages/user/HomePage';
import LoginPage from './pages/user/LoginPage';
import RegisterPage from './pages/user/RegisterPage';
import VerifyEmailPage from './pages/user/VerifyEmailPage';
import ProductListPage from './pages/user/ProductListPage';
import ProductDetailPage from './pages/user/ProductDetailPage';
import CartPage from './pages/user/CartPage';
import CheckoutPage from './pages/user/CheckoutPage';
import ProfilePage from './pages/user/ProfilePage';
import ChangePasswordPage from './pages/user/ChangePasswordPage';
import SupportPage from './pages/user/SupportPage';
import NotificationsPage from './pages/user/NotificationsPage';
import NotFoundPage from './pages/user/NotFoundPage';
import TermsPage from './pages/user/TermsPage';
import PrivacyPage from './pages/user/PrivacyPage';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProductsPage from './pages/admin/AdminProductsPage';
import AdminCategoriesPage from './pages/admin/AdminCategoriesPage';
import AdminOrdersPage from './pages/admin/AdminOrdersPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminCouponsPage from './pages/admin/AdminCouponsPage';
import AdminSupportPage from './pages/admin/AdminSupportPage';
import AdminNotificationsPage from './pages/admin/AdminNotificationsPage';
import AdminStatisticsPage from './pages/admin/AdminStatisticsPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import { useAuth } from './context/AuthContext';

const RequireAdmin: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Wrapper component to handle layout based on route
const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen flex flex-col">
      {!isAdminRoute && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/products" element={<ProductListPage />} />
          <Route path="/products/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/checkout/return" element={<CheckoutPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/profile/orders" element={<ProfilePage />} />
          <Route path="/profile/favorites" element={<ProfilePage />} />
          <Route path="/orders" element={<Navigate to="/profile/orders" replace />} />
          <Route path="/profile/change-password" element={<ChangePasswordPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={(
              <RequireAdmin>
                <AdminLayout />
              </RequireAdmin>
            )}
          >
            <Route index element={<AdminDashboard />} />
            <Route path="products" element={<AdminProductsPage />} />
            <Route path="products/new" element={<ProductFormPage />} />
            <Route path="products/:id/edit" element={<ProductFormPage />} />
            <Route path="categories" element={<AdminCategoriesPage />} />
            <Route path="orders" element={<AdminOrdersPage />} />
            <Route path="users" element={<AdminUsersPage />} />
            <Route path="coupons" element={<AdminCouponsPage />} />
            <Route path="notifications" element={<AdminNotificationsPage />} />
            <Route path="all-notifications" element={<AdminNotificationsPage />} />
            <Route path="support" element={<AdminSupportPage />} />
            <Route path="reviews" element={<AdminReviewsPage />} />
            <Route path="chat" element={<AdminChatPage />} />
            <Route path="statistics" element={<AdminStatisticsPage />} />
          </Route>

          {/* 404 */}
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/404" />} />
        </Routes>
      </div>
      {!isAdminRoute && <Footer />}
      {!isAdminRoute && <ChatWidget />}
    </div>
  );
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CartProvider>
          <Router>
            <ScrollToTop />
            <AppContent />
          </Router>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;
