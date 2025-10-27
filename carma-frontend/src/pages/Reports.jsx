import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

function Reports() {
  const navigate = useNavigate();
  const [reports, setReports] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      const response = await API.get('/admin/reports');
      setReports(response.data.reports);
    } catch (error) {
      console.error('Load reports error:', error);
      alert('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reports...</p>
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
        <span className="ml-4 text-gray-600">Analytics & Reports</span>
      </div>
      <div className="flex items-center space-x-4">
        <button
          onClick={loadReports}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition"
        >
          🔄 Refresh
        </button>
        <button
          onClick={() => navigate('/profile')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
        >
          <span>👤</span>
          <span>Profile</span>
        </button>
        <button
          onClick={() => navigate('/admin')}
          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition"
        >
          ← Back
        </button>
      </div>
    </div>
  </div>
</nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* USER ANALYTICS */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">👥 User Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* User Verification Rate */}
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm font-medium opacity-90">User Verification Rate</p>
              <p className="text-5xl font-bold mt-2">{reports.users.verification_rate}%</p>
              <p className="text-sm mt-2 opacity-90">
                {reports.users.verified_users} of {reports.users.total_users} users verified
              </p>
            </div>

            {/* Total Users */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Total Users</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{reports.users.total_users}</p>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-600">👤 Buyers: {reports.users.total_buyers}</p>
                <p className="text-sm text-gray-600">🚗 Sellers: {reports.users.total_sellers}</p>
                <p className="text-sm text-gray-600">⚙️ Admins: {reports.users.total_admins}</p>
              </div>
            </div>

            {/* Verified Users */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Verified Users</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{reports.users.verified_users}</p>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${reports.users.verification_rate}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Pending Verifications */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Verification Status</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">⏳ Pending:</span>
                  <span className="text-lg font-bold text-yellow-600">{reports.users.pending_verifications}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Approved:</span>
                  <span className="text-lg font-bold text-green-600">{reports.users.verified_users}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">❌ Rejected:</span>
                  <span className="text-lg font-bold text-red-600">{reports.users.rejected_verifications}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* VEHICLE ANALYTICS */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🚗 Vehicle Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* VIN Verification Rate */}
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm font-medium opacity-90">VIN Verification Rate</p>
              <p className="text-5xl font-bold mt-2">{reports.vehicles.vin_verification_rate}%</p>
              <p className="text-sm mt-2 opacity-90">
                {reports.vin_verification.approved_vins} of {reports.vehicles.total_vehicles} vehicles
              </p>
            </div>

            {/* Total Vehicles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Total Vehicles</p>
              <p className="text-4xl font-bold text-gray-900 mt-2">{reports.vehicles.total_vehicles}</p>
              <div className="mt-4 space-y-1">
                <p className="text-sm text-gray-600">👁️ Visible: {reports.vehicles.visible_vehicles}</p>
                <p className="text-sm text-gray-600">🚫 Hidden: {reports.vehicles.hidden_vehicles}</p>
              </div>
            </div>

            {/* VIN Status */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">VIN Verification Status</p>
              <div className="mt-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">✅ Approved:</span>
                  <span className="text-lg font-bold text-green-600">{reports.vin_verification.approved_vins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">⏳ Pending:</span>
                  <span className="text-lg font-bold text-yellow-600">{reports.vin_verification.pending_vins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">❌ Rejected:</span>
                  <span className="text-lg font-bold text-red-600">{reports.vin_verification.rejected_vins}</span>
                </div>
              </div>
            </div>

            {/* Average Price */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Vehicle Pricing</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                ₱{parseFloat(reports.vehicles.avg_price).toLocaleString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">Average Price</p>
              <div className="mt-4 space-y-1">
                <p className="text-xs text-gray-600">Highest: ₱{parseFloat(reports.vehicles.max_price).toLocaleString()}</p>
                <p className="text-xs text-gray-600">Lowest: ₱{parseFloat(reports.vehicles.min_price).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI OCR PERFORMANCE */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🤖 AI OCR Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* OCR Success Rate */}
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
              <p className="text-sm font-medium opacity-90">OCR Success Rate</p>
              <p className="text-5xl font-bold mt-2">{reports.vin_verification.ocr_success_rate}%</p>
              <p className="text-sm mt-2 opacity-90">High-confidence detections</p>
            </div>

            {/* OCR Confidence Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium mb-4">OCR Confidence Levels</p>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>🟢 High</span>
                    <span className="font-bold">{reports.vin_verification.high_confidence_ocr}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ 
                      width: `${(reports.vin_verification.high_confidence_ocr / reports.vin_verification.total_vin_verifications * 100)}%` 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>🟡 Medium</span>
                    <span className="font-bold">{reports.vin_verification.medium_confidence_ocr}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-yellow-500 h-2 rounded-full" style={{ 
                      width: `${(reports.vin_verification.medium_confidence_ocr / reports.vin_verification.total_vin_verifications * 100)}%` 
                    }}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>🔴 Low</span>
                    <span className="font-bold">{reports.vin_verification.low_confidence_ocr}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ 
                      width: `${(reports.vin_verification.low_confidence_ocr / reports.vin_verification.total_vin_verifications * 100)}%` 
                    }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Total VIN Checks */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">Total VIN Checks</p>
              <p className="text-4xl font-bold text-indigo-600 mt-2">
                {reports.vin_verification.total_vin_verifications}
              </p>
              <p className="text-sm text-gray-600 mt-4">
                🤖 AI automatically verified {reports.vin_verification.high_confidence_ocr} VINs
              </p>
            </div>
          </div>
        </div>

        {/* TOP VEHICLE MAKES */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">🏆 Top Vehicle Brands</h2>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {reports.top_makes.map((make, index) => (
                <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-purple-600">{index + 1}</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{make.make}</p>
                  <p className="text-sm text-gray-600">{make.count} vehicles</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RECENT ACTIVITY */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">📈 Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">New Users (7 days)</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{reports.recent_activity.users_this_week}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">New Users (30 days)</p>
              <p className="text-4xl font-bold text-blue-600 mt-2">{reports.recent_activity.users_this_month}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">New Vehicles (7 days)</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{reports.recent_activity.vehicles_this_week}</p>
            </div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-gray-500 text-sm font-medium">New Vehicles (30 days)</p>
              <p className="text-4xl font-bold text-green-600 mt-2">{reports.recent_activity.vehicles_this_month}</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Reports;