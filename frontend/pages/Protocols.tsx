import React, { useState, useEffect } from 'react';
import { FileText, Download, Search, Calendar, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { ProtocolShortResponse, ProtocolResponse } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';
import { api } from '../services/api.ts';

export default function Protocols() {
  const [search, setSearch] = useState('');
  const [protocols, setProtocols] = useState<ProtocolShortResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
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

  const filteredProtocols = protocols.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.room_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Meeting Protocols</h1>
            <p className="text-sm text-gray-500 mt-1">AI-generated summaries, decisions, and action items</p>
          </div>
          <div className="relative w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search protocols..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-shadow"
            />
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
              <ul className="divide-y divide-gray-200">
                {filteredProtocols.map((protocol) => (
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
                {filteredProtocols.length === 0 && (
                  <li className="px-6 py-12 text-center text-gray-500">
                    No protocols found. Create a room and generate a protocol to see it here.
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
