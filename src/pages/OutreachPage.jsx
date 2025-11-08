import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Select from 'react-select';
import EnrollmentModal from '../components/EnrollmentModal';

// API Urls
const API_URL = import.meta.env.VITE_OUTREACH_API_URL;
const WORKFLOW_START_URL = import.meta.env.VITE_WORKFLOW_START_URL;


function OutreachPage() {
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [accountsError, setAccountsError] = useState('');
  const [campaigns, setCampaigns] = useState([]);
  const [campaignsLoading, setCampaignsLoading] = useState(true);
  const [campaignsError, setCampaignsError] = useState('');
  
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newCampaignMessage, setNewCampaignMessage] = useState('');

  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editMessage, setEditMessage] = useState('');
  
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [workflowError, setWorkflowError] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  const [managingCampaign, setManagingCampaign] = useState(null);

  // --- NEW: States for filtered contact data ---
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [contactsLoading, setContactsLoading] = useState(false);
  const [contactsError, setContactsError] = useState('');
  const [searchParams] = useSearchParams(); // Hook to get URL query params

  // --- Generic Fetch Helper ---
  const apiFetch = useCallback(async (url, options = {}) => {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! Status: ${response.status} - ${errorText}`);
      }
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      }
      return true;
    } catch (err) {
      console.error(`Fetch error for ${url}:`, err);
      throw err;
    }
  }, []);

  // --- Data Fetching Callbacks (Original) ---
  const fetchCampaignAccounts = useCallback(async () => {
    setAccountsLoading(true); setAccountsError('');
    try {
      const data = await apiFetch(`${API_URL}/database/campaign_accounts`);
      setAccounts(data.accounts || []);
    } catch (err) { setAccountsError('Failed to fetch account statuses.'); }
    finally { setAccountsLoading(false); }
  }, [apiFetch]);

  const fetchCampaigns = useCallback(async () => {
    setCampaignsLoading(true); setCampaignsError('');
    try {
      const data = await apiFetch(`${API_URL}/database/campaigns`);
      setCampaigns(data);
    } catch (err) { setCampaignsError('Failed to fetch campaigns.'); }
    finally { setCampaignsLoading(false); }
  }, [apiFetch]);

  // --- NEW: Data Fetching Callback for Filtered Contacts ---
  const fetchFilteredContacts = useCallback(async (params) => {
    setContactsLoading(true);
    setContactsError('');
    try {
      const queryString = params.toString();
      // This endpoint needs to be created on your backend to handle the filtering logic.
      const data = await apiFetch(`${API_URL}/database/contacts/filter?${queryString}`);
      setFilteredContacts(data || []);
    } catch (err) {
      setContactsError('Failed to fetch filtered contact data.');
    } finally {
      setContactsLoading(false);
    }
  }, [apiFetch]);

  // useEffect for initial dashboard data
  useEffect(() => {
    fetchCampaignAccounts();
    fetchCampaigns();
  }, [fetchCampaignAccounts, fetchCampaigns]);

  // --- NEW: useEffect to trigger data fetch when URL filter params change ---
  useEffect(() => {
    if (searchParams.toString()) {
      fetchFilteredContacts(searchParams);
    } else {
      setFilteredContacts([]); // Clear results if no params
    }
  }, [searchParams, fetchFilteredContacts]);

  // --- Campaign Handlers (Original) ---
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newCampaignName.trim() || !newCampaignMessage.trim()) return;
    try {
      await apiFetch(`${API_URL}/database/campaigns`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCampaignName, message: newCampaignMessage }),
      });
      setNewCampaignName('');
      setNewCampaignMessage(''); 
      fetchCampaigns();
    } catch (err) { alert('Failed to create campaign.'); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this campaign? This will also remove all its account enrollments.')) {
      try {
        await apiFetch(`${API_URL}/database/campaigns/${id}`, { method: 'DELETE' });
        fetchCampaigns();
        fetchCampaignAccounts();
      } catch (err) { alert('Failed to delete campaign.'); }
    }
  };

  const handleUpdate = async (id) => {
    try {
      await apiFetch(`${API_URL}/database/campaigns/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editTitle, message: editMessage }),
      });
      setEditingId(null); 
      fetchCampaigns();
    } catch (err) { alert('Failed to update campaign.'); }
  };

  const startEditing = (campaign) => {
    setEditingId(campaign.id); 
    setEditTitle(campaign.name);
    setEditMessage(campaign.message);
  };
    
  const handleWorkflowToggle = async () => {
    setWorkflowError('');
    if (workflowStatus === 'starting') return;
    if (!selectedCampaign) {
      alert('Please select a campaign to start the workflow.');
      return;
    }
    setWorkflowStatus('starting');
    try {
      await apiFetch(WORKFLOW_START_URL, {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedCampaign.value, name: selectedCampaign.label }),
      });
      alert('Workflow activated');
    } catch (err) {
      setWorkflowError('Failed to start workflow. Check the server console.');
    } finally {
      setWorkflowStatus('idle');
    }
  };

  // --- Helper Functions & Dynamic Properties (Original) ---
  const formatTimestamp = (ts) => ts ? new Date(ts).toLocaleString() : 'N/A';
  const getStatusClass = (status) => {
    switch (status) {
      case 'HEALTHY': return 'bg-green-600 text-white';
      case 'RATE_LIMITED': return 'bg-yellow-500 text-black';
      case 'BANNED': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const isButtonDisabled = workflowStatus === 'starting';
  const getWorkflowButtonText = () => workflowStatus === 'starting' ? 'Starting...' : 'Start Master Workflow';
  const getWorkflowButtonClass = () => 'bg-indigo-600 hover:bg-indigo-700';

  // --- Styles (Original) ---
  const cardStyle = "bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700";
  const headingStyle = "text-xl font-semibold text-white mb-4";
  const buttonStyle = "px-4 py-2 font-bold rounded-lg transition-colors text-xs";
  const headerButtonStyle = "px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors";
  const inputStyle = "bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500";
  
  const selectStyles = {
    control: (provided) => ({ ...provided, backgroundColor: '#374151', borderColor: '#4B5563', color: 'white' }),
    singleValue: (provided) => ({ ...provided, color: 'white' }),
    menu: (provided) => ({ ...provided, backgroundColor: '#1F2937' }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#0891B2' : state.isFocused ? '#374151' : '#1F2937',
      color: 'white',
      ':active': { backgroundColor: '#0E7490' },
    }),
  };

  const campaignOptions = campaigns.map(c => ({ value: c.id, label: c.name }));

  // --- NEW: A flag to determine which view to show ---
  const hasFilters = searchParams.toString().length > 0;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Outreach Dashboard" />
      {managingCampaign && (
        <EnrollmentModal
          campaign={managingCampaign}
          onClose={() => setManagingCampaign(null)}
          onSave={fetchCampaignAccounts}
        />
      )}
      <main className="p-6">
        <div className="container mx-auto grid grid-cols-1 gap-8">
          
          {/* --- NEW: Conditional rendering for the filter results view --- */}
          {hasFilters ? (
            <div className={cardStyle}>
              <div className="flex justify-between items-center mb-4">
                <h2 className={headingStyle}>Filtered Contact Results</h2>
                <Link to="/outreach">
                  <button className={`${buttonStyle} bg-gray-600 hover:bg-gray-500 text-base`}>
                    Clear Results & Go Back
                  </button>
                </Link>
              </div>
              {contactsError && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{contactsError}</p>}
              <div className="overflow-x-auto border border-gray-700 rounded-lg">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Organization</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Tags</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Campaign Logs</th>
                    </tr>
                  </thead>
                  <tbody className="bg-gray-800 divide-y divide-gray-700">
                    {contactsLoading ? (
                      <tr><td colSpan="5" className="text-center py-4 text-cyan-400">Loading filtered contacts...</td></tr>
                    ) : filteredContacts.length > 0 ? (
                      filteredContacts.map((contact) => (
                        <tr key={contact.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{contact.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{contact.organization || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{contact.type || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{contact.tags || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {contact.campaign_log?.length > 0 ? `${contact.campaign_log.length} entries` : 'None'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5" className="text-center py-4 text-gray-500">No contacts found for these filters.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            // --- The original dashboard view ---
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Campaign Manager Card */}
              <div className={`${cardStyle} flex flex-col space-y-6`}>
                <div className="flex justify-between items-center">
                  <h2 className={headingStyle} style={{ marginBottom: 0 }}>Campaign Manager</h2>
                  <div className="flex items-center space-x-2">
                      <Link to="/outreach/stats">
                          <button className={`${headerButtonStyle} bg-teal-600 hover:bg-teal-700`}>Stats</button>
                      </Link>
                      {/* MODIFIED: Button now links to the dedicated filter page */}
                      <Link to="/outreach/filter">
                        <button className={`${headerButtonStyle} bg-gray-600 hover:bg-gray-500`}>Filter Data</button>
                      </Link>
                  </div>
                </div>
                
                <div>
                    <div className="mb-4">
                        <Select options={campaignOptions} onChange={setSelectedCampaign} value={selectedCampaign} styles={selectStyles} placeholder="Select a campaign..." isClearable />
                    </div>
                  <button onClick={handleWorkflowToggle} disabled={isButtonDisabled} className={`${buttonStyle} ${getWorkflowButtonClass()} disabled:bg-gray-500 w-full text-base`}>
                    {getWorkflowButtonText()}
                  </button>
                  {workflowError && <p className="text-red-400 mt-2 text-sm">{workflowError}</p>}
                </div>

                <form onSubmit={handleCreate} className="space-y-4">
                  <input type="text" value={newCampaignName} onChange={(e) => setNewCampaignName(e.target.value)} placeholder="Enter new campaign name" className={inputStyle} required />
                  <textarea value={newCampaignMessage} onChange={(e) => setNewCampaignMessage(e.target.value)} placeholder="Enter new campaign message" className={`${inputStyle} h-24`} required />
                  <button type="submit" className={`${buttonStyle} bg-cyan-600 hover:bg-cyan-700 w-full text-base`}>Add Campaign</button>
                </form>

                <div className="grow">
                  <h3 className="text-lg font-semibold text-gray-300 mb-3">Existing Campaigns</h3>
                  {campaignsLoading && <p className="text-cyan-400">Loading campaigns...</p>}
                  {campaignsError && <p className="text-red-400">{campaignsError}</p>}
                  <ul className="space-y-4">
                    {campaigns.map((c) => (
                      <li key={c.id} className="bg-gray-900/50 p-4 rounded-lg">
                        {editingId === c.id ? (
                           <div className="flex flex-col space-y-3">
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className={inputStyle} />
                            <textarea value={editMessage} onChange={(e) => setEditMessage(e.target.value)} className={`${inputStyle} h-20`} />
                            <div className="flex items-center space-x-2 self-end">
                                <button onClick={() => handleUpdate(c.id)} className={`${buttonStyle} bg-green-600 hover:bg-green-700`}>Save</button>
                                <button onClick={() => setEditingId(null)} className={`${buttonStyle} bg-gray-600 hover:bg-gray-500`}>Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div className="grow mr-4">
                               <div className="flex items-center space-x-3 mb-1">
                                 <h4 className="font-bold text-white">{c.name}</h4>
                                 <span className="text-xs font-mono text-cyan-300 bg-gray-700 px-2 py-0.5 rounded-full">
                                   ID: {c.id}
                                 </span>
                               </div>
                               <p className="text-gray-400 text-sm mt-1 wrap-break-words">{c.message}</p>
                            </div>
                            <div className="flex items-center space-x-2 shrink-0 ml-4">
                              <button onClick={() => setManagingCampaign(c)} className={`${buttonStyle} bg-blue-600 hover:bg-blue-700`}>Manage</button>
                              <button onClick={() => startEditing(c)} className={`${buttonStyle} bg-gray-600 hover:bg-gray-500`}>Edit</button>
                              <button onClick={() => handleDelete(c.id)} className={`${buttonStyle} bg-red-600 hover:bg-red-700`}>Delete</button>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              {/* Account Status Card */}
              <div className={cardStyle}>
                <div className="flex justify-between items-center mb-4">
                  <h2 className={headingStyle}>Account Status</h2>
                  <button onClick={fetchCampaignAccounts} disabled={accountsLoading} className={`${buttonStyle} bg-gray-600 hover:bg-gray-500 disabled:bg-gray-500 text-base`}>
                    {accountsLoading ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>
                {accountsError && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg">{accountsError}</p>}
                <div className="overflow-x-auto border border-gray-700 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Campaign ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Account</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Cooldown Ends</th>
                      </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                      {accountsLoading ? (
                        <tr><td colSpan="4" className="text-center py-4 text-cyan-400">Loading statuses...</td></tr>
                      ) : accounts.length > 0 ? (
                        accounts.map((acc) => (
                          <tr key={acc.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{acc.campaign_id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{acc.account_name}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusClass(acc.status)}`}>{acc.status.replace('_', ' ')}</span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{formatTimestamp(acc.cooldown_until)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="text-center py-4 text-gray-500">No account data found.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default OutreachPage;