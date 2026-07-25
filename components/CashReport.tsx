import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useBarber } from '../context/BarberContext';
import { useSales } from '../context/SalesContext';
import { useCatalog } from '../context/CatalogContext';
import { useConfigCtx } from '../context/ConfigContext';
import { CashReportContent } from './CashReportContent';
import { printReceipt } from '../services/printService';
import {
    DollarSign, CreditCard, ArrowRightLeft, Printer, Mail, Bitcoin, Lock,
    TrendingUp, Clock, ShieldCheck, Smartphone, BarChart3, Scissors, Package, Layers, Receipt, Power, ArrowLeft,
    History, Calendar, CheckCircle2, ChevronRight, Eye, AlertTriangle, X
} from 'lucide-react';
import { formatTimeES, formatDateTimeES } from '../utils/dates';
import { CashClosure } from '../types';

interface CashReportProps {
    navigateView?: (view: string) => void;
}

export const CashReport = ({ navigateView }: CashReportProps) => {
    const { sales } = useSales();
    const { catalog } = useCatalog();
    const { config } = useConfigCtx();
    const { cashSession, cashClosures, closeCashSession, currentUser } = useBarber();

    const [tab, setTab] = useState<'current' | 'history'>('current');
    const [viewingClosureId, setViewingClosureId] = useState<string | null>(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [filterDate, setFilterDate] = useState('');

    const filteredClosures = useMemo(() => {
        if (!filterDate) return cashClosures;
        return cashClosures.filter(c => {
            if (!c.closedAt) return false;
            const d = c.closedAt.split('T')[0].split(' ')[0];
            return d === filterDate;
        });
    }, [cashClosures, filterDate]);

    const stats = useMemo(() => {
        const computeReport = (session: { branchId: string, openedAt: string, openingAmount: number, openedBy: string }) => {
            const sessionSales = sales.filter(s =>
                s.branchId === session.branchId &&
                new Date(s.timestamp) >= new Date(session.openedAt)
            );
            let cash = 0, card = 0, transfer = 0, bitcoin = 0;
            let servicesTotal = 0, productsTotal = 0, combosTotal = 0;
            let servicesCount = 0, productsCount = 0, combosCount = 0;

            sessionSales.forEach(s => {
                const totalPaid = s.payments.reduce((sum, p) => sum + p.amount, 0);
                const change = Math.max(0, totalPaid - s.total);
                s.payments.forEach(p => {
                    if (p.method === 'cash') cash += (p.amount - change);
                    if (p.method === 'card') card += p.amount;
                    if (p.method === 'transfer') transfer += p.amount;
                    if (p.method === 'bitcoin') bitcoin += p.amount;
                });

                s.items.forEach(item => {
                    const cat = catalog.find(c => c.id === item.itemId);
                    if (cat?.type === 'service') {
                        servicesCount += item.quantity;
                        servicesTotal += (item.price * item.quantity);
                    } else if (cat?.type === 'product') {
                        productsCount += item.quantity;
                        productsTotal += (item.price * item.quantity);
                    } else if (cat?.type === 'combo') {
                        combosCount += item.quantity;
                        combosTotal += (item.price * item.quantity);
                    }
                });
            });

            return {
                branchId: session.branchId,
                openedAt: session.openedAt,
                openedBy: session.openedBy,
                opening: session.openingAmount,
                totalSales: sessionSales.reduce((sum, s) => sum + s.total, 0),
                cash, card, transfer, bitcoin,
                servicesTotal, productsTotal, combosTotal,
                servicesCount, productsCount, combosCount,
                count: sessionSales.length,
                totalInDrawer: session.openingAmount + cash,
            };
        };

        if (viewingClosureId) {
            const closure = cashClosures.find(c => c.id === viewingClosureId);
            if (!closure) return null;
            return {
                branchId: closure.branchId, openedAt: closure.openedAt, openedBy: closure.openedBy,
                opening: closure.openingAmount, totalSales: closure.totalSales,
                cash: closure.totalCash, card: closure.totalCard, transfer: closure.totalTransfer, bitcoin: closure.totalBitcoin,
                servicesTotal: closure.servicesTotal, productsTotal: closure.productsTotal, combosTotal: closure.combosTotal,
                servicesCount: 0, productsCount: 0, combosCount: 0,
                count: closure.operationsCount,
                totalInDrawer: closure.openingAmount + closure.totalCash,
            };
        }

        if (!cashSession) return null;
        return computeReport(cashSession);
    }, [cashSession, sales, catalog, viewingClosureId, cashClosures]);

    const handleExecuteClosure = () => {
        if (!stats) return;
        closeCashSession({
            branchId: stats.branchId, openedAt: stats.openedAt, openedBy: stats.openedBy,
            openingAmount: stats.opening, totalSales: stats.totalSales,
            totalCash: stats.cash, totalCard: stats.card, totalTransfer: stats.transfer, totalBitcoin: stats.bitcoin,
            servicesTotal: stats.servicesTotal, productsTotal: stats.productsTotal, combosTotal: stats.combosTotal,
            operationsCount: stats.count
        });
        setShowConfirmModal(false);
        if (navigateView) navigateView('pos');
    };

    if (tab === 'history' && !viewingClosureId) {
        return (
            <div className="h-full w-full bg-rose-bg flex flex-col p-[clamp(6px,1.5vmin,24px)] animate-in fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[clamp(8px,2vmin,32px)] gap-[clamp(4px,1vmin,16px)] shrink-0">
                    <div className="flex items-center gap-[clamp(8px,2vmin,24px)]">
                        <button onClick={() => navigateView && navigateView('pos')} className="flex items-center gap-2 bg-rose-muted hover:bg-rose-muted text-rose-900 px-[clamp(8px,2vmin,24px)] py-[clamp(6px,1.5vmin,12px)] rounded-xl sm:rounded-2xl font-black text-[clamp(9px,2vmin,10px)] uppercase tracking-widest transition-all"><ArrowLeft size={14} /> REGRESAR</button>
                        <div><h1 className="text-[clamp(16px,4vmin,24px)] font-black text-rose-900 uppercase tracking-tight">Auditoría</h1><p className="text-rose-400 text-[clamp(9px,2vmin,10px)] font-bold uppercase tracking-widest mt-0.5">Historial de Reportes Z</p></div>
                    </div>
                    <div className="flex bg-white p-1 rounded-xl border border-rose-border shadow-xl">
                        <button onClick={() => { setTab('current'); setViewingClosureId(null); }} className="px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,8px)] rounded-lg text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest transition-all text-rose-500 hover:text-rose-400">Actual</button>
                        <button className="px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,8px)] rounded-lg text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest bg-amber-500 text-black shadow-lg">Historial</button>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3 mb-[clamp(8px,2vmin,16px)] flex-wrap">
                    <div className="flex items-center gap-1 sm:gap-2"><span className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-500 uppercase">Fecha</span><input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-white border border-rose-border rounded-lg px-2 sm:px-3 py-1 sm:py-1.5 text-[clamp(10px,2vmin,12px)] font-bold text-rose-900 outline-none" /></div>
                    <span className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase">{filterDate ? filteredClosures.length : cashClosures.length} resultados</span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-white border border-rose-border rounded-xl sm:rounded-2xl lg:rounded-[2rem]">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse min-w-[500px]">
                            <thead className="bg-white text-rose-400 font-black uppercase text-[clamp(8px,1.5vmin,10px)] border-b border-rose-border tracking-widest sticky top-0 z-10 shadow-sm">
                                <tr><th className="p-[clamp(8px,2vmin,20px)]">Fecha</th><th className="p-[clamp(8px,2vmin,20px)]">Cajero</th><th className="p-[clamp(8px,2vmin,20px)] text-right">Efectivo</th><th className="p-[clamp(8px,2vmin,20px)] text-right">Venta Total</th><th className="p-[clamp(8px,2vmin,20px)] text-center">Ver</th></tr>
                            </thead>
                            <tbody className="divide-y divide-rose-border">{(filteredClosures.length === 0 ? cashClosures : filteredClosures).map(c => (
                                <tr key={c.id} className="hover:bg-rose-muted transition-colors">
                                    <td className="p-[clamp(8px,2vmin,20px)]"><div className="font-black text-rose-900 text-[clamp(11px,2.5vmin,14px)] uppercase">{formatDateTimeES(c.closedAt!)}</div></td>
                                    <td className="p-[clamp(8px,2vmin,20px)] text-rose-500 font-black text-[clamp(10px,2vmin,11px)] uppercase">{c.openedBy}</td>
                                    <td className="p-[clamp(8px,2vmin,20px)] text-right font-black text-emerald-500 font-mono text-[clamp(12px,3vmin,14px)]">${(c.openingAmount + c.totalCash).toFixed(2)}</td>
                                    <td className="p-[clamp(8px,2vmin,20px)] text-right font-black text-rose-900 font-mono text-[clamp(14px,3.5vmin,18px)]">${c.totalSales.toFixed(2)}</td>
                                    <td className="p-[clamp(8px,2vmin,20px)] text-center"><button onClick={() => { setViewingClosureId(c.id); setTab('current'); }} className="p-[clamp(4px,1vmin,8px)] bg-rose-muted hover:bg-blue-600 text-rose-500 hover:text-white rounded-lg sm:rounded-xl transition-all shadow-md"><Eye size={14} /></button></td>
                                </tr>
                            ))}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        );
    }

    const px = 'p-[clamp(8px,2vmin,32px)] sm:p-[clamp(12px,3vmin,40px)]';
    const rnd = 'rounded-[clamp(12px,3vmin,40px)]';

    return (
        <div className="h-full w-full bg-rose-bg overflow-hidden flex flex-col p-[clamp(6px,1.5vmin,32px)] animate-in fade-in">
            {stats ? (
                <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-[clamp(8px,2vmin,32px)] gap-[clamp(4px,1vmin,16px)] shrink-0">
                        <div className="flex items-center gap-[clamp(8px,2vmin,24px)]">
                            <button onClick={() => navigateView && navigateView('pos')} className="bg-white hover:bg-rose-muted p-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl border border-rose-border text-rose-500 hover:text-rose-900 transition-all shadow-lg active:scale-95"><ArrowLeft size={16} /></button>
                            <div><h1 className="text-[clamp(18px,4.5vmin,28px)] font-black text-rose-900 uppercase tracking-tight">{viewingClosureId ? 'Auditoría' : 'Corte Z'}</h1><p className="text-rose-400 text-[clamp(9px,2vmin,10px)] font-bold uppercase tracking-widest mt-0.5">Control de Efectivo</p></div>
                        </div>
                        {!viewingClosureId && (
                            <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                                <div className="flex items-center gap-1 sm:gap-2">
                                    <span className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-500 uppercase hidden sm:inline">Fecha</span>
                                    <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="bg-white border border-rose-border rounded-lg px-2 py-1 text-[clamp(10px,2vmin,12px)] font-bold text-rose-900 outline-none w-[clamp(100px,18vmin,150px)]" />
                                </div>
                                <div className="flex bg-white p-1 rounded-xl border border-rose-border shadow-xl">
                                    <button className="px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,8px)] rounded-lg text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest bg-emerald-600 text-white shadow-lg">Actual</button>
                                    <button onClick={() => setTab('history')} className="px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,8px)] rounded-lg text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest text-rose-500 hover:text-rose-400">Historial</button>
                                </div>
                            </div>
                        )}
                        {viewingClosureId && (<button onClick={() => { setViewingClosureId(null); setTab('history'); }} className="bg-amber-600 hover:bg-amber-500 text-black px-[clamp(12px,3vmin,32px)] py-[clamp(6px,1.5vmin,12px)] rounded-xl sm:rounded-2xl font-black text-[clamp(9px,2vmin,11px)] uppercase tracking-widest shadow-xl transition-all active:scale-95">Regresar</button>)}
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-[clamp(6px,1.5vmin,24px)]">
                            {/* Left column */}
                            <div className="sm:col-span-6 lg:col-span-3 grid grid-rows-2 gap-[clamp(6px,1.5vmin,24px)]">
                                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-[clamp(8px,2vmin,20px)] rounded-[clamp(12px,3vmin,24px)] text-white shadow-2xl relative overflow-hidden">
                                    <div className="absolute -right-2 -top-2 opacity-10"><DollarSign size={50} /></div>
                                    <div className="relative z-10">
                                        <span className="text-[clamp(8px,1.5vmin,9px)] font-black uppercase tracking-[0.3em] opacity-80">Efectivo</span>
                                        <div className="text-[clamp(22px,5vmin,36px)] font-black font-mono tracking-tighter mt-1">${stats.totalInDrawer.toFixed(2)}</div>
                                        <div className="mt-[clamp(4px,1vmin,12px)] pt-[clamp(4px,1vmin,12px)] border-t border-white/20 flex justify-between items-center">
                                            <div><div className="text-[clamp(7px,1.5vmin,8px)] font-black uppercase opacity-60">Apertura</div><div className="text-[clamp(12px,2.5vmin,14px)] font-black font-mono">${stats.opening.toFixed(2)}</div></div>
                                            <div className="text-right"><div className="text-[clamp(7px,1.5vmin,8px)] font-black uppercase opacity-60">Cash</div><div className="text-[clamp(12px,2.5vmin,14px)] font-black font-mono">+${stats.cash.toFixed(2)}</div></div>
                                        </div>
                                    </div>
                                </div>



                                <div className="bg-white border border-rose-border rounded-[clamp(12px,3vmin,40px)] p-[clamp(12px,3vmin,32px)] shadow-xl">
                                    <h3 className="text-rose-500 font-black text-[clamp(9px,2vmin,10px)] uppercase tracking-[0.3em] flex items-center gap-2 sm:gap-3 mb-[clamp(8px,2vmin,24px)]"><BarChart3 size={12} className="text-blue-500" /> Rendimiento</h3>
                                    <div className="space-y-[clamp(8px,2vmin,24px)]">
                                        <div><span className="text-[clamp(7px,1.5vmin,8px)] font-black text-rose-400 uppercase tracking-widest mb-0.5 block">Ticket Promedio</span><span className="text-[clamp(16px,4vmin,20px)] font-black text-rose-900 font-mono tracking-tighter">${(stats.totalSales / (stats.count || 1)).toFixed(2)}</span></div>
                                        <div><span className="text-[clamp(7px,1.5vmin,8px)] font-black text-rose-400 uppercase tracking-widest mb-1 block">Mix de Venta</span>
                                            <div className="flex gap-1 h-2 rounded-full overflow-hidden bg-rose-muted">
                                                <div className="bg-blue-500" style={{ width: `${(stats.servicesTotal / (stats.totalSales || 1)) * 100}%` }}></div>
                                                <div className="bg-amber-500" style={{ width: `${(stats.productsTotal / (stats.totalSales || 1)) * 100}%` }}></div>
                                                <div className="bg-indigo-500" style={{ width: `${(stats.combosTotal / (stats.totalSales || 1)) * 100}%` }}></div>
                                            </div>
                                            <div className="flex justify-between mt-1 text-[clamp(7px,1.5vmin,8px)] font-black uppercase"><span className="text-blue-400">Serv</span><span className="text-amber-400">Prod</span><span className="text-indigo-400">Comb</span></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Middle column */}
                            <div className="sm:col-span-6 lg:col-span-6 grid grid-rows-2 gap-[clamp(6px,1.5vmin,24px)]">
                                <div className="bg-white border border-rose-border rounded-[clamp(12px,3vmin,24px)] p-[clamp(6px,1.5vmin,16px)] shadow-xl">
                                    <div className="flex items-center justify-between mb-[clamp(4px,1vmin,12px)] flex-wrap gap-2">
                                        <h3 className="text-rose-500 font-black text-[clamp(8px,1.5vmin,9px)] uppercase tracking-[0.3em] flex items-center gap-2"><BarChart3 size={10} className="text-blue-500" /> Métodos de Pago</h3>
                                        <div className="text-right"><span className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase block leading-none">Venta Bruta</span><span className="text-[clamp(18px,4.5vmin,24px)] font-black text-rose-900 font-mono tracking-tighter">${stats.totalSales.toFixed(2)}</span></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,8px)]">
                                        <div className="bg-rose-muted p-[clamp(4px,1vmin,10px)] rounded-xl border"><MethodItem icon={<CreditCard size={12} />} label="Tarjetas" amount={stats.card} color="text-blue-400" /></div>
                                        <div className="bg-rose-muted p-[clamp(4px,1vmin,10px)] rounded-xl border"><MethodItem icon={<ArrowRightLeft size={12} />} label="Transf." amount={stats.transfer} color="text-violet-400" /></div>
                                        <div className="bg-rose-muted p-[clamp(4px,1vmin,10px)] rounded-xl border"><MethodItem icon={<Bitcoin size={12} />} label="Bitcoin" amount={stats.bitcoin} color="text-orange-400" /></div>
                                        <div className="bg-rose-muted p-[clamp(4px,1vmin,10px)] rounded-xl border"><MethodItem icon={<DollarSign size={12} />} label="Efectivo" amount={stats.cash} color="text-emerald-400" /></div>
                                    </div>
                                </div>

                                <div className="bg-white border border-rose-border rounded-[clamp(12px,3vmin,24px)] p-[clamp(6px,1.5vmin,16px)] shadow-inner flex flex-col">
                                    <h3 className="text-rose-500 font-black text-[clamp(8px,1.5vmin,9px)] uppercase tracking-[0.3em] flex items-center gap-2 mb-[clamp(4px,1vmin,8px)]"><Layers size={10} className="text-indigo-500" /> Desempeño</h3>
                                    <div className="grid grid-cols-4 gap-[clamp(4px,1vmin,8px)] flex-1">
                                        <MetricCard icon={<Scissors size={12} />} label="Servicios" value={`$${stats.servicesTotal.toFixed(2)}`} sub={`${stats.servicesCount} un`} color="bg-blue-600/20 text-blue-500" />
                                        <MetricCard icon={<Package size={12} />} label="Productos" value={`$${stats.productsTotal.toFixed(2)}`} sub={`${stats.productsCount} un`} color="bg-amber-600/20 text-amber-500" />
                                        <MetricCard icon={<Layers size={12} />} label="Combos" value={`$${stats.combosTotal.toFixed(2)}`} sub={`${stats.combosCount} un`} color="bg-indigo-600/20 text-indigo-500" />
                                        <MetricCard icon={<Receipt size={12} />} label="Operaciones" value={`${stats.count}`} sub={`${stats.count === 1 ? 'venta' : 'ventas'}`} color="bg-rose-600/20 text-rose-500" />
                                    </div>
                                </div>
                            </div>

                            {/* Right column */}
                            <div className="sm:col-span-12 lg:col-span-3 grid grid-cols-2 gap-[clamp(6px,1.5vmin,24px)]">
                                <div className="bg-white border border-rose-border rounded-[clamp(12px,3vmin,40px)] p-[clamp(8px,2vmin,16px)] shadow-xl flex flex-col gap-[clamp(4px,1vmin,8px)]">
                                    <h3 className="text-rose-500 font-black text-[clamp(9px,2vmin,10px)] uppercase shrink-0">Acciones</h3>
                                    <div className="flex flex-col gap-[clamp(6px,1.5vmin,12px)] flex-1 justify-center">
                                        <button onClick={() => setShowReportModal(true)} className="w-full bg-rose-palo hover:bg-rose-palo-dark text-white py-[clamp(11px,2.8vmin,16px)] rounded-xl font-black uppercase text-[clamp(9px,2.2vmin,11px)] shadow-lg active:scale-95 transition-all flex items-center justify-center gap-1"><Receipt size={14} /> Ticket</button>
                                        <button onClick={() => printReceipt('printable-report-z')} className="w-full bg-rose-muted text-rose-500 py-[clamp(11px,2.8vmin,16px)] rounded-xl font-black uppercase text-[clamp(9px,2.2vmin,11px)] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-1"><Printer size={14} /> Imprimir</button>
                                    </div>
                                </div>
                                <div className="bg-white border border-rose-border rounded-[clamp(12px,3vmin,40px)] p-[clamp(8px,2vmin,16px)] shadow-xl flex flex-col gap-[clamp(4px,1vmin,8px)]">
                                    <h3 className="text-rose-500 font-black text-[clamp(9px,2vmin,10px)] uppercase shrink-0">Cierre</h3>
                                    <div className="flex flex-col gap-[clamp(6px,1.5vmin,12px)] flex-1 justify-center">
                                        <button className="w-full bg-rose-muted text-rose-500 py-[clamp(11px,2.8vmin,16px)] rounded-xl font-black uppercase text-[clamp(9px,2.2vmin,11px)] shadow-xl flex items-center justify-center gap-1 opacity-40 cursor-not-allowed"><Mail size={14} /> Correo</button>
                                        {!viewingClosureId ? (
                                            <button onClick={() => setShowConfirmModal(true)} className="w-full bg-destructive text-white py-[clamp(11px,2.8vmin,16px)] rounded-xl font-black uppercase text-[clamp(9px,2.2vmin,11px)] shadow-xl flex items-center justify-center gap-1 border-b-4 border-destructive active:border-b-0 active:translate-y-1 transition-all"><Power size={14} /> Cerrar Caja</button>
                                        ) : (
                                            <div className="w-full bg-blue-900/10 border border-blue-500/20 rounded-xl flex items-center justify-center py-[clamp(20px,5vmin,32px)] text-[clamp(12px,3vmin,14px)] font-black text-blue-400 uppercase">Archivado</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {createPortal(
                        <div id="printable-report-z" className="print-area hidden">
                            <CashReportContent stats={stats} config={config} />
                        </div>,
                        document.body
                    )}
                </>
            ) : (
                <div className="h-full flex flex-col items-center justify-center text-rose-500 space-y-[clamp(8px,2vmin,24px)]">
                    <div className="w-[clamp(48px,12vmin,96px)] h-[clamp(48px,12vmin,96px)] rounded-full bg-white border border-rose-border flex items-center justify-center animate-pulse"><DollarSign size={20} className="opacity-20" /></div>
                    <div className="text-center"><h2 className="text-[clamp(16px,4vmin,20px)] font-black text-rose-900 uppercase tracking-widest">Esperando Sesión</h2><p className="text-[clamp(10px,2.5vmin,14px)] font-bold text-rose-400 uppercase tracking-widest mt-2">Abre caja en el POS</p></div>
                    <button onClick={() => navigateView && navigateView('pos')} className="bg-blue-600 hover:bg-blue-500 text-white px-[clamp(16px,4vmin,40px)] py-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-widest shadow-xl active:scale-95 transition-all">Ir a POS</button>
                </div>
            )}

            {showReportModal && (
                <div className="fixed inset-0 z-[1000] bg-rose-bg/95 backdrop-blur-2xl flex items-center justify-center p-[clamp(8px,2vmin,24px)] animate-in fade-in" onClick={() => setShowReportModal(false)}>
                    <div className="bg-white border border-rose-border w-full max-w-[min(90vw,400px)] rounded-[clamp(16px,3vmin,40px)] shadow-2xl p-[clamp(12px,3vmin,24px)] animate-in zoom-in" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-[clamp(8px,2vmin,16px)]">
                            <h3 className="text-[clamp(14px,3.5vmin,18px)] font-black text-rose-900 uppercase">Ticket de Cierre</h3>
                            <button onClick={() => setShowReportModal(false)} className="p-1.5 bg-rose-muted rounded-lg text-rose-500"><X size={14} /></button>
                        </div>
                        <CashReportContent stats={stats} config={config} />
                        <div className="mt-[clamp(8px,2vmin,16px)] flex gap-[clamp(4px,1vmin,8px)]">
                            <button onClick={() => { printReceipt('printable-report-z'); setShowReportModal(false); }} className="flex-1 bg-rose-palo text-white py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black uppercase text-[clamp(9px,2vmin,10px)] flex items-center justify-center gap-2 shadow-lg active:scale-95"><Printer size={12} /> Imprimir</button>
                            <button onClick={() => setShowReportModal(false)} className="flex-1 bg-rose-muted text-rose-700 py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black uppercase text-[clamp(9px,2vmin,10px)]">Cerrar</button>
                        </div>
                    </div>
                </div>
            )}
            {showConfirmModal && (
                <div className="fixed inset-0 z-[1000] bg-rose-bg/95 backdrop-blur-2xl flex items-center justify-center p-[clamp(8px,2vmin,24px)] animate-in fade-in">
                    <div className="bg-white border border-destructive/50 w-full max-w-[min(90vw,500px)] rounded-[clamp(16px,3vmin,40px)] shadow-2xl p-[clamp(16px,4vmin,40px)] flex flex-col items-center text-center animate-in zoom-in">
                        <div className="w-[clamp(48px,12vmin,80px)] h-[clamp(48px,12vmin,80px)] rounded-full bg-destructive/20 flex items-center justify-center text-destructive border border-destructive/30 mb-[clamp(8px,2vmin,24px)]"><AlertTriangle size={24} /></div>
                        <h2 className="text-[clamp(18px,4.5vmin,24px)] font-black text-rose-900 uppercase tracking-tighter mb-2">Confirmar Cierre</h2>
                        <p className="text-rose-500 text-[clamp(11px,2.5vmin,14px)] mb-[clamp(12px,3vmin,32px)] leading-relaxed">Se registrará el cierre contable y se bloqueará el POS hasta una nueva apertura.</p>
                        <div className="w-full flex gap-[clamp(8px,2vmin,16px)]">
                            <button onClick={() => setShowConfirmModal(false)} className="flex-1 bg-rose-muted text-rose-500 py-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-widest transition-all">Cancelar</button>
                            <button onClick={handleExecuteClosure} className="flex-1 bg-destructive text-white py-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-widest shadow-xl active:scale-95 transition-all border-b-4 border-destructive active:border-b-0">Cerrar Caja</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const MetricCard = ({ icon, label, value, sub, color }: any) => (
    <div className="bg-white border border-rose-border p-[clamp(4px,1vmin,12px)] rounded-lg shadow-xl group transition-all flex flex-col items-center text-center justify-center">
        <div className={`w-[clamp(20px,4vmin,36px)] h-[clamp(20px,4vmin,36px)] rounded-lg flex items-center justify-center mb-[clamp(2px,0.5vmin,6px)] transition-transform group-hover:scale-110 ${color}`}>{icon}</div>
        <div className="text-[clamp(6px,1.2vmin,7px)] font-black text-rose-500 uppercase tracking-widest leading-tight">{label}</div>
        <div className="text-[clamp(12px,3vmin,18px)] font-black text-rose-900 font-mono tracking-tighter leading-none">{value}</div>
        <div className="text-[clamp(6px,1.2vmin,7px)] font-bold text-rose-700 uppercase tracking-widest leading-tight">{sub}</div>
    </div>
);

const MethodItem = ({ icon, label, amount, color }: any) => (
    <div className="flex justify-between items-center group">
        <div className="flex items-center gap-2 sm:gap-3 text-rose-500 group-hover:text-rose-900 transition-colors">
            {icon}
            <span className="text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className={`text-[clamp(14px,3.5vmin,18px)] font-black font-mono tracking-tighter ${color}`}>${amount.toFixed(2)}</div>
    </div>
);
