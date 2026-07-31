import React, { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, DollarSign, UserPlus, Search, ChevronRight, Package } from 'lucide-react';
import { ReceiptModal } from './ReceiptModal';
import type { Sale, CatalogItem, User } from '../../types';

interface POSModalsProps {
  showReceiptModal: boolean;
  currentSale: Sale | null;
  config: any;
  catalog: CatalogItem[];
  barbers?: User[];
  receiptEmail: string;
  isSendingEmail: boolean;
  onCloseReceipt: () => void;
  onFinalizeReceipt: () => void;
  onPrintReceipt: () => void;
  onEmailChange: (v: string) => void;
  onSendEmail: () => void;
  showAddClientModal: boolean;
  onCloseAddClient: () => void;
  newClientName: string;
  newClientPhone: string;
  newClientEmail: string;
  newClientBirth: string;
  newClientNotes: string;
  newClientReferrerSearch: string;
  filteredReferrers: any[];
  clients: any[];
  onNewClientNameChange: (v: string) => void;
  onNewClientPhoneChange: (v: string) => void;
  onNewClientEmailChange: (v: string) => void;
  onNewClientBirthChange: (v: string) => void;
  onNewClientNotesChange: (v: string) => void;
  onNewClientReferrerSearchChange: (v: string) => void;
  onNewClientSelectReferrer: (id: string) => void;
  onAddClientSubmit: (e: React.FormEvent) => void;
  showComboModal: any;
  onCloseCombo: () => void;
  onAddComboToCart: (item: any) => void;
  showOpenSessionModal: boolean;
  openingAmount: string;
  onOpeningAmountChange: (v: string) => void;
  onOpenSession: (e: React.FormEvent) => void;
  onCloseOpenSession: () => void;
}

