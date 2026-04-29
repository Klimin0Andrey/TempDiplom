import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, PhoneOff, Users, MessageSquare, 
  Settings, Hand, Share, MoreVertical, Send, Info, FileText, Reply, X, Circle, Edit3, Trash2
} from 'lucide-react';
import { Participant, ChatMessage, ProtocolResponse, RoomResponse } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';
import ConnectionStatus from '../components/ConnectionStatus.tsx';
import { api } from '../services/api.ts';
import { wsClient, ConnectionState } from '../services/websocket.ts';
import { AlertTriangle } from 'lucide-react';

const MOCK_PROTOCOL: ProtocolResponse = {
  id: 'prot_123',
  room_id: 'room_123',
  title: 'Project Alpha Kickoff Summary',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  summary_json: {
    summary: 'Discussed the platform architecture and task distribution between modules. Agreed to use PostgreSQL and WebSockets for real-time signaling.',
    topics: ['Architecture', 'Database', 'WebRTC Signaling']
  },
  decisions_json: {
    decisions: [
      'Use PostgreSQL as the primary database',
      'Implement WebSocket server for signaling',
      'Store protocols in JSONB format'
    ]
  },
  action_items_json: {
    action_items: [
      { id: 'a1', task: 'Design ER diagram', assignee: 'Alex', deadline: '2026-04-20', status: 'pending' },
      { id: 'a2', task: 'Setup WebSocket server', assignee: 'Dmitry', deadline: '2026-04-22', status: 'in_progress' }
    ]
  },
  pdf_url: '#'
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(true);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [chatInput, setChatInput] = useState('');
  
  // State is now dynamic, driven by WebSockets
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [replyingTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
  const [isProtocolViewerOpen, setIsProtocolViewerOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [room, setRoom] = useState<RoomResponse | null>(null);

  // ====== WebRTC Audio State ======
  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const localAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioConnected, setAudioConnected] = useState(false);
  // ====== End WebRTC Audio State ======
  const [elapsedTime, setElapsedTime] = useState('00:00:00');
  const userStr = localStorage.getItem('user');
  const currentUser = userStr ? JSON.parse(userStr) : null;


  // ====== WebRTC Audio Functions ======
const startAudio = async () => {
  console.log('🎤 startAudio() called at', new Date().toISOString());
  // Проверка поддержки WebRTC
  if (!window.RTCPeerConnection) {
    alert('Your browser does not support WebRTC audio calls');
    return;
  }
  
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Создаём скрытый audio-элемент для локального мониторинга (muted)
    localAudioRef.current = new Audio();
    localAudioRef.current.srcObject = stream;
    localAudioRef.current.muted = true;
    localAudioRef.current.play().catch(() => {});
    
    // Создаём peer connection для каждого участника (только если участники уже есть)
    if (participants.length > 0) {
      participants.forEach(async (p) => {
        if (p.user_id === currentUser?.id) return;
        await createPeerConnection(p.user_id, stream);
      });
    }
    
    setAudioConnected(true);
    wsClient.updatePresence('speaking');
  } catch (err) {
    console.error('Microphone access denied:', err);
    alert('Please allow microphone access to use audio.');
  }
};

const createPeerConnection = async (targetUserId: string, stream: MediaStream) => {
  // Закрываем старое соединение если есть
  const existing = peerConnections.current.get(targetUserId);
  if (existing) existing.close();
  
  const pc = new RTCPeerConnection({
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
  });
  
  // Добавляем локальные аудиодорожки
  stream.getTracks().forEach(track => {
    pc.addTrack(track, stream);
  });
  
  // При получении ICE-кандидата — отправляем через signalling
  pc.onicecandidate = (event) => {
    if (event.candidate) {
      wsClient.send('ice-candidate', { 
        target: targetUserId, 
        candidate: event.candidate 
      });
    }
  };
  
  // При получении удалённого аудиопотока — воспроизводим
  pc.ontrack = (event) => {
    const audio = new Audio();
    audio.srcObject = event.streams[0];
    audio.autoplay = true;
    audio.play().catch(() => {});
    wsClient.updatePresence('speaking');
  };
  
  peerConnections.current.set(targetUserId, pc);
  
  // Создаём и отправляем offer
  const offer = await pc.createOffer();
  await pc.setLocalDescription(offer);
  wsClient.send('offer', { target: targetUserId, sdp: pc.localDescription });
  console.log('📤 Sent offer to:', targetUserId);
};

const handleWebRTCSignal = async (data: any) => {
  console.log('📡 WebRTC SIGNAL received:', data.type, 'from:', data.from, 'sdp:', !!data.sdp, 'candidate:', !!data.candidate);
  const { type, from, sdp, candidate } = data;
  
  try {
    let pc: RTCPeerConnection | undefined = peerConnections.current.get(from);
    
    if (!pc && (type === 'offer' || type === 'answer')) {
      console.log('🆕 Creating NEW peer connection for incoming call from:', from);
      
      // НЕ вызываем startAudio здесь — используем флаг ожидания
      if (!localAudioRef.current?.srcObject && !audioConnected) {
        console.warn('⚠️ No local audio stream yet, waiting for user to enable mic...');
        // Не вызываем startAudio — пользователь сам включит микрофон
        return; // Игнорируем сигнал, ждём когда пользователь включит микрофон
      }
      
      const newPc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      newPc.onicecandidate = (event) => {
        if (event.candidate) {
          wsClient.send('ice-candidate', { target: from, candidate: event.candidate });
        }
      };
      
      newPc.oniceconnectionstatechange = () => {
        console.log('🔗 ICE connection state:', newPc.iceConnectionState);
      };
      
      newPc.ontrack = (event) => {
        console.log('🔊 Received remote audio track from:', from);
        const audio = new Audio();
        audio.srcObject = event.streams[0];
        audio.autoplay = true;
        audio.play().then(() => {
          console.log('✅ Remote audio playing');
        }).catch((err) => {
          console.error('❌ Audio play failed:', err);
        });
      };
      
      const stream = localAudioRef.current?.srcObject as MediaStream;
      if (stream) {
        stream.getTracks().forEach(track => {
          newPc.addTrack(track, stream);
        });
      }
      
      peerConnections.current.set(from, newPc);
      pc = newPc;
    }
    
    if (!pc) {
      console.log('⏭️ Skipping signal — no peer connection for:', from);
      return;
    }
    
    if (type === 'offer' && sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      wsClient.send('answer', { target: from, sdp: pc.localDescription });
    } else if (type === 'answer' && sdp) {
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    } else if (type === 'ice-candidate' && candidate) {
      if (pc.remoteDescription) {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      }
      // Игнорируем ICE если нет remoteDescription — не буферизируем
    }
  } catch (err) {
    console.error('❌ WebRTC signal error:', err);
  }
};

const stopAudio = () => {
  // Останавливаем локальный стрим
  if (localAudioRef.current?.srcObject) {
    const stream = localAudioRef.current.srcObject as MediaStream;
    stream.getTracks().forEach(track => track.stop());
    localAudioRef.current = null;
  }
  // Закрываем все peer connections
  peerConnections.current.forEach(pc => pc.close());
  peerConnections.current.clear();
  setAudioConnected(false);
};

const toggleMic = () => {
  if (!audioConnected) {
    startAudio();
    setIsMuted(false);
    wsClient.send('presence', { status: 'speaking', is_muted: false, hand_raised: isHandRaised });
  } else if (!isMuted) {
    if (localAudioRef.current?.srcObject) {
      const stream = localAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => { track.enabled = false; });
    }
    setIsMuted(true);
    wsClient.send('presence', { status: 'idle', is_muted: true, hand_raised: isHandRaised });
  } else {
    if (localAudioRef.current?.srcObject) {
      const stream = localAudioRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => { track.enabled = true; });
    }
    setIsMuted(false);
    wsClient.send('presence', { status: 'speaking', is_muted: false, hand_raised: isHandRaised });
  }
};
// ====== End WebRTC Audio Functions ======

  // Загрузка данных комнаты
  useEffect(() => {
    if (!roomId) return;
    api.rooms.getById(roomId).then(res => {
        const roomData = { ...res.room };
        if (roomData.started_at) {
            if (typeof roomData.started_at !== 'string') {
                roomData.started_at = new Date(roomData.started_at).toISOString();
            }
            if (!roomData.started_at.endsWith('Z') && !roomData.started_at.includes('+')) {
                roomData.started_at += 'Z';
            }
        }
        console.log('Room started_at:', roomData.started_at);
        console.log('ROOM DATA:', JSON.stringify(roomData, null, 2));
        setRoom(roomData);
        
        // Загружаем участников из ответа API (для ended/archived комнат)
        if ((roomData.status === 'ended' || roomData.status === 'archived') && res.participants) {
          const loadedParticipants = res.participants
            .filter((p: any) => (p.userId || p.user_id) !== currentUser?.id)
            .map((p: any) => ({
              id: p.userId || p.user_id,
              user_id: p.userId || p.user_id,
              username: p.name || 'Unknown',
              role_in_room: (p.roleInRoom || 'participant') as 'organizer' | 'participant',
              is_muted: true,
              hand_raised: false,
              presence_status: 'idle' as const,
            }));
          if (loadedParticipants.length > 0) {
            setParticipants(loadedParticipants);
          }
        }
    }).catch(console.error);
}, [roomId]);

    // Таймер
    useEffect(() => {
        // Для завершённых комнат показываем итоговое время
        if (room?.duration_seconds && (room?.status === 'ended' || room?.status === 'archived')) {
            const h = String(Math.floor(room.duration_seconds / 3600)).padStart(2, '0');
            const m = String(Math.floor((room.duration_seconds % 3600) / 60)).padStart(2, '0');
            const s = String(room.duration_seconds % 60).padStart(2, '0');
            setElapsedTime(`${h}:${m}:${s}`);
            return;
        }

        if (!room?.started_at) {
            setElapsedTime('00:00:00');
            return;
        }

        const updateTimer = () => {
            const start = new Date(room.started_at!).getTime();
            const diff = Math.floor((Date.now() - start) / 1000);
            if (diff < 0) {
                setElapsedTime('00:00:00');
                return;
            }
            const h = String(Math.floor(diff / 3600)).padStart(2, '0');
            const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0');
            const s = String(diff % 60).padStart(2, '0');
            setElapsedTime(`${h}:${m}:${s}`);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [room?.started_at, room?.status, room?.duration_seconds]);

  // ====== АВТО-ЗАПУСК АУДИО ПОСЛЕ ГОТОВНОСТИ WS ======
  const wsConnectedRef = useRef(false);
  const autoStartAttemptedRef = useRef(false);

  useEffect(() => {
    wsConnectedRef.current = false;
    autoStartAttemptedRef.current = false;

    const unsubscribe = wsClient.onStateChange((state: ConnectionState) => {
      // Убираем проверку room — он ещё null в этом замыкании
      if (state === 'connected') {
        wsConnectedRef.current = true;
      }
    });

    return () => {
      unsubscribe();
    };
  }, [roomId]);

    useEffect(() => {
      if (
        room &&
        (room.status === 'scheduled' || room.status === 'active') &&
        wsConnectedRef.current &&
        participants.length > 0 &&
        !autoStartAttemptedRef.current
      ) {
        autoStartAttemptedRef.current = true;
        console.log('🎯 Auto-starting audio with muted mic');
        startAudio().then(() => {
          if (localAudioRef.current?.srcObject) {
            const stream = localAudioRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => { track.enabled = false; });
          }
        });
      }
    }, [room, participants]);
  // ====== КОНЕЦ АВТО-ЗАПУСКА ======
  

  // WebSocket Integration
  useEffect(() => {
    if (!roomId) return;
    
    const token = localStorage.getItem('accessToken');
    if (!token) {
      navigate('/login');
      return;
    }
    
    if (room?.status !== 'ended' && room?.status !== 'archived') {
      wsClient.connect(roomId, token);
    }

    const handleIncomingChat = (msg: ChatMessage) => {
        // Если username нет — попробуй взять из userId (для старых сообщений)
        if (!msg.username && msg.user_id) {
            const participant = participants.find(p => p.user_id === msg.user_id);
            msg.username = participant?.username || 'User';
        }
        setMessages(prev => [...prev, msg]);
    };

    const handleSystem = (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: data.message,
        message_type: 'system',
        created_at: new Date().toISOString()
      }]);

      if (data.started_at) {
          const startedAt = (data.started_at.endsWith('Z') || data.started_at.includes('+')) 
              ? data.started_at 
              : data.started_at + 'Z';
          setRoom(prev => {
              if (!prev) return prev;
              return { ...prev, started_at: startedAt };
          });
      }

      if (data.message && data.message.includes('ended by organizer')) {
          navigate('/dashboard');
          return;
      }

      // joined block
      if (data.message.includes('joined')) {
        setParticipants(prev => {
          if (prev.find(p => p.user_id === (data.user_id || data.userId))) return prev;
          return [...prev, {
            id: data.user_id || data.userId,
            user_id: data.user_id || data.userId,
            username: data.username || 'User',
            role_in_room: 'participant' as const,
            is_muted: true,
            hand_raised: false,
            presence_status: 'idle' as const,
          }];
        });
        if (audioConnected && localAudioRef.current?.srcObject) {
          createPeerConnection(data.user_id || data.userId, localAudioRef.current.srcObject as MediaStream);
        }
      }
      // left block
      else if (data.message.includes('left')) {
        setParticipants(prev => prev.filter(p => p.user_id !== (data.user_id || data.userId)));
      }
    };

    const handlePresence = (data: any) => {
      setParticipants(prev => prev.map(p => {
        if (p.user_id === data.user_id) {
          return {
            ...p,
            presence_status: data.status || 'idle',
            is_muted: data.is_muted ?? p.is_muted,
            hand_raised: data.hand_raised ?? p.hand_raised,
          };
        }
        return p;
      }));
    };

    const handleProtocolReady = (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `Protocol "${data.title || 'Meeting Summary'}" is ready.`,
        message_type: 'notification',
        created_at: new Date().toISOString()
      }]);
    };

        const handleChatHistory = (data: any) => {
      if (data.messages && Array.isArray(data.messages)) {
        setMessages(prev => [...data.messages, ...prev]);
      }
    };

    wsClient.on('chat', handleIncomingChat);
    wsClient.on('chat_history', handleChatHistory);
    wsClient.on('system', handleSystem);
    wsClient.on('presence', handlePresence);
    wsClient.on('protocol_ready', handleProtocolReady);
    wsClient.on('offer', handleWebRTCSignal);
    wsClient.on('answer', handleWebRTCSignal);
    wsClient.on('ice-candidate', handleWebRTCSignal);

    const handleParticipantsList = (data: any) => {
      if (room?.status === 'ended' || room?.status === 'archived') return;
      if (data.participants) {
        const list = data.participants
          .filter((p: any) => (p.user_id || p.userId) !== currentUser?.id)
          .map((p: any) => ({
            id: p.user_id || p.userId,
            user_id: p.user_id || p.userId,
            username: p.username || 'User',
            role_in_room: 'participant' as const,
            is_muted: p.is_muted ?? true,
            hand_raised: p.hand_raised ?? false,
            presence_status: p.presence_status || 'idle',
          }));
        setParticipants(list);
      }
    };

    // Добавьте эту функцию перед wsClient.on
    // const handleParticipantsResponse = (data: any) => {
    //   console.log('📋 Participants response:', data);
    //   if (data.participants && Array.isArray(data.participants)) {
    //     setParticipants(prev => {
    //       const existing = new Set(prev.map(p => p.userId));
    //       const newParticipants = data.participants
    //         .filter((p: any) => !existing.has(p.userId))
    //         .map((p: any) => ({
    //           id: p.userId,
    //           userId: p.userId,
    //           username: p.username || 'User',
    //           roleInRoom: 'participant' as const,
    //           isMuted: false,
    //           handRaised: false,
    //           presenceStatus: 'idle' as const,
    //         }));
    //       return [...prev, ...newParticipants];
    //     });
    //   }
    // };

    
    wsClient.on('participants_list', handleParticipantsList);

    return () => {
      wsClient.off('chat', handleIncomingChat);
      wsClient.off('chat_history', handleChatHistory);
      wsClient.off('system', handleSystem);
      wsClient.off('presence', handlePresence);
      wsClient.off('protocol_ready', handleProtocolReady);
      wsClient.off('participants_list', handleParticipantsList);
      wsClient.disconnect();
      wsClient.off('offer', handleWebRTCSignal);
      wsClient.off('answer', handleWebRTCSignal);
      wsClient.off('ice-candidate', handleWebRTCSignal);
      stopAudio();
    };
  }, [roomId, navigate]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId) return;
    
    // Send via WebSocket. The server will broadcast it back to us, 
    // so we don't append it locally here.
    wsClient.sendChat(roomId, chatInput.trim(), replyingTo?.id);
    
    setChatInput('');
    setReplyTo(null);
    wsClient.updatePresence('idle');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (e.target.value.length === 1) {
      wsClient.updatePresence('typing');
    } else if (e.target.value.length === 0) {
      wsClient.updatePresence('idle');
    }
  };

  const toggleHand = () => {
    const newState = !isHandRaised;
    setIsHandRaised(newState);
    wsClient.updatePresence(newState ? 'hand_raised' : 'idle');
  };

  const handleLeave = () => {
    navigate('/dashboard');
  };

  const handleEndMeeting = async () => {
    if (!roomId || !confirm("End this meeting for everyone?")) return;
    try {
      // Отправляем WebSocket-уведомление всем участникам
      wsClient.send('end_room', { roomId });
      await api.rooms.end(roomId);
      navigate('/dashboard');
    } catch (err) { alert("Failed to end meeting"); }
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex flex-col text-gray-100 overflow-hidden">
      {/* Top Header */}
      <header className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center space-x-4">
          <div className="bg-blue-600 p-1.5 rounded-md">
            <Mic className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-sm">Conference Room</h1>
            <div className="flex items-center space-x-2">
              {(room?.status !== 'ended' && room?.status !== 'archived') && (
                <span className="flex items-center text-xs text-red-400 font-medium animate-pulse">
                  <Circle className="w-2 h-2 fill-current mr-1" /> Auto-Recording
                </span>
              )}
              <span className="text-gray-600">•</span>
              <span className="text-xs text-gray-400 font-mono">{elapsedTime}</span>
              <span className="text-gray-600">•</span>
              <ConnectionStatus />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => setIsProtocolViewerOpen(true)}
            className="flex items-center space-x-2 px-3 py-1.5 bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 rounded-md text-sm font-medium transition-colors mr-2"
          >
            <FileText className="w-4 h-4" />
            <span>View Protocol</span>
          </button>
          <button 
            onClick={() => setShowParticipants(!showParticipants)}
            className={`p-2 rounded-md transition-colors ${showParticipants ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <Users className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowChat(!showChat)}
            className={`p-2 rounded-md transition-colors ${showChat ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}`}
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* Left Sidebar: Participants */}
        {showParticipants && (
          <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-sm">Participants ({participants.length + 1})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {/* Self Participant */}
              <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 group">
                <div className="flex items-center space-x-3 overflow-hidden">
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                      {currentUser?.first_name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm truncate">
                      {currentUser?.first_name || 'You'} {currentUser?.last_name || ''}
                    </span>
                  </div>
                </div>
                {(room?.status !== 'ended' && room?.status !== 'archived') && (
                  <div className="flex items-center space-x-1 text-gray-400">
                    {isHandRaised && <Hand className="w-4 h-4 text-yellow-500" />}
                    {isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />}
                  </div>
                )}
              </div>

              {/* Remote Participants */}
              {participants.filter(p => p.user_id !== currentUser?.id).map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-sm font-bold">
                        {p.username.charAt(0).toUpperCase()}
                      </div>
                      {p.presence_status === 'speaking' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm truncate">{p.username}</span>
                      {p.presence_status === 'typing' && (
                        <span className="text-[10px] text-blue-400 italic">typing...</span>
                      )}
                    </div>
                  </div>
                  {(room?.status !== 'ended' && room?.status !== 'archived') && (
                    <div className="flex items-center space-x-1 text-gray-400">
                      {p.hand_raised && <Hand className="w-4 h-4 text-yellow-500" />}
                      {p.is_muted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center: Content Area */}
        <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-6 relative">
          {(room?.status === 'ended' || room?.status === 'archived') ? (
            /* Итоговая информация для завершённых встреч */
            <div className="max-w-2xl w-full bg-gray-800/50 border border-gray-700 rounded-2xl p-8 backdrop-blur-sm">
              <h2 className="text-xl font-bold text-gray-200 mb-6 text-center">Meeting Summary</h2>
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Duration</p>
                  <p className="text-2xl font-bold text-white">{elapsedTime}</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Participants</p>
                  {/* total_participants — это общее кол-во уникальных людей за всё время из БД */}
                  <p className="text-2xl font-bold text-white">{room?.total_participants || 0}</p>
                </div>
                <div className="bg-gray-700/50 rounded-xl p-4 col-span-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Status</p>
                  <p className="text-lg font-bold text-purple-400 capitalize">{room.status}</p>
                </div>
              </div>
            </div>
          ) : (
            /* Активная встреча — Media & AI */
            <>
              <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <Mic className="w-96 h-96" />
              </div>
              <div className="max-w-2xl w-full bg-gray-800/50 border border-gray-700 border-dashed rounded-2xl p-12 text-center backdrop-blur-sm">
                <h2 className="text-2xl font-bold text-gray-300 mb-4">Media & AI Processing Area</h2>
                <p className="text-gray-400 mb-6">
                  This space is reserved for the second student's module. 
                  It will contain WebRTC audio streams, active speaker visualization, 
                  and real-time STT (Speech-to-Text) transcriptions.
                </p>
                <div className="flex flex-col items-center">
                  <div className="flex justify-center space-x-4 mb-4">
                    <div className="h-3 w-12 bg-blue-500 rounded-full animate-pulse"></div>
                    <div className="h-3 w-16 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                    <div className="h-3 w-8 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                  </div>
                  <p className="text-sm text-blue-400 font-medium">Listening and transcribing...</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Right Sidebar: Chat */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-sm">In-call messages</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                if (msg.message_type === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs text-gray-500 italic bg-gray-800/50 px-3 py-1 rounded-full text-center">
                        {msg.message}
                      </span>
                    </div>
                  );
                }
                
                if (msg.message_type === 'notification') {
                  return (
                    <div key={msg.id} className="flex items-center space-x-2 bg-blue-900/30 border border-blue-800/50 p-3 rounded-lg cursor-pointer hover:bg-blue-900/50 transition-colors" onClick={() => setIsProtocolViewerOpen(true)}>
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm text-blue-200">{msg.message}</span>
                    </div>
                  );
                }

                return (
                  <div key={msg.id} className="flex flex-col group">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-medium text-sm text-blue-400">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      {room?.status !== 'ended' && room?.status !== 'archived' && (
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {msg.user_id === currentUser?.id && !msg.deleted_at && (
                            <>
                              <button 
                                onClick={() => setEditingMessage(msg)}
                                className="text-gray-400 hover:text-yellow-400"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (confirm('Delete message?')) {
                                    wsClient.send('delete_chat', { messageId: msg.id });
                                  }
                                }}
                                className="text-gray-400 hover:text-red-400"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          <button 
                            onClick={() => setReplyTo(msg)}
                            className="text-gray-400 hover:text-white"
                          >
                            <Reply className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="rounded-lg rounded-tl-none p-3 text-sm bg-gray-700 text-gray-200">
                      {msg.reply_to_id && (
                        <div className="mb-2 pl-2 border-l-2 border-gray-500 text-xs text-gray-400 italic line-clamp-1">
                          {messages.find(m => m.id === msg.reply_to_id)?.message || 'Reply to a message'}
                        </div>
                      )}
                      
                      {editingMessage?.id === msg.id ? (
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={editingMessage.message}
                            onChange={(e) => setEditingMessage({ ...editingMessage, message: e.target.value })}
                            className="flex-1 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm text-white"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                wsClient.send('edit_chat', { messageId: msg.id, message: editingMessage.message });
                                setEditingMessage(null);
                              }
                              if (e.key === 'Escape') setEditingMessage(null);
                            }}
                            autoFocus
                          />
                          <button onClick={() => {
                            wsClient.send('edit_chat', { messageId: msg.id, message: editingMessage.message });
                            setEditingMessage(null);
                          }} className="text-green-400 hover:text-green-300">
                            <Send className="w-4 h-4" />
                          </button>
                          <button onClick={() => setEditingMessage(null)} className="text-gray-400 hover:text-gray-300">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          {msg.message}
                          {msg.deleted_at && <span className="text-xs text-gray-500 italic ml-2">(deleted)</span>}
                          {msg.edited_at && <span className="text-xs text-gray-500 italic ml-2">(edited)</span>}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {room?.status !== 'ended' && room?.status !== 'archived' ? (
              <div className="p-3 border-t border-gray-700 bg-gray-800 flex flex-col">
                {replyingTo && (
                  <div className="flex items-center justify-between bg-gray-700/50 px-3 py-1.5 rounded-t-md border-b border-gray-600">
                    <div className="flex items-center space-x-2 text-xs text-gray-300 truncate">
                      <Reply className="w-3 h-3" />
                      <span className="font-medium">{replyingTo.username}:</span>
                      <span className="truncate">{replyingTo.message}</span>
                    </div>
                    <button onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-white">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSendMessage} className="relative">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={handleTyping}
                    placeholder="Send a message..."
                    className={`w-full bg-gray-900 border border-gray-600 pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 ${replyingTo ? 'rounded-b-md' : 'rounded-full'}`}
                  />
                  <button 
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            ) : (
              <div className="p-3 border-t border-gray-700 bg-gray-800 text-center">
                <span className="text-xs text-gray-500">Meeting has ended</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Control Bar — только для активных встреч */}
      {(room?.status !== 'ended' && room?.status !== 'archived') ? (
        <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center px-6 shrink-0 space-x-4">
          
          {/* Кнопка микрофона — единая: выкл / вкл / muted */}
          <button 
            onClick={toggleMic}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${
              !audioConnected 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : isMuted 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
            title={!audioConnected ? 'Turn on microphone' : isMuted ? 'Unmute' : 'Mute'}
          >
            {!audioConnected ? <MicOff className="w-6 h-6" /> : isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>
          
          {/* Поднять руку */}
          <button 
            onClick={toggleHand}
            className={`p-4 rounded-full flex items-center justify-center transition-colors ${isHandRaised ? 'bg-yellow-500 hover:bg-yellow-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
            title={isHandRaised ? 'Lower hand' : 'Raise hand'}
          >
            <Hand className="w-6 h-6" />
          </button>

          {/* Настройки */}
          <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="Settings">
            <Settings className="w-6 h-6" />
          </button>
          
          {/* Поделиться */}
          <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="Share">
            <Share className="w-6 h-6" />
          </button>
          
          {/* Ещё */}
          <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors" title="More">
            <MoreVertical className="w-6 h-6" />
          </button>

          <div className="w-px h-8 bg-gray-600 mx-2"></div>

          {/* Покинуть */}
          <button 
            onClick={handleLeave}
            className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center space-x-2 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Leave</span>
          </button>
          
          {/* Завершить встречу (только организатор) */}
          {room?.creator_id === currentUser?.id && (
            <button onClick={handleEndMeeting} className="px-6 py-3 rounded-full bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 font-medium flex items-center space-x-2 transition-colors">
              <AlertTriangle className="w-5 h-5" />
              <span>End Meeting</span>
            </button>
          )}
        </div>
      ) : (
        /* Для завершённых встреч — только кнопка назад */
        <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center px-6 shrink-0">
          <button 
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 rounded-full bg-gray-700 hover:bg-gray-600 text-white font-medium flex items-center space-x-2 transition-colors"
          >
            <PhoneOff className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      )}

      <ProtocolViewer 
        isOpen={isProtocolViewerOpen} 
        onClose={() => setIsProtocolViewerOpen(false)} 
        protocol={MOCK_PROTOCOL} 
      />
    </div>
  );
}
