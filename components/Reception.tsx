import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBarber } from '../context/BarberContext';
import { TurnTicketContent } from './TurnTicketContent';
import { printReceipt } from '../services/printService';
import { Scissors, UserPlus, User, Search, ArrowRight, ArrowUp, Printer, Clock, CheckCircle, Users, AlertCircle, Mail, DollarSign, LogOut, Gift, UserCheck } from 'lucide-react';
import { TicketType, Ticket, User as UserType, Client } from '../types';
import { formatTimeES } from '../utils/dates';
import { useDragScroll } from '../hooks/useDragScroll';

interface WaitingTicketItemProps {
  ticket: Ticket;
  barbers: UserType[];
  onAssign: (ticketId: string, barberId: string, chair: string) => void;
}

const WaitingTicketItem: React.FC<WaitingTicketItemProps> = ({ ticket, barbers, onAssign }) => {
  const [localBarber, setLocalBarber] = useState('');
  const [localChair, setLocalChair] = useState('1');

  return (
    <div className="bg-white border border-rose-border rounded-lg p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 shadow-sm hover:border-rose-palo transition-colors">
      <div className="text-center border-b border-rose-border pb-1 sm:pb-2">
        <div className="text-sm sm:text-base lg:text-lg font-black text-rose-900 tracking-tighter">{ticket.fullCode}</div>
        <div className="font-bold text-rose-700 text-[10px] sm:text-xs truncate w-full" title={ticket.clientName}>{ticket.clientName}</div>
        <div className="text-[9px] sm:text-[10px] text-rose-400 mt-0.5 flex items-center justify-center gap-1"><Clock size={8} /> {formatTimeES(ticket.createdAt)}</div>
      </div>
      <div className="flex flex-col gap-1.5 sm:gap-2">
        <select className={`w-full bg-rose-muted text-rose-900 text-[10px] sm:text-xs p-1.5 sm:p-2 rounded border outline-none focus:border-rose-palo ${!localBarber ? 'border-rose-border' : 'border-rose-palo'}`} onChange={(e) => setLocalBarber(e.target.value)} value={localBarber}>
          <option value="" disabled hidden>Estilista...</option>
          {barbers.map(b => <option key={b.id} value={b.id}>{b.name || 'Estilista'}</option>)}
        </select>
        <div className="flex gap-1.5 sm:gap-2">
          <input type="number" min="1" className="w-full bg-rose-muted text-rose-900 text-[10px] sm:text-xs p-1.5 sm:p-2 text-center rounded border border-rose-border outline-none font-bold" placeholder="Silla" value={localChair} onChange={(e) => { if (e.target.value === '' || parseInt(e.target.value) > 0) setLocalChair(e.target.value); }} />
          <button onClick={() => onAssign(ticket.id, localBarber, localChair)} className="bg-rose-palo hover:bg-rose-palo-dark text-white p-1.5 sm:p-2 rounded shadow-sm"><ArrowRight size={10} /></button>
        </div>
      </div>
    </div>
  );
};

interface ReceptionProps {
  navigateView?: (view: string) => void;
  currentView?: string;
}

