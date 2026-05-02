import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Landing from './pages/Landing.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Room from './pages/Room.tsx';
import Login from './pages/Login.tsx';
import Settings from './pages/Settings.tsx';
import Protocols from './pages/Protocols.tsx';
import Team from './pages/Team.tsx';
import Support from './pages/Support';
import JoinRoom from './pages/JoinRoom.tsx';
import ForgotPassword from './pages/ForgotPassword.tsx';
import SetupPassword from './pages/SetupPassword.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';
import UserGuide from './pages/docs/UserGuide';
import ApiDocs from './pages/docs/ApiDocs';
import Blog from './pages/docs/Blog';
import About from './pages/About.tsx';   
import Contacts from './pages/Contacts.tsx'; 
import FAQ from './pages/FAQ.tsx'; 

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

        {/* Публичные информационные страницы */}
        <Route path="/docs/user-guide" element={<UserGuide />} />
        <Route path="/docs/api" element={<ApiDocs />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:id" element={<Blog />} />
        <Route path="/about" element={<About />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/faq" element={<FAQ />} />

        {/* Защищённые страницы (только с токеном) */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/protocols" element={<ProtectedRoute><Protocols /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/support" element={<ProtectedRoute><Support /></ProtectedRoute>} />
        

        {/* Редирект на лендинг для неизвестных путей */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </HashRouter>
  );
}