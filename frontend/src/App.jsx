import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import VendorDashboard from './pages/VendorDashboard';
import WholesalerDashboard from './pages/WholesalerDashboard';
import RetailerDashboard from './pages/RetailerDashboard';
import ConsumerShop from './pages/ConsumerShop';

const ROLE_HOME = {
  admin: '/admin', vendor: '/vendor', wholesaler: '/wholesaler', retailer: '/retailer', consumer: '/shop'
};

function Root() {
  const { auth } = useAuth();
  if (auth) return <Navigate to={ROLE_HOME[auth.user.role]} replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Root />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/vendor" element={<ProtectedRoute role="vendor"><VendorDashboard /></ProtectedRoute>} />
      <Route path="/wholesaler" element={<ProtectedRoute role="wholesaler"><WholesalerDashboard /></ProtectedRoute>} />
      <Route path="/retailer" element={<ProtectedRoute role="retailer"><RetailerDashboard /></ProtectedRoute>} />
      <Route path="/shop" element={<ProtectedRoute role="consumer"><ConsumerShop /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
