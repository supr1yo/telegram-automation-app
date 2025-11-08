import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar'; 

const API_BASE_URL = import.meta.env.VITE_KEYWORD_MONITOR_API_URL;


function KeywordMonitorPage() {
  
  // State for the list of groups currently being monitored
  const [monitoredGroups, setMonitoredGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State for the "Add New Group" form
  const [availableGroups, setAvailableGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [isClientConnecting, setIsClientConnecting] = useState(true);

  // State for inline editing of keywords
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editingKeywordsText, setEditingKeywordsText] = useState('');


  // --- NEW: Function to fetch the list of MONITORED groups ---
  const fetchMonitoredGroups = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/groups`);
      if (response.ok) {
        const data = await response.json();
        // The API returns an object, but we need an array to map over.
        // This converts { "chat_id1": {...}, "chat_id2": {...} } into an array.
        const groupsArray = Object.entries(data).map(([chat_id, groupData]) => ({
          chat_id: parseInt(chat_id), // The key from the object IS the chat_id
          ...groupData
        }));
        setMonitoredGroups(groupsArray);
      } else {
        console.error("Failed to fetch monitored groups");
      }
    } catch (error) {
      console.error("Error fetching monitored groups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect to fetch AVAILABLE groups for the dropdown (with retry logic)
  useEffect(() => {
    const fetchAvailableGroups = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/available`);
        if (response.ok) {
          const data = await response.json();
          setAvailableGroups(data);
          setIsClientConnecting(false);
        } else if (response.status === 503) {
          console.log("Client not ready (503), retrying in 3 seconds...");
          setTimeout(fetchAvailableGroups, 3000);
        } else {
          console.error("Failed to fetch available groups, status:", response.status);
          setIsClientConnecting(false);
        }
      } catch (error) {
        console.error("Error fetching available groups:", error);
        setTimeout(fetchAvailableGroups, 3000);
      }
    };
    fetchAvailableGroups();
  }, []);

  // useEffect to fetch MONITORED groups when the component loads
  useEffect(() => {
    fetchMonitoredGroups();
  }, []);

  const handleAddGroup = async (groupPayload) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupPayload)
      });
      if (response.ok) {
        await fetchMonitoredGroups(); // Refresh the list
        setSelectedGroupId('');
        setNewKeywords('');
      } else {
        const errorData = await response.json();
        alert(`Error adding group: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to add group:", error);
      alert("An unexpected error occurred.");
    }
  };
  
  const handleDeleteGroup = async (groupId) => {
    if (window.confirm('Are you sure you want to stop monitoring this group?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          await fetchMonitoredGroups(); // Refresh the list
        } else {
          const errorData = await response.json();
          alert(`Error deleting group: ${errorData.detail}`);
        }
      } catch (error) {
        console.error("Failed to delete group:", error);
        alert("An unexpected error occurred.");
      }
    }
  };

  const handleUpdateKeywords = async (groupId, keywords) => {
    try {
      const response = await fetch(`${API_BASE_URL}/groups/${groupId}/keywords`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: keywords }) // API expects {"keywords": [...]}
      });
      if (response.ok) {
        await fetchMonitoredGroups(); // Refresh the list
        setEditingGroupId(null);
        setEditingKeywordsText('');
      } else {
        const errorData = await response.json();
        alert(`Error updating keywords: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Failed to update keywords:", error);
      alert("An unexpected error occurred.");
    }
  };

  // --- Form submission and UI handlers ---

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!selectedGroupId || !newKeywords) {
      alert('Please select a group and provide keywords.');
      return;
    }
    const selectedGroup = availableGroups.find(g => g.id === parseInt(selectedGroupId));
    const groupPayload = {
      group_id: parseInt(selectedGroupId),
      group_name: selectedGroup ? selectedGroup.title : 'Unknown Group',
      keywords: newKeywords.split(',').map(kw => kw.trim()).filter(Boolean),
      case_sensitive: false, // Default values
      whole_word: false      // Default values
    };
    handleAddGroup(groupPayload); // Call the new API handler
  };

  const handleEditClick = (group) => {
    setEditingGroupId(group.chat_id);
    setEditingKeywordsText(group.keywords.join(', '));
  };

  const handleCancelEdit = () => {
    setEditingGroupId(null);
    setEditingKeywordsText('');
  };

  const handleSaveClick = (groupId) => {
    const updatedKeywords = editingKeywordsText.split(',').map(kw => kw.trim()).filter(Boolean);
    handleUpdateKeywords(groupId, updatedKeywords); // Call the new API handler
  };

  const cardStyle = "bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-6xl mx-auto border border-gray-700";
  const labelStyle = "block text-gray-400 text-sm font-bold mb-2";
  const inputStyle = "bg-gray-700 shadow border border-gray-600 rounded w-full py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500";
  const buttonStyle = "w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors";
  const actionButton = "py-1 px-3 rounded-md text-sm font-semibold text-white transition-colors";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Keyword Monitor" />
      <main className="p-4 sm:p-8">
        <div className={cardStyle}>
          <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">Manage Monitored Groups</h2>
          
          {/* ADD NEW GROUP FORM */}
          <div className="bg-gray-900/50 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-semibold mb-4 border-b border-gray-600 pb-2">Add New Group</h3>
            {isClientConnecting ? (
              <div className="text-center text-gray-400 p-4">
                <p>Connecting to Telegram, please wait...</p>
              </div>
            ) : (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className={labelStyle}>Group</label>
                  <select
                    value={selectedGroupId}
                    onChange={(e) => setSelectedGroupId(e.target.value)}
                    className={inputStyle} required>
                    <option value="" disabled>Select a group</option>
                    {availableGroups.length > 0 ? (
                      availableGroups.map(group => (
                        <option key={group.id} value={group.id}>{group.title}</option>
                      ))
                    ) : (
                      <option disabled>No groups found</option>
                    )}
                  </select>
                </div>
                <div>
                  <label className={labelStyle}>Keywords (comma-separated)</label>
                  <input
                    type="text"
                    value={newKeywords}
                    onChange={(e) => setNewKeywords(e.target.value)}
                    placeholder="e.g., fastapi, bitcoin, gaming"
                    className={inputStyle} required />
                </div>
                <button type="submit" className={buttonStyle} disabled={availableGroups.length === 0}>Add Group</button>
              </form>
            )}
          </div>
          
          {/* CURRENTLY MONITORING LIST */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Currently Monitoring ({monitoredGroups.length})</h3>
            {isLoading ? (
              <p className="text-gray-400">Loading groups...</p>
            ) : (
              <ul className="space-y-4">
                {monitoredGroups.length > 0 ? (
                  monitoredGroups.map(group => (
                    <li key={group.chat_id} className="flex flex-col sm:flex-row justify-between sm:items-center bg-gray-700/60 p-4 rounded-lg gap-4">
                      <div className="flex-1 pr-4">
                        <strong className="text-lg text-white">{group.name || `ID: ${group.chat_id}`}</strong>
                        <div className="text-gray-300 mt-1">
                          <strong className="text-gray-400">Keywords: </strong>
                          {editingGroupId === group.chat_id ? (
                            <input
                              type="text"
                              className="bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white w-full sm:w-auto focus:outline-none focus:ring-1 focus:ring-cyan-500"
                              value={editingKeywordsText}
                              onChange={(e) => setEditingKeywordsText(e.target.value)} />
                          ) : (
                            <span className="wrap-break-words">{group.keywords.join(', ')}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 shrink-0">
                        {editingGroupId === group.chat_id ? (
                          <>
                            <button className={`${actionButton} bg-green-600 hover:bg-green-700`} onClick={() => handleSaveClick(group.chat_id)}>Save</button>
                            <button className={`${actionButton} bg-gray-500 hover:bg-gray-600`} onClick={handleCancelEdit}>Cancel</button>
                          </>
                        ) : (
                          <>
                            <button className={`${actionButton} bg-blue-600 hover:bg-blue-700`} onClick={() => handleEditClick(group)}>Edit</button>
                            <button className={`${actionButton} bg-red-600 hover:bg-red-700`} onClick={() => handleDeleteGroup(group.chat_id)}>Delete</button>
                          </>
                        )}
                      </div>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-400 bg-gray-700/50 p-4 rounded-lg text-center">No groups are being monitored.</p>
                )}
              </ul>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default KeywordMonitorPage;