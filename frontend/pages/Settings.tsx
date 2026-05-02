import React, { useState } from 'react';
import { User, Mail, Lock, Save, Eye, EyeOff, Shield, Bell, LogOut, CheckCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { api } from '../services/api.ts';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [firstName, setFirstName] = useState(user.first_name || '');
  const [lastName, setLastName] = useState(user.last_name || '');
  const [email] = useState(user.email || '');
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // Настройки уведомлений (только локально)
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    soundNotifications: true,
  });

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      const updatedUser = await api.auth.updateProfile({ 
        first_name: firstName, 
        last_name: lastName 
      });
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setMessage({ type: 'success', text: 'Профиль успешно обновлён!' });
      toast.success('Профиль обновлён');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Не удалось обновить профиль' });
      toast.error(err.message || 'Ошибка обновления');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Новый пароль должен содержать минимум 6 символов' });
      return;
    }
    
    setIsChangingPassword(true);
    setMessage(null);
    
    try {
      await api.auth.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword 
      });
      setMessage({ type: 'success', text: 'Пароль успешно изменён!' });
      toast.success('Пароль изменён');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Не удалось изменить пароль' });
      toast.error(err.message || 'Ошибка смены пароля');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Вы вышли из аккаунта');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Настройки профиля
            </h1>
            <p className="text-sm text-gray-500 mt-1">Управляйте личной информацией и безопасностью</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Шапка профиля */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="flex items-center space-x-5">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-lg border-4 border-white">
                    {firstName?.charAt(0)?.toUpperCase() || 'U'}{lastName?.charAt(0)?.toUpperCase() || 'S'}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {firstName || 'Пользователь'} {lastName}
                    </h2>
                    <p className="text-gray-600 font-medium mt-1 flex items-center gap-2">
                      <span className="capitalize">{user.role || 'Участник'}</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Активен</span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">{email}</p>
                  </div>
                </div>
              </div>

              {/* Сообщение об успехе/ошибке */}
              {message && (
                <div className={`mx-8 mt-6 p-4 rounded-lg text-sm font-medium flex items-center gap-2 ${
                  message.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <CheckCircle className="w-4 h-4" />
                  {message.text}
                </div>
              )}

              {/* Форма профиля */}
              <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Личная информация
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Иван"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Фамилия</label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="Иванов"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="email"
                          value={email}
                          disabled
                          className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg text-gray-500 cursor-not-allowed"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Email нельзя изменить</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Сохранение...' : 'Сохранить изменения'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Форма смены пароля */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    Безопасность
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Текущий пароль</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Новый пароль</label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          minLength={6}
                          className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Минимум 6 символов</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleChangePassword}
                    disabled={isChangingPassword || !currentPassword || !newPassword}
                    className="flex items-center gap-2 bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    <Lock className="w-4 h-4" />
                    <span>{isChangingPassword ? 'Изменение...' : 'Сменить пароль'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Блок уведомлений */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-blue-600" />
                  Уведомления
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Email уведомления</span>
                    <button
                      type="button"
                      onClick={() => setNotifications({...notifications, emailNotifications: !notifications.emailNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.emailNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.emailNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-gray-700">Звуковые уведомления</span>
                    <button
                      type="button"
                      onClick={() => setNotifications({...notifications, soundNotifications: !notifications.soundNotifications})}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifications.soundNotifications ? 'bg-blue-600' : 'bg-gray-300'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${notifications.soundNotifications ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </label>
                </div>
                <p className="text-xs text-gray-400">Настройки уведомлений сохраняются только в этом браузере</p>
              </div>
            </div>

            {/* Выход из аккаунта */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-8 space-y-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-red-600" />
                  Аккаунт
                </h3>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white px-6 py-2.5 rounded-lg font-medium transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  Выйти из аккаунта
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}