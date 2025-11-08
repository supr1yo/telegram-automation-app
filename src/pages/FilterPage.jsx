import { useState, useCallback } from 'react';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabaseClient';
import { Filter, X, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

function FilterPage() {
  // State for input fields
  const [organization, setOrganization] = useState('');
  const [tags, setTags] = useState('');
  const [type, setType] = useState('');
  
  // --- NEW: State for the checkbox to toggle between outreached and non-outreached contacts ---
  const [showOutreached, setShowOutreached] = useState(true);

  // State for data management
  const [filterResults, setFilterResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Consistent styling
  const cardStyle = "bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 max-w-7xl mx-auto";
  const headingStyle = "text-xl font-semibold text-white mb-6";
  const inputStyle = "bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const labelStyle = "block text-gray-300 text-sm font-bold mb-2";
  const buttonStyle = "px-4 py-2 font-bold rounded-lg transition-colors text-base flex items-center justify-center space-x-2";

  // Helper to format timestamps neatly
  const formatTimestamp = (ts) => {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleDateString('en-GB', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getStatusClass = (status) => {
    const lowerCaseStatus = status?.toLowerCase();
    switch (lowerCaseStatus) {
      case 'contacted': return 'bg-green-600 text-white';
      case 'wrong tg': return 'bg-red-600 text-white';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const handleApplyFilters = useCallback(async () => {
    setLoading(true);
    setError('');
    setFilterResults(null);

    try {
      if (showOutreached) {
        // --- LOGIC 1: Fetch contacts WITH campaign logs (Original behavior) ---
        let query = supabase.from('campaign_log').select(`
          status, replied, sent_at,
          contacts ( id, fullname, username, organisation, tags, type ),
          campaigns ( id, name )
        `);
        
        if (organization.trim()) query = query.ilike('contacts.organisation', `%${organization.trim()}%`);
        if (tags.trim()) query = query.ilike('contacts.tags', `%${tags.trim()}%`);
        if (type.trim()) query = query.eq('contacts.type', type.trim());
        query = query.order('sent_at', { ascending: false });

        const { data, error: queryError } = await query;
        if (queryError) throw queryError;

        const groupedContacts = {};
        (data || []).forEach(log => {
          if (!log.contacts) return;
          const contactId = log.contacts.id;
          if (!groupedContacts[contactId]) {
            groupedContacts[contactId] = { ...log.contacts, campaignActivity: [] };
          }
          groupedContacts[contactId].campaignActivity.push({
            name: log.campaigns?.name || 'Unknown Campaign',
            status: log.status || 'N/A',
            replied: log.replied,
            sent_at: log.sent_at,
          });
        });
        setFilterResults(Object.values(groupedContacts));

      } else {
        // --- LOGIC 2: Fetch contacts WITHOUT any campaign logs ---
        // Step 1: Get the IDs of all contacts that have an entry in campaign_log.
        const { data: outreachedLogs, error: logError } = await supabase
          .from('campaign_log')
          .select('contact_id');
        if (logError) throw logError;
        const outreachedContactIds = outreachedLogs.map(log => log.contact_id);

        // Step 2: Fetch contacts whose IDs are NOT in the list of outreached IDs.
        let query = supabase
          .from('contacts')
          .select('*')
          .not('id', 'in', `(${outreachedContactIds.join(',')})`);

        if (organization.trim()) query = query.ilike('organisation', `%${organization.trim()}%`);
        if (tags.trim()) query = query.ilike('tags', `%${tags.trim()}%`);
        if (type.trim()) query = query.eq('type', type.trim());
        
        const { data: contactsData, error: contactsError } = await query;
        if (contactsError) throw contactsError;

        // Format data to match the structure expected by the table
        const processedData = contactsData.map(contact => ({
          ...contact,
          campaignActivity: [], // Ensure campaignActivity is an empty array
        }));
        setFilterResults(processedData);
      }
    } catch (err) {
      console.error("Error fetching or processing filtered data:", err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [organization, tags, type, showOutreached]);

  const handleClearFilters = () => {
    setOrganization('');
    setTags('');
    setType('');
    setFilterResults(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Filter Outreach Data" />
      <main className="p-6">
        <div className="mb-6">
          <Link to="/outreach" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Outreach
          </Link>
        </div>

        <div className={cardStyle}>
          <h2 className={headingStyle}>Filter Contacts & Campaign Logs</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="organization" className={labelStyle}>Organisation</label>
              <input id="organization" type="text" value={organization} onChange={(e) => setOrganization(e.target.value)} placeholder="Filter by organisation..." className={inputStyle} />
            </div>
            <div>
              <label htmlFor="tags" className={labelStyle}>Tags</label>
              <input id="tags" type="text" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="Filter by tags..." className={inputStyle} />
            </div>
            <div>
              <label htmlFor="type" className={labelStyle}>Type</label>
              <input id="type" type="text" value={type} onChange={(e) => setType(e.target.value)} placeholder="Filter by type..." className={inputStyle} />
            </div>
          </div>

          {/* --- NEW: Checkbox to control filter logic --- */}
          <div className="flex items-center mt-6 pt-4 border-t border-gray-700">
            <input
              id="show-outreached"
              type="checkbox"
              checked={showOutreached}
              onChange={(e) => setShowOutreached(e.target.checked)}
              className="h-4 w-4 rounded bg-gray-600 border-gray-500 text-cyan-500 focus:ring-cyan-600"
            />
            <label htmlFor="show-outreached" className="ml-3 block text-sm font-medium text-gray-300">
              Accounts Outreached
            </label>
          </div>
          
          <div className="flex justify-end space-x-4 mt-6">
            <button onClick={handleClearFilters} className={`${buttonStyle} bg-gray-600 hover:bg-gray-500`}>
              <X size={18} /><span>Clear</span>
            </button>
            <button onClick={handleApplyFilters} disabled={loading} className={`${buttonStyle} bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-500`}>
              <Filter size={18} /><span>{loading ? 'Searching...' : 'Apply Filters'}</span>
            </button>
          </div>
        </div>

        <div className={`${cardStyle} mt-8`}>
          <h2 className={headingStyle}>Results</h2>
          {error && <p className="text-red-400 bg-red-900/50 p-3 rounded-lg mb-4">{error}</p>}
          
          {loading ? (
            <p className="text-center text-cyan-400 py-4">Loading results...</p>
          ) : filterResults === null ? (
            <p className="text-center text-gray-500 py-4">Click "Apply Filters" to see results.</p>
          ) : filterResults.length > 0 ? (
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Full Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Organisation</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Campaign & Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Log Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Reply Status</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {filterResults.map((contact) => (
                    <tr key={contact.id}>
                      <td className="px-6 py-4 align-top whitespace-nowrap text-sm font-medium text-gray-200">{contact.fullname || 'N/A'}</td>
                      <td className="px-6 py-4 align-top whitespace-nowrap text-sm text-gray-400">@{contact.username || 'N/A'}</td>
                      <td className="px-6 py-4 align-top whitespace-nowrap text-sm text-gray-400">{contact.organisation || 'N/A'}</td>
                      
                      {/* --- MODIFIED: Conditionally render campaign details --- */}
                      <td className="px-6 py-4 align-top text-sm">
                        {contact.campaignActivity.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            {contact.campaignActivity.map((activity, index) => (
                              <div key={index} className="flex items-center h-6">
                                <span className="font-bold text-cyan-300 w-32 truncate" title={activity.name}>{activity.name}</span>
                                <span className="text-gray-400 text-xs ml-3">({formatTimestamp(activity.sent_at)})</span>
                              </div>
                            ))}
                          </div>
                        ) : (<span className="text-gray-500">No outreach</span>)}
                      </td>
                      <td className="px-6 py-4 align-top text-sm">
                        {contact.campaignActivity.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            {contact.campaignActivity.map((activity, index) => (
                              <div key={index} className="flex items-center h-6">
                                <span className={`inline-block rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(activity.status)}`}>
                                  {activity.status}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (<span className="text-gray-500">N/A</span>)}
                      </td>
                      <td className="px-6 py-4 align-top text-sm">
                        {contact.campaignActivity.length > 0 ? (
                          <div className="flex flex-col space-y-2">
                            {contact.campaignActivity.map((activity, index) => (
                              <div key={index} className="flex items-center h-6">
                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${activity.replied ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-200'}`}>
                                  {activity.replied ? 'Yes' : 'No'}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (<span className="text-gray-500">N/A</span>)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500 py-4">No contacts found for the specified filters.</p>
          )}
        </div>
      </main>
    </div>
  );
}

export default FilterPage;