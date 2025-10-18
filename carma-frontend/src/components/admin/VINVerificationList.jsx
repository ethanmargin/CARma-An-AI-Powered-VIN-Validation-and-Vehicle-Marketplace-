import { useState, useEffect } from 'react';
import API from '../../services/api';

function VINVerificationList() {
  const [pendingVINs, setPendingVINs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(null);

  useEffect(() => {
    loadPendingVINs();
  }, []);

  const loadPendingVINs = async () => {
    try {
      const response = await API.get('/admin/pending-vins');
      setPendingVINs(response.data.vins);
    } catch (error) {
      console.error('Load pending VINs error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoVerify = async (vehicleId) => {
    if (!window.confirm('🤖 Run automatic VIN verification using OCR?\n\nThis will read the VIN from the uploaded image and compare it with the entered VIN.')) return;

    setVerifying(vehicleId);
    try {
      const response = await API.post(`/admin/vehicles/${vehicleId}/auto-verify-vin`);
      
      alert(
        `✅ OCR Verification Complete!\n\n` +
        `Status: ${response.data.newStatus.toUpperCase()}\n` +
        `${response.data.notes}\n\n` +
        `Extracted VIN: ${response.data.ocrResult.extractedVIN || 'None'}\n` +
        `Expected VIN: ${response.data.ocrResult.expectedVIN || 'None'}\n` +
        `Similarity: ${response.data.ocrResult.similarity?.toFixed(0) || 'N/A'}%`
      );
      
      loadPendingVINs();
    } catch (error) {
      alert('❌ ' + (error.response?.data?.message || 'Failed to auto-verify VIN'));
    } finally {
      setVerifying(null);
    }
  };

  const handleManualVerify = async (vehicleId, status) => {
    if (!window.confirm(`Are you sure you want to ${status} this VIN?`)) return;

    try {
      await API.post(`/admin/verify-vin/${vehicleId}`, { status });
      alert(`VIN ${status} successfully!`);
      loadPendingVINs();
    } catch (error) {
      alert('Failed to verify VIN');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">VIN Verifications</h1>
          <p className="text-gray-600 mt-2">Review and verify vehicle VINs using OCR technology</p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold mb-4">Pending VIN Verifications ({pendingVINs.length})</h2>

          {pendingVINs.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">✅ No pending VIN verifications</p>
              <p className="text-gray-400 mt-2">All vehicles are verified!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {pendingVINs.map((vin) => (
                <div key={vin.vehicle_id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Vehicle Info */}
                    <div>
                      <h3 className="font-bold text-xl text-gray-800 mb-3">
                        {vin.year} {vin.make} {vin.model}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex items-start">
                          <span className="font-semibold text-gray-700 w-24">VIN:</span>
                          <span className="text-gray-600 font-mono">{vin.vin_number}</span>
                        </div>
                        
                        <div className="flex items-start">
                          <span className="font-semibold text-gray-700 w-24">Seller:</span>
                          <span className="text-gray-600">{vin.seller_name}</span>
                        </div>
                        
                        <div className="flex items-start">
                          <span className="font-semibold text-gray-700 w-24">Email:</span>
                          <span className="text-gray-600">{vin.seller_email}</span>
                        </div>
                        
                        <div className="flex items-start">
                          <span className="font-semibold text-gray-700 w-24">Price:</span>
                          <span className="text-green-600 font-bold">₱{parseFloat(vin.price).toLocaleString()}</span>
                        </div>

                        {vin.mileage && (
                          <div className="flex items-start">
                            <span className="font-semibold text-gray-700 w-24">Mileage:</span>
                            <span className="text-gray-600">{parseInt(vin.mileage).toLocaleString()} km</span>
                          </div>
                        )}

                        {vin.location && (
                          <div className="flex items-start">
                            <span className="font-semibold text-gray-700 w-24">Location:</span>
                            <span className="text-gray-600">{vin.location}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: VIN Image */}
                    <div>
                      {vin.submitted_vin_image ? (
                        <div>
                          <p className="text-sm font-semibold text-gray-700 mb-2">VIN Plate Image:</p>
                          <div className="border-2 border-blue-200 rounded-lg overflow-hidden bg-gray-50">
                            <img 
                              src={vin.submitted_vin_image} 
                              alt="VIN Plate" 
                              className="w-full h-64 object-contain"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Click "Auto-Verify" to use OCR on this image
                          </p>
                        </div>
                      ) : (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8 text-center">
                          <p className="text-red-600 font-semibold">⚠️ No VIN Image Uploaded</p>
                          <p className="text-sm text-red-500 mt-2">Seller must upload VIN plate photo</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-gray-200">
                    <button
                      onClick={() => handleAutoVerify(vin.vehicle_id)}
                      disabled={verifying === vin.vehicle_id || !vin.submitted_vin_image}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
                    >
                      {verifying === vin.vehicle_id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Processing OCR...</span>
                        </>
                      ) : (
                        <>
                          <span>🤖</span>
                          <span>Auto-Verify (OCR)</span>
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => handleManualVerify(vin.vehicle_id, 'approved')}
                      className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      ✅ Approve Manually
                    </button>
                    
                    <button
                      onClick={() => handleManualVerify(vin.vehicle_id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition"
                    >
                      ❌ Reject
                    </button>
                  </div>

                  {/* OCR Notes */}
                  {vin.verification_notes && (
                    <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="font-semibold text-yellow-800 mb-1">📝 Previous Notes:</p>
                      <p className="text-sm text-yellow-700">{vin.verification_notes}</p>
                    </div>
                  )}

                  {vin.ocr_extracted_vin && (
                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="font-semibold text-blue-800 mb-1">🤖 OCR Result:</p>
                      <p className="text-sm text-blue-700 font-mono">Extracted VIN: {vin.ocr_extracted_vin}</p>
                      {vin.ocr_confidence && (
                        <p className="text-sm text-blue-700">Confidence: {vin.ocr_confidence}</p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default VINVerificationList;