import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import IDUpload from '../components/buyer/IDUpload';
import VerificationStatus from '../components/common/VerificationStatus';

function SellerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await API.get('/users/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto"></div>
      </div>
    );
  }

  const verificationStatus = profile?.verification?.status || 'pending';
  const hasSubmittedID = profile?.verification?.submitted_id;
  const isVerified = verificationStatus === 'approved';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">CARma</h1>
              <span className="ml-4 text-gray-600">Seller Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-gray-700">Welcome, {user?.name}!</span>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Status */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Seller Verification</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Your verification status:</p>
              <VerificationStatus status={verificationStatus} />
            </div>
          </div>

          {verificationStatus === 'pending' && hasSubmittedID && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">⏳ Verification in Progress</p>
              <p className="text-sm mt-1">Your ID is being reviewed. You'll be able to list vehicles once approved.</p>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Verified Seller!</p>
              <p className="text-sm mt-1">You can now list vehicles for sale.</p>
            </div>
          )}
        </div>

        {/* ID Upload */}
        {(!hasSubmittedID || verificationStatus === 'rejected') && (
          <IDUpload onUploadSuccess={loadProfile} />
        )}

        {/* Quick Actions */}
        {isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition">
              + Add New Vehicle
            </button>
            <p className="text-gray-500 text-sm mt-2">Coming soon...</p>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">My Vehicles</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Verified</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">0</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;