import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Users, UserPlus, Mail, Shield, MoreVertical, CheckCircle2, Clock, Loader2, AlertCircle, X, Search, Filter, ChevronDown, Crown, Star } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import toast from 'react-hot-toast';
import { UserResponse, UserRole, UserStatus } from '../types.ts';
import { api } from '../services/api.ts';
import { wsClient } from '../services/websocket.ts';
import { initUserSocket } from '../services/userSocket';
import ConfirmModal from '../components/ConfirmModal.tsx';

// Переводы
const translations = {
  title: 'Управление командой',
  subtitle: 'Управление участниками организации и их ролями',
  inviteMember: 'Пригласить участника',
  loading: 'Загрузка данных организации...',
  error: 'Не удалось загрузить участников команды',
  tryAgain: 'Повторить',
  table: {
    user: 'Пользователь',
    role: 'Роль',
    status: 'Статус',
    joinedAt: 'Дата регистрации',
    actions: 'Действия'
  },
  statuses: {
    active: 'Активен',
    deactivated: 'Деактивирован',
    invited: 'Приглашён'
  },
  roles: {
    owner: 'Владелец',
    admin: 'Администратор',
    member: 'Участник'
  },
  you: 'Вы',
  deactivateConfirm: 'Деактивировать этого пользователя?',
  deactivateWarning: 'Пользователь потеряет доступ к организации',
  deactivateSuccess: 'Пользователь деактивирован',
  roleChangeSuccess: 'Роль изменена',
  invite: {
    title: 'Пригласить участника',
    email: 'Email',
    emailPlaceholder: 'name@company.com',
    fullName: 'Имя и фамилия',
    fullNamePlaceholder: 'Например: Иван Иванов',
    role: 'Роль в организации',
    roleMember: 'Участник',
    roleAdmin: 'Администратор',
    send: 'Отправить приглашение',
    success: 'Приглашение отправлено',
    error: 'Не удалось отправить приглашение'
  },
  menu: {
    manageUser: 'Управление пользователем',
    makeAdmin: 'Назначить администратором',
    makeMember: 'Назначить участником',
    deactivate: 'Деактивировать аккаунт'
  },
  searchPlaceholder: 'Поиск по имени, фамилии или email...',
  filterAll: 'Все',
  filterActive: 'Активные',
  filterInvited: 'Приглашённые',
  membersFound: (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return `${count} участник`;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return `${count} участника`;
    return `${count} участников`;
  }
};

// Цвета для аватаров
const avatarColors = [
  'from-blue-500 to-blue-600',
  'from-green-500 to-green-600',
  'from-purple-500 to-purple-600',
  'from-orange-500 to-orange-600',
  'from-pink-500 to-pink-600',
  'from-teal-500 to-teal-600',
  'from-red-500 to-red-600',
  'from-indigo-500 to-indigo-600',
];

