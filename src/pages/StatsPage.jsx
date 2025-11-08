import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient'; 
import Navbar from '../components/Navbar';

function StatsPage() {
  const [stats, setStats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const calculateStats = useCallback((campaigns, logs) => {
    const statsMap = new Map();

    // Initialize map with all campaigns
    campaigns.forEach(campaign => {
      statsMap.set(campaign.id, {
        name: campaign.name,
        totalContacts: new Set(),
        messagesSent: 0,
        replies: 0,
      });
    });

    // Process logs
    logs.forEach(log => {
      if (statsMap.has(log.campaign_id)) {
        const campaignStat = statsMap.get(log.campaign_id);
        
        // Add unique contact ID to the set
        campaignStat.totalContacts.add(log.contact_id);

        // Count sent messages
        if (log.status === 'Contacted') {
          campaignStat.messagesSent++;
        }

        // Count replies
        if (log.replied === true) {
          campaignStat.replies++;
        }
      }
    });

    // Convert map to array and calculate reply rate
    const finalStats = Array.from(statsMap.values()).map(stat => {
      const replyRate = stat.messagesSent > 0 ? (stat.replies / stat.messagesSent) * 100 : 0;
      return {
        ...stat,
        totalContacts: stat.totalContacts.size, // Get the count of unique contacts
        replyRate: replyRate.toFixed(1), // Format to one decimal place
      };
    });

    return finalStats;
  }, []);

  const fetchStatsData = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      // Fetch all campaigns and all logs in parallel
      const [campaignsResponse, logsResponse] = await Promise.all([
        supabase.from('campaigns').select('id, name').order('created_at', { ascending: false }),
        supabase.from('campaign_log').select('campaign_id, contact_id, status, replied')
      ]);

      if (campaignsResponse.error) throw campaignsResponse.error;
      if (logsResponse.error) throw logsResponse.error;
      
      const processedStats = calculateStats(campaignsResponse.data, logsResponse.data);
      setStats(processedStats);

    } catch (err) {
      console.error("Error fetching stats data:", err);
      setError('Failed to load campaign statistics. Please check the console for details.');
    } finally {
      setIsLoading(false);
    }
  }, [calculateStats]);

  useEffect(() => {
    fetchStatsData();
  }, [fetchStatsData]);

  // --- Styles ---
  const cardStyle = "bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700";
  const statBoxStyle = "bg-gray-900/50 p-4 rounded-lg text-center";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Campaign Statistics" />
      <main className="p-6 container mx-auto">
        <div className="mb-6">
          <Link to="/outreach" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Outreach
          </Link>
        </div>

        {isLoading && <p className="text-center text-lg">Loading statistics...</p>}
        {error && <p className="text-center text-red-400 bg-red-900/50 p-4 rounded-lg">{error}</p>}
        
        {!isLoading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stats.length > 0 ? stats.map(campaign => (
              <div key={campaign.name} className={cardStyle}>
                <h3 className="text-xl font-bold text-white mb-4 truncate">{campaign.name}</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className={statBoxStyle}>
                    <p className="text-2xl font-semibold text-cyan-400">{campaign.totalContacts}</p>
                    <p className="text-xs text-gray-400">Total Contacts</p>
                  </div>
                  <div className={statBoxStyle}>
                    <p className="text-2xl font-semibold text-cyan-400">{campaign.messagesSent}</p>
                    <p className="text-xs text-gray-400">Messages Sent</p>
                  </div>
                  <div className={statBoxStyle}>
                    <p className="text-2xl font-semibold text-cyan-400">{campaign.replies}</p>
                    <p className="text-xs text-gray-400">Replies</p>
                  </div>
                  <div className={statBoxStyle}>
                    <p className="text-2xl font-semibold text-cyan-400">{campaign.replyRate}%</p>
                    <p className="text-xs text-gray-400">Reply Rate</p>
                  </div>
                </div>
              </div>
            )) : (
              <p className="col-span-full text-center text-gray-500">No campaign data found to generate stats.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default StatsPage;