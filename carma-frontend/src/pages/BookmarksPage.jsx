import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import VehicleCard from '../components/common/VehicleCard';

function BookmarksPage() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = async () => {
    try {
      const response = await API.get('/vehicles/my/bookmarks');
      setBookmarks(response.data.bookmarks);
    } catch (error) {
      console.error('Load bookmarks error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
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
              <h1 className="text-2xl font-bold text-blue-600">CARma</h1>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <button
                onClick={() => navigate('/buyer/dashboard')}
                className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
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
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600"
              >
                Saved
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center space-x-2"
              >
                <span>👤</span>
                <span>Profile</span>
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 focus:outline-none p-2"
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden pb-4 border-t border-gray-200 mt-2">
              <div className="flex flex-col space-y-2 pt-2">
                <button
                  onClick={() => { navigate('/buyer/dashboard'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
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
                  className="text-left px-4 py-3 rounded-md text-sm font-medium bg-blue-50 text-blue-600 border-l-4 border-blue-600"
                >
                  <span className="mr-2">❤️</span>
                  Saved
                </button>
                <button
                  onClick={() => { navigate('/profile'); setMobileMenuOpen(false); }}
                  className="text-left px-4 py-3 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  <span className="mr-2">👤</span>
                  My Profile
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Saved Vehicles</h2>
          <p className="text-gray-600">Your bookmarked vehicles</p>
        </div>

        {bookmarks.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No saved vehicles yet</p>
            <button
              onClick={() => navigate('/buyer/browse')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Browse Vehicles
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((vehicle) => (
              <VehicleCard 
                key={vehicle.vehicle_id} 
                vehicle={vehicle}
                onBookmark={loadBookmarks}
                onViewDetails={handleViewDetails}
              />
            ))}
          </div>
        )}
      </div>

      {/* Vehicle Details Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-800">
                  {selectedVehicle.year} {selectedVehicle.make} {selectedVehicle.model}
                </h3>
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Vehicle Image */}
                  {selectedVehicle.image_path ? (
                    <img
                      src={selectedVehicle.image_path}
                      alt={`${selectedVehicle.make} ${selectedVehicle.model}`}
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-400">No image available</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <p className="text-sm text-gray-600 mb-1">Price</p>
                    <p className="text-3xl font-bold text-green-600">
                      ₱{parseFloat(selectedVehicle.price).toLocaleString()}
                    </p>
                  </div>

                  {/* VIN Status */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <p className="text-sm text-gray-600 mb-2">VIN Verification Status</p>
                    <span className={`px-3 py-1 inline-flex text-xs font-semibold rounded-full ${
                      selectedVehicle.vin_status === 'approved' ? 'bg-green-100 text-green-800' :
                      selectedVehicle.vin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedVehicle.vin_status === 'approved' ? '✓ Verified VIN' :
                       selectedVehicle.vin_status === 'rejected' ? '✗ VIN Rejected' :
                       '⏳ VIN Pending Verification'}
                    </span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Specifications */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-lg mb-3">Specifications</h4>
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
                      {selectedVehicle.location && (
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-gray-600">Location:</span>
                          <span className="font-semibold">{selectedVehicle.location}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-600">VIN:</span>
                        <span className="font-mono text-xs">{selectedVehicle.vin_number}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selectedVehicle.description && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-lg mb-2">Description</h4>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">
                        {selectedVehicle.description}
                      </p>
                    </div>
                  )}

                  {/* Seller Information */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <h4 className="font-semibold text-lg mb-3">Seller Information</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-semibold">{selectedVehicle.seller_name}</span>
                      </div>
                      {selectedVehicle.seller_email && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-semibold text-sm break-all">{selectedVehicle.seller_email}</span>
                        </div>
                      )}
                      {selectedVehicle.seller_mobile && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-semibold">{selectedVehicle.seller_mobile}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Close Button */}
              <div className="mt-6 pt-6 border-t">
                <button
                  onClick={() => setSelectedVehicle(null)}
                  className="w-full bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookmarksPage;