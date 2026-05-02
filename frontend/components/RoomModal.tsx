import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, AlignLeft, Type, Clock, AlertCircle } from 'lucide-react';
import { RoomResponse } from '../types.ts';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  room?: RoomResponse | null;
}

// Лимиты по тарифам
const TIER_LIMITS: Record<string, number | null> = {
  light: 5,
  pro: 30,
  business: null, // безлимит
};

// Переводы
const translations = {
  title: {
    create: 'Создание новой встречи',
    edit: 'Редактирование встречи'
  },
  fields: {
    roomName: 'Название встречи',
    description: 'Описание',
    scheduledStart: 'Дата и время начала',
    maxParticipants: 'Максимум участников'
  },
  placeholders: {
    roomName: 'Например: Еженедельное совещание',
    description: 'Краткое описание встречи (необязательно)'
  },
  buttons: {
    cancel: 'Отмена',
    create: 'Создать встречу',
    save: 'Сохранить изменения'
  },
  limits: {
    max: 'макс.',
    unlimited: 'Безлимит',
    warning: 'Ваш тариф ограничивает количество участников'
  },
  required: 'Обязательное поле'
};

export default function RoomModal({ isOpen, onClose, onSubmit, room }: RoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [maxAllowed, setMaxAllowed] = useState<number | null>(null);

  // Определяем лимит по тарифу
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      const orgTier = user.tier_slug || 'light';
      setMaxAllowed(TIER_LIMITS[orgTier] ?? null);
      
      const limit = TIER_LIMITS[orgTier];
      if (limit && maxParticipants > limit) {
        setMaxParticipants(limit);
      }
    }
  }, []);

  useEffect(() => {
    if (room) {
      setName(room.name);
      setDescription(room.description || '');
      if (room.scheduled_start_at) {
        const date = new Date(room.scheduled_start_at);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        setScheduledStartAt(localISOTime);
      }
      setMaxParticipants(room.max_participants || (maxAllowed || 50));
    } else {
      setName('');
      setDescription('');
      setScheduledStartAt('');
      setMaxParticipants(maxAllowed || 50);
    }
  }, [room, isOpen, maxAllowed]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      scheduled_start_at: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null,
      max_participants: maxParticipants
    });
    onClose();
  };

  const isLimitReached = maxAllowed && maxParticipants >= maxAllowed;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-slide-in">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
          <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            {room ? translations.title.edit : translations.title.create}
          </h2>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.fields.roomName} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Type className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text" 
                required 
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={translations.placeholders.roomName}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {translations.fields.description}
            </label>
            <div className="relative">
              <div className="absolute top-3 left-3 pointer-events-none">
                <AlignLeft className="h-4 w-4 text-gray-400" />
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder={translations.placeholders.description}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all resize-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.fields.scheduledStart}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Clock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="datetime-local" 
                  value={scheduledStartAt}
                  onChange={(e) => setScheduledStartAt(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {translations.fields.maxParticipants}
                {maxAllowed && (
                  <span className="text-gray-400 text-xs ml-1">
                    ({translations.limits.max} {maxAllowed === null ? translations.limits.unlimited : maxAllowed})
                  </span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Users className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="number"
                  min={1}
                  max={maxAllowed || 999}
                  value={maxParticipants}
                  onChange={(e) => {
                    const val = parseInt(e.target.value);
                    if (maxAllowed && val > maxAllowed) {
                      setMaxParticipants(maxAllowed);
                    } else {
                      setMaxParticipants(val);
                    }
                  }}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-all ${
                    isLimitReached && maxAllowed 
                      ? 'border-yellow-400 bg-yellow-50' 
                      : 'border-gray-300'
                  }`}
                />
              </div>
              {isLimitReached && maxAllowed && (
                <p className="mt-1 text-xs text-yellow-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {translations.limits.warning} ({maxAllowed})
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {translations.buttons.cancel}
          </button>
          <button
            type="submit" 
            onClick={handleSubmit} 
            disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-500 rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all shadow-sm hover:shadow-md"
          >
            {room ? translations.buttons.save : translations.buttons.create}
          </button>
        </div>
      </div>
    </div>
  );
}