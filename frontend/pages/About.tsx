import React from 'react';
import PublicLayout from '../components/PublicLayout';

export default function About() {
  return (
    <PublicLayout title="О компании" subtitle="Potalkyem - платформа для аудиоконференций с AI">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 space-y-4">
        <p className="text-gray-600">Мы создаём современные решения для аудиоконференций, используя передовые технологии AI.</p>
        <p className="text-gray-600">Наша миссия — сделать онлайн-коммуникации максимально продуктивными и удобными.</p>
        <p className="text-gray-600">С нами вы можете фокусироваться на обсуждении, а не на записи — всё остальное сделает AI.</p>
      </div>
    </PublicLayout>
  );
}