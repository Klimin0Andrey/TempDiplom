import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: Props) {
  const location = useLocation();
  const token = localStorage.getItem('accessToken');

  if (!token) {
    // Сохраняем путь, куда хотел попасть пользователь, и редиректим на логин
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <>{children}</>;
}