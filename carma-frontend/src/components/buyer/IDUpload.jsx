import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

function IDUpload({ onUploadSuccess }) {
  const { user } = useContext(AuthContext);
  
  const [idType, setIdType] = useState('');
  const [idFile, setIdFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form data based on ID type
  const [formData, setFormData] = useState({});

  const idTypes = {
    'drivers_license': 'Driver\'s License (LTO)',
    'passport': 'Philippine Passport (DFA)',
    'national_id': 'Philippine National ID (PhilSys)'
  };

  const idFields = {
    drivers_license: [
      { name: 'license_number', label: 'License Number', placeholder: 'LL-YY-NNNNNN', required: true },
      { name: 'last_name', label: 'Last Name', required: true },
      { name: 'first_name', label: 'First Name', required: true },
      { name: 'middle_name', label: 'Middle Name', required: false },
      { name: 'address', label: 'Address', required: true },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'nationality', label: 'Nationality', defaultValue: 'Filipino', required: true },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'blood_type', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: false },
      { name: 'height', label: 'Height (cm)', type: 'number', required: false },
      { name: 'weight', label: 'Weight (kg)', type: 'number', required: false },
      { name: 'expiry_date', label: 'Expiry Date', type: 'date', required: true },
      { name: 'conditions', label: 'Conditions/Restrictions', required: false }
    ],
    passport: [
      { name: 'passport_number', label: 'Passport Number', placeholder: 'LLNNNNNNN', required: true },
      { name: 'last_name', label: 'Last Name (Surname)', required: true },
      { name: 'first_name', label: 'First Name (Given Name)', required: true },
      { name: 'middle_name', label: 'Middle Name', required: false },
      { name: 'nationality', label: 'Nationality', defaultValue: 'Filipino', required: true },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'place_of_birth', label: 'Place of Birth', required: true },
      { name: 'date_of_issue', label: 'Date of Issue', type: 'date', required: true },
      { name: 'date_of_expiry', label: 'Date of Expiry', type: 'date', required: true },
      { name: 'place_of_issue', label: 'Place of Issue', defaultValue: 'Philippines', required: true }
    ],
    national_id: [
      { name: 'philsys_number', label: 'PhilSys Card Number', placeholder: 'NNNN-NNNN-NNNN-NNNN', required: true },
      { name: 'last_name', label: 'Last Name', required: true },
      { name: 'first_name', label: 'First Name', required: true },
      { name: 'middle_name', label: 'Middle Name', required: false },
      { name: 'sex', label: 'Sex', type: 'select', options: ['Male', 'Female'], required: true },
      { name: 'date_of_birth', label: 'Date of Birth', type: 'date', required: true },
      { name: 'place_of_birth', label: 'Place of Birth', required: true },
      { name: 'blood_type', label: 'Blood Type', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], required: false },
      { name: 'address', label: 'Address', required: true },
      { name: 'nationality', label: 'Nationality', defaultValue: 'Filipino', required: true },
      { name: 'issue_date', label: 'Issue Date', type: 'date', required: true }
    ]
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setIdFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleIdTypeChange = (e) => {
    setIdType(e.target.value);
    setFormData({});
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!idType) {
      setError('Please select an ID type');
      return;
    }

    if (!idFile) {
      setError('Please upload an image of your ID');
      return;
    }

    setLoading(true);

    const data = new FormData();
    data.append('id', idFile);
    data.append('id_type', idType);
    data.append('id_data', JSON.stringify(formData));

    try {
      await API.post('/users/upload-id', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSuccess('ID uploaded successfully! Awaiting verification.');
      setIdFile(null);
      setPreview(null);
      setIdType('');
      setFormData({});
      
      if (onUploadSuccess) {
        setTimeout(() => onUploadSuccess(), 1500);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field) => {
    const value = formData[field.name] || field.defaultValue || '';

    if (field.type === 'select') {
      return (
        <select
          name={field.name}
          value={value}
          onChange={handleInputChange}
          required={field.required}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="">Select {field.label}</option>
          {field.options.map(option => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
      );
    }

    return (
      <input
        type={field.type || 'text'}
        name={field.name}
        value={value}
        onChange={handleInputChange}
        placeholder={field.placeholder}
        required={field.required}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-2xl font-bold text-gray-800 mb-6">Upload Valid ID</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
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

        {/* ID Type Selection */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Select ID Type <span className="text-red-500">*</span>
          </label>
          <select
            value={idType}
            onChange={handleIdTypeChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Choose an ID Type --</option>
            {Object.entries(idTypes).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>

        {/* Dynamic Fields Based on ID Type */}
        {idType && idFields[idType] && (
          <div className="border-t pt-6">
            <h4 className="font-semibold text-lg mb-4">Enter {idTypes[idType]} Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {idFields[idType].map((field) => (
                <div key={field.name} className={field.name === 'address' ? 'md:col-span-2' : ''}>
                  <label className="block text-gray-700 font-medium mb-2">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* File Upload */}
        {idType && (
          <div className="border-t pt-6">
            <label className="block text-gray-700 font-medium mb-2">
              Upload Clear Photo of Your {idTypes[idType]} <span className="text-red-500">*</span>
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <p className="text-sm text-gray-500 mt-2">
              Make sure all details on the ID are clearly visible
            </p>
            
            {preview && (
              <div className="mt-4">
                <p className="text-sm text-gray-600 mb-2">Preview:</p>
                <img 
                  src={preview} 
                  alt="ID Preview" 
                  className="max-w-md h-auto border rounded-lg"
                />
              </div>
            )}
          </div>
        )}

        {/* Submit Button */}
        {idType && (
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Submit for Verification'}
          </button>
        )}
      </form>
    </div>
  );
}

export default IDUpload;