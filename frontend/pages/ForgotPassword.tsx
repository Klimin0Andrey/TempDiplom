import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, Loader2, Mic, AlertCircle, Eye, EyeOff } from 'lucide-react';
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
      setError(err.message || "Не удалось отправить ссылку. Проверьте правильность email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div 
            className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/30 cursor-pointer transition-transform hover:scale-105"
            onClick={() => navigate('/')}
          >
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Восстановление пароля
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            Не волнуйтесь, мы отправим вам инструкции для сброса пароля
          </p>
        </div>

        {!isSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center animate-slide-in">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" /> 
                <span>{error}</span>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Почта <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input 
                  type="email" 
                  required 
                  placeholder="you@company.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-bold hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 flex justify-center items-center transition-all active:scale-[0.98] shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin w-5 h-5 mr-2" /> 
                  Отправка...
                </>
              ) : (
                "Отправить ссылку для сброса"
              )}
            </button>
          </form>
        ) : (
          <div className="text-center animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Проверьте почту</h2>
            <p className="text-gray-500 mb-4">
              Мы отправили ссылку для сброса пароля на адрес
            </p>
            <p className="font-semibold text-gray-800 bg-gray-50 p-2 rounded-lg mb-6 break-all">
              {email}
            </p>
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-xs text-gray-600">
                Не получили письмо? Проверьте папку "Спам" или попробуйте ещё раз через несколько минут.
              </p>
            </div>
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-gray-100">
          <Link 
            to="/login" 
            className="flex items-center justify-center text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" /> 
            Вернуться ко входу
          </Link>
        </div>
      </div>
    </div>
  );
}