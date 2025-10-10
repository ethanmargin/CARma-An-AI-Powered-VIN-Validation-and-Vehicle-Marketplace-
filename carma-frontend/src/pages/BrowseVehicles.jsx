import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import API from '../services/api';
import VehicleCard from '../components/common/VehicleCard';

function BrowseVehicles() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, verified, pending

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await API.get('/vehicles/all');
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getFilteredVehicles = () => {
    if (filter === 'all') return vehicles;
    if (filter === 'verified') return vehicles.filter(v => v.vin_status === 'approved');
    if (filter === 'pending') return vehicles.filter(v => v.vin_status === 'pending');
    return vehicles;
  };

  const filteredVehicles = getFilteredVehicles();

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
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-blue-600">CARma</h1>
              <div className="hidden md:flex space-x-4">
                <button
                  onClick={() => navigate('/buyer/dashboard')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate('/buyer/browse')}
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600"
                >
                  Browse Vehicles
                </button>
                <button
                  onClick={() => navigate('/buyer/bookmarks')}
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Saved (❤️)
                </button>
              </div>
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
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Browse Vehicles</h2>
          <p className="text-gray-600">Find your next car from verified sellers</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'all'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            All Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setFilter('verified')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'verified'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ✓ Verified ({vehicles.filter(v => v.vin_status === 'approved').length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 font-medium transition ${
              filter === 'pending'
                ? 'border-b-2 border-yellow-600 text-yellow-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            ⏳ Pending ({vehicles.filter(v => v.vin_status === 'pending').length})
          </button>
        </div>

        {/* Vehicles Grid */}
        {filteredVehicles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">No vehicles found</p>
            <p className="text-gray-400">Check back later for new listings!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard 
                key={vehicle.vehicle_id} 
                vehicle={vehicle}
                onBookmark={loadVehicles}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BrowseVehicles;