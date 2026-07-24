import React, { useEffect, useState } from 'react';
import { X, CheckCircle, AlertTriangle, Info, AlertOctagon } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
    id: string;
    type: ToastType;
    title: string;
    message: string;
}

export const useToast = () => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const addToast = (type: ToastType, title: string, message: string) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => removeToast(id), 5000); // Auto-dismiss
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return { toasts, addToast, removeToast };
};

// Componente global para renderizar los toasts
export const ToastContainer = ({ toasts, removeToast }: { toasts: ToastMessage[], removeToast: (id: string) => void }) => {
    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
            {toasts.map(t => (
                <div key={t.id} className={`pointer-events-auto w-full p-4 rounded-xl border shadow-2xl flex gap-3 animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md ${t.type === 'success' ? 'bg-emerald-50 border-emerald-300 text-emerald-900' :
                        t.type === 'error' ? 'bg-red-50 border-red-300 text-red-900' :
                            t.type === 'warning' ? 'bg-amber-50 border-amber-300 text-amber-900' :
                                'bg-rose-muted border-rose-border text-rose-900'
                    }`}>
                    <div className={`shrink-0 ${t.type === 'success' ? 'text-emerald-600' :
                            t.type === 'error' ? 'text-red-500' :
                                t.type === 'warning' ? 'text-amber-600' :
                                    'text-rose-palo-dark'
                        }`}>
                        {t.type === 'success' && <CheckCircle size={24} />}
                        {t.type === 'error' && <AlertOctagon size={24} />}
                        {t.type === 'warning' && <AlertTriangle size={24} />}
                        {t.type === 'info' && <Info size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm uppercase tracking-wide">{t.title}</h4>
                        <p className="text-xs text-rose-500 mt-1 break-words leading-relaxed">{t.message}</p>
                    </div>
                    <button onClick={() => removeToast(t.id)} className="text-rose-400 hover:text-rose-700 transition-colors self-start">
                        <X size={16} />
                    </button>
                </div>
            ))}
        </div>
    );
};
