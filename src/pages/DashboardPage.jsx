import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar'; 
import { Send, Monitor, FileSearch, Users } from 'lucide-react';

const features = [
  { name: 'Outreach', color: 'from-blue-500 to-blue-600', path: '/outreach', icon: Send },
  { name: 'Keyword Monitor', color: 'from-green-500 to-green-600', path: '/keyword-monitor', icon: Monitor },
  { name: 'Keyword Searching', color: 'from-purple-500 to-purple-600', path: '/keyword-searching', icon: FileSearch },
  { name: 'Group Member Scraping', color: 'from-pink-500 to-pink-600', path: '/export-group', icon: Users },
];

// --- STEP 2: The local Navbar definition has been removed from this file ---

const Dashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* --- STEP 3: Use the imported Navbar and pass the pageTitle prop --- */}
      <Navbar pageTitle="Features Dashboard" />
      
      <div className="container mx-auto p-6 md:p-8">
        
        <div className="flex flex-wrap justify-center gap-6">
          {features.map((feature) => {
            const Icon = feature.icon; 
            return (
              <Link 
                to={feature.path} 
                key={feature.name} 
                // Corrected a typo: bg-linear-to-br -> bg-gradient-to-br
                className={`bg-linear-to-br ${feature.color} text-white p-8 rounded-xl shadow-lg 
                           flex flex-col items-center justify-center gap-4 
                           text-xl font-semibold transform hover:-translate-y-1 
                           hover:shadow-2xl transition-all duration-300 w-64 h-48`}
              >
                <Icon size={48} strokeWidth={1.5} />
                <span>{feature.name}</span>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
            <Link 
              to="/register-account" 
              className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-colors"
            >
                Register New Account
            </Link>
            
            <Link 
              // Corrected the path to match the router
              to="/manage-accounts" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-lg text-lg ml-4 transition-colors"
            >
                Manage Accounts
            </Link>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;