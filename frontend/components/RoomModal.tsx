import React, { useState, useEffect } from 'react';
import { X, Calendar, Users, AlignLeft, Type } from 'lucide-react';
import { RoomResponse } from '../types.ts';

interface RoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  room?: RoomResponse | null; // Если передано, значит это редактирование
}

export default function RoomModal({ isOpen, onClose, onSubmit, room }: RoomModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scheduledStartAt, setScheduledStartAt] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(50);

  // Когда открываем модалку для редактирования, заполняем поля
  useEffect(() => {
    if (room) {
      setName(room.name);
      setDescription(room.description || '');
      // Преобразуем дату из ISO в формат для datetime-local
      if (room.scheduled_start_at) {
        const date = new Date(room.scheduled_start_at);
        const offset = date.getTimezoneOffset() * 60000;
        const localISOTime = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        setScheduledStartAt(localISOTime);
      }
      setMaxParticipants(room.max_participants || 50);
    } else {
      setName('');
      setDescription('');
      setScheduledStartAt('');
      setMaxParticipants(50);
    }
  }, [room, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      name,
      description,
      // ВАЖНО: для бэкенда используем snake_case
      scheduled_start_at: scheduledStartAt ? new Date(scheduledStartAt).toISOString() : null,
      max_participants: maxParticipants
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-900">
            {room ? 'Edit Conference' : 'Create New Conference'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Room Name <span className="text-red-500">*</span></label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Type className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text" required value={name}
                onChange={(e) => setName(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Start</label>
              <input
                type="datetime-local" value={scheduledStartAt}
                onChange={(e) => setScheduledStartAt(e.target.value)}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Participants</label>
              <input
                type="number" value={maxParticipants}
                onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
            Cancel
          </button>
          <button
            type="submit" onClick={handleSubmit} disabled={!name.trim()}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {room ? 'Save Changes' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
}