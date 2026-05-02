import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, PlayCircle, Archive, Loader2, AlertCircle, MoreVertical, Edit, Copy, Trash2, ArchiveIcon, Mail, CheckCircle2, Calendar, Search, X, Filter, ChevronDown } from 'lucide-react';
import { RoomResponse, RoomStatus } from '../types.ts';
import RoomModal from '../components/RoomModal.tsx';
import Sidebar from '../components/Sidebar.tsx';
import InviteToRoomModal from '../components/InviteToRoomModal.tsx';
import toast from 'react-hot-toast';
import { api } from '../services/api.ts';
import ConfirmModal from '../components/ConfirmModal.tsx';
import { initUserSocket } from '../services/userSocket';

// Переводы
const translations = {
  title: 'Встречи',
  subtitle: 'Управляйте активными и запланированными встречами',
  newMeeting: 'Новая встреча',
  loading: 'Загрузка встреч...',
  error: 'Не удалось загрузить встречи',
  tryAgain: 'Повторить',
  noRooms: 'Встречи не найдены',
  noRoomsHint: 'Попробуйте изменить фильтры или создайте новую встречу',
  filters: {
    all: 'Все',
    active: 'Активные',
    scheduled: 'Запланированные',
    ended: 'Завершённые',
    archived: 'Архивные'
  },
  roomsFound: (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return `${count} встреча найдена`;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return `${count} встречи найдены`;
    return `${count} встреч найдено`;
  },
  searchPlaceholder: 'Поиск по названию или описанию...',
  clearSearch: 'Очистить поиск',
  noDescription: 'Нет описания',
  participants: 'участников',
  joinNow: 'Присоединиться',
  viewDetails: 'Подробнее',
  viewResults: 'Результаты',
  archived: 'В архиве',
  edit: 'Редактировать',
  inviteByEmail: 'Пригласить по email',
  copyInviteLink: 'Скопировать ссылку',
  archive: 'Архивировать',
  delete: 'Удалить',
  copySuccess: 'Ссылка-приглашение скопирована!',
  archiveConfirm: 'Архивировать эту встречу?',
  deleteConfirm: 'Удалить эту встречу? Это действие нельзя отменить.',
  statuses: {
    active: 'Активна',
    scheduled: 'Запланирована',
    ended: 'Завершена',
    archived: 'В архиве'
  },
  started: 'Началась',
  scheduledAt: 'Запланирована на',
  to: '→'
};

