import React, { useState, useEffect, useMemo } from 'react';
import { FileText, Download, Search, Calendar, ChevronRight, Loader2, AlertCircle, ArrowUpDown } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { ProtocolShortResponse, ProtocolResponse } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';
import { api } from '../services/api.ts';

type SortField = 'date' | 'title' | 'room';
type SortDir = 'asc' | 'desc';

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
      setError("Failed to load protocols. Please try again.");
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
      alert("Failed to load protocol details.");
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
    
    // Фильтрация: поиск по названию, комнате, И сводке (summary)
    let filtered = protocols.filter(p => {
      if (!search) return true;
      return (
        p.title.toLowerCase().includes(searchLower) ||
        p.room_name.toLowerCase().includes(searchLower) ||
        (p.summary && p.summary.toLowerCase().includes(searchLower))
      );
    });

    // Сортировка
    filtered.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title':
          cmp = a.title.localeCompare(b.title);
          break;
        case 'room':
          cmp = a.room_name.localeCompare(b.room_name);
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

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Protocols</h1>
            <p className="text-sm text-gray-500 mt-1">AI-generated summaries, decisions, and action items</p>
          </div>
          <div className="flex items-center space-x-3">
            {/* Кнопки сортировки */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {([
                { field: 'date' as SortField, label: 'Date' },
                { field: 'title' as SortField, label: 'Title' },
                { field: 'room' as SortField, label: 'Room' },
              ]).map(({ field, label }) => (
                <button
                  key={field}
                  onClick={() => toggleSort(field)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center space-x-1 ${
                    sortField === field
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span>{label}</span>
                  {sortField === field && (
                    <ArrowUpDown className={`w-3 h-3 ${sortDir === 'asc' ? 'rotate-180' : ''}`} />
                  )}
                </button>
              ))}
            </div>
            {/* Поиск */}
            <div className="relative w-72">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search in title, room, summary..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full pl-10 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Clear search"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
              <Loader2 className="w-8 h-8 mb-4 text-blue-500 animate-spin" />
              <p className="text-sm font-medium">Loading protocols...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-64 text-red-500">
              <AlertCircle className="w-12 h-12 mb-4 text-red-300" />
              <p className="text-lg font-medium text-red-900">{error}</p>
              <button onClick={fetchProtocols} className="mt-4 px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors">Try Again</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              {filteredAndSortedProtocols.length > 0 && (
                <div className="px-6 py-2 bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                  {filteredAndSortedProtocols.length} protocol{filteredAndSortedProtocols.length !== 1 ? 's' : ''} found
                </div>
              )}
              <ul className="divide-y divide-gray-200">
                {filteredAndSortedProtocols.map((protocol) => (
                  <li key={protocol.id} className="hover:bg-gray-50 transition-colors">
                    <div className="px-6 py-5 flex items-center justify-between">
                      <div className="flex items-start space-x-4 flex-1">
                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 shrink-0">
                          <FileText className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-bold text-gray-900 truncate">{protocol.title}</h3>
                            <div className="flex items-center text-sm text-gray-500 shrink-0 ml-4">
                              <Calendar className="w-4 h-4 mr-1.5" />
                              {new Date(protocol.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          <p className="text-sm font-medium text-blue-600 mb-1">{protocol.room_name}</p>
                          <p className="text-sm text-gray-600 line-clamp-2">{protocol.summary || 'No summary available.'}</p>
                        </div>
                      </div>
                      <div className="ml-8 flex items-center space-x-3 shrink-0">
                        {protocol.pdf_url && (
                          <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                            <Download className="w-5 h-5" />
                          </button>
                        )}
                        <button 
                          onClick={() => handleViewProtocol(protocol.id)}
                          disabled={isViewerLoading && selectedProtocolId === protocol.id}
                          className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm disabled:opacity-50"
                        >
                          {isViewerLoading && selectedProtocolId === protocol.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <span>View</span>
                              <ChevronRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
                {filteredAndSortedProtocols.length === 0 && (
                  <li className="px-6 py-12 text-center text-gray-500">
                    {search ? 'No protocols match your search.' : 'No protocols found. Create a room and generate a protocol to see it here.'}
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