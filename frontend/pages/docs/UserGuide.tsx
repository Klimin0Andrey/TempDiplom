import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Mic, Users, Settings, HelpCircle, Calendar, MessageSquare, FileText, ArrowLeft } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';

export default function UserGuide() {
  const navigate = useNavigate();

  const sections = [
    {
      icon: Calendar,
      title: 'Создание встречи',
      content: 'Нажмите кнопку "Создать встречу" на главной странице. Заполните название, дату, время и описание. После создания вы получите ссылку-приглашение для участников.',
      steps: ['Нажмите на кнопку "+ Создать встречу" в правом верхнем углу', 'Заполните название встречи', 'Выберите дату и время начала встречи', 'При желании добавьте описание', 'Нажмите "Создать" — ссылка для приглашения будет сгенерирована автоматически']
    },
    {
      icon: Users,
      title: 'Приглашение участников',
      content: 'Поделитесь ссылкой-приглашением с участниками. Они смогут присоединиться к встрече без регистрации.',
      steps: ['Скопируйте ссылку-приглашение из карточки встречи', 'Отправьте её участникам через email, мессенджеры', 'Участники переходят по ссылке и попадают в комнату ожидания', 'Вы можете пригласить участников напрямую по email через модальное окно "Пригласить"']
    },
    {
      icon: Mic,
      title: 'Управление аудио',
      content: 'Используйте кнопки в нижней панели для управления микрофоном и настройками звука.',
      steps: ['Кликните по иконке микрофона для включения/выключения звука', 'Зелёный микрофон = включён, красный = выключен', 'Используйте иконку "Рука" для поднятия руки', 'Уровень громкости отображается в списке участников']
    },
    {
      icon: MessageSquare,
      title: 'Чат встречи',
      content: 'Общайтесь с участниками через текстовый чат, отвечайте на сообщения и редактируйте их.',
      steps: ['Откройте чат, нажав на иконку сообщения в правой панели', 'Введите текст в поле внизу и нажмите Enter или кнопку отправки', 'Наведите на сообщение — появятся кнопки ответа, редактирования и удаления', 'Удалённые сообщения заменяются на серый текст "удалено"']
    },
    {
      icon: FileText,
      title: 'Протоколы встреч',
      content: 'Все встречи автоматически записываются, а протоколы доступны в соответствующем разделе.',
      steps: ['Перейдите в раздел "Протоколы" в боковом меню', 'Выберите встречу из списка', 'PDF протокол можно скачать или просмотреть онлайн', 'Протокол содержит расшифровку, основные темы и принятые решения']
    },
    {
      icon: Settings,
      title: 'Настройки профиля',
      content: 'Управляйте личной информацией и безопасностью в разделе настроек.',
      steps: ['Перейдите в "Настройки" через боковое меню', 'Измените имя и фамилию', 'Смените пароль (минимум 6 символов)', 'Настройте уведомления']
    }
  ];

  return (
    <PublicLayout title="Руководство пользователя" subtitle="Полное руководство по работе с платформой Potalkyem">
      <div className="space-y-6">
        {sections.map((section, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <section.icon className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">{section.title}</h2>
              </div>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">{section.content}</p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="font-medium text-gray-900 mb-3">Пошаговая инструкция:</p>
                <ul className="space-y-2">
                  {section.steps.map((step, stepIdx) => (
                    <li key={stepIdx} className="flex items-start gap-2 text-gray-600">
                      <span className="text-blue-600 font-bold">{stepIdx + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 text-center border border-blue-100">
          <HelpCircle className="w-12 h-12 text-blue-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">Остались вопросы?</h3>
          <p className="text-gray-600 mb-4">Наша команда поддержки всегда готова помочь</p>
          <button
            onClick={() => {
              const isAuthenticated = !!localStorage.getItem('accessToken');
              if (isAuthenticated) {
                navigate('/support');
              } else {
                navigate('/login');
              }
            }}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Написать в поддержку
          </button>
        </div>
      </div>
    </PublicLayout>
  );
}