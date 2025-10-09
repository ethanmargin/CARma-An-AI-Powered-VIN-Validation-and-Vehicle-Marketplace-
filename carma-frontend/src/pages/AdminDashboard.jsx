import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import VerificationList from '../components/admin/VerificationList';

function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    verifiedUsers: 0,
    pendingVerifications: 0,
    totalVehicles: 0,
    verifiedVehicles: 0
  });
  
  const [verifications, setVerifications] = useState([]);
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load statistics
      const statsResponse = await API.get('/admin/stats');
      setStats(statsResponse.data.stats);

      // Load verifications
      const verificationsResponse = await API.get('/admin/verifications/all');
      setVerifications(verificationsResponse.data.verifications);
    } catch (error) {
      console.error('Load dashboard error:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFilteredVerifications = () => {
    if (filter === 'all') {
      return verifications;
    }
    return verifications.filter(v => v.status === filter);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">CARma</h1>
              <span className="ml-4 text-gray-600">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalUsers}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Verified</p>
                <p className="text-3xl font-bold text-green-600 mt-1">{stats.verifiedUsers}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending</p>
                <p className="text-3xl font-bold text-yellow-600 mt-1">{stats.pendingVerifications}</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Vehicles</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">{stats.totalVehicles}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Verified Cars</p>
                <p className="text-3xl font-bold text-indigo-600 mt-1">{stats.verifiedVehicles}</p>
              </div>
              <div className="bg-indigo-100 rounded-full p-3">
                <svg className="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Management Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">User Verifications</h2>
            <button
              onClick={loadDashboardData}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-6 border-b border-gray-200">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 font-medium transition ${
                filter === 'all'
                  ? 'border-b-2 border-purple-600 text-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              All ({verifications.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 font-medium transition ${
                filter === 'pending'
                  ? 'border-b-2 border-yellow-600 text-yellow-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Pending ({verifications.filter(v => v.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-2 font-medium transition ${
                filter === 'approved'
                  ? 'border-b-2 border-green-600 text-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Approved ({verifications.filter(v => v.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 font-medium transition ${
                filter === 'rejected'
                  ? 'border-b-2 border-red-600 text-red-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Rejected ({verifications.filter(v => v.status === 'rejected').length})
            </button>
          </div>

          {/* Verification List */}
          <VerificationList 
            verifications={getFilteredVerifications()} 
            onUpdate={loadDashboardData}
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition text-left">
                📊 Generate Reports
              </button>
              <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition text-left">
                🚗 Review Vehicle VINs
              </button>
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition text-left">
                📋 View System Logs
              </button>
            </div>
            <p className="text-gray-500 text-sm mt-4">More features coming soon...</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-bold mb-4">Admin Tips</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Review pending verifications regularly</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Check ID documents carefully before approving</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Monitor flagged VIN numbers</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Generate weekly reports for tracking</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;