function getAvatarColor(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = ((hash << 5) - hash) + email.charCodeAt(i);
    hash |= 0;
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export default function Team() {
  const [users, setUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'invited'>('all');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  
  const menuRef = useRef<HTMLDivElement | null>(null);
  const filterRef = useRef<HTMLDivElement | null>(null);

  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('member');
  const [isInviting, setIsInviting] = useState(false);

  const [deactivateConfirm, setDeactivateConfirm] = useState<{
    isOpen: boolean;
    userId: string | null;
  }>({
    isOpen: false,
    userId: null,
  });

  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const isManager = currentUser?.role === 'owner' || currentUser?.role === 'admin';

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.auth.getUsers();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
      // Инициализируем глобальный WebSocket для получения уведомлений
      initUserSocket();
  }, []);

  useEffect(() => {
    // Подписка на событие обновления пользователя через WebSocket
    const handleUserUpdated = (data: any) => {
        if (data.user && data.user.id) {
            console.log('📡 User updated via WebSocket:', data.user);
            
            // Обновляем пользователя в списке
            setUsers(prevUsers => prevUsers.map(user => 
                user.id === data.user.id 
                    ? { ...user, ...data.user }
                    : user
            ));
            
            // Если обновили текущего пользователя - обновляем localStorage и Sidebar
            if (data.user.id === currentUser?.id) {
                const updatedUser = { ...currentUser, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                // Диспатчим событие для Sidebar и Dashboard
                window.dispatchEvent(new Event('storage'));
                
                // Показываем уведомление
                const roleText = data.user.role === 'admin' ? 'администратором' : 'участником';
                toast.success(`Ваша роль изменена на ${roleText}. Страница будет перезагружена.`);
                
                // Перезагружаем страницу для применения новых прав
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            } else {
                // Для других пользователей просто показываем уведомление
                toast.success(`Пользователь ${data.user.first_name} обновлён`);
            }
        }
    };
    
    // Подписываемся на событие
    wsClient.on('user_updated', handleUserUpdated);
    
    // Отписка при размонтировании
    return () => {
        wsClient.off('user_updated', handleUserUpdated);
    };
}, [currentUser]);

  const updateCurrentUser = async () => {
    try {
      const updatedUser = await api.auth.getMe();
      localStorage.setItem('user', JSON.stringify(updatedUser));
      // Обновляем currentUser в состоянии (если добавите state для него)
      window.dispatchEvent(new Event('storage'));
      // Перезагружаем страницу для применения новых прав (простой способ)
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Failed to update current user:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    
    // Подписка на обновление пользователя через WebSocket
    const handleUserUpdate = (event: StorageEvent) => {
      if (event.key === 'user') {
        window.location.reload();
      }
    };
    
    window.addEventListener('storage', handleUserUpdate);
    
    return () => {
      window.removeEventListener('storage', handleUserUpdate);
    };
  }, []);

  // Закрытие меню при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsInviting(true);
    try {
      await api.auth.invite({
        email: inviteEmail,
        first_name: inviteFirstName,
        last_name: inviteLastName,
        role: inviteRole,
      });
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteFirstName('');
      setInviteLastName('');
      toast.success(translations.invite.success);
      fetchUsers();
    } catch (err: any) {
      toast.error(translations.invite.error + ": " + (err.message || "Unknown error"));
    } finally {
      setIsInviting(false);
    }
  };

  const handleDeactivateClick = (userId: string) => {
    setDeactivateConfirm({
      isOpen: true,
      userId: userId,
    });
  };

  const handleDeactivateConfirm = async () => {
    const userId = deactivateConfirm.userId;
    if (!userId) return;
    
    try {
      await api.auth.updateUser(userId, { status: 'deactivated' });
      setOpenMenuId(null);
      toast.success(translations.deactivateSuccess);
      fetchUsers();
      
      // Если деактивируют текущего пользователя - разлогиниваем
      if (userId === currentUser?.id) {
        toast.error("Ваш аккаунт был деактивирован. Вы будете перенаправлены.");
        setTimeout(() => {
          localStorage.clear();
          window.location.href = '/login';
        }, 2000);
      }
    } catch (err: any) {
      toast.error("Не удалось деактивировать: " + (err.message || "Unknown error"));
    } finally {
      setDeactivateConfirm({ isOpen: false, userId: null });
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.auth.updateUser(userId, { role: newRole });
      setOpenMenuId(null);
      toast.success(translations.roleChangeSuccess);
      fetchUsers();
      
      // Если меняют роль текущего пользователя - обновляем его данные
      if (userId === currentUser?.id) {
        await updateCurrentUser();
      }
    } catch (err: any) {
      toast.error("Не удалось изменить роль: " + (err.message || "Unknown error"));
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return {
        icon: CheckCircle2,
        label: translations.statuses.active,
        color: 'green'
      };
    }
    return {
      icon: Clock,
      label: status === 'deactivated' ? translations.statuses.deactivated : translations.statuses.invited,
      color: 'amber'
    };
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'admin':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Users className="w-4 h-4 text-gray-400" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'owner': return translations.roles.owner;
      case 'admin': return translations.roles.admin;
      default: return translations.roles.member;
    }
  };

  const filteredUsers = useMemo(() => {
    let filtered = [...users];
    
    // Поиск
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        (user.first_name && user.first_name.toLowerCase().includes(query)) ||
        (user.last_name && user.last_name.toLowerCase().includes(query))
      );
    }
    
    // Фильтр по статусу
    if (statusFilter === 'active') {
      filtered = filtered.filter(user => user.status === 'active');
    } else if (statusFilter === 'invited') {
      filtered = filtered.filter(user => user.status === 'invited');
    }
    
    return filtered;
  }, [users, searchQuery, statusFilter]);

  const getRoleName = (role: string) => {
    switch (role) {
      case 'owner': return 'Владелец';
      case 'admin': return 'Администратор';
      default: return 'Участник';
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 shrink-0 z-20">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {translations.title}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{translations.subtitle}</p>
            </div>
            {isManager && (
              <button 
                onClick={() => setShowInviteModal(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
              >
                <UserPlus className="w-5 h-5" />
                <span>{translations.inviteMember}</span>
              </button>
            )}
          </div>
          
          {/* Панель поиска и фильтров */}
          <div className="flex items-center gap-3 mt-5 flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={translations.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
              />
            </div>
            
            <div className="relative" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-all"
              >
                <Filter className="w-4 h-4" />
                <span>
                  {statusFilter === 'all' && translations.filterAll}
                  {statusFilter === 'active' && translations.filterActive}
                  {statusFilter === 'invited' && translations.filterInvited}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute right-0 mt-2 w-36 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-30 animate-fade-in">
                  <button
                    onClick={() => { setStatusFilter('all'); setShowFilterDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    {translations.filterAll}
                  </button>
                  <button
                    onClick={() => { setStatusFilter('active'); setShowFilterDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    {translations.filterActive}
                  </button>
                  <button
                    onClick={() => { setStatusFilter('invited'); setShowFilterDropdown(false); }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors"
                  >
                    {translations.filterInvited}
                  </button>
                </div>
              )}
            </div>
            
            {filteredUsers.length > 0 && (
              <span className="text-xs text-gray-400">
                {translations.membersFound(filteredUsers.length)}
              </span>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto w-full relative bg-gray-50">
          <div className="p-8 min-h-full w-full max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
                <p className="text-sm font-medium text-gray-500">{translations.loading}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="bg-red-50 rounded-full p-4 mb-4">
                  <AlertCircle className="w-12 h-12 text-red-400" />
                </div>
                <p className="text-lg font-medium text-red-800">{error}</p>
                <button 
                  onClick={fetchUsers} 
                  className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors shadow-sm"
                >
                  {translations.tryAgain}
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50/80">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {translations.table.user}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {translations.table.role}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {translations.table.status}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {translations.table.joinedAt}
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                          {translations.table.actions}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredUsers.map((user) => {
                        const isMe = user.id === currentUser?.id;
                        const StatusIcon = getStatusBadge(user.status).icon;
                        const statusColor = getStatusBadge(user.status).color;
                        const avatarGradient = getAvatarColor(user.email);
                        
                        return (
                          <tr key={user.id} className="hover:bg-blue-50/30 transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className={`flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br ${avatarGradient} flex items-center justify-center text-white font-bold shadow-sm`}>
                                  {user.first_name?.charAt(0)?.toUpperCase() || user.email.charAt(0).toUpperCase()}
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                    {user.first_name} {user.last_name || ''}
                                    {isMe && (
                                      <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                                        {translations.you}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3 opacity-50" />
                                    {user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {getRoleIcon(user.role)}
                                <span className="text-sm font-medium text-gray-700">
                                  {getRoleLabel(user.role)}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                statusColor === 'green' 
                                  ? 'bg-green-50 text-green-700 border border-green-100' 
                                  : 'bg-amber-50 text-amber-700 border border-amber-100'
                              }`}>
                                <StatusIcon className="w-3 h-3" />
                                {getStatusBadge(user.status).label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                              {new Date(user.created_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {/* Администратор может управлять всеми, кроме владельца и себя */}
                              {(currentUser?.role === 'owner' || currentUser?.role === 'admin') && !isMe && user.role !== 'owner' && (
                                <div className="relative" ref={openMenuId === user.id ? menuRef : null}>
                                  <button 
                                    onClick={() => setOpenMenuId(openMenuId === user.id ? null : user.id)}
                                    className="text-gray-400 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                  >
                                    <MoreVertical className="w-5 h-5" />
                                  </button>
                                  
                                  {openMenuId === user.id && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50 animate-fade-in">
                                      <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1">
                                        {translations.menu.manageUser}
                                      </div>
                                      
                                      {/* Назначить администратором - могут и владелец, и администратор */}
                                      {user.role !== 'admin' && (
                                        <button 
                                          onClick={() => handleRoleChange(user.id, 'admin')} 
                                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                                        >
                                          <Shield className="w-4 h-4 text-blue-500" />
                                          {translations.menu.makeAdmin}
                                        </button>
                                      )}
                                      
                                      {/* Снять с должности администратора - могут и владелец, и администратор */}
                                      {user.role !== 'member' && user.role !== 'owner' && (
                                        <button 
                                          onClick={() => handleRoleChange(user.id, 'member')} 
                                          className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"
                                        >
                                          <Users className="w-4 h-4 text-gray-400" />
                                          {translations.menu.makeMember}
                                        </button>
                                      )}
                                      
                                      <div className="h-px bg-gray-100 my-1 mx-2" />
                                      
                                      {/* Деактивировать - могут и владелец, и администратор */}
                                      <button 
                                        onClick={() => handleDeactivateClick(user.id)} 
                                        className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 font-medium transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                        {translations.menu.deactivate}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {filteredUsers.length === 0 && (
                  <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <Users className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">Участники не найдены</p>
                    <p className="text-sm text-gray-400 mt-1">Попробуйте изменить параметры поиска</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Модальное окно приглашения */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg">
                  <UserPlus className="w-4 h-4 text-white" />
                </div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  {translations.invite.title}
                </h2>
              </div>
              <button 
                onClick={() => setShowInviteModal(false)} 
                className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleInvite} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {translations.invite.email}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input 
                    type="email" 
                    required 
                    value={inviteEmail} 
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all" 
                    placeholder={translations.invite.emailPlaceholder} 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {translations.invite.fullName}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <input 
                    type="text" 
                    required 
                    value={inviteFirstName} 
                    onChange={(e) => setInviteFirstName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    placeholder="Имя" 
                  />
                  <input 
                    type="text" 
                    value={inviteLastName} 
                    onChange={(e) => setInviteLastName(e.target.value)}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
                    placeholder="Фамилия" 
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {translations.invite.role}
                </label>
                <select 
                  value={inviteRole} 
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all cursor-pointer appearance-none bg-white"
                >
                  <option value="member">{translations.invite.roleMember}</option>
                  <option value="admin">{translations.invite.roleAdmin}</option>
                </select>
              </div>
              
              <button 
                type="submit" 
                disabled={isInviting}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-600 transition-all shadow-md hover:shadow-lg disabled:opacity-50 mt-4"
              >
                {isInviting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  translations.invite.send
                )}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Модальное окно подтверждения деактивации */}
      <ConfirmModal
        isOpen={deactivateConfirm.isOpen}
        title={translations.deactivateConfirm}
        message={translations.deactivateWarning}
        variant="danger"
        confirmText="Да, деактивировать"
        cancelText="Отмена"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setDeactivateConfirm({ isOpen: false, userId: null })}
      />
    </div>
  );
}