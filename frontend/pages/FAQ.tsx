import React from 'react';
import { ChevronRight } from 'lucide-react';
import PublicLayout from '../components/PublicLayout';

export default function FAQ() {
  const faqs = [
    { q: 'Как создать новую встречу?', a: 'Нажмите кнопку "Создать встречу" на главной странице, заполните название, дату и время.' },
    { q: 'Как пригласить участников?', a: 'Скопируйте ссылку-приглашение из карточки встречи или отправьте приглашение по email.' },
    { q: 'Сколько стоит использование?', a: 'Light - бесплатно, Pro - 2 999 ₽/мес, Business - 9 999 ₽/мес.' },
    { q: 'Как изменить пароль?', a: 'Перейдите в Настройки → Безопасность, там вы сможете сменить пароль.' },
  ];

  return (
    <PublicLayout title="Часто задаваемые вопросы" subtitle="Ответы на популярные вопросы">
      <div className="space-y-4">
        {faqs.map((faq, idx) => (
          <details key={idx} className="bg-white rounded-xl shadow-sm border border-gray-200">
            <summary className="flex items-center justify-between cursor-pointer p-6 hover:bg-gray-50">
              <span className="font-medium text-gray-900">{faq.q}</span>
              <ChevronRight className="w-5 h-5 text-gray-400 group-open:rotate-90 transition-transform" />
            </summary>
            <div className="px-6 pb-6 text-gray-600">{faq.a}</div>
          </details>
        ))}
      </div>
    </PublicLayout>
  );
}