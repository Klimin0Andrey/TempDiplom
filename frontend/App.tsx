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

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/protocols" element={<Protocols />} />
        <Route path="/team" element={<Team />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/room/:roomId" element={<Room />} />
        <Route path="/join/:inviteCode" element={<JoinRoom />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
}
