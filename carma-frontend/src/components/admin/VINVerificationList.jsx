const [verifying, setVerifying] = useState(null);

const handleAutoVerify = async (vehicleId) => {
  if (!window.confirm('🤖 Run automatic VIN verification using OCR?\n\nThis will read the VIN from the uploaded image and compare it with the entered VIN.')) return;

  setVerifying(vehicleId);
  try {
    const response = await API.post(`/admin/vehicles/${vehicleId}/auto-verify-vin`);
    
    alert(
      `✅ OCR Verification Complete!\n\n` +
      `Status: ${response.data.newStatus.toUpperCase()}\n` +
      `${response.data.notes}\n\n` +
      `Similarity: ${response.data.ocrResult.similarity?.toFixed(0) || 'N/A'}%`
    );
    
    loadPendingVINs();
  } catch (error) {
    alert('❌ ' + (error.response?.data?.message || 'Failed to auto-verify VIN'));
  } finally {
    setVerifying(null);
  }
};

// In your table row, add this button:
<button
  onClick={() => handleAutoVerify(vehicle.vehicle_id)}
  disabled={verifying === vehicle.vehicle_id}
  className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
>
  {verifying === vehicle.vehicle_id ? '⏳ Processing...' : '🤖 Auto-Verify'}
</button>