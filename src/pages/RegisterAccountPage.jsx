import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const API_BASE_URL = import.meta.env.VITE_TELEGRAM_ACCOUNT_SESSIONS_API_URL;

const RegisterAccountPage = () => {
  const [accountName, setAccountName] = useState('');
  const [purpose, setPurpose] = useState('Outreach');
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showOtp, setShowOtp] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const purposeOptions = [
    { value: 'Outreach', label: 'Outreach' },
    { value: 'Keyword_Monitor', label: 'Keyword Monitor' },
    { value: 'Keyword_Searching', label: 'Keyword Searching' },
    { value: 'Group_Member_Scraping', label: 'Group Member Scraping' },
  ];

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const apiIdInt = parseInt(apiId, 10);
      if (isNaN(apiIdInt)) {
        setError('API ID must be a valid number.');
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_BASE_URL}/send_code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_id: apiIdInt,
          api_hash: apiHash,
          phone_number: phoneNo,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send OTP. Please check your details and try again.');
      }
      
      setShowOtp(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_name: accountName,
          purpose,
          api_id: parseInt(apiId, 10),
          api_hash: apiHash,
          phone_number: phoneNo,
          otp,
          password: password || null,
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || 'Login failed. Invalid OTP or password.');
      }

      alert('Account registered successfully!');
      navigate('/dashboard');

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const formInputStyle = "bg-gray-700 shadow appearance-none border border-gray-600 rounded w-full py-3 px-4 text-white leading-tight focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50";
  const formLabelStyle = "block text-gray-400 text-sm font-bold mb-2";

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Navbar pageTitle="Register Account" />
      <div className="flex items-center justify-center p-4">
        <div className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg mt-8 border border-gray-700">
          {!showOtp ? (
            <form onSubmit={handleInitialSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">Register Telegram Account</h2>
              {error && <p className="text-red-400 text-center mb-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}
              
              <div>
                <label className={formLabelStyle} htmlFor="accountName">Account Name</label>
                <input className={formInputStyle} id="accountName" type="text" placeholder="e.g. supr1yo" value={accountName} onChange={(e) => setAccountName(e.target.value)} required />
              </div> 
              
              <div>
                <label className={formLabelStyle} htmlFor="purpose">Purpose</label>
                <select id="purpose" className={formInputStyle} value={purpose} onChange={(e) => setPurpose(e.target.value)} required>
                  {purposeOptions.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className={formLabelStyle} htmlFor="apiId">API ID</label>
                <input className={formInputStyle} id="apiId" type="text" placeholder="Your API ID" value={apiId} onChange={(e) => setApiId(e.target.value)} required />
              </div>
              
              <div>
                <label className={formLabelStyle} htmlFor="apiHash">API Hash</label>
                <input className={formInputStyle} id="apiHash" type="text" placeholder="Your API Hash" value={apiHash} onChange={(e) => setApiHash(e.target.value)} required />
              </div>

              <div>
                <label className={formLabelStyle} htmlFor="phoneNo">Phone Number</label>
                <input className={formInputStyle} id="phoneNo" type="tel" placeholder="+1234567890 (with country code)" value={phoneNo} onChange={(e) => setPhoneNo(e.target.value)} required />
              </div>
              
              <div className="flex items-center justify-center pt-4">
                <button type="submit" disabled={isLoading} className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full disabled:bg-gray-500">
                  {isLoading ? 'Sending...' : 'Get OTP'}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <h2 className="text-2xl font-bold mb-6 text-center text-cyan-400">Verify Your Account</h2>
              {error && <p className="text-red-400 text-center mb-4 bg-red-900/50 p-3 rounded-lg">{error}</p>}
              
              <div>
                <label className={formLabelStyle} htmlFor="otp">OTP</label>
                <input className={formInputStyle} id="otp" type="text" placeholder="Enter the code from Telegram" value={otp} onChange={(e) => setOtp(e.target.value)} required />
              </div>
              
              <div>
                <label className={formLabelStyle} htmlFor="password">2FA Password (if you have one)</label>
                <input className={formInputStyle} id="password" type="password" placeholder="Leave empty if you don't use a password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              
              <div className="flex items-center justify-center pt-4">
                <button type="submit" disabled={isLoading} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg transition-colors w-full disabled:bg-gray-500">
                  {isLoading ? 'Verifying...' : 'Verify & Register'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterAccountPage;