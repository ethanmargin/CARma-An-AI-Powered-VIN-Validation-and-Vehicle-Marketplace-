import { useState } from 'react';
import API from '../../services/api';
import VerificationStatus from '../common/VerificationStatus';

function VerificationList({ verifications, onUpdate }) {
  const [processing, setProcessing] = useState(null);

  const handleApprove = async (userId) => {
    if (!window.confirm('Are you sure you want to approve this user?')) {
      return;
    }

    setProcessing(userId);
    try {
      await API.put('/admin/verifications/update', {
        userId,
        status: 'approved'
      });
      
      alert('User approved successfully!');
      onUpdate(); // Refresh the list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to approve user');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this user?')) {
      return;
    }

    setProcessing(userId);
    try {
      await API.put('/admin/verifications/update', {
        userId,
        status: 'rejected'
      });
      
      alert('User rejected successfully!');
      onUpdate(); // Refresh the list
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to reject user');
    } finally {
      setProcessing(null);
    }
  };

  const viewID = (submittedId) => {
    if (submittedId) {
      // Open ID image in new tab
      window.open(`http://localhost:5000/${submittedId}`, '_blank');
    }
  };

  if (verifications.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500 text-lg">No verifications found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registered
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {verifications.map((verification) => (
              <tr key={verification.user_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {verification.name}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{verification.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800 capitalize">
                    {verification.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <VerificationStatus status={verification.status} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(verification.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                  {verification.submitted_id && (
                    <button
                      onClick={() => viewID(verification.submitted_id)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View ID
                    </button>
                  )}
                  
                  {verification.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(verification.user_id)}
                        disabled={processing === verification.user_id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {processing === verification.user_id ? 'Processing...' : 'Approve'}
                      </button>
                      <button
                        onClick={() => handleReject(verification.user_id)}
                        disabled={processing === verification.user_id}
                        className="text-red-600 hover:text-red-900 disabled:opacity-50"
                      >
                        {processing === verification.user_id ? 'Processing...' : 'Reject'}
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default VerificationList;