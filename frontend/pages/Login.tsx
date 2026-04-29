import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Lock, Mail, User, UserPlus, LogIn, Building2, CreditCard } from 'lucide-react';
import { api } from '../services/api.ts';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [selectedTier, setSelectedTier] = useState('light');
  const [showTrialInfo, setShowTrialInfo] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('mode') === 'register') {
      setIsLogin(false);
    }
    // Предзаполнить тариф из URL
    const plan = params.get('plan');
    if (plan && ['light', 'pro', 'business'].includes(plan)) {
      setSelectedTier(plan);
    }
  }, [location]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let response;
      if (isLogin) {
        response = await api.auth.login({ email, password });
      } else {
        await api.auth.register({
          email, password,
          first_name: firstName,
          last_name: lastName,
          org_name: orgName,
          tier_slug: selectedTier,
        });
        response = await api.auth.login({ email, password });
      }

      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.user));
      
      const destination = 
        location.state?.returnTo || 
        location.state?.from || 
        sessionStorage.getItem('redirectAfterLogin') || 
        '/dashboard';
      
      sessionStorage.removeItem('redirectAfterLogin');
      
      navigate(destination, { replace: true });
    } catch (err: any) {
      console.error('Auth error:', err);
      alert(err.message || 'Authentication failed');
    }
  };

  const getTierInfo = () => {
    const tiers = {
      light: { name: 'Light', price: 'Free', trial: 'Free forever' },
      pro: { name: 'Pro', price: '2,999 ₽/month', trial: '14-day free trial' },
      business: { name: 'Business', price: '9,999 ₽/month', trial: '30-day free trial' }
    };
    return tiers[selectedTier as keyof typeof tiers];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">IntelliConf Platform</h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {isLogin ? 'Sign in to your account' : 'Register your organization and create an admin account'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              </div>
              
              {/* Select Plan Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Plan <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    required={!isLogin}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow appearance-none bg-white"
                    value={selectedTier}
                    onChange={(e) => {
                      setSelectedTier(e.target.value);
                      setShowTrialInfo(true);
                    }}
                  >
                    <option value="light">Light - Free forever</option>
                    <option value="pro">Pro - 2,999 ₽/month (14-day free trial)</option>
                    <option value="business">Business - 9,999 ₽/month (30-day free trial)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {/* Trial period info */}
                {(showTrialInfo || selectedTier !== 'light') && selectedTier !== 'light' && (
                  <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded-lg">
                    ✨ {getTierInfo().trial} included with this plan
                  </div>
                )}
                
                {selectedTier === 'light' && (
                  <div className="mt-2 text-xs text-gray-500">
                    ℹ️ Free plan includes AI Protocols (STT + LLM) with limited features
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin First Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                      placeholder="Ivan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Last Name
                  </label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                    placeholder="Ivanov"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                required
                minLength={6}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Forgot password?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors mt-6"
          >
            {isLogin ? (
              <>
                <LogIn className="w-4 h-4 mr-2" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2" /> Register Organization
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            {isLogin ? "Don't have an account? Register Organization" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}