function AddClientModal({
  onClose, newClientName, newClientPhone, newClientEmail, newClientBirth, newClientNotes,
  newClientReferrerSearch, filteredReferrers, clients,
  onNameChange, onPhoneChange, onEmailChange, onBirthChange, onNotesChange,
  onReferrerSearchChange, onSelectReferrer, onSubmit,
}: {
  onClose: () => void;
  newClientName: string; newClientPhone: string; newClientEmail: string;
  newClientBirth: string; newClientNotes: string;
  newClientReferrerSearch: string;
  filteredReferrers: any[]; clients: any[];
  onNameChange: (v: string) => void; onPhoneChange: (v: string) => void;
  onEmailChange: (v: string) => void; onBirthChange: (v: string) => void;
  onNotesChange: (v: string) => void;
  onReferrerSearchChange: (v: string) => void;
  onSelectReferrer: (id: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-rose-palo-dark/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-rose-border w-full max-w-md shadow-xl rounded-[2.5rem] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-rose-palo/10 p-2 rounded-xl text-rose-palo-dark"><UserPlus size={20} /></div>
            <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Nuevo Cliente</h3>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-700"><X size={24} /></button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <input value={newClientName} onChange={e => onNameChange(e.target.value)} placeholder="Nombre *" required
            className="w-full border border-rose-border rounded-xl py-3 px-4 text-xs font-black text-rose-900 outline-none focus:border-rose-palo" />
          <input value={newClientPhone} onChange={e => onPhoneChange(e.target.value)} placeholder="Teléfono"
            className="w-full border border-rose-border rounded-xl py-3 px-4 text-xs font-black text-rose-900 outline-none focus:border-rose-palo" />
          <input value={newClientEmail} onChange={e => onEmailChange(e.target.value)} placeholder="Correo" type="email"
            className="w-full border border-rose-border rounded-xl py-3 px-4 text-xs font-black text-rose-900 outline-none focus:border-rose-palo" />
          <input value={newClientBirth} onChange={e => onBirthChange(e.target.value)} placeholder="Fecha de Nacimiento" type="date"
            className="w-full border border-rose-border rounded-xl py-3 px-4 text-xs font-black text-rose-900 outline-none focus:border-rose-palo" />
          <textarea value={newClientNotes} onChange={e => onNotesChange(e.target.value)} placeholder="Notas"
            className="w-full border border-rose-border rounded-xl py-3 px-4 text-xs font-black text-rose-900 outline-none focus:border-rose-palo resize-none" rows={2} />

          <div className="relative">
            <div className="flex items-center gap-2 bg-rose-muted rounded-xl px-4 py-2">
              <Search size={14} className="text-rose-400" />
              <input value={newClientReferrerSearch} onChange={e => onReferrerSearchChange(e.target.value)}
                placeholder="Buscar referido..."
                className="bg-transparent text-xs font-black text-rose-900 outline-none flex-1" />
            </div>
            {newClientReferrerSearch.length > 1 && filteredReferrers.length > 0 && (
              <div className="absolute top-full left-0 w-full bg-white border border-rose-border rounded-xl mt-1 shadow-xl z-10 max-h-40 overflow-y-auto">
                {filteredReferrers.map((c: any) => (
                  <button key={c.id} type="button" onClick={() => { onSelectReferrer(c.id); onReferrerSearchChange(c.name); }}
                    className="w-full p-3 text-left text-xs font-bold text-rose-900 hover:bg-rose-muted border-b border-rose-border last:border-0 flex justify-between items-center">
                    <span>{c.name}</span>
                    <ChevronRight size={14} className="text-rose-400" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="submit"
            className="w-full bg-rose-palo text-white py-4 font-black rounded-2xl uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all hover:bg-rose-palo-dark">
            Registrar Cliente
          </button>
        </form>
      </div>
    </div>,
    document.body
  );
}

function ComboModal({ combo, onClose, onAddToCart }: { combo: CatalogItem; onClose: () => void; onAddToCart: (item: CatalogItem) => void }) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-rose-palo-dark/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-rose-border w-full max-w-sm shadow-xl rounded-[2.5rem] p-8 animate-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="bg-rose-palo/10 p-2 rounded-xl text-rose-palo-dark"><Package size={20} /></div>
            <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">{combo.name}</h3>
          </div>
          <button onClick={onClose} className="text-rose-400 hover:text-rose-700"><X size={24} /></button>
        </div>
        <p className="text-rose-500 text-xs font-bold mb-4">Precio: ${combo.price.toFixed(2)}</p>
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 bg-rose-muted text-rose-700 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-colors active:scale-95">
            Cancelar
          </button>
          <button onClick={() => { onAddToCart(combo); onClose(); }}
            className="flex-1 bg-rose-palo text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all hover:bg-rose-palo-dark">
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function OpenSessionModal({ openingAmount, onAmountChange, onSubmit, onClose }: {
  openingAmount: string; onAmountChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void; onClose: () => void;
}) {
  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-rose-palo-dark/30 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-rose-border w-full max-w-sm shadow-xl rounded-[2.5rem] p-8 animate-in zoom-in duration-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-rose-palo/10 p-2 rounded-xl text-rose-palo-dark"><DollarSign size={20} /></div>
          <h3 className="text-lg font-black text-rose-900 uppercase tracking-tight">Abrir Caja</h3>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-black text-lg">$</span>
            <input value={openingAmount} onChange={e => onAmountChange(e.target.value)} placeholder="0.00" type="number" step="0.01" required autoFocus
              className="w-full border border-rose-border rounded-xl py-3 pl-10 pr-4 text-rose-900 font-mono font-black text-xl outline-none focus:border-rose-palo text-right" />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="flex-1 bg-rose-muted text-rose-700 py-3 rounded-2xl font-black uppercase text-xs tracking-widest transition-colors active:scale-95">
              Cancelar
            </button>
            <button type="submit"
              className="flex-1 bg-rose-palo text-white py-3 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-95 transition-all hover:bg-rose-palo-dark">
              Abrir Caja
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}

export function POSModals({
  showReceiptModal, currentSale, config, catalog, barbers,
  receiptEmail, isSendingEmail,
  onCloseReceipt, onFinalizeReceipt, onPrintReceipt,
  onEmailChange, onSendEmail,
  showAddClientModal, onCloseAddClient,
  newClientName, newClientPhone, newClientEmail, newClientBirth, newClientNotes,
  newClientReferrerSearch, filteredReferrers, clients,
  onNewClientNameChange, onNewClientPhoneChange, onNewClientEmailChange,
  onNewClientBirthChange, onNewClientNotesChange,
  onNewClientReferrerSearchChange, onNewClientSelectReferrer,
  onAddClientSubmit,
  showComboModal, onCloseCombo, onAddComboToCart,
  showOpenSessionModal, openingAmount, onOpeningAmountChange,
  onOpenSession, onCloseOpenSession,
}: POSModalsProps) {
  const [persistedSale, setPersistedSale] = useState<Sale | null>(null);

  useEffect(() => {
    if (showReceiptModal && currentSale) {
      setPersistedSale(currentSale);
    } else if (!showReceiptModal && !currentSale) {
      setPersistedSale(null);
    }
  }, [showReceiptModal, currentSale]);

  const displaySale = currentSale || persistedSale;
  const showSaleModal = showReceiptModal && (!!currentSale || !!persistedSale);

  const handleClose = useCallback(() => {
    setPersistedSale(null);
    onCloseReceipt();
  }, [onCloseReceipt]);

  const handleFinalize = useCallback(() => {
    setPersistedSale(null);
    onFinalizeReceipt();
  }, [onFinalizeReceipt]);

  return (
    <>
      {showSaleModal && displaySale && (
        <ReceiptModal
          sale={displaySale}
          barbers={barbers}
          config={config}
          catalog={catalog}
          receiptEmail={receiptEmail}
          isSendingEmail={isSendingEmail}
          onClose={handleClose}
          onEmailChange={onEmailChange}
          onSendEmail={onSendEmail}
          onFinalize={handleFinalize}
        />
      )}

      {showAddClientModal && (
        <AddClientModal
          onClose={onCloseAddClient}
          newClientName={newClientName}
          newClientPhone={newClientPhone}
          newClientEmail={newClientEmail}
          newClientBirth={newClientBirth}
          newClientNotes={newClientNotes}
          newClientReferrerSearch={newClientReferrerSearch}
          filteredReferrers={filteredReferrers}
          clients={clients}
          onNameChange={onNewClientNameChange}
          onPhoneChange={onNewClientPhoneChange}
          onEmailChange={onNewClientEmailChange}
          onBirthChange={onNewClientBirthChange}
          onNotesChange={onNewClientNotesChange}
          onReferrerSearchChange={onNewClientReferrerSearchChange}
          onSelectReferrer={onNewClientSelectReferrer}
          onSubmit={onAddClientSubmit}
        />
      )}

      {showComboModal && (
        <ComboModal
          combo={showComboModal}
          onClose={onCloseCombo}
          onAddToCart={onAddComboToCart}
        />
      )}

      {showOpenSessionModal && (
        <OpenSessionModal
          openingAmount={openingAmount}
          onAmountChange={onOpeningAmountChange}
          onSubmit={onOpenSession}
          onClose={onCloseOpenSession}
        />
      )}
    </>
  );
}
