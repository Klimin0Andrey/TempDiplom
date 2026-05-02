import React, { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Lock, CheckCircle2, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff, KeyRound } from 'lucide-react';
import { api } from '../services/api.ts';

export default function SetupPassword() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const isReset = location.pathname.includes('reset');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }
    if (password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return;
    }
    if (!token) {
      setError("Отсутствует токен. Пожалуйста, используйте ссылку из письма.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await api.auth.resetPasswordConfirm({ token, password });
      setIsSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.message || "Недействительная или просроченная ссылка. Запросите новую.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
        <div className="text-center bg-white p-10 rounded-3xl shadow-xl max-w-sm w-full animate-in zoom-in duration-300">
          <div className="w-24 h-24 bg-gradient-to-r from-green-100 to-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent mb-2">
            Готово!
          </h2>
          <p className="text-gray-500 leading-relaxed">
            Ваш пароль успешно обновлён. Перенаправляем на страницу входа...
          </p>
          <div className="mt-8">
            <Loader2 className="animate-spin w-6 h-6 text-blue-600 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-br from-blue-500 to-blue-700 w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/30">
            <KeyRound className="text-white w-8 h-8" />
          </div>
        </div>
        
        <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent text-center mb-2">
          {isReset ? 'Создание нового пароля' : 'Активация аккаунта'}
        </h2>
        <p className="text-gray-500 mb-8 text-center leading-relaxed">
          {isReset 
            ? 'Создайте новый надёжный пароль для вашего аккаунта Potalkyem.' 
            : 'Добро пожаловать! Установите пароль для завершения регистрации в организации.'}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center animate-slide-in">
              <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> 
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 ml-1">
              Новый пароль
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type={showPassword ? "text" : "password"}
                required 
                placeholder="••••••••" 
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-gray-400 ml-1">Минимум 6 символов</p>
          </div>

          <div className="space-y-1">
            <label className="block text-sm font-semibold text-gray-700 ml-1">
              Подтверждение пароля
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type={showConfirmPassword ? "text" : "password"}
                required 
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-12 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Индикатор сложности пароля */}
          {password && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 rounded-full ${
                      password.length >= 8 ? 'w-full bg-green-500' :
                      password.length >= 6 ? 'w-2/3 bg-yellow-500' :
                      password.length >= 4 ? 'w-1/3 bg-orange-500' : 'w-0'
                    }`}
                  />
                </div>
                <span className="text-xs text-gray-500">
                  {password.length >= 8 ? 'Надёжный' :
                   password.length >= 6 ? 'Средний' :
                   password.length >= 4 ? 'Слабый' : ''}
                </span>
              </div>
              <div className="flex gap-2 text-xs text-gray-400">
                <span className={`flex items-center gap-1 ${/[A-Z]/.test(password) ? 'text-green-600' : ''}`}>
                  <CheckCircle2 className="w-3 h-3" /> Заглавная буква
                </span>
                <span className={`flex items-center gap-1 ${/[0-9]/.test(password) ? 'text-green-600' : ''}`}>
                  <CheckCircle2 className="w-3 h-3" /> Цифра
                </span>
                <span className={`flex items-center gap-1 ${password.length >= 6 ? 'text-green-600' : ''}`}>
                  <CheckCircle2 className="w-3 h-3" /> 6+ символов
                </span>
              </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isLoading || !token}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-2xl font-bold hover:from-blue-700 hover:to-blue-600 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all active:scale-[0.98] mt-6"
          >
            {isLoading ? (
              <Loader2 className="animate-spin w-6 h-6 mx-auto" />
            ) : (
              isReset ? "Обновить пароль" : "Активировать аккаунт"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-sm text-gray-500 hover:text-blue-600 transition-colors"
          >
            ← Вернуться ко входу
          </button>
        </div>
      </div>
    </div>
  );
}