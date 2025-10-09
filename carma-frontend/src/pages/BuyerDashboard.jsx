import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import IDUpload from '../components/buyer/IDUpload';
import VerificationStatus from '../components/common/VerificationStatus';

function BuyerDashboard() {
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
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const verificationStatus = profile?.verification?.status || 'pending';
  const hasSubmittedID = profile?.verification?.submitted_id;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">CARma</h1>
              <span className="ml-4 text-gray-600">Buyer Dashboard</span>
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
        {/* Verification Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Your verification status:</p>
              <VerificationStatus status={verificationStatus} />
            </div>
          </div>

          {/* Status Messages */}
          {verificationStatus === 'pending' && hasSubmittedID && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">⏳ Verification in Progress</p>
              <p className="text-sm mt-1">Your ID has been submitted and is awaiting admin approval. This usually takes 1-2 business days.</p>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Account Verified!</p>
              <p className="text-sm mt-1">Your account has been verified. You can now browse all available vehicles.</p>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✗ Verification Rejected</p>
              <p className="text-sm mt-1">Unfortunately, your ID could not be verified. Please upload a clearer image of your government-issued ID.</p>
            </div>
          )}
        </div>

        {/* ID Upload Section */}
        {(!hasSubmittedID || verificationStatus === 'rejected') && (
          <IDUpload onUploadSuccess={loadProfile} />
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Available Vehicles</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-blue-600 mt-2">Coming soon...</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Verified Vehicles</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-green-600 mt-2">Coming soon...</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Your Status</h3>
            <p className="text-lg font-medium text-purple-600 capitalize">{verificationStatus}</p>
          </div>
        </div>

        {/* Info Section */}
        {!hasSubmittedID && (
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">📋 Why do I need to verify?</h3>
            <p className="text-blue-700 mb-4">
              Account verification helps us maintain a secure and trustworthy platform for buying and selling vehicles.
            </p>
            <ul className="list-disc list-inside text-blue-700 space-y-1">
              <li>Prevents fraudulent activities</li>
              <li>Ensures buyer authenticity</li>
              <li>Provides peace of mind to sellers</li>
              <li>Quick verification process (1-2 business days)</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyerDashboard;