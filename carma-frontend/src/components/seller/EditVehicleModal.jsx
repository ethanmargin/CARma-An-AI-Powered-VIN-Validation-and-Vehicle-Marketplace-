import { useState, useEffect } from 'react';
import API from '../../services/api';

function EditVehicleModal({ vehicle, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
    vin_number: '', // 🆕 Can now edit VIN
    mileage: '',
    location: '',
    transmission: '',
    fuel_type: '' // 🆕 NEW
  });
  const [vehicleImage, setVehicleImage] = useState(null);
  const [vinImage, setVinImage] = useState(null);
  const [vinPreview, setVinPreview] = useState(null);
  const [vinStatus, setVinStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (vehicle) {
      setFormData({
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        price: vehicle.price || '',
        description: vehicle.description || '',
        vin_number: vehicle.vin_number || '', // 🆕 Load VIN
        mileage: vehicle.mileage || '',
        location: vehicle.location || '',
        transmission: vehicle.transmission || '',
        fuel_type: vehicle.fuel_type || '' // 🆕 Load fuel type
      });
      setVinStatus(vehicle.vin_status || '');
    }
  }, [vehicle]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setVehicleImage(e.target.files[0]);
  };

  const handleVinImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVinImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVinPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = new FormData();
      data.append('make', formData.make);
      data.append('model', formData.model);
      data.append('year', formData.year);
      data.append('price', formData.price);
      data.append('description', formData.description);
      data.append('vin_number', formData.vin_number); // 🆕 Send VIN
      data.append('mileage', formData.mileage);
      data.append('location', formData.location);
      data.append('transmission', formData.transmission);
      data.append('fuel_type', formData.fuel_type); // 🆕 Send fuel type
      
      if (vehicleImage) {
        data.append('vehicleImage', vehicleImage);
      }

      if (vinImage) {
        data.append('vinImage', vinImage);
      }

      const response = await API.put(`/vehicles/${vehicle.vehicle_id}`, data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (vinImage) {
        alert('✅ Vehicle updated successfully!\n\n🤖 AI is automatically re-verifying your VIN. Check "My Vehicles" in a few seconds to see the result!');
      } else if (formData.vin_number !== vehicle.vin_number) {
        alert('✅ Vehicle and VIN updated!\n\n⚠️ VIN verification reset to pending. Please re-upload VIN image for auto-verification.');
      } else {
        alert('✅ Vehicle updated successfully!');
      }

      if (onSuccess) onSuccess();
      onClose();

    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold">Edit Vehicle</h3>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* 🆕 VIN Status Indicator */}
          {vinStatus && (
            <div className={`mb-6 p-4 rounded-lg border-2 ${
              vinStatus === 'approved' ? 'bg-green-50 border-green-300' :
              vinStatus === 'rejected' ? 'bg-red-50 border-red-300' :
              'bg-yellow-50 border-yellow-300'
            }`}>
              <h4 className="font-semibold mb-1">VIN Verification Status</h4>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                vinStatus === 'approved' ? 'bg-green-100 text-green-800' :
                vinStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {vinStatus === 'approved' ? '✅ Approved' :
                 vinStatus === 'rejected' ? '❌ Rejected' :
                 '⏳ Pending Verification'}
              </span>
              {vinStatus === 'approved' && (
                <p className="text-sm text-gray-600 mt-2">
                  ℹ️ VIN cannot be edited once approved. Contact admin if you need to change it.
                </p>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-medium mb-2">Make *</label>
                <input
                  type="text"
                  name="make"
                  value={formData.make}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Model *</label>
                <input
                  type="text"
                  name="model"
                  value={formData.model}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Year *</label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Price (₱) *</label>
                <input
                  type="number"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Mileage (km)</label>
                <input
                  type="number"
                  name="mileage"
                  value={formData.mileage}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Location</label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">Transmission *</label>
                <select
                  name="transmission"
                  value={formData.transmission}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Select Transmission</option>
                  <option value="Automatic">Automatic</option>
                  <option value="Manual">Manual</option>
                  <option value="CVT">CVT</option>
                </select>
              </div>

              {/* 🆕 NEW: Fuel Type */}
              <div>
                <label className="block text-gray-700 font-medium mb-2">Fuel Type *</label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                >
                  <option value="">Select Fuel Type</option>
                  <option value="Gasoline">Gasoline</option>
                  <option value="Diesel">Diesel</option>
                  <option value="Electric">Electric</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Plug-in Hybrid">Plug-in Hybrid</option>
                </select>
              </div>
            </div>

            {/* 🆕 NEW: VIN Number - Editable if not approved */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                VIN Number *
                {vinStatus === 'approved' && (
                  <span className="ml-2 text-xs text-gray-500">(Cannot edit - approved)</span>
                )}
              </label>
              <input
                type="text"
                name="vin_number"
                value={formData.vin_number}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Enter 17-character VIN"
                maxLength="17"
                disabled={vinStatus === 'approved'}
                required
              />
              {vinStatus !== 'approved' && (
                <p className="text-xs text-gray-500 mt-1">
                  ⚠️ Changing VIN will reset verification status to pending
                </p>
              )}
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows="3"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Update Vehicle Image (optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
              {vehicle.image_path && !vehicleImage && (
                <p className="text-sm text-gray-500 mt-1">
                  Current image will be kept if no new image is uploaded
                </p>
              )}
            </div>

            {/* VIN Image Re-upload */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-gray-700 font-medium mb-2">
                Update VIN Plate Image (Re-upload for better OCR) 📸
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleVinImageChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
              />
              
              <div className="mt-3 bg-white border border-blue-300 rounded p-3">
                <p className="text-sm font-semibold text-blue-900 mb-2">📷 Tips for Clear VIN Photos:</p>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>✓ Take photo in good lighting (daylight is best)</li>
                  <li>✓ Hold camera straight, not at an angle</li>
                  <li>✓ Get close enough so VIN fills most of the frame</li>
                  <li>✓ Make sure all 17 characters are clearly visible</li>
                  <li>✓ Avoid shadows, glare, or reflections</li>
                </ul>
              </div>

              {vinPreview && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">New VIN Image Preview:</p>
                  <img src={vinPreview} alt="New VIN Preview" className="max-w-sm h-auto rounded-lg border border-blue-300" />
                </div>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
              >
                {loading ? 'Updating...' : 'Update Vehicle'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-3 px-4 rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default EditVehicleModal;