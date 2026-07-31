import React, { useState, useEffect, useMemo } from 'react';
import { formatDateES, formatTimeES } from '../utils/dates';

import { createPortal } from 'react-dom';
import { useBarber } from '../context/BarberContext';
import { useSales } from '../context/SalesContext';
import { useClients } from '../context/ClientsContext';
import { useStaff } from '../context/StaffContext';
import { useCatalog } from '../context/CatalogContext';
import { useConfigCtx } from '../context/ConfigContext';
import { TicketContent } from './TicketContent';
import { printReceipt } from '../services/printService';
import { Search, Calendar, User, DollarSign, Printer, ArrowLeft, Filter, Trash2, Eye, X, Mail, Receipt, CheckCircle2, RefreshCw, ShoppingCart } from 'lucide-react';
import { Sale, PaymentMethod } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

interface SalesHistoryProps {
    navigateView?: (view: string) => void;
    hideSummary?: boolean;
}

const paymentMethods: Partial<Record<PaymentMethod, string>> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transf.',
    bitcoin: 'Bitcoin'
};

export const SalesHistory = ({ navigateView, hideSummary = false }: SalesHistoryProps) => {
    const { sales } = useSales();
    const { clients } = useClients();
    const { users } = useStaff();
    const { catalog } = useCatalog();
    const { config } = useConfigCtx();
    const { sendInvoiceByEmail, showToast } = useBarber();
    const scroll = useDragScroll();
    const [search, setSearch] = useState('');

    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 3);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [receiptEmail, setReceiptEmail] = useState('');
    const [isSending, setIsSending] = useState(false);

    useEffect(() => {
        if (selectedSale) {
            const client = clients.find(c => c.id === selectedSale.clientId);
            setReceiptEmail(client?.email || '');
        }
    }, [selectedSale, clients]);

    const filteredSales = useMemo(() => {
        const safeSales = sales || [];
        const safeSearch = (search || '').toLowerCase();

        return safeSales.filter(sale => {
            let saleDate = '';
            try {
                if (sale.timestamp) {
                    saleDate = new Date(sale.timestamp).toISOString().split('T')[0];
                }
            } catch (e) {
                console.warn("Invalid date for sale:", sale.id);
            }

            const client = clients.find(c => c.id === sale.clientId);
            const clientName = (client?.name || 'Venta Directa').toLowerCase();
            const ticketId = (sale.id || '').toLowerCase();

            const matchesSearch = clientName.includes(safeSearch) || ticketId.includes(safeSearch);
            const matchesRange = saleDate >= startDate && saleDate <= endDate;

            return matchesSearch && matchesRange;
        }).sort((a, b) => {
            const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
            const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
            return timeB - timeA;
        });
    }, [sales, clients, search, startDate, endDate]);

    const totalPeriod = filteredSales.reduce((acc, s) => acc + s.total, 0);

    const handlePrint = () => {
        printReceipt('printable-receipt');
    };

    const handleSendEmail = async () => {
        if (!receiptEmail || !selectedSale) {
            showToast('error', 'Faltan datos', 'Por favor ingresa un correo válido.');
            return;
        }
        setIsSending(true);
        const clientName = clients.find(c => c.id === selectedSale.clientId)?.name || "Cliente";
        const success = await sendInvoiceByEmail(selectedSale, clientName, receiptEmail);
        setIsSending(false);
        if (success) {
            showToast('success', 'Ticket Enviado', `¡El ticket ha sido enviado a ${receiptEmail} con éxito!`);
        } else {
            showToast('error', 'Error de Envío', 'Revisa la configuración del Webhook.');
        }
    };

    return (
        <div className="h-full flex flex-col bg-rose-bg p-[clamp(4px,1vmin,24px)] animate-in fade-in duration-300 font-inter overflow-hidden">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-[clamp(8px,2vmin,32px)] gap-[clamp(6px,1.5vmin,16px)] shrink-0">
                <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)]">
                    {hideSummary ? (
                        <button onClick={() => navigateView?.('pos')}
                            className="flex items-center gap-[clamp(4px,1vmin,8px)] bg-blue-600 hover:bg-blue-500 text-white px-[clamp(8px,2vmin,24px)] py-[clamp(4px,1vmin,12px)] rounded-[clamp(8px,2vmin,24px)] font-black text-[clamp(8px,1.5vmin,11px)] uppercase tracking-[0.1em] shadow-xl shadow-blue-900/20 active:scale-95 transition-all border-b-4 border-blue-800 active:border-b-0">
                            <ArrowLeft size={14} />
                            REGRESAR
                        </button>
                    ) : (
                        <button onClick={() => navigateView?.('menu')}
                            className="p-[clamp(4px,1vmin,12px)] bg-white hover:bg-rose-muted rounded-[clamp(8px,2vmin,24px)] border border-rose-border text-rose-500 hover:text-rose-900 transition-all shadow-lg active:scale-95">
                            <ArrowLeft size={16} />
                        </button>
                    )}
                    <div>
                        <h1 className="text-[clamp(16px,4vmin,28px)] font-black text-rose-900 uppercase tracking-tight">
                            {hideSummary ? 'Consulta de Tickets' : 'Reporte de Ventas'}
                        </h1>
                        <p className="text-rose-400 text-[clamp(7px,1.2vmin,10px)] font-bold uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)]">
                            {hideSummary ? 'Reimpresión y Auditoría' : 'Análisis financiero'}
                        </p>
                    </div>
                </div>

                <div className="flex flex-wrap gap-[clamp(4px,1vmin,12px)] w-full md:w-auto items-end">
                    <div className="relative flex-1 min-w-[clamp(80px,20vmin,160px)] md:w-[clamp(120px,25vmin,200px)]">
                        <label className="text-[clamp(6px,1vmin,9px)] font-black text-rose-400 uppercase block mb-[clamp(1px,0.3vmin,4px)] tracking-widest ml-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-[clamp(4px,1vmin,12px)] top-1/2 -translate-y-1/2 text-rose-500" size={11} />
                            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(6px,1.5vmin,12px)] py-[clamp(3px,0.8vmin,10px)] pl-[clamp(20px,5vmin,36px)] pr-[clamp(4px,1vmin,12px)] text-[clamp(9px,1.8vmin,12px)] text-rose-900 focus:border-blue-500 outline-none shadow-inner h-[clamp(28px,6vmin,40px)]" placeholder="Cliente o folio..." />
                        </div>
                    </div>
                    <div className="relative">
                        <label className="text-[clamp(6px,1vmin,9px)] font-black text-rose-400 uppercase block mb-[clamp(1px,0.3vmin,4px)] tracking-widest ml-1">Desde</label>
                        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-white border border-rose-border rounded-[clamp(6px,1.5vmin,12px)] py-[clamp(3px,0.8vmin,10px)] px-[clamp(4px,1vmin,12px)] text-[clamp(9px,1.8vmin,12px)] text-rose-900 focus:border-blue-500 outline-none font-mono h-[clamp(28px,6vmin,40px)]" />
                    </div>
                    <div className="relative">
                        <label className="text-[clamp(6px,1vmin,9px)] font-black text-rose-400 uppercase block mb-[clamp(1px,0.3vmin,4px)] tracking-widest ml-1">Hasta</label>
                        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-white border border-rose-border rounded-[clamp(6px,1.5vmin,12px)] py-[clamp(3px,0.8vmin,10px)] px-[clamp(4px,1vmin,12px)] text-[clamp(9px,1.8vmin,12px)] text-rose-900 focus:border-blue-500 outline-none font-mono h-[clamp(28px,6vmin,40px)]" />
                    </div>
                </div>
            </div>

            {!hideSummary && (
                <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,16px)] mb-[clamp(6px,1.5vmin,24px)] shrink-0 max-w-2xl">
                    <div className="bg-blue-600/10 border border-blue-500/20 p-[clamp(8px,2vmin,24px)] rounded-[clamp(12px,3vmin,32px)] shadow-xl transition-all">
                        <div className="text-[clamp(6px,1vmin,10px)] font-black text-blue-400 uppercase tracking-[0.2em] mb-[clamp(1px,0.3vmin,4px)]">Ventas Período</div>
                        <div className="text-[clamp(18px,4.5vmin,40px)] font-black text-rose-900 font-mono tracking-tighter">${totalPeriod.toFixed(2)}</div>
                    </div>
                    <div className="bg-white border border-rose-border p-[clamp(8px,2vmin,24px)] rounded-[clamp(12px,3vmin,32px)] shadow-xl transition-all">
                        <div className="text-[clamp(6px,1vmin,10px)] font-black text-rose-500 uppercase tracking-[0.2em] mb-[clamp(1px,0.3vmin,4px)]">Operaciones</div>
                        <div className="text-[clamp(18px,4.5vmin,40px)] font-black text-rose-900 font-mono tracking-tighter">{filteredSales.length}</div>
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden border border-rose-border rounded-[clamp(12px,3vmin,40px)] bg-white shadow-2xl">
                <div
                    ref={scroll.ref}
                    {...scroll.props}
                    className="flex-1 overflow-auto hide-scrollbar cursor-grab active:cursor-grabbing"
                >
                    <div className="min-w-[clamp(500px,80vmin,900px)]">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-rose-bg/90 backdrop-blur-md text-rose-400 font-black uppercase text-[clamp(7px,1.2vmin,10px)] border-b border-rose-border tracking-[0.3em] sticky top-0 z-10 shadow-sm">
                                <tr>
                                    <th className="p-[clamp(4px,1vmin,20px)] w-[clamp(60px,15vmin,120px)]">Fecha</th>
                                    <th className="p-[clamp(4px,1vmin,20px)]">Cliente</th>
                                    <th className="p-[clamp(4px,1vmin,20px)] hidden sm:table-cell">Estilista</th>
                                    <th className="p-[clamp(4px,1vmin,20px)] hidden md:table-cell">Items</th>
                                    <th className="p-[clamp(4px,1vmin,20px)] text-right">Monto</th>
                                    <th className="p-[clamp(4px,1vmin,20px)] w-[clamp(32px,8vmin,80px)] text-center">Ver</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-rose-border">
                                {filteredSales.length === 0 ? (
                                    <tr><td colSpan={6} className="p-[clamp(16px,4vmin,80px)] text-center text-rose-400 italic font-black uppercase tracking-[0.5em] opacity-20">Sin registros</td></tr>
                                ) : (
                                    filteredSales.map(sale => {
                                        const client = clients.find(c => c.id === sale.clientId);
                                        const barberIds = (sale.barberIds && sale.barberIds.length > 0 ? sale.barberIds : (sale.barberId ? [sale.barberId] : []));
                                        const barberNames = barberIds.map(id => users.find(u => u.id === id)?.name || '').filter(Boolean);
                                        const barberLabel = barberNames.length > 0 ? barberNames.join(' + ') : '---';
                                        return (
                                            <tr key={sale.id} className="hover:bg-rose-muted transition-colors group">
                                                <td className="p-[clamp(4px,1vmin,20px)] text-rose-500 font-mono text-[clamp(7px,1.2vmin,10px)]">
                                                    <div className="text-rose-900 font-black">{formatDateES(sale.timestamp)}</div>
                                                    <div className="hidden sm:block">{formatTimeES(sale.timestamp)}</div>
                                                </td>
                                                <td className="p-[clamp(4px,1vmin,20px)]">
                                                    <div className="font-black text-rose-900 text-[clamp(8px,1.5vmin,12px)] uppercase tracking-tight truncate max-w-[clamp(60px,15vmin,200px)]">{client?.name || 'Venta Directa'}</div>
                                                    <div className="text-[clamp(6px,1vmin,8px)] font-black text-rose-400 uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)]">Folio: #{(sale.id || '').split('-').slice(0,2).join('').toUpperCase()}</div>
                                                </td>
                                                <td className="p-[clamp(4px,1vmin,20px)] hidden sm:table-cell">
                                                    <span className="text-[clamp(7px,1.2vmin,10px)] text-rose-500 font-black uppercase bg-white px-[clamp(4px,1vmin,8px)] py-[clamp(1px,0.3vmin,4px)] rounded border border-rose-border">{barberLabel}</span>
                                                </td>
                                                <td className="p-[clamp(4px,1vmin,20px)] hidden md:table-cell">
                                                    <div className="text-[clamp(7px,1.2vmin,9px)] text-rose-500 truncate max-w-[clamp(60px,15vmin,200px)] uppercase font-bold leading-relaxed">{(sale.items || []).map(i => `${i.quantity || 1}x ${i.name || 'Item'}`).join(', ')}</div>
                                                </td>
                                                <td className="p-[clamp(4px,1vmin,20px)] text-right font-black text-emerald-500 font-mono text-[clamp(11px,2.5vmin,18px)] tracking-tighter">${Number(sale.total || 0).toFixed(2)}</td>
                                                <td className="p-[clamp(4px,1vmin,20px)] text-center">
                                                    <button onClick={() => setSelectedSale(sale)} className="p-[clamp(4px,1vmin,12px)] bg-rose-muted hover:bg-blue-600 text-rose-500 hover:text-white rounded-[clamp(6px,1.5vmin,16px)] transition-all shadow-lg active:scale-95 group-hover:scale-110" title="Ver Ticket">
                                                        <Eye size={11} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {selectedSale && (
                <div className="fixed inset-0 z-[600] bg-rose-bg/95 backdrop-blur-xl flex items-center justify-center p-[clamp(4px,1vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-[min(85vmin,320px)] shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[clamp(12px,3vmin,40px)] p-[clamp(8px,2vmin,32px)] animate-in zoom-in duration-200 max-h-[100dvh] overflow-y-auto">

                        <div className="flex justify-between items-center mb-[clamp(8px,2vmin,24px)]">
                            <div className="flex items-center gap-[clamp(4px,1vmin,12px)] min-w-0">
                                <div className="bg-blue-600/20 p-[clamp(4px,1vmin,8px)] rounded-[clamp(6px,1.5vmin,16px)] text-blue-500 shrink-0"><Receipt size={14} /></div>
                                <h3 className="text-[clamp(12px,3vmin,20px)] font-black text-rose-900 uppercase tracking-tight truncate">Copia de Ticket</h3>
                            </div>
                            <button onClick={() => setSelectedSale(null)} className="text-rose-400 hover:text-rose-900 shrink-0"><X size={18} /></button>
                        </div>

                        <div className="transform hover:scale-[1.02] transition-transform mb-[clamp(8px,2vmin,32px)]">
                            <TicketContent sale={selectedSale} config={config} catalog={catalog} />
                        </div>

                        <div className="space-y-[clamp(4px,1vmin,16px)] no-print">
                            <button onClick={() => printReceipt('printable-receipt')}
                                className="w-full bg-white text-rose-900 py-[clamp(6px,1.5vmin,16px)] font-black rounded-[clamp(8px,2vmin,24px)] uppercase text-[clamp(8px,1.5vmin,12px)] flex items-center justify-center gap-[clamp(4px,1vmin,12px)] shadow-xl active:scale-95 transition-all border-b-4 border-rose-border active:border-b-0 hover:bg-rose-muted">
                                <Printer size={14} /> Reimprimir
                            </button>

                            <div className={`p-[clamp(4px,1vmin,16px)] rounded-[clamp(12px,3vmin,32px)] border space-y-[clamp(4px,1vmin,12px)] shadow-lg transition-colors ${receiptEmail ? 'bg-emerald-50 border-emerald-100' : 'bg-destructive/10 border-destructive/20'}`}>
                                <label className={`text-[clamp(7px,1.2vmin,9px)] font-black uppercase tracking-widest ml-1 ${receiptEmail ? 'text-emerald-600' : 'text-destructive'}`}>
                                    {receiptEmail ? 'Reenviar' : 'Sin Correo'}
                                </label>
                                <div className="flex gap-[clamp(4px,1vmin,8px)]">
                                    <div className="relative flex-1">
                                        <Mail className={`absolute left-[clamp(4px,1vmin,12px)] top-1/2 -translate-y-1/2 ${receiptEmail ? 'text-emerald-300' : 'text-destructive/50'}`} size={11} />
                                        <input type="email" value={receiptEmail} onChange={(e) => setReceiptEmail(e.target.value)} placeholder="cliente@correo.com" className={`w-full border rounded-[clamp(6px,1.5vmin,16px)] py-[clamp(4px,1vmin,10px)] pl-[clamp(20px,5vmin,36px)] pr-[clamp(4px,1vmin,8px)] text-[clamp(9px,1.8vmin,12px)] font-bold outline-none focus:border-blue-300 transition-all h-[clamp(28px,6vmin,40px)] ${receiptEmail ? 'bg-white border-emerald-200 text-emerald-900 focus:border-emerald-500' : 'bg-white border-destructive/30 text-destructive focus:border-destructive'}`} />
                                    </div>
                                    <button onClick={handleSendEmail} disabled={isSending} className={`p-[clamp(4px,1vmin,10px)] rounded-[clamp(6px,1.5vmin,16px)] shadow-lg transition-all active:scale-95 ${isSending ? 'bg-rose-muted text-rose-500' : 'bg-blue-600 text-white hover:bg-blue-500'}`}>
                                        {isSending ? <RefreshCw className="animate-spin" size={14} /> : <Mail size={14} />}
                                    </button>
                                </div>
                            </div>

                            <button onClick={() => setSelectedSale(null)} className="w-full bg-rose-muted hover:bg-rose-muted text-rose-900 py-[clamp(6px,1.5vmin,16px)] rounded-[clamp(8px,2vmin,24px)] font-black uppercase text-[clamp(8px,1.5vmin,12px)] tracking-widest transition-colors shadow-lg active:scale-95">
                                Finalizar
                            </button>
                        </div>
                    </div>

                    {createPortal(
                        <div id="printable-receipt" className="print-area hidden">
                            <TicketContent sale={selectedSale} config={config} catalog={catalog} />
                        </div>,
                        document.body
                    )}

                </div>
            )}

        </div>
    );
};
