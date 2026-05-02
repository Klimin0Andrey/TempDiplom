import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Ленивая загрузка компонентов
const Landing = lazy(() => import('./pages/Landing.tsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const Room = lazy(() => import('./pages/Room.tsx'));
const Login = lazy(() => import('./pages/Login.tsx'));
const Settings = lazy(() => import('./pages/Settings.tsx'));
const Protocols = lazy(() => import('./pages/Protocols.tsx'));
const Team = lazy(() => import('./pages/Team.tsx'));
const Support = lazy(() => import('./pages/Support'));
const JoinRoom = lazy(() => import('./pages/JoinRoom.tsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.tsx'));
const SetupPassword = lazy(() => import('./pages/SetupPassword.tsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.tsx'));
const UserGuide = lazy(() => import('./pages/docs/UserGuide'));
const ApiDocs = lazy(() => import('./pages/docs/ApiDocs'));
const Blog = lazy(() => import('./pages/docs/Blog'));
const About = lazy(() => import('./pages/About.tsx'));   
const Contacts = lazy(() => import('./pages/Contacts.tsx')); 
const FAQ = lazy(() => import('./pages/FAQ.tsx')); 
const Analytics = lazy(() => import('./pages/Analytics'));

// Компонент загрузки
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-500">Загрузка...</p>
    </div>
  </div>
);

export default function App() {
  return (
    <HashRouter>
      <Suspense fallback={<LoadingFallback />}>
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
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />

          {/* Редирект на лендинг для неизвестных путей */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <Toaster position="bottom-right" />
    </HashRouter>
  );
}