function getStatusConfig(status: string) {
  switch (status) {
    case RoomStatus.ACTIVE:
      return { color: 'green', label: translations.statuses.active, icon: PlayCircle };
    case RoomStatus.SCHEDULED:
      return { color: 'blue', label: translations.statuses.scheduled, icon: Clock };
    case RoomStatus.ENDED:
      return { color: 'emerald', label: translations.statuses.ended, icon: CheckCircle2 };
    case RoomStatus.ARCHIVED:
      return { color: 'slate', label: translations.statuses.archived, icon: Archive };
    default:
      return { color: 'gray', label: status, icon: Clock };
  }
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | RoomStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterRef = React.useRef<HTMLDivElement>(null);
  
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [inviteRoom, setInviteRoom] = useState<{id: string, name: string} | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);


  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    variant: 'danger',
  });

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = { limit: 100, offset: 0 };
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await api.rooms.list(params);
      setRooms(response.rooms || []);
    } catch (err: any) {
      console.error("Failed to fetch rooms:", err);
      if (err.status === 401) {
        navigate('/login');
      } else {
        setError(translations.error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  // Закрытие фильтра при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setShowFilterDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleUserUpdate = (event: StorageEvent) => {
      if (event.key === 'user') {
        // Обновляем currentUser
        const newUser = localStorage.getItem('user');
        if (newUser) {
          // Перезагружаем страницу для применения новых прав
          window.location.reload();
        }
      }
    };
  
  window.addEventListener('storage', handleUserUpdate);
  return () => window.removeEventListener('storage', handleUserUpdate);
}, []);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = async (data: any) => {
    try {
      await api.rooms.create({
        name: data.name,
        description: data.description,
        scheduled_start_at: data.scheduled_start_at || undefined,
        maxParticipants: data.maxParticipants
      });
      setIsCreateModalOpen(false);
      fetchRooms();
      toast.success('Встреча создана');
    } catch (err: any) {
      console.error("Failed to create room:", err);
      toast.error("Не удалось создать встречу: " + (err.message || "Unknown error"));
    }
  };

  const handleEditRoom = async (data: any) => {
    if (!editingRoom) return;
    try {
      await api.rooms.update(editingRoom.id, {
        name: data.name,
        description: data.description,
        scheduled_start_at: data.scheduled_start_at || undefined,
      });
      setEditingRoom(null);
      fetchRooms();
      toast.success('Встреча обновлена');
    } catch (err: any) {
      console.error("Failed to update room:", err);
      toast.error("Не удалось обновить встречу: " + (err.message || "Unknown error"));
    }
  };

  const handleArchiveRoom = (roomId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Архивировать встречу?',
      message: 'Вы уверены, что хотите архивировать эту встречу?',
      variant: 'warning',
      onConfirm: async () => {
        try {
          await api.rooms.archive(roomId);
          fetchRooms();
          toast.success('Встреча архивирована');
        } catch (err: any) {
          toast.error("Не удалось архивировать: " + (err.message || "Unknown error"));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleDeleteRoom = (roomId: string) => {
    setConfirmModal({
      isOpen: true,
      title: 'Удалить встречу?',
      message: 'Вы уверены, что хотите удалить эту встречу? Это действие нельзя отменить.',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await api.rooms.delete(roomId);
          fetchRooms();
          toast.success('Встреча удалена');
        } catch (err: any) {
          toast.error("Не удалось удалить: " + (err.message || "Unknown error"));
        }
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleCopyInviteLink = (room: RoomResponse) => {
    const link = `${window.location.origin}/#/join/${room.invite_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setShowCopyToast(true);
      setOpenMenuId(null);
      setTimeout(() => setShowCopyToast(false), 3000);
    });
  };

  // Фильтрация по поиску
  const filteredRooms = useMemo(() => {
    if (!searchQuery) return rooms;
    const query = searchQuery.toLowerCase();
    return rooms.filter(room => 
      room.name.toLowerCase().includes(query) ||
      (room.description && room.description.toLowerCase().includes(query))
    );
  }, [rooms, searchQuery]);

  const formatDateTime = (dateStr: string, showTime: boolean = true) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: 'numeric', 
      month: 'short' 
    };
    if (showTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return date.toLocaleDateString('ru-RU', options);
  };

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
      initUserSocket();
  }, []);

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {translations.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{translations.subtitle}</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-md hover:shadow-lg active:scale-95"
          >
            <Plus className="w-5 h-5" />
            <span>{translations.newMeeting}</span>
          </button>
        </header>

        {/* Панель фильтров и поиска */}
        <div className="px-8 py-4 border-b border-gray-200 bg-white flex justify-between items-center flex-wrap gap-4 shrink-0">
          <div className="flex gap-2 flex-wrap">
            {/* Мобильный фильтр (выпадающий список) */}
            <div className="relative md:hidden" ref={filterRef}>
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl text-sm font-medium text-gray-700"
              >
                <Filter className="w-4 h-4" />
                <span>
                  {filter === 'all' && translations.filters.all}
                  {filter === RoomStatus.ACTIVE && translations.filters.active}
                  {filter === RoomStatus.SCHEDULED && translations.filters.scheduled}
                  {filter === RoomStatus.ENDED && translations.filters.ended}
                  {filter === RoomStatus.ARCHIVED && translations.filters.archived}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform ${showFilterDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showFilterDropdown && (
                <div className="absolute left-0 mt-2 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-30">
                  <button onClick={() => { setFilter('all'); setShowFilterDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Все</button>
                  <button onClick={() => { setFilter(RoomStatus.ACTIVE); setShowFilterDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Активные</button>
                  <button onClick={() => { setFilter(RoomStatus.SCHEDULED); setShowFilterDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Запланированные</button>
                  <button onClick={() => { setFilter(RoomStatus.ENDED); setShowFilterDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Завершённые</button>
                  <button onClick={() => { setFilter(RoomStatus.ARCHIVED); setShowFilterDropdown(false); }} className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50">Архивные</button>
                </div>
              )}
            </div>

            {/* Десктопные кнопки фильтров */}
            <div className="hidden md:flex gap-2">
              <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === 'all' ? 'bg-gray-900 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {translations.filters.all}
              </button>
              <button onClick={() => setFilter(RoomStatus.ACTIVE)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${filter === RoomStatus.ACTIVE ? 'bg-green-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <PlayCircle className="w-4 h-4" /> {translations.filters.active}
              </button>
              <button onClick={() => setFilter(RoomStatus.SCHEDULED)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${filter === RoomStatus.SCHEDULED ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Clock className="w-4 h-4" /> {translations.filters.scheduled}
              </button>
              <button onClick={() => setFilter(RoomStatus.ENDED)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${filter === RoomStatus.ENDED ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <CheckCircle2 className="w-4 h-4" /> {translations.filters.ended}
              </button>
              <button onClick={() => setFilter(RoomStatus.ARCHIVED)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-1.5 ${filter === RoomStatus.ARCHIVED ? 'bg-slate-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                <Archive className="w-4 h-4" /> {translations.filters.archived}
              </button>
            </div>
          </div>

          {/* Поиск */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={translations.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Результат поиска */}
        {searchQuery && (
          <div className="px-8 py-2 bg-blue-50 border-b border-blue-100 text-sm text-blue-700 flex justify-between items-center">
            <span>Найдено: {translations.roomsFound(filteredRooms.length)}</span>
            <button onClick={() => setSearchQuery('')} className="text-blue-500 hover:text-blue-700">Очистить поиск</button>
          </div>
        )}

        <main className="flex-1 overflow-y-auto p-8">
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
              <button onClick={fetchRooms} className="mt-4 px-6 py-2 bg-white border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors shadow-sm">
                {translations.tryAgain}
              </button>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="bg-gray-100 rounded-full p-4 mb-4">
                <Calendar className="w-12 h-12 text-gray-300" />
              </div>
              <p className="text-lg font-medium text-gray-900">{translations.noRooms}</p>
              <p className="text-sm text-gray-500 mt-1">{translations.noRoomsHint}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {filteredRooms.map((room) => {
                const canManage = room.creator_id === currentUser.id || 
                                  currentUser.role === 'owner' || 
                                  currentUser.role === 'admin';
                const StatusConfig = getStatusConfig(room.status);
                const StatusIcon = StatusConfig.icon;

                return (
                  <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-200 flex flex-col group relative overflow-hidden">
                    {/* Цветная полоска сверху */}
                    <div className={`h-1 w-full ${
                      room.status === RoomStatus.ACTIVE ? 'bg-green-500' :
                      room.status === RoomStatus.SCHEDULED ? 'bg-blue-500' :
                      room.status === RoomStatus.ENDED ? 'bg-emerald-500' :
                      'bg-gray-400'
                    }`} />
                    
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">
                          {room.name}
                        </h3>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                            room.status === RoomStatus.ACTIVE 
                              ? 'bg-green-100 text-green-700 border border-green-200' 
                              : room.status === RoomStatus.SCHEDULED 
                                ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                                : room.status === RoomStatus.ENDED 
                                  ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-500 border border-gray-200'
                          }`}>
                            <StatusIcon className="w-3 h-3" />
                            {StatusConfig.label}
                          </span>
                          
                          {canManage && (
                            <div className="relative">
                              <button 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === room.id ? null : room.id); }}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              
                              {openMenuId === room.id && (
                                <>
                                  <div className="fixed inset-0 z-40" onClick={() => setOpenMenuId(null)} />
                                  <div className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-xl border border-gray-200 py-1 z-50 animate-fade-in">
                                    
                                    {/* Редактировать - только для SCHEDULED */}
                                    {room.status === RoomStatus.SCHEDULED && (
                                      <button 
                                        onClick={() => { setEditingRoom(room); setOpenMenuId(null); }} 
                                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        <Edit className="w-3 h-3" /> 
                                        <span>Редактировать</span>
                                      </button>
                                    )}
                                    
                                    {/* Пригласить и скопировать ссылку - НЕ для ENDED и НЕ для ARCHIVED */}
                                    {room.status !== RoomStatus.ENDED && room.status !== RoomStatus.ARCHIVED && (
                                      <>
                                        <button 
                                          onClick={() => { setInviteRoom({ id: room.id, name: room.name }); setOpenMenuId(null); }} 
                                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                          <Mail className="w-3 h-3" /> 
                                          <span>Пригласить</span>
                                        </button>
                                        <button 
                                          onClick={() => handleCopyInviteLink(room)} 
                                          className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                          <Copy className="w-3 h-3" /> 
                                          <span>Скопировать ссылку</span>
                                        </button>
                                      </>
                                    )}
                                    
                                    {/* Архивировать - только для SCHEDULED или ENDED */}
                                    {(room.status === RoomStatus.SCHEDULED || room.status === RoomStatus.ENDED) && (
                                      <button 
                                        onClick={() => { handleArchiveRoom(room.id); setOpenMenuId(null); }} 
                                        className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-gray-700 hover:bg-gray-50 transition-colors"
                                      >
                                        <ArchiveIcon className="w-3 h-3" /> 
                                        <span>Архивировать</span>
                                      </button>
                                    )}
                                    
                                    {/* Удалить - для ВСЕХ (включая архивные) */}
                                    <button 
                                      onClick={() => { handleDeleteRoom(room.id); setOpenMenuId(null); }} 
                                      className="w-full flex items-center gap-1.5 px-2 py-1.5 text-[11px] text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                      <Trash2 className="w-3 h-3" /> 
                                      <span>Удалить</span>
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <p className="text-gray-500 text-sm mb-3 flex-1 line-clamp-2">
                        {room.description || translations.noDescription}
                      </p>

                      {/* Дата и время */}
                      <div className="flex items-center text-xs text-gray-400 gap-2 flex-wrap mb-4">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        {room.status === RoomStatus.SCHEDULED && room.scheduled_start_at && (
                          <span>{formatDateTime(room.scheduled_start_at)}</span>
                        )}
                        {room.status === RoomStatus.ACTIVE && room.started_at && (
                          <span>Началась {formatDateTime(room.started_at)}</span>
                        )}
                        {(room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED) && room.started_at && (
                          <>
                            <span>{formatDateTime(room.started_at)}</span>
                            {room.ended_at && (
                              <>
                                <span className="text-gray-300">→</span>
                                <span>{formatDateTime(room.ended_at)}</span>
                              </>
                            )}
                            {room.duration_seconds && (
                              <span className="ml-1 bg-gray-100 px-1.5 py-0.5 rounded">
                                {Math.floor(room.duration_seconds / 60)} мин
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                        <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                          <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                          <span className="font-medium">{room.participants_count} {room.max_participants ? `/ ${room.max_participants}` : ''}</span>
                        </div>
                        <button 
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={false}
                          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                            room.status === RoomStatus.ACTIVE
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : room.status === RoomStatus.SCHEDULED
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : room.status === RoomStatus.ENDED
                                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                  : room.status === RoomStatus.ARCHIVED
                                    ? 'bg-gray-400 text-white cursor-pointer hover:bg-gray-500'  // Серый цвет для архивных, но активная
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {room.status === RoomStatus.ACTIVE ? translations.joinNow : 
                          room.status === RoomStatus.SCHEDULED ? translations.viewDetails :
                          room.status === RoomStatus.ENDED ? translations.viewResults :
                          room.status === RoomStatus.ARCHIVED ? translations.viewResults :
                          translations.archived}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
      
      <RoomModal 
        isOpen={isCreateModalOpen || !!editingRoom} 
        onClose={() => { setIsCreateModalOpen(false); setEditingRoom(null); }}
        onSubmit={editingRoom ? handleEditRoom : handleCreateRoom}
        room={editingRoom}
      />

      <InviteToRoomModal 
        isOpen={!!inviteRoom} 
        onClose={() => setInviteRoom(null)} 
        roomId={inviteRoom?.id || ''} 
        roomName={inviteRoom?.name || ''} 
      />

      {showCopyToast && (
        <div className="fixed bottom-8 right-8 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-2xl z-[100] animate-slide-in">
          <div className="bg-green-500 p-1 rounded-full">
            <Copy className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="font-medium text-sm">{translations.copySuccess}</span>
        </div>
      )}
      {/* Модальное окно подтверждения - ВСТАВЬТЕ СЮДА */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        variant={confirmModal.variant}
        confirmText="Да, подтверждаю"
        cancelText="Отмена"
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}