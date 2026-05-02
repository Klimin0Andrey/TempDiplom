import { wsClient } from './websocket.ts';

let isConnected = false;

export const initUserSocket = () => {
    const token = localStorage.getItem('accessToken');
    if (!token || isConnected) return;
    
    // Создаём специальную комнату для глобальных уведомлений пользователя
    const userId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (!userId) return;
    
    wsClient.connect(`user_${userId}`, token);
    isConnected = true;
    
    console.log('🔌 User global WebSocket initialized');
};

export const getUserSocket = () => wsClient;