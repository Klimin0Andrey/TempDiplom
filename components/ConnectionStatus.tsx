import React, { useEffect, useState } from 'react';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { wsClient, ConnectionState } from '../services/websocket.ts';

export default function ConnectionStatus() {
  const [status, setStatus] = useState<ConnectionState>('disconnected');

  useEffect(() => {
    const unsubscribe = wsClient.onStateChange((newState) => {
      setStatus(newState);
    });
    return unsubscribe;
  }, []);

  if (status === 'connected') {
    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-green-500/10 border border-green-500/20 rounded-full">
        <Wifi className="w-3.5 h-3.5 text-green-500" />
        <span className="text-[10px] font-medium text-green-500 uppercase tracking-wider">Connected</span>
      </div>
    );
  }

  if (status === 'connecting') {
    return (
      <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-yellow-500/10 border border-yellow-500/20 rounded-full">
        <Loader2 className="w-3.5 h-3.5 text-yellow-500 animate-spin" />
        <span className="text-[10px] font-medium text-yellow-500 uppercase tracking-wider">Connecting</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-1.5 px-2.5 py-1 bg-red-500/10 border border-red-500/20 rounded-full">
      <WifiOff className="w-3.5 h-3.5 text-red-500" />
      <span className="text-[10px] font-medium text-red-500 uppercase tracking-wider">Disconnected</span>
    </div>
  );
}
