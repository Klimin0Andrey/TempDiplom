import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mic, ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar.tsx'; // Подключаем сайдбар для авторизованных

interface PublicLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showBackButton?: boolean;
}

export default function PublicLayout({ children, title, subtitle, showBackButton = true }: PublicLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('accessToken');

  const handleBack = () => {
    // Если есть история переходов внутри приложения, идём назад
    if (location.key !== 'default') {
      navigate(-1);
    } else {
      // Иначе направляем в зависимости от статуса
      navigate(isAuthenticated ? '/support' : '/');
    }
  };

  // === ВЕРСИЯ ДЛЯ АВТОРИЗОВАННЫХ ПОЛЬЗОВАТЕЛЕЙ (С САЙДБАРОМ) ===
  if (isAuthenticated) {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Слева показываем стандартное меню админки */}
        <Sidebar />
        
        {/* Справа контент страницы */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {title}
                </h1>
                {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
              </div>
              {showBackButton && (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-2 text-gray-500 hover:text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium text-sm"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад
                </button>
              )}
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-8">
            <div className="max-w-4xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    );
  }

  // === ВЕРСИЯ ДЛЯ НЕАВТОРИЗОВАННЫХ (С ВЕРХНИМ МЕНЮ) ===
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-wrap gap-4">
          
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-2 rounded-xl shadow-md">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Potalkyem
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link to="/login" className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-all shadow-md hover:shadow-lg">
              Войти
            </Link>

            {showBackButton && (
              <button
                onClick={handleBack}
                className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title="Вернуться назад"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm hidden sm:inline">Назад</span>
              </button>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {title}
          </h1>
          {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
        </div>
        {children}
      </main>
    </div>
  );
}