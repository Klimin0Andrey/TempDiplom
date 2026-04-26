import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, Mic } from 'lucide-react';
import { api } from '../services/api.ts';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      await api.auth.forgotPassword(email);
      setIsSent(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link. Please check your email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/30 cursor-pointer" onClick={() => navigate('/')}>
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
          <p className="text-gray-500 text-sm mt-2 text-center text-pretty">
            No worries, we'll send you instructions to reset your password.
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" /> {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input 
                  type="email" required placeholder="you@company.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
                />
              </div>
            </div>
            <button 
              type="submit" disabled={isLoading}
              className="w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 flex justify-center items-center transition-all active:scale-95"
            >
              {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Reset Link"}
            </button>
          </form>
        ) : (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email</h2>
            <p className="text-gray-500 mb-8">We've sent a password reset link to <br/><span className="font-semibold text-gray-800">{email}</span></p>
            <p className="text-xs text-gray-400">Didn't receive the email? Check your spam folder or try again later.</p>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link to="/login" className="flex items-center justify-center text-sm font-semibold text-blue-600 hover:text-blue-700">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

// Добавим AlertCircle в импорты из lucide-react
import { AlertCircle } from 'lucide-react';