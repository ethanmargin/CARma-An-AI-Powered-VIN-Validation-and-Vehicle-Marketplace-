import { useState, useEffect, useContext } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

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
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Vehicle management states
  const [vehicles, setVehicles] = useState([]);
  const [vehicleFilter, setVehicleFilter] = useState('all');
  const [showVehicles, setShowVehicles] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Load all vehicles
  const loadVehicles = async () => {
    try {
      const response = await API.get('/admin/all-vehicles');
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Load vehicles error:', error);
      alert('Failed to load vehicles');
    }
  };

  // Toggle vehicle visibility
  const handleToggleVisibility = async (vehicleId, currentStatus) => {
    const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible';
    const action = newStatus === 'hidden' ? 'hide' : 'unhide';
    
    if (!window.confirm(`Are you sure you want to ${action} this vehicle?`)) {
      return;
    }

    try {
      await API.put(`/admin/vehicles/${vehicleId}/visibility`, { status: newStatus });
      alert(`Vehicle ${action}d successfully!`);
      loadVehicles();
    } catch (error) {
      console.error('Toggle visibility error:', error);
      alert('Failed to update vehicle visibility');
    }
  };

  // Get filtered vehicles
  const getFilteredVehicles = () => {
    if (vehicleFilter === 'all') return vehicles;
    return vehicles.filter(v => v.visibility_status === vehicleFilter);
  };

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const statsResponse = await API.get('/admin/stats');
      setStats(statsResponse.data.stats);

      const verificationsResponse = await API.get('/admin/verifications/all');
      setVerifications(verificationsResponse.data.verifications);

      await loadVehicles();
    } catch (error) {
      console.error('Load dashboard error:', error);
      alert('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (userId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this user?`)) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await API.put('/admin/verify-user', { userId, status });
      console.log('Verification response:', response.data);
      alert(response.data.message || `User ${status} successfully!`);
      setSelectedUser(null);
      loadDashboardData();
    } catch (error) {
      console.error('Verification error:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update verification status';
      alert(errorMessage);
    } finally {
      setActionLoading(false);
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

  const filteredVerifications = getFilteredVerifications();

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
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-purple-600">CARma</h1>
              <span className="ml-4 text-gray-600">Admin Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <span>👤</span>
                <span>Profile</span>
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
          {filteredVerifications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No verifications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVerifications.map((verification) => (
                    <tr key={verification.user_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{verification.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{verification.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-700 capitalize">
                          {verification.id_type ? verification.id_type.replace('_', ' ') : 'Not specified'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          verification.status === 'approved' ? 'bg-green-100 text-green-800' :
                          verification.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          verification.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {verification.status || 'No status'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <button
                          onClick={() => setSelectedUser(verification)}
                          className="text-purple-600 hover:text-purple-900 font-medium"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button 
                onClick={() => navigate('/admin/vin-verifications')}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg font-medium transition text-left flex items-center"
              >
                <span className="mr-3">🤖</span>
                <div className="text-left">
                  <div className="font-semibold">VIN Verifications (OCR)</div>
                  <div className="text-xs opacity-90">Review and auto-verify VINs</div>
                </div>
              </button>

              <button 
                onClick={() => navigate('/profile')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium transition text-left flex items-center"
              >
                <span className="mr-3">👤</span>
                <div className="text-left">
                  <div className="font-semibold">My Profile</div>
                  <div className="text-xs opacity-90">Update settings & password</div>
                </div>
              </button>

              <button 
  onClick={() => navigate('/admin/reports')}
  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg font-medium transition text-left flex items-center"
>
  <span className="mr-3">📊</span>
  <div className="text-left">
    <div className="font-semibold">Analytics & Reports</div>
    <div className="text-xs opacity-90">View system metrics</div>
  </div>
</button>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg shadow-md p-6 text-white">
            <h3 className="text-lg font-bold mb-4">🤖 OCR Features</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Automatic VIN reading from images</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>AI-powered text recognition</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>70%+ similarity auto-approval</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Manual override available</span>
              </li>
            </ul>
            <div className="mt-4 pt-4 border-t border-white/30">
              <p className="text-sm opacity-90">
                💡 Use OCR to verify VINs faster and more accurately!
              </p>
            </div>
          </div>
        </div>

        {/* Vehicle Listings Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Vehicle Listings Management</h2>
            <button
              onClick={() => setShowVehicles(!showVehicles)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
            >
              {showVehicles ? '👁️ Hide Listings' : '🚗 View All Listings'}
            </button>
          </div>

          {showVehicles && (
            <>
              {/* Filter Tabs */}
              <div className="flex space-x-2 mb-6 border-b border-gray-200">
                <button
                  onClick={() => setVehicleFilter('all')}
                  className={`px-4 py-2 font-medium transition ${
                    vehicleFilter === 'all'
                      ? 'border-b-2 border-indigo-600 text-indigo-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  All ({vehicles.length})
                </button>
                <button
                  onClick={() => setVehicleFilter('visible')}
                  className={`px-4 py-2 font-medium transition ${
                    vehicleFilter === 'visible'
                      ? 'border-b-2 border-green-600 text-green-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Visible ({vehicles.filter(v => v.visibility_status === 'visible' || !v.visibility_status).length})
                </button>
                <button
                  onClick={() => setVehicleFilter('hidden')}
                  className={`px-4 py-2 font-medium transition ${
                    vehicleFilter === 'hidden'
                      ? 'border-b-2 border-red-600 text-red-600'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Hidden ({vehicles.filter(v => v.visibility_status === 'hidden').length})
                </button>
              </div>

              {/* Vehicle List */}
              {getFilteredVehicles().length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No vehicles found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Vehicle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Seller
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Price
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          VIN Status
                        </th>
                        {/* 🆕 NEW: Listed Date Column */}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Listed Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visibility
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {getFilteredVehicles().map((vehicle) => (
                        <tr key={vehicle.vehicle_id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {vehicle.image_path && (
                                <img 
                                  src={vehicle.image_path} 
                                  alt={`${vehicle.make} ${vehicle.model}`}
                                  className="w-16 h-16 object-cover rounded-lg mr-3"
                                />
                              )}
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                </div>
                                <div className="text-xs text-gray-500">VIN: {vehicle.vin_number}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{vehicle.seller_name}</div>
                            <div className="text-xs text-gray-500">{vehicle.seller_email}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-gray-900">
                              ₱{parseFloat(vehicle.price).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vehicle.vin_status === 'approved' ? 'bg-green-100 text-green-800' :
                              vehicle.vin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {vehicle.vin_status || 'pending'}
                            </span>
                          </td>
                          {/* 🆕 NEW: Listed Date Cell */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {vehicle.listed_at ? (
                              <div>
                                <div className="font-medium text-gray-900">
                                  {format(new Date(vehicle.listed_at), 'MMM d, yyyy')}
                                </div>
                                <div className="text-xs text-gray-400">
                                  {format(new Date(vehicle.listed_at), 'h:mm a')}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  {formatDistanceToNow(new Date(vehicle.listed_at), { addSuffix: true })}
                                </div>
                              </div>
                            ) : (
                              <span className="text-gray-400 italic">Not listed</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              vehicle.visibility_status === 'hidden' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {vehicle.visibility_status === 'hidden' ? '🚫 Hidden' : '👁️ Visible'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedVehicle(vehicle)}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg font-medium transition"
                              >
                                👁️ View
                              </button>
                              
                              <button
                                onClick={() => handleToggleVisibility(vehicle.vehicle_id, vehicle.visibility_status || 'visible')}
                                className={`px-3 py-2 rounded-lg font-medium transition ${
                                  vehicle.visibility_status === 'hidden'
                                    ? 'bg-green-600 hover:bg-green-700 text-white'
                                    : 'bg-red-600 hover:bg-red-700 text-white'
                                }`}
                              >
                                {vehicle.visibility_status === 'hidden' ? 'Unhide' : 'Hide'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* User ID Verification Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-2xl font-bold">ID Verification - {selectedUser.name}</h3>
              <button
                onClick={() => setSelectedUser(null)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
              >
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - User Info & ID Details */}
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">User Information</h4>
              <div className="space-y-2">
                <div>
                  <p className="text-sm text-gray-600">Name:</p>
                  <p className="font-semibold">{selectedUser.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email:</p>
                  <p className="font-semibold">{selectedUser.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Role:</p>
                  <p className="font-semibold capitalize">{selectedUser.role}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Verification Status:</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedUser.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedUser.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedUser.status || 'pending'}
                  </span>
                </div>
              </div>
            </div>

            {selectedUser.id_type && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-lg mb-2 text-blue-900">ID Type</h4>
                <p className="font-bold capitalize text-blue-800 text-lg">
                  {selectedUser.id_type.replace('_', ' ')}
                </p>
              </div>
            )}

            {selectedUser.id_data && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
                <h4 className="font-semibold text-lg mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Submitted ID Information
                </h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {(() => {
                    try {
                      const data = typeof selectedUser.id_data === 'string' 
                        ? JSON.parse(selectedUser.id_data) 
                        : selectedUser.id_data;

                      if (!data || Object.keys(data).length === 0) {
                        return <p className="text-gray-500 text-sm">No ID data available</p>;
                      }

                      return Object.entries(data).map(([key, value]) => {
                        const formattedKey = key
                          .split('_')
                          .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(' ');

                        return (
                          <div key={key} className="flex justify-between items-start border-b border-gray-200 pb-2 last:border-0">
                            <span className="text-sm text-gray-600 font-medium w-1/2">
                              {formattedKey}:
                            </span>
                            <span className="text-sm font-semibold text-gray-900 text-right w-1/2 break-words">
                              {value || 'Not provided'}
                            </span>
                          </div>
                        );
                      });
                    } catch (error) {
                      console.error('Error parsing ID data:', error, selectedUser.id_data);
                      return (
                        <div className="bg-red-50 p-3 rounded">
                          <p className="text-red-600 text-sm font-semibold">Error displaying ID data</p>
                          <p className="text-xs text-gray-600 mt-1">Raw: {JSON.stringify(selectedUser.id_data)}</p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            )}

            {!selectedUser.id_data && (
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ No ID details submitted. This might be an old upload before the ID form was added.
                </p>
              </div>
            )}
          </div>

          {/* Right Column - ID Image */}
          <div>
            <h4 className="font-semibold text-lg mb-3">Submitted ID Image</h4>
            {selectedUser.submitted_id ? (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                <img 
                  src={selectedUser.submitted_id}
                  alt="User ID"
                  className="w-full h-auto"
                  onError={(e) => {
                    console.error('Image load error:', e);
                    e.target.onerror = null;
                    e.target.src = 'https://via.placeholder.com/600x400?text=Image+Not+Found';
                  }}
                />
                <p className="text-xs text-gray-500 p-2 break-all">URL: {selectedUser.submitted_id}</p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                <p className="text-gray-500">No ID image submitted</p>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t mt-6">
          <button
            onClick={() => handleVerification(selectedUser.user_id, 'approved')}
            disabled={actionLoading || selectedUser.status === 'approved'}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {actionLoading ? 'Processing...' : '✓ Approve Verification'}
          </button>
          <button
            onClick={() => handleVerification(selectedUser.user_id, 'rejected')}
            disabled={actionLoading || selectedUser.status === 'rejected'}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {actionLoading ? 'Processing...' : '✗ Reject Verification'}
          </button>
        </div>
      </div>
    </div>
  )}

  {/* Vehicle Details Modal */}
  {selectedVehicle && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold">
            Vehicle Details - {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
          </h3>
          <button
            onClick={() => setSelectedVehicle(null)}
            className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        {/* 🆕 NEW: Listed Date Banner */}
        {selectedVehicle.listed_at && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center text-sm text-blue-800">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <div>
                <span className="font-semibold">
                  Listed on {format(new Date(selectedVehicle.listed_at), 'MMMM d, yyyy')} at {format(new Date(selectedVehicle.listed_at), 'h:mm a')}
                </span>
                <p className="text-xs text-blue-600 mt-1">
                  {formatDistanceToNow(new Date(selectedVehicle.listed_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Vehicle Info */}
          <div className="space-y-4">
            {/* Vehicle Image */}
            {selectedVehicle.image_path && (
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <img 
                  src={selectedVehicle.image_path} 
                  alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                  className="w-full h-auto"
                />
              </div>
            )}

            {/* Basic Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-lg mb-3">Vehicle Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Make:</span>
                  <span className="font-semibold">{selectedVehicle.make}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Model:</span>
                  <span className="font-semibold">{selectedVehicle.model}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Year:</span>
                  <span className="font-semibold">{selectedVehicle.year}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-green-600">
                    ₱{parseFloat(selectedVehicle.price).toLocaleString()}
                  </span>
                </div>
                {selectedVehicle.mileage && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Mileage:</span>
                    <span className="font-semibold">
                      {parseInt(selectedVehicle.mileage).toLocaleString()} km
                    </span>
                  </div>
                )}
                {selectedVehicle.transmission && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Transmission:</span>
                    <span className="font-semibold">{selectedVehicle.transmission}</span>
                  </div>
                )}
                {selectedVehicle.fuel_type && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Fuel Type:</span>
                    <span className="font-semibold">{selectedVehicle.fuel_type}</span>
                  </div>
                )}
                {selectedVehicle.location && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-semibold">{selectedVehicle.location}</span>
                  </div>
                )}
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Created:</span>
                  <span className="font-semibold">
                    {format(new Date(selectedVehicle.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                {/* 🆕 NEW: Listed Date Row */}
                {selectedVehicle.listed_at && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Listed:</span>
                    <span className="font-semibold text-blue-600">
                      {format(new Date(selectedVehicle.listed_at), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedVehicle.description && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-lg mb-2 text-blue-900">Description</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedVehicle.description}</p>
              </div>
            )}

            {/* Visibility Status */}
            <div className={`p-4 rounded-lg border-2 ${
              selectedVehicle.visibility_status === 'hidden'
                ? 'bg-red-50 border-red-300'
                : 'bg-green-50 border-green-300'
            }`}>
              <h4 className="font-semibold text-lg mb-2">Visibility Status</h4>
              <span className={`px-4 py-2 inline-flex text-sm font-bold rounded-full ${
                selectedVehicle.visibility_status === 'hidden' 
                  ? 'bg-red-200 text-red-800' 
                  : 'bg-green-200 text-green-800'
              }`}>
                {selectedVehicle.visibility_status === 'hidden' ? '🚫 Hidden from Buyers' : '👁️ Visible to Buyers'}
              </span>
            </div>
          </div>

          {/* Right Column - VIN & Seller Info */}
          <div className="space-y-4">
            {/* VIN Information */}
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <h4 className="font-semibold text-lg mb-3 text-purple-900">VIN Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">VIN Number:</span>
                  <span className="font-mono font-bold text-purple-800">
                    {selectedVehicle.vin_number}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">VIN Status:</span>
                  <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                    selectedVehicle.vin_status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedVehicle.vin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedVehicle.vin_status || 'pending'}
                  </span>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedVehicle(null);
                  navigate('/admin/vin-verifications');
                }}
                className="mt-4 w-full bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
              >
                🔍 View VIN Verification Details
              </button>
            </div>

            {/* Seller Information */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <h4 className="font-semibold text-lg mb-3">Seller Information</h4>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{selectedVehicle.seller_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Email:</span>
                  <span className="font-semibold text-sm">{selectedVehicle.seller_email}</span>
                </div>
              </div>
            </div>

            {/* Vehicle Images */}
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-300">
              <h4 className="font-semibold text-lg mb-3">Vehicle Image</h4>
              {selectedVehicle.image_path ? (
                <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                  <img 
                    src={selectedVehicle.image_path} 
                    alt="Vehicle"
                    className="w-full h-auto"
                  />
                  <p className="text-xs text-gray-500 p-2 break-all">
                    URL: {selectedVehicle.image_path}
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No vehicle image uploaded</p>
              )}
            </div>

            {/* Admin Actions */}
            <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-lg mb-3 text-indigo-900">Admin Actions</h4>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    handleToggleVisibility(
                      selectedVehicle.vehicle_id, 
                      selectedVehicle.visibility_status || 'visible'
                    );
                    setSelectedVehicle(null);
                  }}
                  className={`w-full px-4 py-3 rounded-lg font-semibold transition ${
                    selectedVehicle.visibility_status === 'hidden'
                      ? 'bg-green-600 hover:bg-green-700 text-white'
                      : 'bg-red-600 hover:bg-red-700 text-white'
                  }`}
                >
                  {selectedVehicle.visibility_status === 'hidden' 
                    ? '👁️ Unhide Vehicle' 
                    : '🚫 Hide Vehicle'}
                </button>
                
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-3 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )}
</div>

);
}

export default AdminDashboard;
