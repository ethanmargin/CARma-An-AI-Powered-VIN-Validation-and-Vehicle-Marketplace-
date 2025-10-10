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
    vin_number: ''
  });
  
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
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
    if (image) {
      data.append('vehicleImage', image);
    }

    try {
      await API.post('/vehicles/add', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('Vehicle added successfully! Awaiting VIN verification.');
      setFormData({ make: '', model: '', year: '', price: '', description: '', vin_number: '' });
      setImage(null);
      setPreview(null);
      
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
            <label className="block text-gray-700 font-medium mb-2">Make</label>
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
            <label className="block text-gray-700 font-medium mb-2">Model</label>
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
            <label className="block text-gray-700 font-medium mb-2">Year</label>
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
            <label className="block text-gray-700 font-medium mb-2">Price ($)</label>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="25000"
            />
          </div>
        </div>

        <div>
          <label className="block text-gray-700 font-medium mb-2">VIN Number</label>
          <input
            type="text"
            name="vin_number"
            value={formData.vin_number}
            onChange={handleChange}
            required
            maxLength="17"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            placeholder="17-character VIN"
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
            onChange={handleImageChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
          />
          {preview && (
            <div className="mt-4">
              <img src={preview} alt="Preview" className="max-w-md h-auto rounded-lg border" />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
        >
          {loading ? 'Adding Vehicle...' : 'Add Vehicle'}
        </button>
      </form>
    </div>
  );
}

export default AddVehicleForm;