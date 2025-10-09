function VerificationStatus({ status }) {
  const getStatusColor = () => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'approved':
        return '✓';
      case 'rejected':
        return '✗';
      case 'pending':
        return '⏳';
      default:
        return '?';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'approved':
        return 'Verified';
      case 'rejected':
        return 'Rejected';
      case 'pending':
        return 'Pending Verification';
      default:
        return 'Not Submitted';
    }
  };

  return (
    <div className={`inline-flex items-center px-4 py-2 rounded-lg border-2 font-semibold ${getStatusColor()}`}>
      <span className="text-xl mr-2">{getStatusIcon()}</span>
      <span>{getStatusText()}</span>
    </div>
  );
}

export default VerificationStatus;