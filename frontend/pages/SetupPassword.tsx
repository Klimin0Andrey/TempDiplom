import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, CheckCircle2, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const isReset = location.pathname.includes('reset'); // Проверяем, это сброс или настройка

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (!token) {
      setError("Token is missing. Please use the link from your email.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.auth.resetPasswordConfirm({ token, password });
      setIsSuccess(true);
      // Перенаправляем на логин через 3 секунды
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || "Invalid or expired link. Please request a new one.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-12 h-12 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">All set!</h2>
          <p className="text-gray-500">Your password has been updated successfully. Redirecting you to sign in...</p>
          <div className="mt-8">
             <Loader2 className="animate-spin w-6 h-6 text-blue-600 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 text-pretty">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
        <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6">
          <ShieldCheck className="text-blue-600 w-8 h-8" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isReset ? 'Set New Password' : 'Activate Your Account'}
        </h2>
        <p className="text-gray-500 mb-8 leading-relaxed">
          {isReset 
            ? 'Create a new secure password for your IntelliConf account.' 
            : 'Welcome! Please set up a password to finish joining your organization.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 ml-1">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" required placeholder="••••••••" minLength={6}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 ml-1">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" required placeholder="••••••••"
                value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              />
            </div>
          </div>

          <button 
            type="submit" disabled={isLoading || !token}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-95 mt-4"
          >
            {isLoading ? <Loader2 className="animate-spin w-6 h-6 mx-auto" /> : (isReset ? "Update Password" : "Activate Account")}
          </button>
        </form>
      </div>
    </div>
  );
}