export const Reception = ({ navigateView }: ReceptionProps) => {
  const { createTicket, clients, addClient, tickets, users, updateTicketStatus, currentUser, branches, config, logout, catalog, categories } = useBarber();
  const clientSearchScroll = useDragScroll();
  const queueScroll = useDragScroll();
  const [view, setView] = useState<'ticket' | 'newClient'>('ticket');
  const [mode, setMode] = useState<'checkin' | 'manage'>('checkin');

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [referrerSearch, setReferrerSearch] = useState('');
  const [selectedReferrerId, setSelectedReferrerId] = useState<string | undefined>(undefined);

  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [generatedTicket, setGeneratedTicket] = useState<Ticket | null>(null);
  const [notification, setNotification] = useState<{ type: 'error' | 'success', msg: string } | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);

  const currentBranchId = currentUser?.branchId || branches[0]?.id;
  const branchName = branches.find(b => b.id === currentBranchId)?.name;

  const waitingTickets = tickets.filter(t => t.status === 'waiting' && t.branchId === currentBranchId);
  const activeBarbers = users.filter(u => u.role === 'estilista' && u.active !== false && (!u.branchId || u.branchId === currentBranchId));

  const filteredClients = clientSearch.length > 0 ? clients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase())) : [];
  const suggestNewClient = clientSearch.length > 2 && filteredClients.length === 0 && !selectedClient;

  const filteredReferrers = filteredReferrersForNewClient(clients, referrerSearch);

  function filteredReferrersForNewClient(clients: Client[], search: string) {
    return search.length > 1 ? clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : [];
  }

  const showNotify = (type: 'error' | 'success', msg: string) => {
    setNotification({ type, msg });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleCreateTicket = async (type: TicketType) => {
    const clientName = selectedClient ? clients.find(c => c.id === selectedClient)?.name || "Cliente" : (clientSearch || "Visitante");
    const newTicket = await createTicket(type, clientName, selectedClient || undefined);
    if (newTicket) { setGeneratedTicket(newTicket); setShowTicketModal(true); }
    setSelectedCodes([]);
    setClientSearch(''); setSelectedClient(null);
  };

  const handleRegisterClient = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient = {
      id: crypto.randomUUID(),
      name,
      phone,
      email,
      visits: 1,
      birthDate: birthDate || undefined,
      referredBy: selectedReferrerId
    };
    addClient(newClient);
    if (selectedReferrerId && config.loyalty?.referralBonus) {
      showNotify('success', `Cliente creado! Puntos bono asignados al padrino.`);
    }
    setName(''); setPhone(''); setEmail(''); setBirthDate(''); setReferrerSearch(''); setSelectedReferrerId(undefined);
    setView('ticket');
    setSelectedClient(newClient.id);
    setClientSearch(newClient.name);
  };

  const handleCallTicket = (ticketId: string, assignedBarberId: string, assignedChair: string) => {
    if (!assignedBarberId) return showNotify('error', '⚠️ Falta Estilista.');
    if (!assignedChair || parseInt(assignedChair) < 1) return showNotify('error', '⚠️ Silla inválida.');
    updateTicketStatus(ticketId, 'serving', assignedBarberId, `Silla ${assignedChair}`);
    showNotify('success', 'Asignado.');
  };

  const handlePrint = () => {
    printReceipt('printable-receipt');
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 lg:p-6 max-w-7xl mx-auto h-full flex flex-col relative bg-rose-bg overflow-hidden">
      {notification && <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-4 sm:px-6 py-2 sm:py-3 rounded-full shadow-2xl z-50 flex items-center gap-2 font-bold border-2 text-[9px] sm:text-xs ${notification.type === 'error' ? 'bg-destructive/90 text-white border-destructive' : 'bg-emerald-500/90 text-white border-emerald-400'}`}>{notification.type === 'error' ? <AlertCircle size={10} /> : <CheckCircle size={10} />}{notification.msg}</div>}

      {currentUser?.role !== 'admin' && (
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 sm:mb-3 lg:mb-4 bg-white p-3 sm:p-4 rounded-xl border border-rose-border gap-2 sm:gap-0 shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="bg-rose-palo p-1.5 sm:p-2 rounded-lg"><User className="text-white" size={14} /></div>
            <div>
              <h1 className="text-sm sm:text-base lg:text-lg font-bold text-rose-900">Recepción</h1>
              <p className="text-[10px] sm:text-xs text-rose-400">Hola, {currentUser?.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end sm:justify-start">
            <div className="bg-rose-muted px-2 sm:px-3 py-0.5 sm:py-1 rounded text-[9px] sm:text-xs font-bold text-rose-500 border border-rose-border truncate max-w-[120px] sm:max-w-none">📍 {branchName}</div>
            {currentUser?.canDoPos && navigateView && (
              <button onClick={() => navigateView('pos')} className="bg-rose-palo hover:bg-rose-palo-dark text-white px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[9px] sm:text-xs font-bold flex items-center gap-0.5 sm:gap-1.5 transition-all shadow-sm shrink-0"><DollarSign size={10} /> Caja</button>
            )}
            <button onClick={logout} className="p-1.5 sm:p-2 bg-rose-muted hover:bg-destructive/10 text-rose-400 hover:text-destructive rounded-lg transition-colors" title="Salir"><LogOut size={10} /></button>
          </div>
        </div>
      )}

      {currentUser?.role === 'admin' && (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 sm:mb-3 lg:mb-4 border-b border-rose-border pb-2 sm:pb-3 lg:pb-4 gap-2 sm:gap-4 shrink-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-bold text-rose-900 flex items-center gap-2 sm:gap-3"><User className="text-rose-400" size={14} /> Recepción</h1>
          <div className="bg-rose-muted px-2 sm:px-3 py-0.5 sm:py-1 rounded-b-lg text-[9px] sm:text-xs font-bold text-rose-500 border border-t-0 border-rose-border shadow-sm">📍 {branchName}</div>
        </div>
      )}

      <div className="flex justify-center mb-2 sm:mb-3 lg:mb-4 shrink-0">
        <div className="flex bg-rose-muted rounded-lg p-1 shadow-sm border border-rose-border">
          <button onClick={() => setMode('checkin')} className={`px-5 sm:px-6 lg:px-10 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all text-[10px] sm:text-xs ${mode === 'checkin' ? 'bg-white text-rose-900 shadow border border-rose-border' : 'text-rose-500 hover:text-rose-700'}`}><Printer size={12} /> Nuevo Turno</button>
          <button onClick={() => setMode('manage')} className={`px-5 sm:px-6 lg:px-10 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-bold flex items-center justify-center gap-1.5 sm:gap-2 transition-all text-[10px] sm:text-xs ${mode === 'manage' ? 'bg-rose-palo text-white shadow' : 'text-rose-500 hover:text-rose-700'}`}><Clock size={12} /> Gestionar ({waitingTickets.length})</button>
        </div>
      </div>

      {mode === 'checkin' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-3 lg:gap-4 flex-1 overflow-y-auto pb-4 min-h-0">
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl border border-rose-border shadow-sm relative overflow-hidden">
            <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 relative z-10">
              <button onClick={() => setView('ticket')} className={`flex-1 py-2 sm:py-3 rounded-lg font-bold text-[9px] sm:text-xs ${view === 'ticket' ? 'bg-rose-muted text-rose-900 border border-rose-border' : 'bg-white text-rose-500 border border-rose-border/50'}`}>Cliente Existente</button>
              <button onClick={() => { if (clientSearch && !selectedClient) setName(clientSearch); setView('newClient'); }} className={`flex-1 py-2 sm:py-3 rounded-lg font-bold flex items-center justify-center gap-0.5 sm:gap-1.5 text-[9px] sm:text-xs ${view === 'newClient' ? 'bg-rose-muted text-rose-900 border border-rose-border' : suggestNewClient ? 'bg-rose-palo text-white animate-pulse' : 'bg-white text-rose-500 border border-rose-border/50'}`}>{suggestNewClient ? <><UserPlus size={10} /> Crear</> : 'Nuevo'}</button>
            </div>
            {view === 'ticket' ? (
              <div className="relative min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]">
                <label className="block text-[9px] sm:text-xs text-rose-400 mb-1 sm:mb-2 font-bold">Buscar Cliente</label>
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 text-rose-400" size={14} />
                  <input type="text" value={clientSearch} onChange={(e) => { setClientSearch(e.target.value); setSelectedClient(null); }} className="w-full bg-rose-muted border border-rose-border focus:border-rose-palo rounded-lg p-2 sm:p-3 lg:p-4 pl-9 sm:pl-11 lg:pl-12 text-rose-900 text-sm sm:text-base lg:text-lg outline-none" placeholder="Escribe el nombre..." autoFocus />
                  {selectedClient && <button onClick={() => { setClientSearch(''); setSelectedClient(null); }} className="absolute right-3 sm:right-4 top-3 sm:top-4 text-rose-400 text-sm">✕</button>}
                </div>
                <div ref={clientSearchScroll.ref} {...clientSearchScroll.props} className="mt-2 space-y-1 sm:space-y-2 max-h-[180px] sm:max-h-[200px] lg:max-h-[250px] overflow-y-auto pr-1 hide-scrollbar">
                  {filteredClients.map(client => (
                    <div key={client.id} onClick={() => { setSelectedClient(client.id); setClientSearch(client.name); }} className="p-2 sm:p-3 lg:p-4 bg-rose-muted/50 hover:bg-rose-muted cursor-pointer border border-rose-border/50 rounded-lg flex justify-between items-center">
                      <div><div className="font-bold text-rose-900 text-sm sm:text-base lg:text-lg">{client.name}</div><div className="text-[10px] sm:text-xs lg:text-sm text-rose-400">{client.phone} • {client.visits} visitas</div></div><ArrowRight className="text-rose-300" size={14} />
                    </div>
                  ))}
                  {suggestNewClient && <div className="text-center py-4 sm:py-6 lg:py-8 flex flex-col items-center text-rose-palo-dark animate-pulse"><ArrowUp className="animate-bounce" size={14} /><span className="font-bold text-[9px] sm:text-xs">Presiona crear arriba</span></div>}
                </div>
              </div>
            ) : (
              <form onSubmit={handleRegisterClient} className="space-y-2 sm:space-y-3 lg:space-y-4 py-2 sm:py-3 lg:py-4">
                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-rose-muted border border-rose-border rounded-lg p-2 sm:p-3 text-rose-900 text-sm" placeholder="Nombre completo" autoFocus />
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <input value={phone} onChange={e => /^\d*$/.test(e.target.value) && setPhone(e.target.value)} className="w-full bg-rose-muted border border-rose-border rounded-lg p-2 sm:p-3 text-rose-900 text-sm" type="tel" placeholder="Teléfono" />
                  <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-rose-muted border border-rose-border rounded-lg p-2 sm:p-3 text-rose-900 text-sm" type="email" placeholder="Email" />
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="text-[9px] sm:text-[10px] text-rose-400 uppercase block mb-0.5">Cumpleaños</label>
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-rose-muted border border-rose-border rounded-lg p-2 sm:p-3 text-rose-900 text-[10px] sm:text-xs" />
                  </div>
                  <div className="relative">
                    <label className="text-[9px] sm:text-[10px] text-rose-palo-dark uppercase block mb-0.5">Padrino</label>
                    <input value={referrerSearch} onChange={e => { setReferrerSearch(e.target.value); setSelectedReferrerId(undefined); }} className="w-full bg-rose-muted border border-rose-border rounded-lg p-2 sm:p-3 text-rose-900 text-[10px] sm:text-xs" placeholder="Buscar..." />
                    {selectedReferrerId && <CheckCircle size={10} />}
                    {referrerSearch && !selectedReferrerId && (
                      <div className="absolute top-full left-0 w-full bg-white border border-rose-border mt-1 rounded-lg z-50 max-h-28 sm:max-h-32 overflow-y-auto shadow-lg">
                        {filteredReferrers.map(c => (
                          <div key={c.id} onClick={() => { setSelectedReferrerId(c.id); setReferrerSearch(c.name); }} className="p-1.5 sm:p-2 hover:bg-rose-muted cursor-pointer text-[10px] sm:text-xs text-rose-900">{c.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="pt-1 sm:pt-2 flex gap-2 sm:gap-3">
                  <button type="button" onClick={() => setView('ticket')} className="flex-1 bg-rose-muted text-rose-700 font-bold py-2 sm:py-3 rounded-lg border border-rose-border text-[9px] sm:text-xs">Cancelar</button>
                  <button type="submit" className="flex-1 bg-rose-palo hover:bg-rose-palo-dark text-white font-bold py-2 sm:py-3 rounded-lg flex items-center justify-center gap-0.5 sm:gap-1.5 text-[9px] sm:text-xs"><UserPlus size={10} /> Guardar</button>
                </div>
              </form>
            )}
          </div>
          <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl border border-rose-border flex flex-col shadow-sm">
            <div className="mb-2 sm:mb-3 border-b border-rose-border pb-2 sm:pb-3">
              <h2 className="text-sm sm:text-base lg:text-lg font-bold text-rose-900 mb-0.5">Generar Turno</h2>
              <p className="text-rose-400 text-[9px] sm:text-xs truncate">Para: <span className="text-rose-900 font-bold text-sm sm:text-base">{selectedClient ? clients.find(c => c.id === selectedClient)?.name : (clientSearch || "Visitante")}</span></p>
            </div>
            <div className="flex-1 flex flex-col">
              <div className="text-[8px] sm:text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1 sm:mb-1.5">Servicios</div>
              <div className="grid grid-cols-3 gap-1.5 sm:gap-2 flex-1 content-start">
                {(categories || []).filter(c => c.name !== 'General').map(cat => {
                  const code = cat.name.replace(/[^a-zA-Z0-9]/g, '').substring(0, 2).toUpperCase() || 'SV';
                  const isSelected = selectedCodes.includes(code);
                  return (
                    <button key={cat.id || cat.name} onClick={() => {
                      if (isSelected) setSelectedCodes(selectedCodes.filter(c => c !== code));
                      else setSelectedCodes([...selectedCodes, code]);
                    }}
                      className={`rounded-lg p-2 sm:p-3 flex flex-col items-center justify-center border transition-all text-[9px] sm:text-[10px] lg:text-xs font-bold text-center leading-tight ${
                        isSelected
                          ? 'bg-rose-palo text-white border-rose-palo-dark shadow'
                          : 'bg-rose-muted text-rose-900 border-rose-border hover:border-rose-palo-dark'
                      }`}>
                      {cat.name.toUpperCase()}
                    </button>
                  );
                })}
              </div>
              {selectedCodes.length > 0 && (
                <button onClick={() => handleCreateTicket(selectedCodes.join('+'))}
                  className="mt-2 sm:mt-3 w-full bg-rose-palo hover:bg-rose-palo-dark text-white py-2 sm:py-2.5 rounded-lg font-bold text-[10px] sm:text-xs flex items-center justify-center gap-2 shadow transition-all active:scale-95">
                  Generar Turno {selectedCodes.join('+')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === 'manage' && (
        <div className="bg-white rounded-xl border border-rose-border flex-1 overflow-hidden flex flex-col shadow-sm min-h-0">
          <div className="p-2 sm:p-3 lg:p-4 bg-rose-muted/50 border-b border-rose-border flex justify-between items-center shrink-0">
            <h2 className="text-[10px] sm:text-xs lg:text-lg font-bold text-rose-900 flex items-center gap-0.5 sm:gap-1.5"><Clock size={10} /> Cola de Espera</h2>
            <span className="text-rose-400 text-[9px] sm:text-xs bg-rose-muted px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">{waitingTickets.length} Personas</span>
          </div>
          <div ref={queueScroll.ref} {...queueScroll.props} className="flex-1 overflow-y-auto p-2 sm:p-3 lg:p-4 hide-scrollbar">
            {waitingTickets.length === 0 ? <div className="h-full flex flex-col items-center justify-center text-rose-400 opacity-50"><Users size={20} /><p className="text-[10px] sm:text-xs lg:text-lg font-medium">No hay clientes en espera</p></div> : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">{waitingTickets.map(ticket => <WaitingTicketItem key={ticket.id} ticket={ticket} barbers={activeBarbers} onAssign={handleCallTicket} />)}</div>
            )}
          </div>
        </div>
      )}

      {showTicketModal && generatedTicket && (
        <div className="fixed inset-0 z-[100] bg-rose-bg/90 backdrop-blur-sm flex items-center justify-center p-[clamp(4px,1vmin,16px)]">
          <div className="bg-white text-rose-900 w-full max-w-[min(85vmin,320px)] shadow-2xl transform relative rounded-[clamp(8px,1.5vmin,16px)]">
            <div className="flex flex-col items-center">
              <TurnTicketContent ticket={generatedTicket} config={config} />
            </div>
            <div className="p-[clamp(6px,1.5vmin,16px)] pt-0 flex flex-col gap-[clamp(4px,1vmin,8px)] no-print">
              <button onClick={() => printReceipt('printable-receipt')} className="w-full bg-rose-palo text-white font-bold py-[clamp(6px,1.5vmin,12px)] rounded-lg flex items-center justify-center gap-2 text-[clamp(9px,2vmin,13px)]">
                <Printer size={14} /> IMPRIMIR
              </button>
              <button onClick={() => setShowTicketModal(false)} className="w-full border-2 border-rose-border text-rose-500 font-bold py-[clamp(6px,1.5vmin,12px)] rounded-lg text-[clamp(9px,2vmin,13px)]">CERRAR</button>
            </div>
            {createPortal(
              <div id="printable-receipt" className="print-area hidden">
                <TurnTicketContent ticket={generatedTicket} config={config} />
              </div>,
              document.body
            )}
          </div>
        </div>
      )}
    </div>
  );
};
