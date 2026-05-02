import React, { useState, useEffect } from 'react';
import { X, Search, Mail, Users, Send, Check, Loader2, UserPlus } from 'lucide-react';
import { api } from '../services/api.ts';
import { UserResponse } from '../types.ts';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

// Переводы
const translations = {
  title: 'Пригласить участников',
  meeting: 'Встреча',
  searchPlaceholder: 'Поиск по имени или email...',
  inviteAll: 'Пригласить всех участников',
  noResults: 'Пользователи не найдены',
  noMembers: 'Нет участников для приглашения',
  successOne: 'Приглашение отправлено',
  errorOne: 'Не удалось отправить приглашение',
  successAll: 'Приглашения отправлены всем участникам!',
  errorAll: 'Ошибка при массовой отправке',
  confirmAll: 'Отправить приглашения по email всем',
  confirmAllSuffix: 'участникам?',
  close: 'Закрыть'
};

export default function InviteToRoomModal({ isOpen, onClose, roomId, roomName }: Props) {
  const [search, setSearch] = useState('');
  const [allUsers, setAllUsers] = useState<UserResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);
  const [sentEmails, setSentEmails] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      const loadUsers = async () => {
        try {
          const users = await api.auth.getUsers();
          setAllUsers(users);
        } catch (err) { 
          console.error(err);
          toast.error('Не удалось загрузить список пользователей');
        }
      };
      loadUsers();
    }
  }, [isOpen]);

  const handleClose = () => {
    setSearch('');
    setSentEmails(new Set());
    onClose();
  };

  const handleInviteOne = async (email: string) => {
    setSendingEmail(email);
    try {
      await api.rooms.inviteToRoom(roomId, email);
      setSentEmails(prev => new Set(prev).add(email));
      toast.success(translations.successOne);
    } catch (err) { 
      toast.error(translations.errorOne);
    } finally { 
      setSendingEmail(null); 
    }
  };

  const handleInviteAll = async () => {
    if (!confirm(`${translations.confirmAll} ${allUsers.length} ${translations.confirmAllSuffix}`)) return;
    setIsLoading(true);
    try {
      await api.rooms.inviteAllToRoom(roomId);
      toast.success(translations.successAll);
      handleClose();
    } catch (err) { 
      toast.error(translations.errorAll);
    } finally { 
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.first_name && u.first_name.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-1.5 rounded-lg">
              <UserPlus className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {translations.title}
            </h2>
          </div>
          <button 
            onClick={handleClose} 
            className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meeting info */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
          <p className="text-xs text-blue-700 font-semibold uppercase tracking-wider mb-1">
            {translations.meeting}
          </p>
          <p className="text-sm font-bold text-blue-900 truncate">
            {roomName}
          </p>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder={translations.searchPlaceholder} 
              value={search} 
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2.5 bg-gray-100 border border-transparent rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white outline-none transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredUsers.length > 0 ? (
              filteredUsers.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-all group">
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-semibold text-gray-900 truncate">
                      {user.first_name} {user.last_name || ''}
                    </span>
                    <span className="text-xs text-gray-500 truncate flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {user.email}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleInviteOne(user.email)}
                    disabled={sentEmails.has(user.email) || sendingEmail === user.email}
                    className={`p-2 rounded-lg transition-all ml-2 ${
                      sentEmails.has(user.email) 
                        ? 'bg-green-50 text-green-600' 
                        : 'text-blue-600 hover:bg-blue-50'
                    }`}
                  >
                    {sendingEmail === user.email ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : sentEmails.has(user.email) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">
                  {search ? translations.noResults : translations.noMembers}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={handleInviteAll}
            disabled={isLoading || allUsers.length === 0}
            className="w-full py-3 bg-gradient-to-r from-gray-800 to-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:from-gray-900 hover:to-gray-950 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            <span>{translations.inviteAll} ({allUsers.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
}