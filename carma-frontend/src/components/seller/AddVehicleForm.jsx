import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

function AddVehicleForm({ onSuccess }) {
  const { user } = useContext(AuthContext);
  
  const [formData, setFormData] = useState({
    make: '',
    model: '',
    year: '',
    price: '',
    description: '',
    vin_number: '',
    mileage: '',
    location: '',
    transmission: ''
  });
  
  const [vehicleImage, setVehicleImage] = useState(null);
  const [vinImage, setVinImage] = useState(null); // 🆕 NEW
  const [vehiclePreview, setVehiclePreview] = useState(null);
  const [vinPreview, setVinPreview] = useState(null); // 🆕 NEW
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVehicleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setVehicleImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setVehiclePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 🆕 NEW: Handle VIN image upload
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
    setSuccess('');
    setLoading(true);

    const data = new FormData();
    data.append('make', formData.make);
    data.append('model', formData.model);
    data.append('year', formData.year);
    data.append('price', formData.price);
    data.append('description', formData.description);
    data.append('vin_number', formData.vin_number);
    data.append('mileage', formData.mileage);
    data.append('location', formData.location);
    data.append('transmission', formData.transmission); // Fixed typo (removed colon)
    
    if (vehicleImage) {
      data.append('vehicleImage', vehicleImage);
    }

    // 🆕 NEW: Append VIN image
    if (vinImage) {
      data.append('vinImage', vinImage);
    }

    try {
      await API.post('/vehicles/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Vehicle added successfully! AI is automatically verifying your VIN...');
      
      // Reset form
      setFormData({ 
        make: '', 
        model: '', 
        year: '', 
        price: '', 
        description: '', 
        vin_number: '',
        mileage: '',
        location: '',
        transmission: ''
      });
      setVehicleImage(null);
      setVinImage(null);
      setVehiclePreview(null);
      setVinPreview(null);
      
      if (onSuccess) onSuccess();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to add vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Vehicle</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Make *</label>
            <input
              type="text"
              name="make"
              value={formData.make}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Toyota, Honda, Ford..."
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Camry, Civic, F-150..."
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
              min="1900"
              max={new Date().getFullYear() + 1}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="2020"
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
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="500000"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Mileage (km)</label>
            <input
              type="number"
              name="mileage"
              value={formData.mileage}
              onChange={handleChange}
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="Manila, Philippines"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Transmission</label>
            <select
              name="transmission"
              value={formData.transmission}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            >
              <option value="">Select Transmission</option>
              <option value="Automatic">Automatic</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">VIN Number *</label>
          <input
            type="text"
            name="vin_number"
            value={formData.vin_number}
            onChange={handleChange}
            required
            maxLength="17"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="17-character VIN (e.g., 1HGBH41JXMN109186)"
          />
          <p className="text-sm text-gray-500 mt-1">Must be exactly 17 characters</p>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="Describe the vehicle condition, features, history..."
          />
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">Vehicle Image</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleVehicleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          {vehiclePreview && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Preview:</p>
              <img src={vehiclePreview} alt="Vehicle Preview" className="max-w-md h-auto rounded-lg border" />
            </div>
          )}
        </div>

        {/* 🆕 NEW: VIN Image Upload */}
       {/* VIN Image Upload */}
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
  <label className="block text-gray-700 font-medium mb-2">
    VIN Plate Image * (For OCR Verification) 🤖
  </label>
  <input
    type="file"
    accept="image/*"
    onChange={handleVinImageChange}
    required
    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
  />
  
  {/* Tips for better VIN photos */}
  <div className="mt-3 bg-white border border-blue-300 rounded p-3">
    <p className="text-sm font-semibold text-blue-900 mb-2">📷 Tips for Clear VIN Photos:</p>
    <ul className="text-xs text-blue-800 space-y-1">
      <li>✓ Take photo in good lighting (daylight is best)</li>
      <li>✓ Hold camera straight, not at an angle</li>
      <li>✓ Get close enough so VIN fills most of the frame</li>
      <li>✓ Make sure all 17 characters are clearly visible</li>
      <li>✓ Avoid shadows, glare, or reflections</li>
      <li>✓ Use your phone's camera, not a screenshot</li>
    </ul>
  </div>

  {vinPreview && (
    <div className="mt-4">
      <p className="text-sm text-gray-600 mb-2">Preview:</p>
      <img src={vinPreview} alt="VIN Preview" className="max-w-sm h-auto rounded-lg border border-blue-300" />
    </div>
  )}
</div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Adding Vehicle...' : '🚗 Add Vehicle'}
        </button>
      </form>
    </div>
  );
}

export default AddVehicleForm;