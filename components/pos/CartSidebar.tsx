import React from 'react';
import {
  ShoppingCart, X, DollarSign, CreditCard, ArrowRightLeft, Bitcoin,
  Plus, CheckCircle2, ChevronRight, Star, Scissors, Trash2, Check, Users,
} from 'lucide-react';
import type { SaleItem, Payment, PaymentMethod, Ticket, Client, CatalogItem } from '../../types';
import type { User } from '../../types';
import { useDragScroll } from '../../hooks/useDragScroll';

interface CartSidebarProps {
  cart: SaleItem[];
  selectedBarbers: string[];
  barbers: User[];
  onToggleBarber: (id: string) => void;
  showBarberModal: boolean;
  onToggleBarberModal: () => void;
  onRemoveFromCart: (itemId: string) => void;
  onRemovePayment: (index: number) => void;
  onClearCart: () => void;
  payments: Payment[];
  currentPaymentMethod: PaymentMethod;
  onPaymentMethodChange: (method: PaymentMethod) => void;
  amountInput: string;
  onAmountInputChange: (value: string) => void;
  onAddPayment: () => void;
  onCheckout: () => void;
  subtotal: number;
  totalDiscount: number;
  rawTotal: number;
  totalPaid: number;
  remainingBalance: number;
  displayChange: number;
  errorMsg: string;
  usePoints: boolean;
  activeClient: Client | undefined;
  activePromotion: any;
  amountInputRef: React.RefObject<HTMLInputElement | null>;
  showCart?: boolean;
  onToggleCart?: () => void;
}

const paymentMethods: Partial<Record<PaymentMethod, string>> = {
  cash: 'Efectivo',
  card: 'Tarjeta',
  transfer: 'Transf.',
  bitcoin: 'Bitcoin',
};

