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
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Browse Vehicles
                </button>
                <button
                  onClick={() => navigate('/buyer/bookmarks')}
                  className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium border-b-2 border-blue-600"
                >
                  Saved (❤️)
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">Saved Vehicles ❤️</h2>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BookmarksPage;