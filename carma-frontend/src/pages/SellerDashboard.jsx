import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import IDUpload from '../components/buyer/IDUpload';
import VerificationStatus from '../components/common/VerificationStatus';
import MyVehicles from '../components/seller/MyVehicles';
import AddVehicleForm from '../components/seller/AddVehicleForm';

function SellerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [refreshVehicles, setRefreshVehicles] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const profileRes = await API.get('/users/profile');
      setProfile(profileRes.data);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVehicleUpdate = () => {
    setShowAddForm(false);
    setRefreshVehicles(prev => prev + 1); // Trigger MyVehicles to reload
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
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">CARma</h1>
            </div>
            <div className="flex items-center space-x-4">
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
          <h2 className="text-2xl font-bold mb-4">Seller Dashboard</h2>
          
          {/* Welcome Message */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-3">
              <div className="bg-green-500 text-white rounded-full w-12 h-12 flex items-center justify-center text-xl font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-gray-600 text-sm">Welcome back,</p>
                <p className="text-gray-800 font-semibold text-lg">{user?.name}</p>
                <p className="text-gray-500 text-sm">{user?.email}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 mb-2">Your verification status:</p>
              <VerificationStatus status={verificationStatus} />
            </div>
          </div>

          {verificationStatus === 'pending' && hasSubmittedID && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">⏳ Verification in Progress</p>
              <p className="text-sm mt-1">Your ID has been submitted and is awaiting admin approval.</p>
            </div>
          )}

          {verificationStatus === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Verified Seller!</p>
              <p className="text-sm mt-1">You can now list vehicles for sale.</p>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✗ Verification Rejected</p>
              <p className="text-sm mt-1">Please upload a clearer image of your government-issued ID.</p>
            </div>
          )}
        </div>

        {/* ID Upload if needed */}
        {(!hasSubmittedID || verificationStatus === 'rejected') && (
          <IDUpload onUploadSuccess={loadData} />
        )}

        {/* Add Vehicle Section */}
        {isVerified && (
          <div className="mb-6">
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition shadow-md hover:shadow-lg"
            >
              {showAddForm ? '✕ Cancel' : '+ Add New Vehicle'}
            </button>
            
            {showAddForm && (
              <div className="mt-6">
                <AddVehicleForm onSuccess={handleVehicleUpdate} />
              </div>
            )}
          </div>
        )}

        {/* 🆕 MyVehicles Component - Replaces the manual vehicle display */}
        {isVerified && (
          <div className="mb-8">
            <MyVehicles key={refreshVehicles} />
          </div>
        )}

        {/* Statistics */}
        {isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">Quick Stats</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-2">Total Listings</h4>
                <p className="text-3xl font-bold text-blue-600">
                  View in "My Vehicles" above
                </p>
              </div>

              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <h4 className="text-lg font-semibold text-green-800 mb-2">Verified Vehicles</h4>
                <p className="text-sm text-green-600 mt-2">
                  Vehicles with approved VIN verification
                </p>
              </div>

              <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
                <h4 className="text-lg font-semibold text-yellow-800 mb-2">Pending Review</h4>
                <p className="text-sm text-yellow-600 mt-2">
                  Awaiting admin VIN approval
                </p>
              </div>
              <button
  onClick={() => navigate('/profile')}
  className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition text-left"
>
  <div className="flex items-center justify-between">
    <div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">My Profile 👤</h3>
      <p className="text-gray-600">Update your information and password</p>
    </div>
    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  </div>
</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;