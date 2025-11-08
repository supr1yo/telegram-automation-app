import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';


const API_BASE_URL = import.meta.env.VITE_TELEGRAM_ACCOUNT_SESSIONS_API_URL;

const ManageAccountsPage = () => {
  // State for the list of accounts
  const [accounts, setAccounts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // State to manage which account is currently being edited
  const [editingPhoneNumber, setEditingPhoneNumber] = useState(null);
  const [editingData, setEditingData] = useState({ account_name: '', purpose: '' });

  // This is needed for the dropdown in the edit form
  const purposeOptions = [
    { value: 'Outreach', label: 'Outreach' },
    { value: 'Keyword_Monitor', label: 'Keyword Monitor' },
    { value: 'Keyword_Searching', label: 'Keyword Searching' },
    { value: 'Group_Member_Scraping', label: 'Group Member Scraping' },
  ];

  // --- Data Fetching ---
  const fetchAccounts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/accounts`);
      if (!response.ok) {
        throw new Error('Failed to fetch accounts.');
      }
      const data = await response.json();
      setAccounts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch accounts when the component mounts
  useEffect(() => {
    fetchAccounts();
  }, []);

  // --- API Handlers ---

  const handleDelete = async (phoneNumber) => {
    if (window.confirm(`Are you sure you want to delete the account for ${phoneNumber}? This cannot be undone.`)) {
      try {
        const response = await fetch(`${API_BASE_URL}/accounts/${phoneNumber}`, {
          method: 'DELETE',
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Failed to delete account.');
        }
        // Refresh the list after successful deletion
        await fetchAccounts();
      } catch (err) {
        alert(`Error: ${err.message}`);
      }
    }
  };
  
  const handleUpdate = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/accounts/${phoneNumber}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingData),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update account.');
      }
      // Exit editing mode and refresh the list
      setEditingPhoneNumber(null);
      await fetchAccounts();
    } catch (err) {
      alert(`Error: ${err.message}`);
    }
  };

  // --- UI Event Handlers ---

  const handleEditClick = (account) => {
    setEditingPhoneNumber(account.phone_number);
    setEditingData({
      account_name: account.account_name,
      purpose: account.purpose,
    });
  };

  const handleCancelEdit = () => {
    setEditingPhoneNumber(null);
    setEditingData({ account_name: '', purpose: '' });
  };
  
  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };

  // --- Styling ---
  const cardStyle = "bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-4xl mx-auto border border-gray-700";
  const formInputStyle = "bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const actionButton = "py-1 px-3 rounded-md text-sm font-semibold text-white transition-colors disabled:opacity-50";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Manage Accounts" />
      <main className="p-4 sm:p-8">
        <div className={cardStyle}>
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">Registered Telegram Accounts</h2>
          
          {isLoading && <p className="text-center text-gray-400">Loading accounts...</p>}
          {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-lg">{error}</p>}
          
          {!isLoading && !error && (
            <ul className="space-y-4">
              {accounts.length > 0 ? (
                accounts.map(account => (
                  <li key={account.phone_number} className="bg-gray-700/60 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {editingPhoneNumber === account.phone_number ? (
                      // --- Edit View ---
                      <div className="w-full grow space-y-3">
                        <input
                          type="text"
                          name="account_name"
                          value={editingData.account_name}
                          onChange={handleEditFormChange}
                          className={formInputStyle}
                        />
                        <select
                          name="purpose"
                          value={editingData.purpose}
                          onChange={handleEditFormChange}
                          className={formInputStyle}
                        >
                          {purposeOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                      </div>
                    ) : (
                      // --- Display View ---
                      <div className="grow">
                        <p className="font-bold text-lg text-white">{account.account_name}</p>
                        <p className="text-sm text-gray-300">{account.phone_number}</p>
                        <p className="text-sm text-cyan-400 mt-1">Purpose: {account.purpose.replace('_', ' ')}</p>
                      </div>
                    )}
                    
                    {/* --- Action Buttons --- */}
                    <div className="flex space-x-2 shrink-0">
                      {editingPhoneNumber === account.phone_number ? (
                        <>
                          <button onClick={() => handleUpdate(account.phone_number)} className={`${actionButton} bg-green-600 hover:bg-green-700`}>Save</button>
                          <button onClick={handleCancelEdit} className={`${actionButton} bg-gray-500 hover:bg-gray-600`}>Cancel</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => handleEditClick(account)} className={`${actionButton} bg-blue-600 hover:bg-blue-700`}>Edit</button>
                          <button onClick={() => handleDelete(account.phone_number)} className={`${actionButton} bg-red-600 hover:bg-red-700`}>Delete</button>
                        </>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <p className="text-center text-gray-400 bg-gray-700/50 p-4 rounded-lg">No accounts have been registered yet.</p>
              )}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
};

export default ManageAccountsPage;