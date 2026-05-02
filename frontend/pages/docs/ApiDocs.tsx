import React, { useState } from 'react';
import { Code, Key, Server, Globe, Lock, CheckCircle, Copy } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';

export default function ApiDocs() {
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);

  const copyToClipboard = (text: string, endpoint: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(endpoint);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const endpoints = [
    { method: 'POST', path: '/api/auth/login', description: 'Авторизация пользователя', auth: false, request: { email: 'user@example.com', password: 'your_password' }, response: { accessToken: 'eyJhbGc...', refreshToken: 'eyJhbGc...', user: { id: 'uuid', email: 'user@example.com', first_name: 'Иван' } } },
    { method: 'POST', path: '/api/rooms', description: 'Создание новой комнаты', auth: true, request: { name: 'Еженедельное совещание', description: 'Обсуждение планов на неделю', scheduled_start_at: '2026-05-15T10:00:00Z' }, response: { id: 'room-uuid', name: 'Еженедельное совещание', invite_code: 'abc123', status: 'scheduled' } },
    { method: 'GET', path: '/api/rooms', description: 'Получение списка комнат', auth: true, params: { limit: 20, offset: 0, status: 'active' }, response: { rooms: [], total: 42, limit: 20, offset: 0 } },
    { method: 'GET', path: '/api/protocols', description: 'Получение списка протоколов', auth: true, response: { protocols: [{ id: 'protocol-uuid', title: 'Project Alpha Kickoff Summary', created_at: '2026-05-01T12:00:00Z' }] } },
    { method: 'POST', path: '/api/support/contact', description: 'Отправка обращения в поддержку', auth: true, request: { subject: 'Проблема с микрофоном', message: 'Не работает микрофон в комнате...', category: 'technical' }, response: { success: true } }
  ];

  return (
    <PublicLayout title="API Документация" subtitle="REST API для интеграции с платформой Potalkyem">
      <div className="space-y-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4"><Server className="w-8 h-8 text-blue-600" /><h2 className="text-xl font-bold text-gray-900">Базовый URL</h2></div>
          <code className="block bg-gray-900 text-green-400 p-3 rounded-lg font-mono text-sm">https://api.potalkyem.ru/v1</code>
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2 flex items-center gap-2"><Lock className="w-4 h-4 text-blue-600" />Аутентификация</h3>
            <p className="text-gray-600 text-sm mb-2">Для защищённых эндпоинтов требуется Bearer токен:</p>
            <code className="block bg-gray-900 text-green-400 p-2 rounded font-mono text-xs">Authorization: Bearer &lt;your_access_token&gt;</code>
          </div>
        </div>

        {endpoints.map((endpoint, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-3 py-1 rounded-lg text-sm font-bold ${endpoint.method === 'GET' ? 'bg-green-100 text-green-700' : endpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>{endpoint.method}</span>
                <code className="font-mono text-sm bg-gray-100 px-3 py-1 rounded">{endpoint.path}</code>
                {endpoint.auth && <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1"><Lock className="w-3 h-3" /> Требуется токен</span>}
                <button onClick={() => copyToClipboard(`https://api.potalkyem.ru/v1${endpoint.path}`, endpoint.path)} className="ml-auto text-gray-400 hover:text-gray-600">{copiedEndpoint === endpoint.path ? <CheckCircle className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}</button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">{endpoint.description}</p>
              {'request' in endpoint && (<div><div className="flex items-center gap-2 mb-2"><Code className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-700">Тело запроса:</span></div><pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">{JSON.stringify(endpoint.request, null, 2)}</pre></div>)}
              {'params' in endpoint && (<div className="mt-4"><div className="flex items-center gap-2 mb-2"><Globe className="w-4 h-4 text-gray-400" /><span className="font-medium text-gray-700">Параметры запроса:</span></div><pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">{JSON.stringify(endpoint.params, null, 2)}</pre></div>)}
              <div className="mt-4"><div className="flex items-center gap-2 mb-2"><CheckCircle className="w-4 h-4 text-green-500" /><span className="font-medium text-gray-700">Ответ:</span></div><pre className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-sm font-mono">{JSON.stringify(endpoint.response, null, 2)}</pre></div>
            </div>
          </div>
        ))}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Коды ответов</h3>
          <div className="space-y-2">{['200', '201', '400', '401', '403', '404', '500'].map((code, i) => (<div key={i} className="flex items-center gap-3"><span className="w-16 px-2 py-1 bg-green-100 text-green-700 rounded text-sm font-mono text-center">{code}</span><span className="text-gray-600">{code === '200' ? 'Успешный запрос' : code === '201' ? 'Успешно создано' : code === '400' ? 'Неверный запрос' : code === '401' ? 'Не авторизован' : code === '403' ? 'Доступ запрещён' : code === '404' ? 'Не найдено' : 'Внутренняя ошибка сервера'}</span></div>))}</div>
        </div>
      </div>
    </PublicLayout>
  );
}