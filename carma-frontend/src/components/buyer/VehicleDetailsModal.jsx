function VehicleDetailsModal({ vehicle, onClose }) {
  if (!vehicle) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full my-8 max-h-[95vh] overflow-y-auto">
        <div className="relative">
          {/* Header - Sticky on scroll */}
          <div className="sticky top-0 bg-white border-b border-gray-200 p-4 sm:p-6 flex justify-between items-center z-10 shadow-sm">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 pr-8">
              {vehicle.year} {vehicle.make} {vehicle.model}
            </h2>
            <button
              onClick={onClose}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition"
            >
              ×
            </button>
          </div>

          <div className="p-4 sm:p-6">
            {/* Vehicle Image - FIXED FOR MOBILE */}
            {vehicle.image_path ? (
              <div className="w-full mb-6 rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={vehicle.image_path}
                  alt={`${vehicle.make} ${vehicle.model}`}
                  className="w-full h-auto object-contain max-h-[60vh]" // ← Changed to object-contain
                />
              </div>
            ) : (
              <div className="w-full h-64 sm:h-96 bg-gray-200 rounded-lg flex items-center justify-center mb-6">
                <svg className="w-24 h-24 sm:w-32 sm:h-32 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}

            {/* Price & Status */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div>
                <p className="text-3xl sm:text-4xl font-bold text-green-600">
                  ₱{parseFloat(vehicle.price).toLocaleString()}
                </p>
              </div>
              <div>
                {vehicle.vin_status === 'approved' && (
                  <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full font-semibold text-sm">
                    ✓ Verified
                  </span>
                )}
                {vehicle.vin_status === 'pending' && (
                  <span className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full font-semibold text-sm">
                    ⏳ Pending Verification
                  </span>
                )}
                {vehicle.vin_status === 'rejected' && (
                  <span className="bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold text-sm">
                    ✗ Not Verified
                  </span>
                )}
              </div>
            </div>

            {/* Vehicle Details Grid - Mobile Responsive */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Make</p>
                <p className="text-lg font-semibold text-gray-800">{vehicle.make}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Model</p>
                <p className="text-lg font-semibold text-gray-800">{vehicle.model}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">Year</p>
                <p className="text-lg font-semibold text-gray-800">{vehicle.year}</p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">VIN Number</p>
                <p className="text-lg font-semibold text-gray-800 break-all">{vehicle.vin_number}</p>
              </div>

              {vehicle.mileage && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Mileage</p>
                  <p className="text-lg font-semibold text-gray-800">
                    📊 {parseInt(vehicle.mileage).toLocaleString()} km
                  </p>
                </div>
              )}

              {vehicle.location && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Location</p>
                  <p className="text-lg font-semibold text-gray-800">
                    📍 {vehicle.location}
                  </p>
                </div>
              )}

              {vehicle.transmission && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Transmission</p>
                  <p className="text-lg font-semibold text-gray-800">
                    ⚙️ {vehicle.transmission}
                  </p>
                </div>
              )}

              {/* 🆕 NEW: Fuel Type */}
{vehicle.fuel_type && (
  <div className="bg-gray-50 p-4 rounded-lg">
    <p className="text-sm text-gray-600 mb-1">Fuel Type</p>
    <p className="text-lg font-semibold text-gray-800">
      ⚡ {vehicle.fuel_type}
    </p>
  </div>
)}
            </div>

            {/* Description */}
            {vehicle.description && (
              <div className="mb-6">
                <h3 className="text-xl font-bold text-gray-800 mb-3">Description</h3>
                <p className="text-gray-600 whitespace-pre-line leading-relaxed">
                  {vehicle.description}
                </p>
              </div>
            )}

            {/* Seller Information */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <h3 className="text-lg font-bold text-blue-800 mb-2">Seller Information</h3>
  <p className="text-gray-700 break-words">
    <span className="font-semibold">Name:</span> {vehicle.seller_name}
  </p>
  <p className="text-gray-700 break-words">
    <span className="font-semibold">Email:</span> {vehicle.seller_email}
  </p>
  {vehicle.seller_mobile && (
    <p className="text-gray-700 break-words">
      <span className="font-semibold">Mobile:</span> 📱 {vehicle.seller_mobile}
    </p>
  )}
  {!vehicle.seller_mobile && (
    <p className="text-gray-500 text-sm italic">
      Mobile number not provided by seller
    </p>
  )}
</div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VehicleDetailsModal;