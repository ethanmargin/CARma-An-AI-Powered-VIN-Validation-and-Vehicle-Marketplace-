import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import IDUpload from '../components/buyer/IDUpload';
import VerificationStatus from '../components/common/VerificationStatus';
import AddVehicleForm from '../components/seller/AddVehicleForm';

function SellerDashboard() {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [profileRes, vehiclesRes] = await Promise.all([
        API.get('/users/profile'),
        API.get('/vehicles/my/vehicles')
      ]);
      setProfile(profileRes.data);
      setVehicles(vehiclesRes.data.vehicles);
    } catch (error) {
      console.error('Load data error:', error);
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

          {verificationStatus === 'approved' && (
            <div className="mt-4 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
              <p className="font-semibold">✓ Verified Seller!</p>
              <p className="text-sm mt-1">You can now list vehicles for sale.</p>
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
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
            >
              {showAddForm ? '− Cancel' : '+ Add New Vehicle'}
            </button>
            
            {showAddForm && (
              <div className="mt-6">
                <AddVehicleForm onSuccess={() => {
                  setShowAddForm(false);
                  loadData();
                }} />
              </div>
            )}
          </div>
        )}

        {/* My Vehicles */}
        {isVerified && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">My Vehicles</h3>
            
            {vehicles.length === 0 ? (
              <p className="text-gray-500">No vehicles listed yet. Add your first vehicle above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {vehicles.map((vehicle) => (
                  <div key={vehicle.vehicle_id} className="border rounded-lg p-4">
                    <h4 className="font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</h4>
                    <p className="text-green-600 font-semibold">${parseFloat(vehicle.price).toLocaleString()}</p>
                    <p className="text-sm text-gray-500">VIN: {vehicle.vin_number}</p>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                      vehicle.vin_status === 'approved' ? 'bg-green-100 text-green-800' :
                      vehicle.vin_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {vehicle.vin_status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-800 mb-2">My Vehicles</h3>
            <p className="text-3xl font-bold text-blue-600">{vehicles.length}</p>
          </div>

          <div className="bg-green-50 p-6 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Verified</h3>
            <p className="text-3xl font-bold text-green-600">
              {vehicles.filter(v => v.vin_status === 'approved').length}
            </p>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Pending</h3>
            <p className="text-3xl font-bold text-yellow-600">
              {vehicles.filter(v => v.vin_status === 'pending').length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SellerDashboard;