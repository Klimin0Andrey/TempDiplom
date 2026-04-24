import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Users, Clock, PlayCircle, Archive, Loader2, AlertCircle } from 'lucide-react';
import { RoomResponse, RoomStatus } from '../types.ts';
import CreateRoomModal from '../components/CreateRoomModal.tsx';
import Sidebar from '../components/Sidebar.tsx';
import { api } from '../services/api.ts';

export default function Dashboard() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState<RoomResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | RoomStatus>('all');

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleJoinRoom = (roomId: string) => {
    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = async (data: { name: string; description: string; scheduledStartAt: string; maxParticipants: number }) => {
    try {
      const newRoom = await api.rooms.create({
        name: data.name,
        description: data.description,
        scheduledStartAt: data.scheduledStartAt ? new Date(data.scheduledStartAt).toISOString() : undefined,
        maxParticipants: data.maxParticipants
      });
      
      // If the current filter allows seeing the new room, add it to the list
      if (filter === 'all' || filter === RoomStatus.SCHEDULED) {
        setRooms([newRoom, ...rooms]);
      }
    } catch (err: any) {
      console.error("Failed to create room:", err);
      alert("Failed to create room: " + (err.message || "Unknown error"));
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      {/* Main Content */}
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
              {rooms.map((room) => (
                <div key={room.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all flex flex-col group">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors">{room.name}</h3>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      room.status === RoomStatus.ACTIVE ? 'bg-green-100 text-green-800 border border-green-200' :
                      room.status === RoomStatus.SCHEDULED ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                      room.status === RoomStatus.ARCHIVED ? 'bg-gray-100 text-gray-600 border border-gray-200' :
                      'bg-gray-100 text-gray-800 border border-gray-200'
                    }`}>
                      {room.status}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm mb-6 flex-1 line-clamp-2">{room.description || 'No description provided.'}</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                    <div className="flex items-center text-gray-500 text-sm bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                      <Users className="w-4 h-4 mr-1.5 text-gray-400" />
                      <span className="font-medium">{room.participantsCount} {room.maxParticipants ? `/ ${room.maxParticipants}` : ''}</span>
                    </div>
                    <button 
                      onClick={() => handleJoinRoom(room.id)}
                      disabled={room.status === RoomStatus.ARCHIVED}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        room.status === RoomStatus.ARCHIVED 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                          : room.status === RoomStatus.ACTIVE
                            ? 'bg-green-600 text-white hover:bg-green-700 shadow-sm hover:shadow'
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-100'
                      }`}
                    >
                      {room.status === RoomStatus.ACTIVE ? 'Join Now' : 'View Details'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CreateRoomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSubmit={handleCreateRoom} 
      />
    </div>
  );
}
