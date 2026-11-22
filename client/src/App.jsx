import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

import Header from './components/layout/Header'
import Footer from './components/layout/Footer'
import AdminLayout from './components/layout/AdminLayout'
import AppErrorBoundary from './components/AppErrorBoundary'
import HomePage from './pages/HomePage'
import CataloguePage from './pages/CataloguePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import { LoginPage, RegisterPage } from './pages/AuthPages'
import { MyOrdersPage, OrderDetailPage, OrderSuccessPage, WishlistPage } from './pages/OrderPages'
import { AccountPage, VerifyEmailPage } from './pages/ProfilePages'
import NotFoundPage from './pages/NotFoundPage'
import { AdminDashboardPage, AdminOrdersPage, AdminPaymentApprovalsPage, AdminProductsPage } from './pages/admin/AdminPages'

function ProtectedRoute({ adminOnly = false }) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (adminOnly && user.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-surface">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  )
}

function AdminRoute() {
  return <AdminLayout><Outlet /></AdminLayout>
}

export default function App() {
  return (
    <BrowserRouter>
      <AppErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: '"Plus Jakarta Sans", sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#2F6046', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#A45B3E', secondary: '#fff' },
            },
          }}
        />
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<CataloguePage />} />
            <Route path="/product/:slug" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-success/:orderId" element={<OrderSuccessPage />} />
              <Route path="/account/orders" element={<MyOrdersPage />} />
              <Route path="/account/orders/:orderId" element={<OrderDetailPage />} />
              <Route path="/account/wishlist" element={<WishlistPage />} />
              <Route path="/account" element={<AccountPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminRoute />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="products" element={<AdminProductsPage />} />
              <Route path="orders" element={<AdminOrdersPage />} />
              <Route path="payments" element={<AdminPaymentApprovalsPage />} />
            </Route>
          </Route>
        </Routes>
      </AppErrorBoundary>
    </BrowserRouter>
  )
}
