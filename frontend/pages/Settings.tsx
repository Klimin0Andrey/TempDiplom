import React, { useState } from 'react';
import { User, Mail, Lock, Save } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { api } from '../services/api.ts'; // ← ДОБАВИТЬ импорт api

export default function Settings() {
  // Загружаем реального пользователя из localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [firstName, setFirstName] = useState(user.first_name || '');   // ← ИСПРАВЛЕНО
  const [lastName, setLastName] = useState(user.last_name || '');       // ← ИСПРАВЛЕНО
  const [email, setEmail] = useState(user.email || '');                 // ← ИСПРАВЛЕНО
  
  // Поля для смены пароля
  const [currentPassword, setCurrentPassword] = useState('');           // ← ДОБАВЛЕНО
  const [newPassword, setNewPassword] = useState('');                   // ← ДОБАВЛЕНО
  
  // Состояния для обратной связи
  const [isSaving, setIsSaving] = useState(false);                      // ← ДОБАВЛЕНО
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null); // ← ДОБАВЛЕНО

  // Обработчик обновления профиля
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
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setIsSaving(false);
    }
  };

  // Обработчик смены пароля
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);
    
    try {
      await api.auth.changePassword({ 
        current_password: currentPassword, 
        new_password: newPassword 
      });
      setMessage({ type: 'success', text: 'Password changed successfully!' });
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to change password' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your personal information and security</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-3xl bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Шапка профиля */}
            <div className="p-6 border-b border-gray-200 bg-gray-50/50">
              <div className="flex items-center space-x-5">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-3xl font-bold text-white shadow-inner border-4 border-white">
                  {firstName.charAt(0)}{lastName.charAt(0)}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {firstName || 'User'} {lastName}
                  </h2>
                  <p className="text-gray-500 font-medium mt-1 capitalize">
                    {user.role || 'Member'}
                  </p>
                </div>
              </div>
            </div>

            {/* Сообщение об успехе/ошибке */}
            {message && (
              <div className={`mx-8 mt-6 p-4 rounded-lg text-sm font-medium ${
                message.type === 'success' 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {message.text}
              </div>
            )}

            {/* Форма профиля */}
            <form onSubmit={handleUpdateProfile} className="p-8 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        disabled  // ← Email менять нельзя через эту форму
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 bg-gray-50 rounded-lg sm:text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>

            {/* Форма смены пароля */}
            <form onSubmit={handleChangePassword} className="px-8 pb-8 space-y-8">
              <div className="pt-8 border-t border-gray-200">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Security</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving || !currentPassword || !newPassword}
                  className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSaving ? 'Changing...' : 'Change Password'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}