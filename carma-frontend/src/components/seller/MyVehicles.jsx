import { useState, useEffect } from 'react';
import API from '../../services/api';
import VerificationStatus from '../common/VerificationStatus';
import EditVehicleModal from './EditVehicleModal';
import { format, formatDistanceToNow } from 'date-fns';


function MyVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingVehicle, setEditingVehicle] = useState(null);

  useEffect(() => {
    loadVehicles();
  }, []);

  const loadVehicles = async () => {
    try {
      const response = await API.get('/vehicles/my');
      setVehicles(response.data.vehicles);
    } catch (error) {
      console.error('Load vehicles error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm('Are you sure you want to delete this vehicle?')) {
      return;
    }

    try {
      await API.delete(`/vehicles/${vehicleId}`);
      loadVehicles(); // Reload list
    } catch (error) {
      console.error('Delete vehicle error:', error);
      alert('Failed to delete vehicle');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading vehicles...</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold mb-6">My Vehicles ({vehicles.length})</h3>

      {vehicles.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow-md">
          <svg className="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-gray-500 text-lg">No vehicles listed yet</p>
          <p className="text-gray-400 mt-2">Add your first vehicle using the form above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div key={vehicle.vehicle_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition">
              {vehicle.image_path ? (
                <img
                  src={vehicle.image_path}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-48 object-cover"
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}
              
              <div className="p-4">
                <h4 className="font-bold text-lg mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h4>
                
                <p className="text-2xl font-bold text-green-600 mb-2">
                  ₱{parseFloat(vehicle.price).toLocaleString()}
                </p>

                {vehicle.mileage && (
                  <p className="text-sm text-gray-600 mb-1">
                    📊 {parseInt(vehicle.mileage).toLocaleString()} km
                  </p>
                )}

                {vehicle.location && (
                  <p className="text-sm text-gray-600 mb-2">
                    📍 {vehicle.location}
                  </p>
                )}

                {/* After location, add transmission */}
{vehicle.transmission && (
  <p className="text-sm text-gray-600 mb-2">
    ⚙️ {vehicle.transmission}
  </p>
)}

                <p className="text-sm text-gray-600 mb-2">VIN: {vehicle.vin_number}</p>

                <div className="mb-3">
                  <VerificationStatus status={vehicle.vin_status} />
                </div>

                {vehicle.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {vehicle.description}
                  </p>
                )}

                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
  Listed Date
</th>

<td className="px-6 py-4 text-sm text-gray-500">
  {vehicle.listed_at ? (
    <div>
      <div className="font-medium">{format(new Date(vehicle.listed_at), 'MMM d, yyyy')}</div>
      <div className="text-xs text-gray-400">
        {formatDistanceToNow(new Date(vehicle.listed_at), { addSuffix: true })}
      </div>
    </div>
  ) : (
    <span className="text-gray-400 italic">Not listed yet</span>
  )}
</td>

                <div className="flex space-x-2">
                  <button
                    onClick={() => setEditingVehicle(vehicle)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition text-sm font-medium"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDelete(vehicle.vehicle_id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition text-sm font-medium"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingVehicle && (
        <EditVehicleModal
          vehicle={editingVehicle}
          onClose={() => setEditingVehicle(null)}
          onSuccess={loadVehicles}
        />
      )}
    </div>
  );
}

export default MyVehicles;