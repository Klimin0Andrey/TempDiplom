import React, { useState, useEffect } from 'react';
import { X, Search, Mail, Users, Send, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api.ts';
import { UserResponse } from '../types.ts';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
  roomName: string;
}

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
        } catch (err) { console.error(err); }
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
    } catch (err) { toast.error("Failed to send invite"); }
    finally { setSendingEmail(null); }
  };

  const handleInviteAll = async () => {
    if (!confirm(`Send email invitations to all ${allUsers.length} members?`)) return;
    setIsLoading(true);
    try {
      await api.rooms.inviteAllToRoom(roomId);
      alert("Invitations sent to everyone!");
      handleClose();
    } catch (err) { toast.error("Error sending mass invites"); }
    finally { setIsLoading(false); }
  };

  if (!isOpen) return null;

  const filteredUsers = allUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    u.first_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-lg font-bold text-gray-900">Invite to Meeting</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 bg-blue-50/50 border-b border-blue-100">
          <p className="text-xs text-blue-700 font-medium uppercase tracking-wider mb-1">Meeting</p>
          <p className="text-sm font-bold text-blue-900 truncate">{roomName}</p>
        </div>

        <div className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search by name or email..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-10 py-2 bg-gray-100 border-none rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
            {filteredUsers.map(user => (
              <div key={user.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex flex-col min-w-0">
                  <span className="text-sm font-bold text-gray-900 truncate">{user.first_name} {user.last_name || ''}</span>
                  <span className="text-xs text-gray-500 truncate">{user.email}</span>
                </div>
                <button 
                  onClick={() => handleInviteOne(user.email)}
                  disabled={sentEmails.has(user.email) || sendingEmail === user.email}
                  className={`p-2 rounded-md transition-all ${
                    sentEmails.has(user.email) ? 'text-green-600' : 'text-blue-600 hover:bg-blue-50'
                  }`}
                >
                  {sendingEmail === user.email ? <Loader2 className="w-4 h-4 animate-spin" /> : 
                   sentEmails.has(user.email) ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={handleInviteAll}
            disabled={isLoading || allUsers.length === 0}
            className="w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold flex items-center justify-center space-x-2 hover:bg-gray-800 transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            <span>Invite All Members ({allUsers.length})</span>
          </button>
        </div>
      </div>
    </div>
  );
}