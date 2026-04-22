import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Mic, MicOff, PhoneOff, Users, MessageSquare, 
  Settings, Hand, Share, MoreVertical, Send, Info, FileText, Reply, X, Circle, Square
} from 'lucide-react';
import { Participant, ChatMessage, Protocol } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';
import ConnectionStatus from '../components/ConnectionStatus.tsx';
import { wsClient } from '../services/websocket.ts';

const MOCK_PARTICIPANTS: Participant[] = [
  { id: 'p1', userId: 'u1', username: 'Alex (You)', roleInRoom: 'organizer', isMuted: false, handRaised: false, presenceStatus: 'speaking' },
  { id: 'p2', userId: 'u2', username: 'Maria Ivanova', roleInRoom: 'participant', isMuted: true, handRaised: true, presenceStatus: 'idle' },
  { id: 'p3', userId: 'u3', username: 'Dmitry Petrov', roleInRoom: 'participant', isMuted: false, handRaised: false, presenceStatus: 'typing' },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 'm0', message: 'Maria Ivanova joined the meeting', messageType: 'system', createdAt: new Date(Date.now() - 360000).toISOString() },
  { id: 'm1', userId: 'u2', username: 'Maria Ivanova', message: 'Hello everyone! Can you hear me?', messageType: 'text', createdAt: new Date(Date.now() - 300000).toISOString() },
];

const MOCK_PROTOCOL: Protocol = {
  id: 'prot_123',
  roomId: 'room_123',
  title: 'Project Alpha Kickoff Summary',
  createdAt: new Date().toISOString(),
  summaryJson: {
    summary: 'Discussed the platform architecture and task distribution between modules. Agreed to use PostgreSQL and WebSockets for real-time signaling.',
    topics: ['Architecture', 'Database', 'WebRTC Signaling']
  },
  decisionsJson: {
    decisions: [
      'Use PostgreSQL as the primary database',
      'Implement WebSocket server for signaling',
      'Store protocols in JSONB format'
    ]
  },
  actionItemsJson: {
    action_items: [
      { id: 'a1', task: 'Design ER diagram', assignee: 'Alex', deadline: '2026-04-20', status: 'pending' },
      { id: 'a2', task: 'Setup WebSocket server', assignee: 'Dmitry', deadline: '2026-04-22', status: 'in_progress' }
    ]
  },
  pdfUrl: '#'
};

