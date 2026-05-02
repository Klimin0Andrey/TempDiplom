import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Calendar, Users, Settings as SettingsIcon, LogOut, Mic, FileText, ChevronLeft, ChevronRight, HelpCircle, TrendingUp  } from 'lucide-react';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
  }, [isCollapsed]);

  const [forceUpdate, setForceUpdate] = useState(0);

  useEffect(() => {
    const handleStorageChange = () => {
      setForceUpdate(prev => prev + 1);
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Только одно объявление! УДАЛИТЕ дубликаты ниже
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const orgName = currentUser?.organization_name || 'Организация';

  const navItems = [
    { path: '/dashboard', icon: Calendar, label: 'Встречи' },
    { path: '/protocols', icon: FileText, label: 'Протоколы' },
    { path: '/team', icon: Users, label: 'Команда' },
    { path: '/analytics', icon: TrendingUp, label: 'Аналитика' },
    { path: '/settings', icon: SettingsIcon, label: 'Настройки' },
    { path: '/support', icon: HelpCircle, label: 'Помощь' },
  ];

  const handleSignOut = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  const getInitials = () => {
    const first = currentUser?.first_name?.charAt(0)?.toUpperCase() || '';
    const last = currentUser?.last_name?.charAt(0)?.toUpperCase() || '';
    return first + last || '?';
  };

  const getDisplayName = () => {
    const firstName = currentUser?.first_name || '';
    const lastName = currentUser?.last_name || '';
    return firstName || lastName || 'Пользователь';
  };

  const getRoleLabel = () => {
    const role = currentUser?.role || 'member';
    const roles: Record<string, string> = {
      admin: 'Администратор',
      organizer: 'Организатор',
      member: 'Участник',
      owner: 'Владелец',  // Добавьте эту строку!
    };
    return roles[role] || 'Участник';
  };
  

  return (
    <div 
      className={`bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-300 relative ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Кнопка сворачивания - по центру */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-md hover:shadow-lg transition-all z-10 hover:scale-110"
      >
        {isCollapsed ? (
          <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
        ) : (
          <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {/* Логотип */}
      <div className={`p-6 flex items-center border-b border-gray-100 transition-all ${
        isCollapsed ? 'justify-center' : 'space-x-3'
      }`}>
        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-xl shadow-md shadow-blue-600/20">
          <Mic className="w-5 h-5 text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-bold text-lg text-gray-900 tracking-tight leading-tight">
              Potalkyem
            </span>
            <span className="text-[10px] text-gray-400 font-medium truncate max-w-[120px]">
              {orgName}
            </span>
          </div>
        )}
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
              className={`w-full flex items-center transition-all duration-200 rounded-lg font-medium ${
                isCollapsed ? 'justify-center px-2 py-3' : 'space-x-3 px-3 py-2.5'
              } ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm border border-blue-100/50'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
              {!isCollapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Профиль и выход */}
      <div className="p-4 border-t border-gray-200 bg-gray-50/50">
        {/* Развернутый вид - прямоугольная область с аватаром-кругом */}
        {!isCollapsed ? (
          <div className="flex items-center space-x-3 bg-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {getInitials()}
            </div>
            <div className="flex flex-col overflow-hidden flex-1">
              <span className="text-sm font-bold text-gray-900 truncate">
                {getDisplayName()}
              </span>
              <span className="text-[10px] font-medium text-blue-600">
                {getRoleLabel()}
              </span>
            </div>
          </div>
        ) : (
          /* Свернутый вид - только круглый аватар */
          <div className="flex justify-center mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {getInitials()}
            </div>
          </div>
        )}
        
        {/* Кнопка выхода */}
        <button
          onClick={handleSignOut}
          className={`flex items-center transition-all w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg font-medium ${
            isCollapsed ? 'justify-center' : 'space-x-2 justify-center'
          }`}
          title={isCollapsed ? 'Выйти' : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Выйти</span>}
        </button>
      </div>
    </div>
  );
}