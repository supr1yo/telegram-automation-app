import React, { useState } from 'react';
import Navbar from '../components/Navbar'; 

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_EXPORT_GROUP_MEMBERS_API_URL;


const formatUserName = (member) => {
  const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim();
  return fullName || member.username || 'N/A';
};

const ExportMemberPage = () => {
  const [groupId, setGroupId] = useState('');
  const [membersData, setMembersData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showExportMenu, setShowExportMenu] = useState(false);

  const fetchGroupMembers = async () => {
    if (!groupId) {
      setError('Please enter a Group ID.');
      return;
    }
    setLoading(true);
    setError('');
    setMembersData(null);

    try {
      const response = await fetch(`${API_BASE_URL}/export-group/${groupId}`);

      if (!response.ok) { 
        const errorData = await response.json(); 
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json(); // Parse the JSON response

      console.log(result); // Log the parsed result

      if (result && result.status === 'success') {
        setMembersData(result.data || []);
      } else if (result) {
        setError(result.message || 'An unknown error occurred.');
        setMembersData([]);
      } else {
        setError('Received an empty or invalid response from the server.');
        setMembersData([]);
      }
    } catch (err) {
      console.error("API call failed:", err);
      // For fetch, network errors (like server not running) or explicit throws from !response.ok go here
      setError(`Failed to fetch group members: ${err.message}. Is the server running on port 8011?`);
      setMembersData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = (format) => {
    if (!membersData || membersData.length === 0) return;
    if (format === 'CSV') {
      const headers = ['User ID', 'Username', 'First Name', 'Last Name'].join(',');
      const rows = membersData.map(member =>
        [
          member.user_id,
          `"${member.username || ''}"`,
          `"${member.first_name || ''}"`,
          `"${member.last_name || ''}"`
        ].join(',')
      );
      const csv = [headers, ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `group_${groupId}_members.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    setShowExportMenu(false);
  };

  const toggleRow = (userId) => {
    const newExpanded = new Set(expandedRows);
    newExpanded.has(userId) ? newExpanded.delete(userId) : newExpanded.add(userId);
    setExpandedRows(newExpanded);
  };

  // --- Dark Theme Styles ---
  const formInputStyle = "bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const formLabelStyle = "block text-gray-400 text-sm font-bold mb-2";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Group Exporter" />
      
      <div className="container mx-auto p-6">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-700">
          <div className="flex items-start space-x-4 mb-6">
            <div className="grow">
              <label htmlFor="group-id-input" className={formLabelStyle}>
                Telegram Group ID
              </label>
              <input
                type="text"
                id="group-id-input"
                value={groupId}
                onChange={(e) => setGroupId(e.target.value)}
                placeholder="-100123456789"
                className={formInputStyle}
              />
            </div>
            <div className="relative pt-7">
              <button
                onClick={fetchGroupMembers}
                disabled={!groupId || loading}
                className="px-5 py-3 bg-cyan-600 text-white font-bold rounded-lg hover:bg-cyan-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Loading...' : 'Fetch Members'}
              </button>
            </div>
            <div className="relative pt-7">
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!membersData || membersData.length === 0}
                className="px-5 py-3 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors"
              >
                Export
              </button>
              {showExportMenu && (
                <div className="absolute right-0 mt-2 w-32 bg-gray-700 border border-gray-600 rounded-md shadow-lg z-10">
                  <button
                    onClick={() => handleExport('CSV')}
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-600 w-full text-left"
                  >
                    As CSV
                  </button>
                </div>
              )}
            </div>
          </div>

          {loading && <div className="text-center py-8 text-cyan-400">Fetching members...</div>}
          {error && <div className="text-center py-8 text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</div>}
          
          {membersData && !loading && (
            <div className="overflow-x-auto border border-gray-700 rounded-lg">
              <div className="p-4 bg-gray-800 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Found {membersData.length} Members</h2>
              </div>
              <table className="min-w-full divide-y divide-gray-700">
                <thead className="bg-gray-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Username</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">User ID</th>
                  </tr>
                </thead>
                <tbody className="bg-gray-800 divide-y divide-gray-700">
                  {membersData.map((member) => (
                    <React.Fragment key={member.user_id}>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-200">{formatUserName(member)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">@{member.username || 'N/A'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{member.user_id}</td>
                      </tr>
                      {expandedRows.has(member.user_id) && (
                        <tr className="bg-gray-900/60">
                          <td colSpan="4" className="px-6 py-4">
                            <div className="text-sm text-gray-300 grid grid-cols-2 gap-x-4">
                              <p><strong>First Name:</strong> {member.first_name || 'N/A'}</p>
                              <p><strong>Last Name:</strong> {member.last_name || 'N/A'}</p>
                              <p><strong>Username:</strong> @{member.username || 'N/A'}</p>
                              <p><strong>User ID:</strong> {member.user_id}</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportMemberPage;