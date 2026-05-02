import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart3, Clock, Users, Zap, Sparkles, 
  TrendingUp, Calendar, Activity, Award, 
  PieChart, Eye, Loader2, AlertCircle, FileText  
} from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { api } from '../services/api.ts';
import toast from 'react-hot-toast';

export default function Analytics() {
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.analytics.getDashboard()
      .then(res => setData(res))
      .catch(err => {
        console.error(err);
        if (err.status === 403) {
          toast.error('У вас нет доступа к аналитике');
          navigate('/dashboard');
        } else {
          toast.error('Ошибка загрузки аналитики');
        }
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Загрузка аналитики...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen bg-gray-50">
        <Sidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Ошибка загрузки</h2>
            <p className="text-gray-500">{error || 'Не удалось загрузить данные'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    { 
      icon: Calendar, 
      label: 'Всего встреч', 
      value: data.total_meetings, 
      color: 'blue',
      suffix: ''
    },
    { 
      icon: Clock, 
      label: 'Общее время', 
      value: data.total_hours, 
      color: 'green',
      suffix: 'ч',
      decimal: 1
    },
    { 
      icon: Sparkles, 
      label: 'Сэкономлено AI', 
      value: data.ai_saved_hours, 
      color: 'purple',
      suffix: 'ч',
      decimal: 1,
      tooltip: 'Время, сэкономленное на ручном составлении протоколов'
    },
    { 
      icon: Users, 
      label: 'Сотрудников', 
      value: data.total_users, 
      color: 'orange',
      suffix: ''
    },
    { 
      icon: FileText, 
      label: 'Протоколов', 
      value: data.total_protocols, 
      color: 'emerald',
      suffix: ''
    },
  ];

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    scheduled: 'bg-blue-100 text-blue-700',
    ended: 'bg-emerald-100 text-emerald-700',
    archived: 'bg-gray-100 text-gray-700'
  };

  const statusLabels: Record<string, string> = {
    active: 'Активные',
    scheduled: 'Запланированные',
    ended: 'Завершённые',
    archived: 'Архивные'
  };

  // Находим максимальное количество встреч для масштабирования графика
  const maxPeakCount = data.peak_hours?.length > 0 
    ? Math.max(...data.peak_hours.map((h: any) => h.count)) 
    : 1;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Аналитика компании
              </h1>
              <p className="text-sm text-gray-500 mt-1">Ключевые метрики эффективности</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              {stats.map((stat, idx) => {
                const Icon = stat.icon;
                const displayValue = stat.decimal 
                  ? stat.value.toFixed(1) 
                  : stat.value;
                return (
                  <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className={`p-2 rounded-lg bg-${stat.color}-100 group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                      {stat.tooltip && (
                        <div className="relative group/tooltip">
                          <div className="w-5 h-5 rounded-full bg-gray-100 text-gray-400 text-xs flex items-center justify-center cursor-help">
                            ?
                          </div>
                          <div className="absolute right-0 top-6 w-48 bg-gray-800 text-white text-xs rounded-lg p-2 opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none z-10">
                            {stat.tooltip}
                          </div>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-gray-900">{displayValue}{stat.suffix}</p>
                      <p className="text-sm text-gray-500 mt-1">{stat.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Часы пиковой активности */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Activity className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Пиковые часы активности</h2>
                </div>
                <div className="space-y-3">
                  {data.peak_hours && data.peak_hours.length > 0 ? (
                    data.peak_hours.map((hour: any) => {
                      const heightPercent = (hour.count / maxPeakCount) * 100;
                      return (
                        <div key={hour.hour} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{hour.hour}:00 - {hour.hour + 1}:00</span>
                            <span className="font-medium text-gray-900">{hour.count} встреч</span>
                          </div>
                          <div className="w-full bg-gray-100 rounded-full h-2">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${heightPercent}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-gray-500 text-center py-8">Нет данных о пиковых часах</p>
                  )}
                </div>
              </div>

              {/* Распределение по статусам */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <PieChart className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Статусы встреч</h2>
                </div>
                <div className="space-y-3">
                  {data.status_distribution && data.status_distribution.length > 0 ? (
                    data.status_distribution.map((status: any) => (
                      <div key={status.status} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${
                            status.status === 'active' ? 'bg-green-500' :
                            status.status === 'scheduled' ? 'bg-blue-500' :
                            status.status === 'ended' ? 'bg-emerald-500' : 'bg-gray-500'
                          }`} />
                          <span className="text-sm font-medium text-gray-700">
                            {statusLabels[status.status] || status.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm font-semibold text-gray-900">{status.count}</span>
                          <span className="text-xs text-gray-400">
                            ({((status.count / data.total_meetings) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-8">Нет данных о статусах</p>
                  )}
                </div>
              </div>

              {/* Встречи по месяцам */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-gray-900">Динамика встреч по месяцам</h2>
                </div>
                {data.monthly_meetings && data.monthly_meetings.length > 0 ? (
                  <div className="flex items-end gap-4 h-64">
                    {data.monthly_meetings.map((month: any, idx: number) => {
                      const maxCount = Math.max(...data.monthly_meetings.map((m: any) => m.count));
                      const heightPercent = (month.count / maxCount) * 100;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center">
                          <div className="w-full bg-gradient-to-t from-blue-100 to-blue-200 rounded-t-lg transition-all duration-500 hover:from-blue-200 hover:to-blue-300"
                            style={{ height: `${Math.max(heightPercent, 5)}%` }}>
                            <div className="text-center -mt-6 text-sm font-semibold text-blue-600">
                              {month.count}
                            </div>
                          </div>
                          <div className="mt-3 text-xs text-gray-500 font-medium">
                            {month.month}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">Нет данных по месяцам</p>
                )}
              </div>
            </div>

            {/* Самые активные пользователи */}
            {data.active_users && data.active_users.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Award className="w-5 h-5 text-yellow-500" />
                  <h2 className="text-lg font-bold text-gray-900">🏆 Самые активные сотрудники</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {data.active_users.map((user: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-500">{user.meetings_count} проведённых встреч</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}