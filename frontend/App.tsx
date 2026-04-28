import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Room from './pages/Room.tsx';
import Login from './pages/Login.tsx';
import Settings from './pages/Settings.tsx';
import Protocols from './pages/Protocols.tsx';
import Team from './pages/Team.tsx';
import JoinRoom from './pages/JoinRoom.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import SetupPassword from './pages/SetupPassword.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        {/* Публичные страницы (без авторизации) */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/setup-password" element={<SetupPassword />} />
        <Route path="/reset-password" element={<SetupPassword />} />
        <Route path="/join/:inviteCode" element={<JoinRoom />} />

        {/* Защищённые страницы (только с токеном) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/protocols" element={<ProtectedRoute><Protocols /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />

        {/* Редирект на лендинг для неизвестных путей */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}