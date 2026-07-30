import React, { useEffect, useState } from 'react';
import {
  ShoppingCart, X, Store, History, DollarSign, LogOut,
  Check, UserPlus, Search, ChevronRight, Star, CheckCircle2,
  User, Zap,
} from 'lucide-react';
import { usePOSStore } from '../hooks/usePOSStore';
import { ProductGrid } from './pos/ProductGrid';
import { CartSidebar } from './pos/CartSidebar';
import { POSModals } from './pos/POSModals';
import { useDragScroll } from '../hooks/useDragScroll';

interface POSProps {
  navigateView?: (view: string) => void;
}

export const POS = ({ navigateView }: POSProps) => {
  const store = usePOSStore();
  const { catalog } = store;

  const [showCart, setShowCart] = useState(false);
  const chipScroll = useDragScroll();

  return (
    <div className="flex h-full bg-rose-bg text-rose-900 overflow-hidden font-inter">
      <div className="flex-1 flex flex-col border-r border-rose-border min-w-0">
        <div className="p-4 border-b border-rose-border bg-white/60 flex justify-between items-center shrink-0">
          <div className="flex bg-rose-muted p-1 rounded-xl border border-rose-border">
            <button
              onClick={() => { store.setPosMode('ticket'); store.setUsePoints(false); store.setSelectedDirectClient(''); store.setClientSearch(''); }}
              className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${store.posMode === 'ticket' ? 'bg-rose-palo text-white shadow-lg' : 'text-rose-400 hover:text-rose-700'}`}
            >
              Tickets
            </button>
            <button
              onClick={() => { store.setPosMode('direct'); store.setUsePoints(false); store.setSelectedTicket(''); }}
              className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${store.posMode === 'direct' ? 'bg-rose-palo text-white shadow-lg' : 'text-rose-400 hover:text-rose-700'}`}
            >
              Directa
            </button>
          </div>

          {store.currentUser?.role === 'admin' && store.branches.length > 1 && (
            <div className="flex items-center gap-2 bg-white border border-rose-border px-3 py-1.5 rounded-xl ml-4">
              <Store size={14} className="text-rose-400" />
              <select
                value={store.currentBranchId}
                onChange={(e) => store.setSelectedBranchId(e.target.value)}
                className="bg-transparent text-[10px] font-black uppercase text-rose-900 outline-none cursor-pointer"
              >
                {store.branches.map((b: any) => (
                  <option key={b.id} value={b.id} className="bg-white">{b.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            {store.activePromotion && (
              <div className="flex items-center gap-2 bg-rose-palo text-white border border-rose-palo-dark px-4 py-2 rounded-xl animate-pulse mr-2 shadow-lg">
                <Zap size={14} className="fill-white" />
                <span className="text-[10px] font-black uppercase tracking-widest">ACTIVA: {store.activePromotion.name}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <button onClick={() => navigateView?.('sales_pos')} className="p-2.5 bg-white hover:bg-rose-muted text-rose-400 hover:text-rose-palo-dark rounded-xl border border-rose-border transition-all">
                <History size={18} />
              </button>
              <button onClick={() => navigateView?.('cash_cut')} className="p-2.5 bg-white hover:bg-rose-muted text-rose-400 hover:text-rose-palo-dark rounded-xl border border-rose-border transition-all">
                <DollarSign size={18} />
              </button>
            </div>
          </div>
        </div>

        {store.posMode === 'direct' ? (
          <DirectClientSection store={store} />
        ) : (
          <TicketSection store={store} />
        )}

        {store.categoryChips.length > 0 && (
          <div className="px-4 lg:px-6 py-1.5 shrink-0 bg-rose-muted/30 border-t border-rose-border/30">
            <div className="flex gap-2 overflow-x-auto hide-scrollbar" ref={chipScroll.ref} {...chipScroll.props}>
              <button
                onClick={() => store.setSelectedCategory(null)}
                className={`shrink-0 px-4 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all ${
                  !store.selectedCategory
                    ? 'bg-rose-palo text-white border-rose-palo shadow-md'
                    : 'bg-white text-rose-500 border-rose-border hover:bg-rose-palo hover:text-white hover:border-rose-palo'
                }`}
              >
                TODOS
              </button>
              {store.categoryChips.map(cat => (
                <button
                  key={cat}
                  onClick={() => store.setSelectedCategory(cat === store.selectedCategory ? null : cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-widest transition-all hover:bg-rose-palo hover:text-white hover:border-rose-palo ${
                    cat === store.selectedCategory
                      ? 'bg-rose-palo text-white border-rose-palo shadow-md'
                      : 'bg-white text-rose-500 border-rose-border'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-h-0">
          <ProductGrid
            catalog={store.filteredCatalog}
            catalogSearch={store.catalogSearch}
            onSearchChange={store.setCatalogSearch}
            onAddToCart={store.addToCart}
            onShowCombo={store.setShowComboModal}
            getStock={store.getStock}
          />
        </div>
      </div>

      <CartSidebar
        cart={store.cart}
        selectedBarber={store.selectedBarber}
        barbers={store.barbers}
        onBarberChange={store.setSelectedBarber}
        onRemoveFromCart={store.removeFromCart}
        onRemovePayment={store.removePayment}
        onClearCart={store.clearCart}
        payments={store.payments}
        currentPaymentMethod={store.currentPaymentMethod}
        onPaymentMethodChange={store.setCurrentPaymentMethod}
        amountInput={store.amountInput}
        onAmountInputChange={store.setAmountInput}
        onAddPayment={store.addPayment}
        onCheckout={store.handleCheckout}
        subtotal={store.subtotal}
        totalDiscount={store.totalDiscount}
        rawTotal={store.rawTotal}
        totalPaid={store.totalPaid}
        remainingBalance={store.remainingBalance}
        displayChange={store.displayChange}
        errorMsg={store.errorMsg}
        usePoints={store.usePoints}
        activeClient={store.activeClient}
        activePromotion={store.activePromotion}
        amountInputRef={store.amountInputRef}
        showCart={showCart}
        onToggleCart={() => setShowCart(!showCart)}
      />

      <POSModals
        showReceiptModal={store.showReceiptModal}
        currentSale={store.currentSale}
        config={store.config}
        catalog={catalog}
        receiptEmail={store.receiptEmail}
        isSendingEmail={store.isSendingEmail}
        onCloseReceipt={() => store.setShowReceiptModal(false)}
        onFinalizeReceipt={store.finalizeReceipt}
        onPrintReceipt={() => {}}
        onEmailChange={store.setReceiptEmail}
        onSendEmail={store.handleSendEmail}
        showAddClientModal={store.showAddClientModal}
        onCloseAddClient={() => { store.setShowAddClientModal(false); store.setNewClientReferrerSearch(''); store.setNewClientSelectedReferrerId(undefined); }}
        newClientName={store.newClientName}
        newClientPhone={store.newClientPhone}
        newClientEmail={store.newClientEmail}
        newClientBirth={store.newClientBirth}
        newClientNotes={store.newClientNotes}
        newClientReferrerSearch={store.newClientReferrerSearch}
        filteredReferrers={store.filteredReferrersForNewClient}
        clients={store.clients}
        onNewClientNameChange={store.setNewClientName}
        onNewClientPhoneChange={store.setNewClientPhone}
        onNewClientEmailChange={store.setNewClientEmail}
        onNewClientBirthChange={store.setNewClientBirth}
        onNewClientNotesChange={store.setNewClientNotes}
        onNewClientReferrerSearchChange={store.setNewClientReferrerSearch}
        onNewClientSelectReferrer={(id) => { store.setNewClientSelectedReferrerId(id); }}
        onAddClientSubmit={store.handleAddAndSelectClient}
        showComboModal={store.showComboModal}
        onCloseCombo={() => store.setShowComboModal(null)}
        onAddComboToCart={store.addToCart}
        showOpenSessionModal={store.showOpenSessionModal}
        openingAmount={store.openingAmount}
        onOpeningAmountChange={store.setOpeningAmount}
        onOpenSession={async (e) => {
          e.preventDefault();
          if (!store.openingAmount || parseFloat(store.openingAmount) <= 0) {
            store.showToast?.('warning', 'Falta monto', 'Ingrese un monto de apertura válido');
            return;
          }
          const success = await store.openCashSession(parseFloat(store.openingAmount), store.currentBranchId);
          if (success) {
            store.setShowOpenSessionModal(false);
          } else {
            store.showToast?.('error', 'Error', 'No se pudo abrir la sesión de caja');
          }
        }}
        onCloseOpenSession={() => {
          store.setOpeningAmount('');
          store.setShowOpenSessionModal(false);
        }}
      />
      {/* ESPACIO VACÍO PARA EVITAR QUE EL POS SE ROMPA */}
      <div id="modals-container" />


      <button onClick={() => setShowCart(true)}
        className="lg:hidden fixed bottom-6 right-6 z-30 bg-rose-palo text-white p-4 rounded-full shadow-2xl active:scale-90 transition-all border-4 border-white hover:bg-rose-palo-dark"
      >
        <div className="relative">
          <ShoppingCart size={24} />
          {store.cart.length > 0 && (
            <div className="absolute -top-3 -right-3 bg-destructive text-white text-[9px] font-black rounded-full w-5 h-5 flex items-center justify-center border-2 border-white">
              {store.cart.reduce((s, i) => s + i.quantity, 0)}
            </div>
          )}
        </div>
      </button>

      {store.activeClient && store.posMode === 'direct' && (
        <div className={`fixed bottom-4 left-4 flex items-center gap-2.5 px-4 py-2 rounded-[1.2rem] border transition-all shadow-lg z-30 animate-in slide-in-from-bottom-2 ${
          store.usePoints ? 'bg-rose-palo border-rose-palo-dark text-white' : 'bg-white border-rose-border text-rose-500'
        }`}>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <Star size={10} className={store.usePoints ? 'text-white' : 'text-rose-palo'} />
              <span className="text-[7px] font-black uppercase tracking-widest">Lealtad</span>
            </div>
            <span className="font-mono font-black text-[11px] leading-none mt-0.5 whitespace-nowrap">{store.activeClient.points || 0} PUNTOS</span>
          </div>
          <div className="h-5 w-px bg-rose-border mx-1"></div>
          {store.config?.loyalty?.enabled && (store.activeClient.points || 0) >= (store.config?.loyalty?.redemptionThreshold || 0) ? (
            <button onClick={() => store.setUsePoints(!store.usePoints)}
              className={`px-2.5 py-1 rounded-lg font-black text-[7px] uppercase tracking-widest transition-all ${
                store.usePoints ? 'bg-white text-rose-palo-dark' : 'bg-rose-palo-dark text-white shadow-md'
              }`}>
              {store.usePoints ? 'Cancelar' : '¡Premio!'}
            </button>
          ) : (
            <div className="text-[8px] font-black uppercase opacity-70 leading-tight tracking-tighter text-rose-400">
              Faltan <span className="text-rose-palo-dark">{(store.config?.loyalty?.redemptionThreshold || 0) - (store.activeClient.points || 0)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function DirectClientSection({ store }: { store: ReturnType<typeof usePOSStore> }) {
  return (
    <div className="p-3 lg:p-4 shrink-0 bg-rose-muted/30">
      <div className="flex flex-col md:flex-row gap-3 items-stretch">
        <div className="relative flex-1 w-full group">
          <User className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${store.selectedDirectClient ? 'text-emerald-500' : 'text-rose-palo'}`} size={18} />
          <input
            value={store.clientSearch}
            onChange={(e) => { store.setClientSearch(e.target.value); store.setSelectedDirectClient(''); store.setUsePoints(false); }}
            className={`w-full bg-white border rounded-2xl h-[48px] pl-12 pr-12 text-rose-900 font-bold outline-none shadow-sm transition-all text-sm ${
              store.selectedDirectClient ? 'border-emerald-400' : 'border-rose-border focus:border-rose-palo'
            }`}
            placeholder="BUSCAR CLIENTE..."
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {store.selectedDirectClient ? (
              <CheckCircle2 size={18} className="text-emerald-500 animate-in zoom-in" />
            ) : store.showAddClientButton ? (
              <button
                onClick={() => { store.setNewClientName(store.clientSearch); store.setShowAddClientModal(true); }}
                className="flex items-center gap-2 px-3 py-1.5 bg-rose-palo hover:bg-rose-palo-dark text-white rounded-xl shadow-lg transition-all animate-in slide-in-from-right-2"
              >
                <UserPlus size={14} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">Agregar</span>
              </button>
            ) : null}
            {store.clientSearch && (
              <button onClick={() => { store.setClientSearch(''); store.setSelectedDirectClient(''); store.setUsePoints(false); }} className="text-rose-400 hover:text-rose-700">
                <X size={14} />
              </button>
            )}
          </div>
          {store.clientSearch.length > 0 && !store.selectedDirectClient && store.filteredClients.length > 0 && (
            <div className="absolute top-full left-0 w-full bg-white border border-rose-border rounded-2xl mt-1 shadow-xl z-[150] max-h-56 overflow-y-auto">
              {store.filteredClients.map(c => (
                <button
                  key={c.id}
                  onClick={() => { store.setSelectedDirectClient(c.id); store.setClientSearch(c.name); }}
                  className="w-full p-4 text-left text-xs font-bold text-rose-900 hover:bg-rose-muted border-b border-rose-border last:border-0 flex justify-between items-center"
                >
                  <div>
                    <div className="font-black uppercase">{c.name}</div>
                    <div className="text-[10px] text-rose-400 font-mono mt-0.5">{c.phone}</div>
                  </div>
                  <ChevronRight size={16} />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketSection({ store }: { store: ReturnType<typeof usePOSStore> }) {
  return (
    <div className="p-3 lg:p-4 shrink-0 bg-rose-muted/30">
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {store.activeTickets.length === 0 ? (
          <div className="text-rose-400 italic text-[10px] font-bold uppercase tracking-widest p-1">
            No hay tickets activos...
          </div>
        ) : (
          store.activeTickets.map(t => (
            <button
              key={t.id}
              onClick={() => store.handleTicketSelect(t.id)}
              className={`min-w-[140px] p-4 rounded-2xl border text-left transition-all relative ${
                store.selectedTicket === t.id
                  ? 'bg-rose-palo/10 border-rose-palo ring-2 ring-rose-palo/20 shadow-xl'
                  : 'bg-white border-rose-border hover:border-rose-palo-light shadow-sm hover:shadow-md'
              }`}
            >
              <div className={`font-black text-2xl tracking-tighter mb-1 ${store.selectedTicket === t.id ? 'text-rose-palo-dark' : 'text-rose-900'}`}>
                {t.fullCode}
              </div>
              <div className={`text-[10px] font-bold truncate uppercase ${store.selectedTicket === t.id ? 'text-rose-500' : 'text-rose-400'}`}>
                {t.clientName}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
