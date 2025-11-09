import { useState, useEffect } from 'react';
import Select from 'react-select';
import Navbar from '../components/Navbar'; 

const API_BASE_URL = import.meta.env.VITE_KEYWORD_SEARCH_API_URL;

function KeywordSearchPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Simplified state: searchResult holds the entire response object { messages, summary_html }
  const [searchResult, setSearchResult] = useState(null);

  // State for form inputs
  const [chatOptions, setChatOptions] = useState([]);
  const [keywords, setKeywords] = useState('');
  const [selectedChats, setSelectedChats] = useState([]);
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  
  // useEffect to fetch chat options when the component mounts
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/chats`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        const options = data.map(chat => ({
          value: chat.id,
          label: chat.name
        }));
        setChatOptions(options);
      } catch (err) {
        setError('Failed to fetch chat list. Please ensure the backend API is running.');
      }
    };

    fetchChats();
  }, []);

  // Simplified handler for the search submission
  const handleSearchSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setError('');
    setSearchResult(null);

    const searchData = {
      keywords: keywords.split(',').map(k => k.trim()).filter(k => k),
      chats: selectedChats.map(option => option.value),
      start_date: `${startDate}T00:00:00`,
      end_date: `${endDate}T23:59:59`,
    };

    try {
      // Call the single, unified '/api/search' endpoint
      const response = await fetch(`${API_BASE_URL}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'An unknown error occurred during the search.');
      }
      
      // Set the entire result in state once.
      setSearchResult(result);

    } catch (err) {
      setError(`Search failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Custom styles for react-select
  const customSelectStyles = {
    control: (provided) => ({ ...provided, backgroundColor: '#374151', borderColor: '#4b5563', '&:hover': { borderColor: '#6b7280' } }),
    multiValue: (provided) => ({ ...provided, backgroundColor: '#1f2937' }),
    multiValueLabel: (provided) => ({ ...provided, color: '#d1d5db' }),
    menu: (provided) => ({ ...provided, backgroundColor: '#1f2937' }),
    option: (provided, state) => ({ ...provided, backgroundColor: state.isSelected ? '#06b6d4' : state.isFocused ? '#374151' : '#1f2937', color: '#d1d5db' }),
    input: (provided) => ({ ...provided, color: '#d1d5db' }),
    placeholder: (provided) => ({ ...provided, color: '#6b7280' }),
  };
  
  const ResultsDisplay = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-full rounded-lg bg-gray-800 p-8">
          <div className="text-center text-gray-400">
             <svg className="animate-spin h-8 w-8 mx-auto mb-3 text-cyan-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p>Searching messages and generating summary...</p>
          </div>
        </div>
      );
    }

    if (error) {
      return <div className="text-red-400 bg-red-900/50 border border-red-800 p-4 rounded-md">{error}</div>;
    }

    if (!searchResult) {
      return (
        <div className="text-center text-gray-500 h-full flex items-center justify-center rounded-lg bg-gray-800 p-8">
          <p>Your search results will appear here.</p>
        </div>
      );
    }
    
    return (
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">Summary</h2>
          <div 
            className="prose prose-invert max-w-none text-gray-300"
            dangerouslySetInnerHTML={{ __html: searchResult.summary_html }}
          />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-cyan-400 mb-4">
            Found Messages ({searchResult.messages.length})
          </h2>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            {searchResult.messages.length > 0 ? (
              searchResult.messages.map((msg, index) => (
                <div key={index} className="bg-gray-900/50 border border-gray-700 rounded-lg p-4 shadow-md transition-transform duration-200 hover:scale-[1.01] hover:border-cyan-700/50">
                  {/* Card Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold text-gray-100">{msg.author}</p>
                      <p className="text-sm text-cyan-400 -mt-1">{msg.username}</p>
                    </div>
                    <span className="bg-gray-700 text-gray-300 text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap">{msg.chat_name}</span>
                  </div>

                  {/* Message Body */}
                  <p className="text-gray-300 my-2 wrap-break-words">
                    {msg.text}
                  </p>
                  
                  {/* Card Footer */}
                  <div className="text-right text-xs text-gray-500 mt-3">
                    {new Date(msg.date).toLocaleString()}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500">No messages found for your criteria.</div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen bg-gray-900 font-sans text-white">
      <Navbar pageTitle='Keyword Search'/>
      <main className="max-w-7xl mx-auto py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
              <h2 className="text-2xl font-bold mb-5 text-cyan-400">Keyword Search</h2>
              <form onSubmit={handleSearchSubmit} className="space-y-6">
                <div>
                  <label htmlFor="keywords" className="block text-sm font-medium text-gray-400 mb-1">Keywords (comma-separated)</label>
                  <input type="text" name="keywords" id="keywords" placeholder='e.g. Web3, n8n' required value={keywords} onChange={(e) => setKeywords(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
                <div>
                  <label htmlFor="chats" className="block text-sm font-medium text-gray-400 mb-1">Groups/Channels</label>
                  <Select id="chats" name="chats" options={chatOptions} isMulti required value={selectedChats} onChange={setSelectedChats} className="mt-1" classNamePrefix="select" placeholder="Select chats..." styles={customSelectStyles} />
                </div>
                <div>
                  <label htmlFor="start_date" className="block text-sm font-medium text-gray-400 mb-1">Start Date</label>
                  <input type="date" name="start_date" id="start_date" required value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
                <div>
                  <label htmlFor="end_date" className="block text-sm font-medium text-gray-400 mb-1">End Date</label>
                  <input type="date" name="end_date" id="end_date" required value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2.5 text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500" />
                </div>
                <div>
                  <button type="submit" disabled={isLoading} className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-cyan-500 disabled:bg-cyan-800 disabled:cursor-not-allowed">
                    {isLoading ? 'Searching & Summarizing...' : 'Search'}
                  </button>
                </div>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2">
            <ResultsDisplay />
          </div>
        </div>
      </main>
    </div>
  );
}

export default KeywordSearchPage;