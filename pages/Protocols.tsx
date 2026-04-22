import React, { useState } from 'react';
import { FileText, Download, Search, Calendar, ChevronRight } from 'lucide-react';
import Sidebar from '../components/Sidebar.tsx';
import { ProtocolShortResponse } from '../types.ts';
import ProtocolViewer from '../components/ProtocolViewer.tsx';

const MOCK_PROTOCOLS: ProtocolShortResponse[] = [
  { id: 'p1', roomId: 'r1', roomName: 'Project Alpha Kickoff', title: 'Alpha Kickoff Summary', summary: 'Discussed initial architecture and assigned tasks for the first sprint.', createdAt: '2024-05-15T14:30:00Z', pdfUrl: '#' },
  { id: 'p2', roomId: 'r2', roomName: 'Weekly Sync', title: 'Weekly Sync - Week 20', summary: 'Reviewed progress on the signaling server. Blockers identified in WebRTC ICE candidate exchange.', createdAt: '2024-05-10T10:00:00Z', pdfUrl: '#' },
  { id: 'p3', roomId: 'r3', roomName: 'Client Presentation', title: 'Q3 Results Protocol', summary: 'Presented Q3 results. Client requested additional features for the dashboard.', createdAt: '2024-04-28T16:00:00Z' },
];

export default function Protocols() {
  const [search, setSearch] = useState('');
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolShortResponse | null>(null);

  const filteredProtocols = MOCK_PROTOCOLS.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.roomName.toLowerCase().includes(search.toLowerCase())
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
                            {new Date(protocol.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                        <p className="text-sm font-medium text-blue-600 mb-1">{protocol.roomName}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{protocol.summary}</p>
                      </div>
                    </div>
                    <div className="ml-8 flex items-center space-x-3 shrink-0">
                      {protocol.pdfUrl && (
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Download PDF">
                          <Download className="w-5 h-5" />
                        </button>
                      )}
                      <button 
                        onClick={() => setSelectedProtocol(protocol)}
                        className="flex items-center space-x-1 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors shadow-sm"
                      >
                        <span>View</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
              {filteredProtocols.length === 0 && (
                <li className="px-6 py-12 text-center text-gray-500">
                  No protocols found matching your search.
                </li>
              )}
            </ul>
          </div>
        </main>
      </div>

      {/* Mocking the full protocol data for the viewer based on the short response */}
      <ProtocolViewer 
        isOpen={!!selectedProtocol} 
        onClose={() => setSelectedProtocol(null)} 
        protocol={selectedProtocol ? {
          id: selectedProtocol.id,
          roomId: selectedProtocol.roomId,
          title: selectedProtocol.title,
          createdAt: selectedProtocol.createdAt,
          pdfUrl: selectedProtocol.pdfUrl,
          summaryJson: { summary: selectedProtocol.summary, topics: ['General'] },
          updatedAt: selectedProtocol.createdAt
        } : null} 
      />
    </div>
  );
}
