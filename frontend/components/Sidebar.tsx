import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings as SettingsIcon, LogOut, Mic, FileText } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Достаем реального пользователя из localStorage
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const orgName = currentUser?.organization_name || 'Organization';

  const navItems = [
    { path: '/dashboard', icon: Calendar, label: 'Meetings' },
    { path: '/protocols', icon: FileText, label: 'Protocols' },
    { path: '/team', icon: Users, label: 'Team' },
    { path: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // Безопасное получение инициалов
  const getInitials = () => {
    const first = currentUser?.first_name?.charAt(0)?.toUpperCase() || '';
    const last = currentUser?.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getDisplayName = () => {
    const firstName = currentUser?.first_name || '';
    const lastName = currentUser?.last_name || '';
    return firstName || lastName || 'User';
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
      {/* Логотип */}
      <div className="p-6 flex items-center space-x-3 border-b border-gray-100">
        <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-600/20">
          <Mic className="w-5 h-5 text-white" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-lg text-gray-900 tracking-tight leading-tight">
            Potalkyem
          </span>
          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
            {orgName}
          </span>
        </div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Профиль и выход */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        <div className="flex items-center space-x-3 px-3 py-3 mb-4 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-sm shrink-0">
            {getInitials()}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 truncate">
              {getDisplayName()}
            </span>
            <span className="text-[10px] font-black uppercase text-blue-500 tracking-tighter">
              {currentUser?.role || 'member'}
            </span>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium transition-colors border border-transparent hover:border-red-100"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}