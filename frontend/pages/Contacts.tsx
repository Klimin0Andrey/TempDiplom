import React from 'react';
import { Mail, Clock, LifeBuoy } from 'lucide-react';
import PublicLayout from '../components/PublicLayout';

export default function Contacts() {
  return (
    <PublicLayout title="Контакты" subtitle="Свяжитесь с нами">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="space-y-6">
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Mail className="w-6 h-6 text-blue-600" />
            <div><p className="font-medium text-gray-900">Email</p><p className="text-gray-600">potalkyem412@gmail.com</p></div>
          </div>
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
            <Clock className="w-6 h-6 text-blue-600" />
            <div><p className="font-medium text-gray-900">Время работы</p><p className="text-gray-600">Пн-Пт: 9:00 - 20:00 МСК</p></div>
          </div>
          <div className="p-4 bg-blue-50 rounded-xl text-center">
            <p className="text-gray-600">Мы ответим на ваше сообщение в течение 2 часов</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}