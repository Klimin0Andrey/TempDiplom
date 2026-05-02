import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Lock, Mail, User, UserPlus, LogIn, Building2, CreditCard, Sparkles, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
      toast.success(isLogin ? 'Добро пожаловать!' : 'Организация успешно зарегистрирована!');
    } catch (err: any) {
      console.error('Auth error:', err);
      toast.error(err.message || 'Ошибка авторизации');
    }
  };

  const getTierInfo = () => {
    const tiers = {
      light: { name: 'Light', price: 'Бесплатно', trial: 'Навсегда бесплатно' },
      pro: { name: 'Pro', price: '2 999 ₽/мес', trial: '14 дней бесплатно' },
      business: { name: 'Business', price: '9 999 ₽/мес', trial: '30 дней бесплатно' }
    };
    return tiers[selectedTier as keyof typeof tiers];
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 rounded-2xl mb-4 shadow-lg shadow-blue-600/30">
            <Mic className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Potalkyem
          </h2>
          <p className="text-gray-500 text-sm mt-2 text-center">
            {isLogin ? 'Войдите в свой аккаунт' : 'Зарегистрируйте организацию и создайте аккаунт администратора'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Название организации <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Building2 className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required={!isLogin}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                    placeholder="ООО «Ромашка»"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Выберите тариф <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CreditCard className="h-4 w-4 text-gray-400" />
                  </div>
                  <select
                    required={!isLogin}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all appearance-none bg-white cursor-pointer"
                    value={selectedTier}
                    onChange={(e) => {
                      setSelectedTier(e.target.value);
                      setShowTrialInfo(true);
                    }}
                  >
                    <option value="light">Light - Бесплатно навсегда</option>
                    <option value="pro">Pro - 2 999 ₽/мес (14 дней бесплатно)</option>
                    <option value="business">Business - 9 999 ₽/мес (30 дней бесплатно)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                
                {selectedTier !== 'light' && (
                  <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-semibold text-blue-700">{getTierInfo().trial}</span>
                    </div>
                  </div>
                )}
                
                {selectedTier === 'light' && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg">
                    Бесплатный тариф включает AI Протоколы (STT + LLM) с базовыми возможностями
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Имя администратора <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      required={!isLogin}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                      placeholder="Иван"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Фамилия
                  </label>
                  <input
                    type="text"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                    placeholder="Иванов"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Почта <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                required
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Пароль <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                className="block w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {isLogin && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => navigate('/forgot-password')}
                className="text-xs font-medium text-blue-600 hover:text-blue-500 transition-colors"
              >
                Забыли пароль?
              </button>
            </div>
          )}

          <button
            type="submit"
            className="w-full group flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all mt-6"
          >
            {isLogin ? (
              <>
                <LogIn className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> 
                Войти
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" /> 
                Зарегистрировать организацию
              </>
            )}
            <ArrowRight className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 transition-colors"
          >
            {isLogin ? "Нет аккаунта? Зарегистрировать организацию" : "Уже есть аккаунт? Войти"}
          </button>
        </div>
      </div>
    </div>
  );
}