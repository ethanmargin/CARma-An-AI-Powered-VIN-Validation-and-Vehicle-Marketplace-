import { useState } from 'react';
import API from '../../services/api';

function VehicleCard({ vehicle, onBookmark, showBookmark = true }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleBookmark = async () => {
    setLoading(true);
    try {
      const response = await API.post('/vehicles/bookmark', {
        vehicleId: vehicle.vehicle_id
      });
      setBookmarked(response.data.bookmarked);
      if (onBookmark) onBookmark();
    } catch (error) {
      console.error('Bookmark error:', error);
    } finally {
      setLoading(false);
    }
  };

  // If image_path exists, it's already a full Cloudinary URL
  const imageUrl = vehicle.image_path || 'https://via.placeholder.com/400x300?text=No+Image';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Vehicle Image */}
      <div className="relative h-48 bg-gray-200">
        <img 
          src={imageUrl} 
          alt={`${vehicle.make} ${vehicle.model}`}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.error('Vehicle image load error:', e);
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
          }}
        />
        
        {/* Bookmark Button */}
        {showBookmark && (
          <button
            onClick={handleBookmark}
            disabled={loading}
            className="absolute top-2 right-2 bg-white p-2 rounded-full shadow-lg hover:bg-gray-100 transition"
          >
            {bookmarked ? '❤️' : '🤍'}
          </button>
        )}

        {/* VIN Status Badge */}
        {vehicle.vin_status && (
          <div className={`absolute bottom-2 left-2 px-3 py-1 rounded-full text-xs font-semibold ${
            vehicle.vin_status === 'approved' ? 'bg-green-100 text-green-800' :
            vehicle.vin_status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {vehicle.vin_status === 'approved' ? '✓ Verified' :
             vehicle.vin_status === 'rejected' ? '✗ Rejected' :
             '⏳ Pending'}
          </div>
        )}
      </div>

      {/* Vehicle Details */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>

        {vehicle.price && (
          <p className="text-2xl font-bold text-green-600 mb-2">
            ${parseFloat(vehicle.price).toLocaleString()}
          </p>
        )}

        {vehicle.description && (
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">
            {vehicle.description}
          </p>
        )}

        {vehicle.seller_name && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            Seller: {vehicle.seller_name}
          </div>
        )}

        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            VIN: {vehicle.vin_number?.substring(0, 8)}...
          </span>
          
          <button className="text-green-600 hover:text-green-700 font-semibold text-sm">
            View Details →
          </button>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;