export default function Room() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [showParticipants, setShowParticipants] = useState(true);
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [replyingTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isProtocolViewerOpen, setIsProtocolViewerOpen] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  // WebSocket Integration
  useEffect(() => {
    if (!roomId) return;
    
    const token = localStorage.getItem('accessToken') || 'mock_token';
    wsClient.connect(roomId, token);

    const handleIncomingChat = (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
    };

    const handleProtocolReady = (data: any) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: `Protocol "${data.title || 'Meeting Summary'}" is ready.`,
        messageType: 'notification',
        createdAt: new Date().toISOString()
      }]);
    };

    wsClient.on('chat', handleIncomingChat);
    wsClient.on('protocol_ready', handleProtocolReady);

    return () => {
      wsClient.off('chat', handleIncomingChat);
      wsClient.off('protocol_ready', handleProtocolReady);
      wsClient.disconnect();
    };
  }, [roomId]);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, showChat]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !roomId) return;
    
    wsClient.sendChat(roomId, chatInput.trim(), replyingTo?.id);
    
    setChatInput('');
    setReplyTo(null);
  };

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (e.target.value.length === 1) {
      wsClient.updatePresence('typing');
    } else if (e.target.value.length === 0) {
      wsClient.updatePresence('idle');
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // In a real app, this would call the API to start/stop the Media & AI module
    if (!isRecording) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: 'Recording started. AI transcription is active.',
        messageType: 'system',
        createdAt: new Date().toISOString()
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        message: 'Recording stopped. Generating protocol...',
        messageType: 'system',
        createdAt: new Date().toISOString()
      }]);
      // Mock protocol generation delay
      setTimeout(() => {
        wsClient.send('protocol_ready', { title: 'Project Alpha Kickoff Summary' });
      }, 3000);
    }
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
            <h1 className="font-semibold text-sm">Project Alpha Kickoff</h1>
            <div className="flex items-center space-x-2">
              {isRecording && (
                <span className="flex items-center text-xs text-red-400 font-medium animate-pulse">
                  <Circle className="w-2 h-2 fill-current mr-1" /> Recording
                </span>
              )}
              {!isRecording && <span className="text-xs text-gray-400">00:15:24</span>}
              <span className="text-gray-600">•</span>
              <ConnectionStatus />
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleRecording}
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors mr-2 border ${
              isRecording 
                ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30' 
                : 'bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600'
            }`}
          >
            {isRecording ? <Square className="w-4 h-4 fill-current" /> : <Circle className="w-4 h-4" />}
            <span>{isRecording ? 'Stop Recording' : 'Record & Transcribe'}</span>
          </button>
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
              <h2 className="font-semibold text-sm">Participants ({MOCK_PARTICIPANTS.length})</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {MOCK_PARTICIPANTS.map(p => (
                <div key={p.id} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-700 group">
                  <div className="flex items-center space-x-3 overflow-hidden">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold">
                        {p.username.charAt(0)}
                      </div>
                      {p.presenceStatus === 'speaking' && (
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-gray-800 rounded-full"></span>
                      )}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm truncate">{p.username}</span>
                      {p.presenceStatus === 'typing' && (
                        <span className="text-[10px] text-blue-400 italic">typing...</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    {p.handRaised && <Hand className="w-4 h-4 text-yellow-500" />}
                    {p.isMuted ? <MicOff className="w-4 h-4 text-red-400" /> : <Mic className="w-4 h-4 text-green-400" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Center: Media & AI Processing Area */}
        <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center p-6 relative">
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
            {isRecording ? (
              <div className="flex flex-col items-center">
                <div className="flex justify-center space-x-4 mb-4">
                  <div className="h-3 w-12 bg-blue-500 rounded-full animate-pulse"></div>
                  <div className="h-3 w-16 bg-blue-400 rounded-full animate-pulse delay-75"></div>
                  <div className="h-3 w-8 bg-blue-600 rounded-full animate-pulse delay-150"></div>
                </div>
                <p className="text-sm text-blue-400 font-medium">Listening and transcribing...</p>
              </div>
            ) : (
              <div className="flex justify-center space-x-4 opacity-30">
                <div className="h-2 w-12 bg-gray-500 rounded-full"></div>
                <div className="h-2 w-16 bg-gray-400 rounded-full"></div>
                <div className="h-2 w-8 bg-gray-600 rounded-full"></div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Chat */}
        {showChat && (
          <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col shrink-0">
            <div className="p-4 border-b border-gray-700">
              <h2 className="font-semibold text-sm">In-call messages</h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map(msg => {
                if (msg.messageType === 'system') {
                  return (
                    <div key={msg.id} className="flex justify-center">
                      <span className="text-xs text-gray-500 italic bg-gray-800/50 px-3 py-1 rounded-full">
                        {msg.message}
                      </span>
                    </div>
                  );
                }
                
                if (msg.messageType === 'notification') {
                  return (
                    <div key={msg.id} className="flex items-center space-x-2 bg-blue-900/30 border border-blue-800/50 p-3 rounded-lg cursor-pointer hover:bg-blue-900/50 transition-colors" onClick={() => setIsProtocolViewerOpen(true)}>
                      <Info className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-sm text-blue-200">{msg.message}</span>
                    </div>
                  );
                }

                const isMentioned = msg.mentions?.includes('u1');

                return (
                  <div key={msg.id} className="flex flex-col group">
                    <div className="flex items-baseline justify-between mb-1">
                      <div className="flex items-baseline space-x-2">
                        <span className="font-medium text-sm text-blue-400">{msg.username}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <button 
                        onClick={() => setReplyTo(msg)}
                        className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-white transition-opacity"
                      >
                        <Reply className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    
                    <div className={`rounded-lg rounded-tl-none p-3 text-sm ${isMentioned ? 'bg-blue-900/40 border border-blue-700/50 text-blue-100' : 'bg-gray-700 text-gray-200'}`}>
                      {msg.replyToMessage && (
                        <div className="mb-2 pl-2 border-l-2 border-gray-500 text-xs text-gray-400 italic line-clamp-1">
                          {msg.replyToMessage}
                        </div>
                      )}
                      {msg.message}
                    </div>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

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
          </div>
        )}
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-gray-800 border-t border-gray-700 flex items-center justify-center px-6 shrink-0 space-x-4">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full flex items-center justify-center transition-colors ${isMuted ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white'}`}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
          <Settings className="w-6 h-6" />
        </button>
        
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
          <Share className="w-6 h-6" />
        </button>
        
        <button className="p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors">
          <MoreVertical className="w-6 h-6" />
        </button>

        <div className="w-px h-8 bg-gray-600 mx-2"></div>

        <button 
          onClick={() => navigate('/dashboard')}
          className="px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 text-white font-medium flex items-center space-x-2 transition-colors"
        >
          <PhoneOff className="w-5 h-5" />
          <span>Leave</span>
        </button>
      </div>

      <ProtocolViewer 
        isOpen={isProtocolViewerOpen} 
        onClose={() => setIsProtocolViewerOpen(false)} 
        protocol={MOCK_PROTOCOL} 
      />
    </div>
  );
}