export function CartSidebar({
  cart, selectedBarbers, barbers, onToggleBarber, showBarberModal, onToggleBarberModal,
  onRemoveFromCart, onRemovePayment, onClearCart,
  payments, currentPaymentMethod, onPaymentMethodChange,
  amountInput, onAmountInputChange, onAddPayment, onCheckout,
  subtotal, totalDiscount, rawTotal, totalPaid,
  remainingBalance, displayChange, errorMsg,
  usePoints, activeClient, activePromotion,
  amountInputRef, showCart, onToggleCart,
}: CartSidebarProps) {
  const cartScroll = useDragScroll();

  return (
    <>
      {showCart && (
        <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={onToggleCart} />
      )}
      <div className={`
        w-72 md:w-80 xl:w-96 bg-white flex flex-col shrink-0 border-l border-rose-border shadow-2xl
        fixed lg:static inset-y-0 right-0 z-50
        transition-transform duration-300 ease-in-out
        ${showCart ? 'translate-x-0' : 'translate-x-full'}
        lg:translate-x-0
      `}>
      <div className="p-3 sm:p-5 border-b border-rose-border flex items-center justify-between bg-white">
        <h2 className="text-rose-400 font-black text-[9px] sm:text-[10px] uppercase tracking-[0.3em] flex items-center gap-2">
          <ShoppingCart size={12} className="sm:size-[14px]" /> CARRITO
        </h2>
        <div className="flex items-center gap-2">
          <button onClick={(e) => { e.preventDefault(); onClearCart(); }} className={`text-destructive/60 hover:text-destructive text-[9px] sm:text-[10px] font-black uppercase transition-colors ${cart.length === 0 ? 'opacity-0 pointer-events-none' : ''}`}>
            Limpiar
          </button>
          <button onClick={onToggleCart} className="lg:hidden text-rose-400 hover:text-rose-700 p-1">
            <X size={16} />
          </button>
        </div>
      </div>

      <div
        ref={cartScroll.ref}
        {...cartScroll.props}
        className="flex-1 overflow-y-auto hide-scrollbar p-3 sm:p-4 space-y-1.5 sm:space-y-2 bg-rose-muted/10"
      >
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-rose-300/40">
            <ShoppingCart strokeWidth={1} className="w-12 h-12 sm:w-16 sm:h-16" />
            <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.5em] mt-3 sm:mt-4 text-center leading-relaxed">VACÍO</span>
          </div>
        ) : (
          cart.map((item, idx) => (
            <div key={`${item.itemId}-${idx}`} className="p-3 sm:p-4 bg-rose-muted border border-rose-border rounded-xl sm:rounded-2xl flex justify-between items-center shadow-sm">
              <div className="min-w-0 flex-1">
                <div className="font-black text-[10px] sm:text-[12px] uppercase truncate text-rose-900">{item.name}</div>
                <div className="text-rose-400 text-[9px] sm:text-[10px] font-bold mt-0.5">{item.quantity} x ${item.price.toFixed(2)}</div>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 ml-2">
                <span className="font-mono font-black text-xs sm:text-sm text-rose-palo-dark">${(item.price * item.quantity).toFixed(2)}</span>
                <button onClick={() => onRemoveFromCart(item.itemId)} className="text-rose-300 hover:text-destructive transition-colors">
                  <X size={14} className="sm:size-[16px]" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex-none bg-white border-t border-rose-border p-3 sm:p-5 space-y-2 sm:space-y-3 shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
        <div className="w-full">
          <label className="text-[8px] sm:text-[9px] text-rose-400 font-black uppercase mb-1 block tracking-widest ml-1">ESTILISTA(S)</label>
          <button
            type="button"
            onClick={onToggleBarberModal}
            className={`w-full bg-white border text-rose-900 py-1.5 sm:py-2 px-3 sm:px-4 rounded-xl text-[10px] sm:text-xs font-black outline-none transition-all flex items-center justify-between gap-2 ${
              errorMsg.includes('ESTILISTA') ? 'border-destructive' : 'border-rose-border focus:border-rose-palo'
            }`}
          >
            <span className="truncate">
              {selectedBarbers.length > 0
                ? selectedBarbers.map(id => barbers.find(b => b.id === id)?.name || '—').join(' + ')
                : 'SELECCIONAR ESTILISTA...'}
            </span>
            <Users size={14} className="shrink-0 text-rose-400" />
          </button>
          {selectedBarbers.length > 0 && (
            <div className="mt-1 flex flex-wrap gap-1">
              {selectedBarbers.map(id => {
                const barber = barbers.find(b => b.id === id);
                return barber && (
                  <span key={id} className="text-[7px] sm:text-[8px] font-black uppercase bg-rose-palo/15 text-rose-palo-dark px-2 py-0.5 rounded-full border border-rose-palo/30 flex items-center gap-1">
                    <Check size={8} /> {barber.name.split(' ')[0]}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {showBarberModal && (
          <div className="fixed inset-0 z-[600] bg-rose-bg/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onToggleBarberModal}>
            <div className="bg-white border border-rose-border rounded-[1.5rem] shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b flex justify-between items-center bg-rose-muted/30">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-palo/20 rounded-xl text-rose-palo-dark"><Users size={14} /></div>
                  <h3 className="text-sm font-black text-rose-900 uppercase">Estilistas</h3>
                </div>
                <button onClick={onToggleBarberModal} className="p-1.5 bg-white rounded-lg text-rose-500 border"><X size={14} /></button>
              </div>
              <div className="p-3 grid grid-cols-2 gap-2 max-h-72 overflow-y-auto">
                {barbers.map(b => {
                  const active = selectedBarbers.includes(b.id);
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => onToggleBarber(b.id)}
                      className={`relative flex items-center gap-1.5 p-2.5 rounded-xl border transition-all text-left ${
                        active
                          ? 'bg-rose-palo/15 border-rose-palo/40 shadow-md'
                          : 'bg-white border-rose-border hover:bg-rose-muted'
                      }`}
                    >
                      {active && <CheckCircle2 size={12} className="absolute top-1 right-1 text-rose-palo-dark" />}
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${active ? 'bg-rose-palo text-white' : 'bg-rose-muted text-rose-400'}`}>
                        <Scissors size={10} />
                      </div>
                      <span className="flex-1 text-[10px] font-black text-rose-900 uppercase truncate leading-tight">{b.name}</span>
                    </button>
                  );
                })}
                {barbers.length === 0 && <div className="col-span-2 text-center p-6 text-rose-400 text-[10px] font-black uppercase">Sin estilistas activos</div>}
              </div>
              <div className="p-3 border-t bg-rose-muted/20">
                <button onClick={onToggleBarberModal} className="w-full bg-rose-palo hover:bg-rose-palo-dark text-white py-3 rounded-xl font-black uppercase text-[10px] transition-all active:scale-95 shadow-lg">
                  Listo ({selectedBarbers.length})
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1 border-t border-rose-border/50 pt-2">
          <div className="flex justify-between text-rose-400 text-[8px] sm:text-[9px] font-black uppercase">
            <span>Subtotal</span>
            <span className="font-mono text-[10px] sm:text-xs">${subtotal.toFixed(2)}</span>
          </div>
          {totalDiscount > 0 && (
            <div className="flex justify-between text-rose-palo-dark text-[8px] sm:text-[9px] font-black uppercase">
              <span>Descuentos</span>
              <span className="font-mono text-[10px] sm:text-xs">-${totalDiscount.toFixed(2)}</span>
            </div>
          )}
          <div className="flex justify-between text-rose-900 text-2xl sm:text-3xl font-black tracking-tighter pt-1">
            <span>Total</span>
            <span className="font-mono">${rawTotal.toFixed(2)}</span>
          </div>
        </div>

        {payments.length > 0 && (
          <div className="bg-rose-muted/50 rounded-xl p-1.5 sm:p-2 space-y-1 max-h-20 sm:max-h-24 overflow-y-auto">
            {payments.map((p, idx) => (
              <div key={idx} className="flex justify-between items-center text-[9px] sm:text-[10px] font-black uppercase text-rose-500">
                <span className="flex items-center gap-1">
                  {p.method === 'cash' && <DollarSign size={9} className="sm:size-[10px]" />}
                  {p.method === 'card' && <CreditCard size={9} className="sm:size-[10px]" />}
                  {p.method === 'transfer' && <ArrowRightLeft size={9} className="sm:size-[10px]" />}
                  {p.method === 'bitcoin' && <Bitcoin size={9} className="sm:size-[10px]" />}
                  {paymentMethods[p.method]}
                  <button onClick={() => onRemovePayment(idx)} className="text-rose-300 hover:text-destructive ml-1.5 sm:ml-2 p-0.5 sm:p-1 bg-white/50 rounded-full">
                    <Trash2 size={8} className="sm:size-[10px]" />
                  </button>
                </span>
                <span className="font-mono">${p.amount.toFixed(2)}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
          {Object.entries(paymentMethods).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onPaymentMethodChange(key as PaymentMethod)}
              className={`p-1.5 sm:p-2 rounded-xl text-[7px] sm:text-[8px] font-black uppercase border transition-all flex flex-col items-center gap-0.5 sm:gap-1 ${
                currentPaymentMethod === key
                  ? 'bg-rose-palo text-white border-rose-palo scale-105 z-10 shadow-lg'
                  : 'bg-rose-muted text-rose-500 border-rose-border'
              }`}
            >
              {key === 'cash' && <DollarSign size={10} className="sm:size-[12px]" />}
              {key === 'card' && <CreditCard size={10} className="sm:size-[12px]" />}
              {key === 'transfer' && <ArrowRightLeft size={10} className="sm:size-[12px]" />}
              {key === 'bitcoin' && <Bitcoin size={10} className="sm:size-[12px]" />}
              {label}
            </button>
          ))}
        </div>

        <div className="relative flex gap-1.5 sm:gap-2">
          <div className="relative flex-1 group">
            <span className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-400 font-mono font-black text-base sm:text-lg group-focus-within:text-rose-palo">$</span>
            <input
              ref={amountInputRef}
              type="number"
              value={amountInput}
              onChange={(e) => onAmountInputChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') onAddPayment(); }}
              placeholder={remainingBalance.toFixed(2)}
              className="w-full bg-rose-muted border border-rose-border rounded-xl py-2 sm:py-3 pl-7 sm:pl-8 pr-2 sm:pr-3 text-rose-900 font-mono font-black text-base sm:text-xl outline-none focus:border-rose-palo text-right shadow-sm"
            />
          </div>
          <button onClick={onAddPayment} className="bg-rose-muted hover:bg-rose-palo/20 text-rose-500 p-2 sm:p-3 rounded-xl border border-rose-border shadow-sm active:scale-95">
            <Plus size={16} className="sm:size-[18px]" />
          </button>
        </div>

        <div className="flex justify-between items-center border-b border-rose-border pb-1">
          <span className="text-rose-400 text-[8px] sm:text-[9px] font-black uppercase tracking-widest">CAMBIO</span>
          <span className="text-rose-palo-dark text-base sm:text-xl font-black font-mono tracking-tighter">${displayChange.toFixed(2)}</span>
        </div>

        <div className="relative">
          <button
            onClick={onCheckout}
            className="w-full bg-rose-palo hover:bg-rose-palo-dark text-white py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg tracking-widest shadow-lg transition-all active:scale-95 uppercase border-b-4 border-rose-palo-dark active:border-b-0"
          >
            COBRAR
          </button>
        </div>
      </div>
    </div>
    </>
  );
}
