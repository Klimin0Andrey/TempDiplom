import React from 'react';
import { X, AlertTriangle, Shield, Info, Trash2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

// Переводы по умолчанию (можно переопределить через props)
const defaultTranslations = {
  confirm: 'Подтвердить',
  cancel: 'Отмена',
  dangerTitle: 'Подтверждение удаления',
  warningTitle: 'Внимание',
  infoTitle: 'Информация'
};

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = defaultTranslations.confirm,
  cancelText = defaultTranslations.cancel,
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const variantConfig = {
    danger: {
      button: 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600',
      icon: Trash2,
      iconColor: 'text-red-500',
      bgIcon: 'bg-red-100',
      borderIcon: 'border-red-200'
    },
    warning: {
      button: 'bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-700 hover:to-yellow-600',
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      bgIcon: 'bg-yellow-100',
      borderIcon: 'border-yellow-200'
    },
    info: {
      button: 'bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600',
      icon: Info,
      iconColor: 'text-blue-500',
      bgIcon: 'bg-blue-100',
      borderIcon: 'border-blue-200'
    },
  };

  const config = variantConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-gray-50 to-gray-100">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${config.bgIcon} border ${config.borderIcon}`}>
              <Icon className={`w-4 h-4 ${config.iconColor}`} />
            </div>
            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              {title}
            </h2>
          </div>
          <button 
            onClick={onCancel} 
            className="text-gray-400 hover:text-gray-600 transition-all hover:rotate-90 duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`flex-shrink-0 p-2 rounded-full ${config.bgIcon}`}>
              <Icon className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <p className="text-gray-600 leading-relaxed">{message}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-all hover:shadow-sm"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-sm hover:shadow-md ${config.button}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}