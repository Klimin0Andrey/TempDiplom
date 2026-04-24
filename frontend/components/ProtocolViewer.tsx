import React from 'react';
import { X, Download, FileText, CheckCircle2, Clock, Tag } from 'lucide-react';
import { ProtocolResponse } from '../types.ts';

interface ProtocolViewerProps {
  protocol: ProtocolResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ProtocolViewer({ protocol, isOpen, onClose }: ProtocolViewerProps) {
  if (!isOpen || !protocol) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <FileText className="w-5 h-5 text-blue-700" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{protocol.title}</h2>
              <p className="text-xs text-gray-500">
                Generated on {new Date(protocol.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {protocol.pdf_url && (
              <a 
                href={protocol.pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-md text-sm font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </a>
            )}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
          <div className="space-y-8 max-w-3xl mx-auto">
            
            {/* Summary Section */}
            {protocol.summary_json && (
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-md font-bold text-gray-900 mb-3 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-blue-500" />
                  Executive Summary
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {protocol.summary_json.summary}
                </p>
                
                {protocol.summary_json.topics && protocol.summary_json.topics.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center">
                      <Tag className="w-3 h-3 mr-1" /> Topics Discussed
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {protocol.summary_json.topics.map((topic, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-md border border-gray-200">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Decisions Section */}
            {protocol.decisions_json && protocol.decisions_json.decisions && protocol.decisions_json.decisions.length > 0 && (
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                  <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  Key Decisions
                </h3>
                <ul className="space-y-3">
                  {protocol.decisions_json.decisions.map((decision, idx) => (
                    <li key={idx} className="flex items-start">
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-500 mt-2 mr-3"></span>
                      <span className="text-sm text-gray-700">{decision}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Action Items Section */}
            {protocol.action_items_json && protocol.action_items_json.action_items && protocol.action_items_json.action_items.length > 0 && (
              <section className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-md font-bold text-gray-900 mb-4 flex items-center">
                  <Clock className="w-4 h-4 mr-2 text-orange-500" />
                  Action Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assignee</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deadline</th>
                        <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {protocol.action_items_json.action_items.map((item, idx) => {
                        // Защита от криво сгенерированного ИИ JSON'а
                        const status = item.status || 'pending';
                        const assignee = item.assignee || 'Unassigned';
                        const initial = item.assignee ? String(item.assignee).charAt(0).toUpperCase() : '?';
                        
                        return (
                          <tr key={item.id || `action-item-${idx}`} className="hover:bg-gray-50 transition-colors">
                            <td className="px-3 py-3 text-sm text-gray-900 font-medium">
                              {item.task || 'Untitled Task'}
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                              <div className="flex items-center space-x-2">
                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">
                                  {initial}
                                </div>
                                <span>{assignee}</span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm text-gray-600">
                              {item.deadline || 'No deadline'}
                            </td>
                            <td className="px-3 py-3 text-sm">
                              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                status === 'completed' ? 'bg-green-100 text-green-800' :
                                status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}