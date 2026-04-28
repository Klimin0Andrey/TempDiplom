import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, PlayCircle, Archive, Loader2, AlertCircle, MoreVertical, Edit, Copy, Trash2, ArchiveIcon, Mail, CheckCircle2, Calendar } from 'lucide-react';
import { RoomResponse, RoomStatus } from '../types.ts';
import RoomModal from '../components/RoomModal.tsx';
import Sidebar from '../components/Sidebar.tsx';
import InviteToRoomModal from '../components/InviteToRoomModal.tsx';
import { api } from '../services/api.ts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | RoomStatus>('all');
  
  const [editingRoom, setEditingRoom] = useState<RoomResponse | null>(null);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [inviteRoom, setInviteRoom] = useState<{id: string, name: string} | null>(null);
  const [showCopyToast, setShowCopyToast] = useState(false);

  const fetchRooms = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const params: any = { limit: 20, offset: 0 };
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
        setError("Failed to load conferences. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [filter]);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = async (data: any) => {
    try {
      await api.rooms.create({
        name: data.name,
        description: data.description,
        // scheduled_start_at: data.scheduledStartAt ? new Date(data.scheduledStartAt).toISOString() : undefined,
        scheduled_start_at: data.scheduled_start_at || undefined,
        maxParticipants: data.maxParticipants
      });
      setIsCreateModalOpen(false);
      fetchRooms();
    } catch (err: any) {
      console.error("Failed to create room:", err);
      alert("Failed to create room: " + (err.message || "Unknown error"));
    }
  };

  const handleEditRoom = async (data: any) => {
    if (!editingRoom) return;
    try {
      await api.rooms.update(editingRoom.id, {
        name: data.name,
        description: data.description,
        // scheduled_start_at: data.scheduledStartAt ? new Date(data.scheduledStartAt).toISOString() : undefined,
        scheduled_start_at: data.scheduled_start_at || undefined,
      });
      setEditingRoom(null);
      fetchRooms();
    } catch (err: any) {
      console.error("Failed to update room:", err);
      alert("Failed to update room: " + (err.message || "Unknown error"));
    }
  };

  const handleArchiveRoom = async (roomId: string) => {
    if (!confirm('Archive this room?')) return;
    try {
      await api.rooms.archive(roomId);
      fetchRooms();
    } catch (err: any) {
      alert("Failed to archive: " + (err.message || "Unknown error"));
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    if (!confirm('Permanently delete this room? This cannot be undone.')) return;
    try {
      await api.rooms.delete(roomId);
      fetchRooms();
    } catch (err: any) {
      alert("Failed to delete: " + (err.message || "Unknown error"));
    }
  };

  const handleCopyInviteLink = (room: RoomResponse) => {
    const link = `${window.location.origin}/#/join/${room.invite_code}`;
    navigator.clipboard.writeText(link).then(() => {
      setShowCopyToast(true);
      setOpenMenuId(null);
      setTimeout(() => setShowCopyToast(false), 3000);
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Conferences</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your active and scheduled meetings</p>
          </div>
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-5 h-5" />
            <span>New Meeting</span>
          </button>
        </header>

        <div className="px-8 py-4 border-b border-gray-200 bg-white flex space-x-4 shrink-0">
          <button onClick={() => setFilter('all')} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === 'all' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>All</button>
          <button onClick={() => setFilter(RoomStatus.ACTIVE)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${filter === RoomStatus.ACTIVE ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><PlayCircle className="w-4 h-4 mr-1.5"/> Active</button>
          <button onClick={() => setFilter(RoomStatus.SCHEDULED)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${filter === RoomStatus.SCHEDULED ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Clock className="w-4 h-4 mr-1.5"/> Scheduled</button>
          <button onClick={() => setFilter(RoomStatus.ENDED)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${filter === RoomStatus.ENDED ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><CheckCircle2 className="w-4 h-4 mr-1.5"/> Ended</button>
          <button onClick={() => setFilter(RoomStatus.ARCHIVED)} className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center ${filter === RoomStatus.ARCHIVED ? 'bg-gray-800 text-white border border-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}><Archive className="w-4 h-4 mr-1.5"/> Archived</button>
        </div>

        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 mb-4 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Loading conferences...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertCircle className="w-12 h-12 mb-4 text-red-300" />
              <p className="text-lg font-medium text-red-900">{error}</p>
              <button onClick={fetchRooms} className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors">Try Again</button>
            </div>
          ) : rooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Clock className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-lg font-medium text-gray-900">No conferences found</p>
              <p className="text-sm">Try changing your filters or create a new meeting.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {rooms.map((room) => {
                const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
                const canManage = room.creator_id === currentUser.id || 
                                  currentUser.role === 'owner' || 
                                  currentUser.role === 'admin';

                return (
                <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col group relative">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{room.name}</h3>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        room.status === RoomStatus.ACTIVE ? 'bg-green-100 text-green-800 border border-green-200' :
                        room.status === RoomStatus.SCHEDULED ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        room.status === RoomStatus.ENDED ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                        room.status === RoomStatus.ARCHIVED ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {room.status}
                      </span>
                      
                      {canManage && (
                        <div className="relative flex items-center space-x-1">
                          {/* Кнопка Edit для scheduled */}
                          {room.status === RoomStatus.SCHEDULED && (
                            <button
                              onClick={(e) => { e.stopPropagation(); setEditingRoom(room); }}
                              className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                              title="Edit meeting"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === room.id ? null : room.id); }}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          
                          {openMenuId === room.id && (
                            <>
                              <div 
                                className="fixed inset-0 z-40" 
                                onClick={(e) => { e.stopPropagation(); setOpenMenuId(null); }}
                              />
                              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                                {room.status !== RoomStatus.ENDED && room.status !== RoomStatus.ARCHIVED && (
                                  <>
                                <button
                                  onClick={() => { setInviteRoom({ id: room.id, name: room.name }); setOpenMenuId(null); }}
                                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Mail className="w-4 h-4" /> <span>Invite by Email</span>
                                </button>
                                <button
                                  onClick={() => handleCopyInviteLink(room)}
                                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <Copy className="w-4 h-4" /> <span>Copy Invite Link</span>
                                </button>
                                </>
                                )}
                                {(room.status === RoomStatus.SCHEDULED || room.status === RoomStatus.ENDED) && (
                                  <button
                                    onClick={() => { handleArchiveRoom(room.id); setOpenMenuId(null); }}
                                    className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                  >
                                    <ArchiveIcon className="w-4 h-4" /> <span>Archive</span>
                                  </button>
                                )}
                                <button
                                  onClick={() => { handleDeleteRoom(room.id); setOpenMenuId(null); }}
                                  className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" /> <span>Delete</span>
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm mb-2 flex-1 line-clamp-2">{room.description || 'No description provided.'}</p>

                  {/* Дата и время */}
                  <div className="flex items-center text-xs text-gray-400 mb-4 space-x-1">
                    <Calendar className="w-3 h-3 shrink-0" />
                    {room.status === RoomStatus.SCHEDULED && room.scheduled_start_at && (
                      <span>{new Date(room.scheduled_start_at).toLocaleDateString([], { day: 'numeric', month: 'short' })} · {new Date(room.scheduled_start_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {room.status === RoomStatus.SCHEDULED && !room.scheduled_start_at && (
                      <span>No date set</span>
                    )}
                    {room.status === RoomStatus.ACTIVE && room.started_at && (
                      <span>Started {new Date(room.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {(room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED) && room.started_at && (
                      <span>{new Date(room.started_at).toLocaleDateString([], { day: 'numeric', month: 'short' })} · {new Date(room.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {(room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED) && room.ended_at && (
                      <span className="text-gray-300 mx-1">→</span>
                    )}
                    {(room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED) && room.ended_at && (
                      <span>{new Date(room.ended_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                    {(room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED) && room.duration_seconds && (
                      <span className="ml-1">({Math.floor(room.duration_seconds / 60)}m)</span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                      <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span className="font-medium">{room.participants_count} {room.max_participants ? `/ ${room.max_participants}` : ''}</span>
                    </div>
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        room.status === RoomStatus.ACTIVE
                          ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow'
                          : room.status === RoomStatus.ENDED || room.status === RoomStatus.ARCHIVED
                            ? 'bg-gray-600 text-white hover:bg-gray-700'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                      }`}
                    >
                      {room.status === RoomStatus.ACTIVE ? 'Join Now' : 
                      room.status === RoomStatus.ENDED ? 'View Results' :
                      room.status === RoomStatus.ARCHIVED ? 'View Protocol' : 'View Details'}
                    </button>
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
        <div className="fixed bottom-8 right-8 flex items-center space-x-3 bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-[100]">
          <div className="bg-green-500 p-1 rounded-full">
            <Copy className="w-4 h-4 text-white" />
          </div>
          <span className="font-medium text-sm">Invite link copied to clipboard!</span>
        </div>
      )}
    </div>
  );
}