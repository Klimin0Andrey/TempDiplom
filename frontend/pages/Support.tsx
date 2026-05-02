import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HelpCircle, Send, Mail, Clock, CheckCircle, 
  MessageSquare, Phone, Globe, ChevronRight, LifeBuoy, BookOpen, FileText
} from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import toast from 'react-hot-toast';
import { api } from '../services/api.ts';

export default function Support() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [category, setCategory] = useState('general');
  const [isSending, setIsSending] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      toast.error('Заполните все поля');
      return;
    }

    setIsSending(true);
    
    try {
      await api.support.sendMessage({ subject, message, category });
      setIsSuccess(true);
      toast.success('Сообщение отправлено! Мы ответим вам на почту');
      setSubject('');
      setMessage('');
      setTimeout(() => setIsSuccess(false), 3000);
    } catch (err: any) {
      toast.error(err.message || 'Ошибка отправки. Попробуйте позже');
    } finally {
      setIsSending(false);
    }
  };

  const faqItems = [
    {
      question: 'Как создать новую встречу?',
      answer: 'Нажмите кнопку "Создать встречу" на главной странице, заполните название, дату и время, затем пригласите участников по ссылке или email.'
    },
    {
      question: 'Как работает запись встреч?',
      answer: 'Все встречи автоматически записываются в облако. Записи доступны в разделе "Протоколы" сразу после окончания встречи.'
    },
    {
      question: 'Сколько участников может быть на встрече?',
      answer: 'На тарифе Light - до 10 участников, Pro - до 50, Business - безлимит.'
    },
    {
      question: 'Как изменить пароль?',
      answer: 'Перейдите в Настройки → Безопасность, там вы сможете сменить пароль.'
    },
  ];

  const docLinks = [
    { icon: BookOpen, label: 'Руководство пользователя', url: '/docs/user-guide', color: 'blue' },
    { icon: FileText, label: 'API документация', url: '/docs/api', color: 'green' },
    { icon: Globe, label: 'Блог', url: '/blog', color: 'orange' },
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Центр поддержки
              </h1>
              <p className="text-sm text-gray-500 mt-1">Помощь и обратная связь</p>
            </div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Назад
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Быстрые ссылки на документацию */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {docLinks.map((link, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(link.url)}
                  className="bg-white p-6 rounded-xl border border-gray-200 hover:shadow-lg transition-all group text-center"
                >
                  <div className={`w-12 h-12 rounded-xl bg-${link.color}-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                    <link.icon className={`w-6 h-6 text-${link.color}-600`} />
                  </div>
                  <h3 className="font-semibold text-gray-900">{link.label}</h3>
                  <p className="text-xs text-gray-400 mt-2">Перейти →</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Форма обращения */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Написать в поддержку
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Ответ придёт на почту {user.email || 'user@example.com'}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {isSuccess && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3 animate-fade-in">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-800">Сообщение отправлено!</p>
                          <p className="text-sm text-green-600">Мы ответим вам в ближайшее время</p>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Тема обращения <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Например: Проблема с микрофоном"
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Категория
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                      >
                        <option value="general">Общий вопрос</option>
                        <option value="technical">Техническая проблема</option>
                        <option value="billing">Биллинг и оплата</option>
                        <option value="feature">Предложение функции</option>
                        <option value="bug">Сообщить об ошибке</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Сообщение <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        rows={6}
                        placeholder="Опишите ваш вопрос или проблему подробнее..."
                        className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSending}
                      className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 transition-all"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Отправка...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Отправить сообщение
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>

              {/* Контакты и информация */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-2 mb-4">
                    <Phone className="w-5 h-5 text-green-600" />
                    Другие способы связи
                  </h3>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Mail className="w-5 h-5 text-blue-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <p className="text-xs text-gray-500">potalkyem412@gmail.com</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Clock className="w-5 h-5 text-orange-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Время работы</p>
                        <p className="text-xs text-gray-500">Пн-Пт: 9:00 - 20:00 МСК</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <LifeBuoy className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">Среднее время ответа</p>
                        <p className="text-xs text-gray-500">до 2 часов</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Статус системы */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    Статус системы
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">API сервер</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Работает</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">WebSocket</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Работает</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">База данных</span>
                      <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Работает</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ секция */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-blue-600" />
                  Часто задаваемые вопросы
                </h2>
              </div>
              <div className="divide-y divide-gray-100">
                {faqItems.map((item, idx) => (
                  <details key={idx} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-gray-50 transition-colors">
                      <span className="font-medium text-gray-900">{item.question}</span>
                      <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
                    </summary>
                    <div className="px-6 pb-6 pt-0 text-gray-600 text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}