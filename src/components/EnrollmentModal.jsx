import { useState, useEffect, useCallback } from 'react';
import Select from 'react-select';
import { X } from 'lucide-react'; 

const API_URL = import.meta.env.VITE_OUTREACH_API_URL;

// Custom styles for react-select
const selectStyles = {
  control: (provided) => ({ ...provided, backgroundColor: '#374151', borderColor: '#4B5563', minHeight: '150px', alignItems: 'flex-start', cursor: 'pointer' }),
  menu: (provided) => ({ ...provided, backgroundColor: '#1F2937' }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#0891B2' : state.isFocused ? '#374151' : '#1F2937',
    color: 'white',
    ':active': { backgroundColor: '#0E7490' },
  }),
  multiValue: (styles) => ({ ...styles, backgroundColor: '#0891B2' }),
  multiValueLabel: (styles) => ({ ...styles, color: 'white' }),
  placeholder: (styles) => ({ ...styles, color: '#9CA3AF' }), 
};

function EnrollmentModal({ campaign, onClose, onSave }) {
  const [availableAccounts, setAvailableAccounts] = useState([]);
  const [enrolledAccounts, setEnrolledAccounts] = useState([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchEnrollmentData = useCallback(async () => {
    if (!campaign) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/database/campaigns/${campaign.id}/enrollment_details`);
      const data = await response.json();
      setAvailableAccounts(data.available_accounts || []);
      setEnrolledAccounts(data.enrolled_accounts || []);
    } catch (error) {
      console.error("Failed to fetch enrollment details:", error);
      alert('Failed to load account data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [campaign]);

  useEffect(() => {
    fetchEnrollmentData();
  }, [fetchEnrollmentData]);

  // Handler to add accounts to the enrolled list
  const handleEnroll = (selectedOptions) => {
    const accountsToEnroll = selectedOptions.map(opt => opt.value);
    setEnrolledAccounts(prev => [...prev, ...accountsToEnroll].sort());
    setAvailableAccounts(prev => prev.filter(acc => !accountsToEnroll.includes(acc)));
  };

  // <<< NEW: Handler to remove a single account from the enrolled list
  const handleUnenroll = (accountNameToRemove) => {
    // Remove the account from the enrolled list
    setEnrolledAccounts(prev => prev.filter(acc => acc !== accountNameToRemove));
    // Add it back to the available list
    setAvailableAccounts(prev => [...prev, accountNameToRemove].sort());
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/database/campaigns/${campaign.id}/manage_enrollment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_names: enrolledAccounts }),
      });
      onSave();
      onClose();
    } catch (error) {
      alert(`Failed to save changes: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!campaign) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 w-full max-w-4xl">
        <h2 className="text-xl font-semibold text-white mb-4">
          Manage Enrollment for <span className="text-cyan-400">{campaign.name}</span>
        </h2>
        
        {isLoading ? (
          <div className="text-center py-10">Loading account data...</div>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold mb-2">Available Accounts</h3>
              <Select
                isMulti
                options={availableAccounts.map(name => ({ value: name, label: name }))}
                onChange={handleEnroll}
                value={[]}
                styles={selectStyles}
                placeholder="Select accounts to enroll..."
              />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Enrolled Accounts</h3>
              {/* <<< MODIFIED: This is now a display area, not a dropdown */}
              <div className="bg-gray-900/50 p-3 rounded-lg min-h-[150px] border border-gray-700 overflow-y-auto">
                {enrolledAccounts.length > 0 ? (
                  enrolledAccounts.map(name => (
                    <div key={name} className="inline-flex items-center bg-cyan-600 text-white text-sm font-medium rounded-md m-1">
                      <span className="pl-2 pr-1">{name}</span>
                      <button 
                        onClick={() => handleUnenroll(name)} 
                        className="p-1 text-cyan-200 hover:bg-cyan-700 hover:text-white rounded-r-md transition-colors"
                        aria-label={`Remove ${name}`}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm p-2">No accounts enrolled.</p>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onClose} className="px-4 py-2 font-bold rounded-lg transition-colors bg-gray-600 hover:bg-gray-500">
            Cancel
          </button>
          <button onClick={handleSave} disabled={isSaving || isLoading} className="px-4 py-2 font-bold rounded-lg transition-colors bg-green-600 hover:bg-green-700 disabled:bg-gray-500">
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default EnrollmentModal;