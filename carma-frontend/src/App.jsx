import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import BuyerDashboard from './pages/BuyerDashboard';
import SellerDashboard from './pages/SellerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import BrowseVehicles from './pages/BrowseVehicles';
import BookmarksPage from './pages/BookmarksPage';
import ProfilePage from './pages/ProfilePage';
import VINVerificationList from './components/admin/VINVerificationList';
import Reports from './pages/Reports';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - Buyer */}
          <Route 
            path="/buyer/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BuyerDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer/browse" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BrowseVehicles />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/buyer/bookmarks" 
            element={
              <ProtectedRoute allowedRoles={['buyer']}>
                <BookmarksPage />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Seller */}
          <Route 
            path="/seller/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['seller']}>
                <SellerDashboard />
              </ProtectedRoute>
            } 
          />

          {/* Protected Routes - Admin */}
          <Route 
            path="/admin/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />

          {/* 🆕 NEW: VIN Verifications Route */}
<Route
  path="/admin/vin-verifications"
  element={
    <ProtectedRoute allowedRoles={['admin']}>
      <VINVerificationList />
    </ProtectedRoute>
  }
/>
<Route path="/admin/reports" element={<Reports />} />

          {/* Default Route */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/login" replace />} />
          {/* Profile Route - Available to all authenticated users */}
<Route
  path="/profile"
  element={
    <ProtectedRoute allowedRoles={['admin', 'seller', 'buyer']}>
      <ProfilePage />
    </ProtectedRoute>
  }
/>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;