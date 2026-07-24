import React from 'react';
import { X, Receipt, Printer, Mail, RefreshCw } from 'lucide-react';
import { TicketContent } from '../TicketContent';
import type { Sale, CatalogItem } from '../../types';

interface Props {
  sale: Sale | null;
  config: any;
  catalog: CatalogItem[];
  receiptEmail: string;
  isSendingEmail: boolean;
  onClose: () => void;
  onEmailChange: (v: string) => void;
  onSendEmail: () => void;
  onFinalize: () => void;
}

export function ReceiptModal({ 
  sale, config, catalog, receiptEmail, isSendingEmail, 
  onClose, onEmailChange, onSendEmail, onFinalize 
}: Props) {
  if (!sale) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-rose-palo-dark/30 backdrop-blur-sm flex items-center justify-center p-[clamp(4px,1vmin,16px)]">
      <div className="bg-white border border-rose-border w-full max-w-[min(70vmin,320px)] shadow-xl rounded-[clamp(12px,3vmin,40px)] p-[clamp(8px,2.5vmin,32px)] animate-in zoom-in duration-200 max-h-[100dvh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-[clamp(6px,2vmin,24px)]">
          <div className="flex items-center gap-[clamp(4px,1.2vmin,12px)] min-w-0">
            <div className="bg-rose-palo/10 p-[clamp(4px,1vmin,8px)] rounded-xl text-rose-palo-dark shrink-0">
              <Receipt style={{ width: 'clamp(14px,3.5vmin,20px)', height: 'clamp(14px,3.5vmin,20px)' }} />
            </div>
            <h3 className="text-[clamp(11px,3vmin,18px)] font-black text-rose-900 uppercase tracking-tight truncate">Comprobante</h3>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-700 shrink-0">
            <X style={{ width: 'clamp(16px,4vmin,24px)', height: 'clamp(16px,4vmin,24px)' }} />
          </button>
        </div>

        <div className="transform hover:scale-[1.02] transition-transform mb-[clamp(8px,2.5vmin,32px)] flex-1 overflow-hidden">
          <TicketContent sale={sale} config={config} catalog={catalog} />
        </div>

        <div className="space-y-[clamp(4px,1.2vmin,16px)] no-print shrink-0">
          <button
            onClick={() => window.print()}
            className="w-full bg-rose-palo text-white py-[clamp(6px,2vmin,16px)] font-black rounded-[clamp(8px,2vmin,16px)] uppercase text-[clamp(8px,2.2vmin,12px)] flex items-center justify-center gap-[clamp(4px,1.2vmin,12px)] shadow-lg active:scale-95 transition-all hover:bg-rose-palo-dark"
          >
            <Printer style={{ width: 'clamp(12px,3vmin,18px)', height: 'clamp(12px,3vmin,18px)' }} /> Imprimir
          </button>

          <div className={`p-[clamp(6px,2vmin,16px)] rounded-[clamp(12px,2.5vmin,24px)] border space-y-[clamp(4px,1.2vmin,12px)] shadow-sm transition-colors ${
            receiptEmail ? 'bg-rose-palo/5 border-rose-palo/30' : 'bg-destructive/5 border-destructive/20'
          }`}>
            <label className={`text-[clamp(7px,1.8vmin,9px)] font-black uppercase tracking-widest ml-1 ${
              receiptEmail ? 'text-rose-palo-dark' : 'text-destructive'
            }`}>
              {receiptEmail ? 'Correo Detectado' : 'Sin Correo'}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className={`absolute left-[clamp(4px,1.2vmin,12px)] top-1/2 -translate-y-1/2 ${
                  receiptEmail ? 'text-rose-palo-light' : 'text-destructive/40'
                }`} style={{ width: 'clamp(10px,2.5vmin,14px)', height: 'clamp(10px,2.5vmin,14px)' }} />
                <input
                  type="email"
                  value={receiptEmail}
                  onChange={(e) => onEmailChange(e.target.value)}
                  placeholder="cliente@correo.com"
                  className="w-full border rounded-xl py-[clamp(4px,1.2vmin,10px)] pl-[clamp(20px,5vmin,36px)] pr-[clamp(4px,1.2vmin,8px)] text-[clamp(8px,2.2vmin,12px)] font-bold outline-none transition-all bg-white border-rose-border text-rose-900 focus:border-rose-palo"
                />
              </div>
              <button
                onClick={onSendEmail}
                disabled={isSendingEmail || !receiptEmail}
                className={`p-[clamp(4px,1.2vmin,10px)] rounded-xl shadow-sm transition-all active:scale-95 ${
                  isSendingEmail ? 'bg-rose-muted text-rose-400' : 'bg-rose-palo text-white hover:bg-rose-palo-dark'
                }`}
              >
                {isSendingEmail
                  ? <RefreshCw className="animate-spin" style={{ width: 'clamp(12px,3vmin,18px)', height: 'clamp(12px,3vmin,18px)' }} />
                  : <Mail style={{ width: 'clamp(12px,3vmin,18px)', height: 'clamp(12px,3vmin,18px)' }} />
                }
              </button>
            </div>
          </div>

          <button onClick={onFinalize} className="w-full bg-rose-muted hover:bg-rose-border text-rose-700 py-[clamp(6px,2vmin,16px)] rounded-[clamp(8px,2vmin,16px)] font-black uppercase text-[clamp(8px,2.2vmin,12px)] tracking-widest transition-colors shadow-sm active:scale-95">
            Finalizar
          </button>
        </div>
      </div>
    </div>
  );
}
