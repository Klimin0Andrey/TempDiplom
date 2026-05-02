import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Search, Calendar, ChevronRight, Loader2, AlertCircle, ArrowUpDown, X } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { ProtocolShortResponse, ProtocolResponse } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';
import { api } from '../services/api.ts';

type SortField = 'date' | 'title' | 'room';
type SortDir = 'asc' | 'desc';

// Переводы
const translations = {
  title: 'Протоколы встреч',
  subtitle: 'AI-сгенерированные резюме, решения и планы действий',
  searchPlaceholder: 'Поиск по названию, комнате, резюме...',
  clearSearch: 'Очистить поиск',
  loading: 'Загрузка протоколов...',
  error: 'Не удалось загрузить протоколы',
  tryAgain: 'Повторить',
  protocolsFound: (count: number) => {
    if (count % 10 === 1 && count % 100 !== 11) return `${count} протокол найден`;
    if (count % 10 >= 2 && count % 10 <= 4 && (count % 100 < 10 || count % 100 >= 20)) return `${count} протокола найдено`;
    return `${count} протоколов найдено`;
  },
  noProtocols: 'Протоколы не найдены',
  noMatch: 'Ничего не найдено по вашему запросу',
  createFirst: 'Создайте комнату и проведите встречу, чтобы увидеть протокол здесь',
  downloadPdf: 'Скачать PDF',
  view: 'Просмотр',
  sort: {
    date: 'Дата',
    title: 'Название',
    room: 'Комната'
  },
  noSummary: 'Нет доступного резюме'
};

export default function Protocols() {
  const [search, setSearch] = useState('');
  const [protocols, setProtocols] = useState<ProtocolShortResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [fullProtocol, setFullProtocol] = useState<ProtocolResponse | null>(null);
  const [isViewerLoading, setIsViewerLoading] = useState(false);

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.protocols.list();
      setProtocols(response.protocols || []);
    } catch (err: any) {
      console.error("Failed to fetch protocols:", err);
      setError(translations.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProtocol = async (id: string) => {
    setSelectedProtocolId(id);
    setIsViewerLoading(true);
    try {
      const data = await api.protocols.getById(id);
      setFullProtocol(data);
    } catch (err) {
      console.error("Failed to fetch full protocol:", err);
      alert("Не удалось загрузить детали протокола");
      setSelectedProtocolId(null);
    } finally {
      setIsViewerLoading(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const filteredAndSortedProtocols = useMemo(() => {
    const searchLower = search.toLowerCase();
    
    let filtered = protocols.filter(p => {
      if (!search) return true;
      return (
        p.title.toLowerCase().includes(searchLower) ||
        p.room_name.toLowerCase().includes(searchLower) ||
        (p.summary && p.summary.toLowerCase().includes(searchLower))
      );
    });

    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title, 'ru');
          break;
        case 'room':
          cmp = a.room_name.localeCompare(b.room_name, 'ru');
          break;
        case 'date':
        default:
          cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return filtered;
  }, [protocols, search, sortField, sortDir]);

  const getSortButtonClass = (field: SortField) => {
    const isActive = sortField === field;
    return `px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
      isActive
        ? 'bg-white text-gray-900 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0 flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {translations.title}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{translations.subtitle}</p>
          </div>          
          <div className="flex items-center gap-3 flex-wrap"></div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Кнопки сортировки */}
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { field: 'date' as SortField, label: translations.sort.date },
                { field: 'title' as SortField, label: translations.sort.title },
                { field: 'room' as SortField, label: translations.sort.room },
              ].map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={getSortButtonClass(field)}
                >
                  <span>{label}</span>
                  {sortField === field && (
                    <ArrowUpDown className={`w-3.5 h-3.5 transition-transform ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              ))}
            </div>
            
            {/* Поиск */}
            <div className="relative w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={translations.searchPlaceholder}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-9 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={translations.clearSearch}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-4"></div>
              <p className="text-sm font-medium text-gray-500">{translations.loading}</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="bg-red-50 rounded-full p-4 mb-4">
                <AlertCircle className="w-12 h-12 text-red-400" />
              </div>
              <p className="text-lg font-medium text-red-800">{error}</p>
              <button 
                onClick={fetchProtocols} 
                className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors font-medium"
              >
                {translations.tryAgain}
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredAndSortedProtocols.length > 0 && (
                <div className="px-6 py-2.5 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  {translations.protocolsFound(filteredAndSortedProtocols.length)}
                </div>
              )}
              <ul className="divide-y divide-gray-200">
                {filteredAndSortedProtocols.map((protocol) => (
                  <li key={protocol.id} className="hover:bg-gray-50/80 transition-colors">
                    <div className="px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="bg-gradient-to-br from-blue-100 to-blue-50 p-3 rounded-xl border border-blue-200 shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">
                              {protocol.title}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 shrink-0">
                              <Calendar className="w-3.5 h-3.5 mr-1.5" />
                              {formatDate(protocol.created_at)}
                            </div>
                          </div>
                          <p className="text-sm font-medium text-blue-600 mb-1 truncate">
                            {protocol.room_name}
                          </p>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {protocol.summary || translations.noSummary}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {protocol.pdf_url && (
                          <a
                            href={protocol.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title={translations.downloadPdf}
                          >
                            <Download className="w-5 h-5" />
                          </a>
                        )}
                        <button 
                          onClick={() => handleViewProtocol(protocol.id)}
                          disabled={isViewerLoading && selectedProtocolId === protocol.id}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all shadow-sm hover:shadow disabled:opacity-50"
                        >
                          {isViewerLoading && selectedProtocolId === protocol.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>{translations.view}</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredAndSortedProtocols.length === 0 && (
                  <li className="px-6 py-12 text-center">
                    <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-300" />
                    </div>
                    <p className="text-gray-500 font-medium">
                      {search ? translations.noMatch : translations.noProtocols}
                    </p>
                    {!search && (
                      <p className="text-sm text-gray-400 mt-1">{translations.createFirst}</p>
                    )}
                  </li>
                )}
              </ul>
            </div>
          )}
        </main>
      </div>

      <ProtocolViewer 
        isOpen={!!fullProtocol} 
        onClose={() => {
          setFullProtocol(null);
          setSelectedProtocolId(null);
        }} 
        protocol={fullProtocol} 
      />
    </div>
  );
}