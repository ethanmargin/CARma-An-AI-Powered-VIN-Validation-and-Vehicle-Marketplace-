import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import API from '../../services/api';

function IDUpload({ onUploadSuccess }) {
  const { user } = useContext(AuthContext);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Please upload a valid image (JPEG, PNG) or PDF file');
        return;
      }

      // Validate file size (5MB max)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      setFile(selectedFile);
      setError('');

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(selectedFile);
      } else {
        setPreview(null);
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    setUploading(true);
    setError('');
    setSuccess('');

    const formData = new FormData();
    formData.append('idDocument', file);

    try {
      const response = await API.post('/users/upload-id', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSuccess(response.data.message);
      setFile(null);
      setPreview(null);
      
      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      setError(error.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Upload Your ID</h3>
      <p className="text-gray-600 mb-6">
        Please upload a clear photo of your government-issued ID for verification.
      </p>

      <form onSubmit={handleUpload} className="space-y-4">
        {/* File Input */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Select ID Document
          </label>
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,application/pdf"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <p className="text-sm text-gray-500 mt-1">
            Accepted formats: JPEG, PNG, PDF (Max 5MB)
          </p>
        </div>

        {/* Preview */}
        {preview && (
          <div className="mt-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
            <img 
              src={preview} 
              alt="ID Preview" 
              className="max-w-md h-auto border border-gray-300 rounded-lg"
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        {/* Upload Button */}
        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? 'Uploading...' : 'Upload ID'}
        </button>
      </form>
    </div>
  );
}

export default IDUpload;