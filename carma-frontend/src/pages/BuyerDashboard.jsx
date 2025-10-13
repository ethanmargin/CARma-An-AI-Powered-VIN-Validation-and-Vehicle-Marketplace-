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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      <nav className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-blue-600">CARma</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/buyer/dashboard')}
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600"
              >
                Dashboard
              </button>
              <button
                onClick={() => navigate('/buyer/browse')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Browse Vehicles
              </button>
              <button
                onClick={() => navigate('/buyer/bookmarks')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
              >
                Saved (❤️)
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition ml-4"
              >
                Logout
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none p-2"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
              <div className="flex flex-col space-y-2 pt-2">
                <button
                  onClick={() => { navigate('/buyer/dashboard'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                >
                  <span className="mr-2">📊</span>
                  Dashboard
                </button>
                <button
                  onClick={() => { navigate('/buyer/browse'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-2">🚗</span>
                  Browse Vehicles
                </button>
                <button
                  onClick={() => { navigate('/buyer/bookmarks'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-2">❤️</span>
                  Saved
                </button>
                <button
                  onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <span className="mr-2">🚪</span>
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Verification Status Card */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold mb-4">Account Verification</h2>
          <h3 className="text-2xl font-bold mb-4">Buyer Dashboard</h3>
          
          {/* Welcome Message */}
          <div className="mb-4">
            <p className="text-gray-600 text-lg">Welcome, <span className="font-semibold text-gray-800">{user?.name}!</span></p>
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
              <p className="font-semibold">✓ Account Verified!</p>
              <p className="text-sm mt-1">You can now browse all available vehicles.</p>
            </div>
          )}

          {verificationStatus === 'rejected' && (
            <div className="mt-4 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✗ Verification Rejected</p>
              <p className="text-sm mt-1">Please upload a clearer image of your government-issued ID.</p>
            </div>
          )}
        </div>

        {/* ID Upload Section */}
        {(!hasSubmittedID || verificationStatus === 'rejected') && (
          <IDUpload onUploadSuccess={loadProfile} />
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <button
            onClick={() => navigate('/buyer/browse')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Browse Vehicles 🚗</h3>
                <p className="text-gray-600">Find your next car from verified sellers</p>
              </div>
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>

          <button
            onClick={() => navigate('/buyer/bookmarks')}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Saved Vehicles ❤️</h3>
                <p className="text-gray-600">View your bookmarked vehicles</p>
              </div>
              <svg className="w-8 h-8 text-red-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">Available Vehicles</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
            <p className="text-sm text-blue-600 mt-2">Browse to see listings</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Verified Vehicles</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
            <p className="text-sm text-green-600 mt-2">With VIN verification</p>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-800 mb-2">Your Status</h3>
            <p className="text-lg font-medium text-purple-600 capitalize">{verificationStatus}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuyerDashboard;