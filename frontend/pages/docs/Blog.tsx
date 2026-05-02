import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Calendar, User, Eye, ArrowRight, ArrowLeft, Sparkles, Zap, Shield, TrendingUp } from 'lucide-react';
import PublicLayout from '../../components/PublicLayout';

export default function Blog() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [selectedCategory, setSelectedCategory] = useState('Все');

  const posts = [
    {
      id: 1,
      title: 'Potalkyem — новая платформа для аудиоконференций',
      excerpt: 'Мы рады представить Potalkyem — современное решение для проведения аудиоконференций с AI-расшифровкой и автоматическими протоколами.',
      content: 'Potalkyem — это инновационная платформа, которая объединяет высококачественную аудиосвязь и передовые AI-технологии. Наше решение автоматически расшифровывает разговоры, выделяет ключевые моменты и формирует протоколы встреч. Больше не нужно тратить время на ручное ведение заметок — сконцентрируйтесь на обсуждении! Платформа поддерживает WebRTC соединения, обеспечивая минимальную задержку и кристально чистый звук. А благодаря интеграции с веб-календарями, вы никогда не пропустите важную встречу.',
      date: '1 мая 2026',
      author: 'Команда Potalkyem',
      category: 'Новости',
      readTime: 3,
      icon: Sparkles,
      color: 'blue'
    },
    {
      id: 2,
      title: 'Как мы защищаем ваши данные',
      excerpt: 'Рассказываем о мерах безопасности, которые использует Potalkyem для защиты конфиденциальных данных и переговоров.',
      content: 'Безопасность данных — наш главный приоритет. Potalkyem использует JWT-токены для аутентификации, ролевую модель доступа и изолированные пространства для каждой организации. Все WebRTC соединения защищены протоколом DTLS, обеспечивающим шифрование аудиопотоков. Мы также регулярно проводим аудит безопасности и обновляем зависимости для предотвращения уязвимостей. Ваши данные хранятся в надёжных облачных хранилищах с резервным копированием.',
      date: '28 апреля 2026',
      author: 'Отдел безопасности',
      category: 'Безопасность',
      readTime: 5,
      icon: Shield,
      color: 'green'
    },
    {
      id: 3,
      title: '5 советов для эффективных онлайн-встреч',
      excerpt: 'Делимся рекомендациями, как сделать ваши онлайн-встречи продуктивнее и интереснее для всех участников.',
      content: '1. Подготовьте повестку заранее — отправьте участникам список вопросов для обсуждения. 2. Используйте функцию "Поднятие руки" в Potalkyem, чтобы избежать перебивания. 3. Записывайте встречи — наши AI-протоколы помогут не упустить важные детали. 4. Назначайте ответственных за каждое действие прямо в протоколе. 5. Проводите короткие встречи — оптимальная длительность 30-45 минут. Следуя этим советам, вы повысите эффективность командной работы в разы!',
      date: '25 апреля 2026',
      author: 'Эксперты по продуктивности',
      category: 'Советы',
      readTime: 4,
      icon: Zap,
      color: 'purple'
    },
    {
      id: 4,
      title: 'Обновление платформы: что нового в мае',
      excerpt: 'Рассказываем о новых функциях: улучшенный чат, индикатор набора текста и кастомные модальные окна.',
      content: 'В майском обновлении мы добавили долгожданные функции: теперь вы можете редактировать и удалять сообщения в чате, а также отвечать на конкретные сообщения. Индикатор набора текста показывает, кто сейчас печатает. Мы также полностью переработали интерфейс модальных окон — они стали более информативными и удобными. Добавлена возможность массового приглашения пользователей в комнату. А ещё мы оптимизировали производительность WebSocket соединений, что сделало аудио ещё более стабильным.',
      date: '20 апреля 2026',
      author: 'Команда разработки',
      category: 'Обновления',
      readTime: 3,
      icon: TrendingUp,
      color: 'orange'
    }
  ];

  const categories = ['Все', 'Новости', 'Обновления', 'Советы', 'Безопасность'];

  const filteredPosts = selectedCategory === 'Все' ? posts : posts.filter(p => p.category === selectedCategory);
  const currentPost = id ? posts.find(p => p.id === parseInt(id)) : null;

  // Если открыта конкретная статья
  if (currentPost) {
    return (
      <PublicLayout title={currentPost.title} subtitle="">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <button onClick={() => navigate('/blog')} className="flex items-center gap-2 text-blue-600 mb-6 hover:underline">
              <ArrowLeft className="w-4 h-4" /> Назад ко всем статьям
            </button>
            <div className="flex items-center gap-4 mb-6 flex-wrap">
              <span className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded-full">{currentPost.category}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1"><Calendar className="w-4 h-4" />{currentPost.date}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1"><User className="w-4 h-4" />{currentPost.author}</span>
              <span className="text-sm text-gray-500 flex items-center gap-1"><Eye className="w-4 h-4" />{currentPost.readTime} мин чтения</span>
            </div>
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">{currentPost.content}</p>
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Список статей
  return (
    <PublicLayout title="Блог Potalkyem" subtitle="Новости, обновления и полезные статьи">
      <div className="flex flex-wrap gap-2 mb-8">
        {categories.map((cat, idx) => (
          <button key={idx} onClick={() => setSelectedCategory(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{cat}</button>
        ))}
      </div>

      <div className="space-y-6">
        {filteredPosts.map((post) => {
          const Icon = post.icon;
          const colorClasses = { blue: 'bg-blue-100 text-blue-600', green: 'bg-green-100 text-green-600', purple: 'bg-purple-100 text-purple-600', orange: 'bg-orange-100 text-orange-600' };
          return (
            <article key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-all cursor-pointer" onClick={() => navigate(`/blog/${post.id}`)}>
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${colorClasses[post.color as keyof typeof colorClasses]} flex items-center justify-center shrink-0`}><Icon className="w-6 h-6" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full">{post.category}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="w-3 h-3" />{post.date}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><User className="w-3 h-3" />{post.author}</span>
                      <span className="text-xs text-gray-400 flex items-center gap-1"><Eye className="w-3 h-3" />{post.readTime} мин чтения</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2 hover:text-blue-600 transition-colors">{post.title}</h2>
                    <p className="text-gray-600 mb-4">{post.excerpt}</p>
                    <span className="flex items-center gap-1 text-blue-600 font-medium">Читать далее <ArrowRight className="w-4 h-4" /></span>
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {filteredPosts.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <p className="text-gray-500">Статьи не найдены</p>
        </div>
      )}
    </PublicLayout>
  );
}