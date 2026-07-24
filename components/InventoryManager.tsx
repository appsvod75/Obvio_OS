
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useBarber } from '../context/BarberContext';
import {
    Search, Plus, Package, History, Store, X,
    Trash2, Hash, ShoppingCart, User, CheckCircle2,
    DollarSign, AlertCircle, PlusCircle, TrendingUp,
    Layers, Coins, ArrowUpRight, ArrowDownRight, Activity, Truck,
    MinusCircle, RefreshCcw, Bell, Eye, FileText, Calendar, ShieldCheck, Tag,
    ChevronRight, Filter
} from 'lucide-react';
import { formatDateES, formatDateTimeES } from '../utils/dates';
import { CatalogItem, InventoryMovementType, InventoryMovement } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

interface DetailLine {
    id: string;
    itemId: string;
    itemName: string;
    qty: number;
    lineTotal: number;
    unitCost: number;
}

const StatHeaderCard = ({ icon, label, value, sub, color }: { icon: React.ReactNode, label: string, value: string, sub: string, color?: string }) => (
    <div className="bg-white p-[clamp(8px,2vmin,16px)] rounded-[clamp(12px,2.5vmin,24px)] border border-rose-border shadow-md group hover:border-purple-500/30 transition-all flex-1">
        <div className="flex items-center gap-[clamp(6px,1.5vmin,12px)] text-rose-400 mb-[clamp(4px,1vmin,8px)]">
            {icon}
            <span className="text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest">{label}</span>
        </div>
        <div className={`text-[clamp(16px,4vmin,28px)] font-black ${color || 'text-rose-900'} font-mono tracking-tighter`}>{value}</div>
        <div className="text-[clamp(7px,1.2vmin,9px)] font-bold text-rose-400 uppercase tracking-widest mt-[clamp(2px,0.5vmin,4px)]">{sub}</div>
    </div>
);

export const InventoryManager = () => {
    const {
        catalog, stocks, registerInventoryMovement, transferStock,
        branches, currentUser, inventoryMovements, getBranchStock, confirmTransferIn, showToast
    } = useBarber();

    const mainScroll = useDragScroll();
    const detailScroll = useDragScroll();
    const receiveScroll = useDragScroll();
    const kardexScroll = useDragScroll();

    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
    const [isReceiveModalOpen, setIsReceiveModalOpen] = useState(false);
    const [kardexBranchId, setKardexBranchId] = useState('');

    const [isReadOnly, setIsReadOnly] = useState(false);
    const [docType, setDocType] = useState<InventoryMovementType>('purchase');
    const [docBranchId, setDocBranchId] = useState(currentUser?.branchId || branches[0]?.id || '');
    const [docToBranchId, setDocToBranchId] = useState('');
    const [docReference, setDocReference] = useState('');
    const [docProvider, setDocProvider] = useState('');
    const [docReason, setDocReason] = useState('');

    const [lines, setLines] = useState<DetailLine[]>([]);
    const [gridSearch, setGridSearch] = useState('');
    const [activeSearchLineId, setActiveSearchLineId] = useState<string | null>(null);
    const [focusedField, setFocusedField] = useState<{ id: string, field: 'qty' | 'total' | 'search' } | null>(null);

    const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    const pendingTransfers = useMemo(() => {
        const myBranchId = currentUser?.branchId || branches[0]?.id;
        if (!myBranchId) return [];
        return inventoryMovements.filter(m =>
            m.branchId === myBranchId &&
            m.type === 'transfer_in' &&
            m.status === 'pending'
        );
    }, [inventoryMovements, currentUser, branches]);

    const stats = useMemo(() => {
        const activeProducts = catalog.filter(i => i.type === 'product' && i.active !== false);
        const totalStock = stocks.reduce((acc, s) => acc + s.stock, 0);
        const totalInvestment = stocks.reduce((acc, s) => acc + (s.stock * s.averageCost), 0);
        return { uniqueCount: activeProducts.length, totalStock, totalInvestment };
    }, [catalog, stocks]);

    const handleOpenNewMovement = () => {
        setIsReadOnly(false);
        setDocType('purchase');
        setDocReference('');
        setDocProvider('');
        setDocReason('');
        setDocToBranchId('');
        setDocBranchId(currentUser?.branchId || branches[0]?.id || '');
        const firstLineId = crypto.randomUUID();
        setLines([{ id: firstLineId, itemId: '', itemName: '', qty: 0, lineTotal: 0, unitCost: 0 }]);
        setFocusedField({ id: firstLineId, field: 'search' });
        setIsModalOpen(true);
    };

    const handleViewMovementDetail = (m: InventoryMovement) => {
        setIsReadOnly(true);
        setDocType(m.type);
        setDocBranchId(m.branchId);
        setDocToBranchId(m.relatedBranchId || '');

        const reasonParts = (m.reason || '').split('|');
        setDocReason(reasonParts[0]?.trim() || '');
        setDocReference(reasonParts.find(p => p.includes('Ref:'))?.replace('Ref:', '').trim() || '');
        setDocProvider(reasonParts.find(p => p.includes('Prov:'))?.replace('Prov:', '').trim() || '');

        const qty = Number(m.quantity || 0);
        const cost = Number(m.unitCost || 0);

        setLines([{
            id: m.id,
            itemId: m.itemId,
            itemName: m.itemName,
            qty: Math.abs(qty), // Mostrar siempre positivo en el detalle visual
            unitCost: cost,
            lineTotal: cost * Math.abs(qty)
        }]);

        setIsModalOpen(true);
    };

    useEffect(() => {
        if (isReadOnly) return;
        const lastLine = lines[lines.length - 1];
        if (lastLine && lastLine.itemId !== '') {
            const newLineId = crypto.randomUUID();
            setLines([...lines, { id: newLineId, itemId: '', itemName: '', qty: 0, lineTotal: 0, unitCost: 0 }]);
        }
    }, [lines, isReadOnly]);

    const updateLine = (id: string, updates: Partial<DetailLine>) => {
        if (isReadOnly) return;
        setLines(lines.map(l => {
            if (l.id === id) {
                const newLine = { ...l, ...updates };
                if (docType === 'adjustment_out' || docType === 'transfer_out') {
                    const currentStock = getBranchStock(docBranchId, newLine.itemId);
                    newLine.unitCost = currentStock?.averageCost || 0;
                    newLine.lineTotal = newLine.unitCost * newLine.qty;
                } else {
                    if (updates.qty !== undefined || updates.lineTotal !== undefined) {
                        newLine.unitCost = newLine.qty > 0 ? newLine.lineTotal / newLine.qty : 0;
                    }
                }
                return newLine;
            }
            return l;
        }));
    };

    const selectProductForLine = (lineId: string, item: CatalogItem) => {
        const currentStock = getBranchStock(docBranchId, item.id);
        const lastCost = currentStock?.averageCost || 0;
        const initialLineData: Partial<DetailLine> = { itemId: item.id, itemName: item.name };
        if (['adjustment_in', 'adjustment_out', 'transfer_out'].includes(docType)) {
            initialLineData.unitCost = lastCost;
        }
        updateLine(lineId, initialLineData);
        setActiveSearchLineId(null);
        setGridSearch('');
        setTimeout(() => {
            setFocusedField({ id: lineId, field: 'qty' });
            inputRefs.current[`${lineId}-qty`]?.focus();
        }, 50);
    };

    const handleKeyDown = (e: React.KeyboardEvent, lineId: string, field: string) => {
        if (isReadOnly) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            if (field === 'qty') {
                if (docType === 'adjustment_out' || docType === 'transfer_out') {
                    const currentIndex = lines.findIndex(l => l.id === lineId);
                    const nextLine = lines[currentIndex + 1];
                    if (nextLine) {
                        setFocusedField({ id: nextLine.id, field: 'search' });
                        inputRefs.current[`${nextLine.id}-search`]?.focus();
                    }
                } else {
                    setFocusedField({ id: lineId, field: 'total' });
                    inputRefs.current[`${lineId}-total`]?.focus();
                }
            } else if (field === 'total') {
                const currentIndex = lines.findIndex(l => l.id === lineId);
                const nextLine = lines[currentIndex + 1];
                if (nextLine) {
                    setFocusedField({ id: nextLine.id, field: 'search' });
                    inputRefs.current[`${nextLine.id}-search`]?.focus();
                }
            }
        }
    };

    const processDocument = async () => {
        if (isReadOnly) return;
        const validLines = lines.filter(l => l.itemId && l.qty > 0);
        if (validLines.length === 0) return showToast('warning', 'Sin datos', "⚠️ No hay líneas válidas.");
        if (docType === 'transfer_out' && !docToBranchId) return showToast('warning', 'Faltan datos', "⚠️ Debes seleccionar una sede destino.");

        let successCount = 0;
        for (const line of validLines) {
            const reason = `${docReason} | Ref: ${docReference} ${docProvider ? '| Prov: ' + docProvider : ''}`;
            let result = false;

            if (docType === 'transfer_out') {
                // transferStock aún no devuelve promesa bool, asumimos true o implementamos
                transferStock(docBranchId, docToBranchId, line.itemId, line.qty, reason);
                result = true;
            } else {
                result = await registerInventoryMovement(docBranchId, line.itemId, docType, line.qty, line.unitCost, reason);
            }
            if (result) successCount++;
        }

        if (successCount === validLines.length) {
            setIsModalOpen(false);
            showToast('success', 'Operación Exitosa', "✅ Movimiento guardado correctamente.");
        } else {
            showToast('error', 'Error Parcial', "⚠️ Hubo un error al guardar algunas líneas. Verifica.");
        }
    };



    const docTotal = lines.reduce((acc, l) => acc + l.lineTotal, 0);

    const filteredProducts = useMemo(() => {
        const lower = search.toLowerCase();
        return catalog.filter(i => i && i.type === 'product' && i.active !== false)
            .filter(p => {
                if (!p) return false;
                return (p.name || '').toLowerCase().includes(lower) || (p.category || '').toLowerCase().includes(lower);
            });
    }, [catalog, search]);

    const selectedItem = useMemo(() => catalog.find(p => p.id === selectedId) || null, [catalog, selectedId]);

    return (
        <div className="h-full flex flex-col bg-rose-bg overflow-hidden font-inter">
            {/* HEADER DE MÓDULO */}
            <div className="px-[clamp(8px,2vmin,24px)] py-[clamp(6px,1.5vmin,14px)] border-b border-rose-border bg-rose-bg flex items-center justify-between shrink-0">
                <div className="flex items-center gap-[clamp(6px,1.5vmin,20px)]">
                    <div className="relative w-[clamp(140px,35vmin,320px)]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-300" size={14} />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] py-[clamp(4px,1vmin,10px)] pl-[clamp(24px,6vmin,40px)] pr-[clamp(8px,2vmin,16px)] text-[clamp(9px,1.8vmin,12px)] text-rose-900 outline-none focus:border-purple-600" placeholder="Buscar producto..." />
                    </div>
                    {pendingTransfers.length > 0 && (
                        <button onClick={() => setIsReceiveModalOpen(true)} className="flex items-center gap-[clamp(4px,1vmin,12px)] bg-amber-500/10 border border-amber-500/20 px-[clamp(6px,1.5vmin,16px)] py-[clamp(4px,1vmin,8px)] rounded-[clamp(8px,2vmin,16px)] group hover:bg-amber-500 hover:text-black transition-all">
                            <div className="relative">
                                <Truck size={14} className="text-amber-500 group-hover:text-black" />
                                <span className="absolute -top-2 -right-2 bg-amber-500 text-black text-[clamp(6px,1vmin,8px)] font-black w-[clamp(12px,3vmin,16px)] h-[clamp(12px,3vmin,16px)] flex items-center justify-center rounded-full animate-bounce group-hover:bg-black group-hover:text-white">{pendingTransfers.length}</span>
                            </div>
                            <span className="text-[clamp(7px,1.2vmin,10px)] font-black uppercase tracking-widest">Recepciones</span>
                        </button>
                    )}
                </div>
                <button onClick={handleOpenNewMovement} className="bg-purple-600 hover:bg-purple-500 text-white px-[clamp(8px,2vmin,24px)] py-[clamp(4px,1vmin,10px)] rounded-[clamp(8px,2vmin,16px)] font-black text-[clamp(8px,1.5vmin,10px)] uppercase tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)] shadow-lg transition-all border-b-2 border-purple-800 active:border-b-0">
                    <Plus size={14} /> Nuevo Movimiento
                </button>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* IZQUIERDA: DASHBOARD DE INVENTARIO */}
                <div className="flex-[2.5] flex flex-col min-w-0 border-r border-rose-border bg-rose-muted/10 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-[clamp(4px,1vmin,12px)] px-[clamp(8px,2vmin,24px)] py-[clamp(6px,1.5vmin,14px)] bg-rose-bg shrink-0 border-b border-rose-border">
                        <StatHeaderCard icon={<Layers size={14} className="text-blue-500" />} label="Artículos Únicos" value={stats.uniqueCount.toString()} sub="Catálogo Activo" />
                        <StatHeaderCard icon={<Package size={14} className="text-amber-500" />} label="Existencia Total" value={stats.totalStock.toString()} sub="Unidades en Red" color="text-amber-500" />
                        <StatHeaderCard icon={<Coins size={14} className="text-emerald-500" />} label="Inversión Total" value={`$${stats.totalInvestment.toFixed(2)}`} sub="Valor de Inventario" color="text-emerald-500" />
                    </div>

                    <div
                        ref={mainScroll.ref}
                        {...mainScroll.props}
                        className="flex-1 overflow-y-auto hide-scrollbar p-[clamp(8px,2vmin,24px)]"
                    >
                        <div className="bg-white rounded-[clamp(1rem,3vmin,2.5rem)] border border-rose-border overflow-hidden shadow-xl">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-rose-muted text-rose-400 font-black uppercase text-[clamp(8px,1.5vmin,10px)] border-b border-rose-border tracking-widest sticky top-0 z-10">
                                    <tr>
                                        <th className="p-[clamp(6px,1.5vmin,16px)] w-16 text-center">#</th>
                                        <th className="p-[clamp(6px,1.5vmin,16px)] w-[45%]">Producto / Categoría</th>
                                        <th className="p-[clamp(6px,1.5vmin,16px)] text-center">PVP</th>
                                        <th className="p-[clamp(6px,1.5vmin,16px)] text-center">Costo Prom.</th>
                                        <th className="p-[clamp(6px,1.5vmin,16px)] text-center">Stock Global</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rose-border">
                                    {filteredProducts.map(p => {
                                        const prodStocks = stocks.filter(s => s.itemId === p.id);
                                        const stockCount = prodStocks.reduce((acc, s) => acc + s.stock, 0);
                                        const avgCost = prodStocks.length > 0 ? (prodStocks.reduce((acc, s) => acc + (s.stock * s.averageCost), 0) / (stockCount || 1)) : 0;
                                        return (
                                            <tr key={p.id} onClick={() => setSelectedId(p.id)} className={`group cursor-pointer transition-all ${selectedId === p.id ? 'bg-purple-600/10' : 'hover:bg-rose-muted'}`}>
                                                <td className="p-[clamp(6px,1.5vmin,16px)] text-center text-rose-300 font-mono text-[clamp(9px,1.8vmin,12px)]">{catalog.indexOf(p) + 1}</td>
                                                <td className="p-[clamp(6px,1.5vmin,16px)] flex items-center gap-[clamp(4px,1vmin,12px)]">
                                                    <div className={`w-[clamp(24px,6vmin,40px)] h-[clamp(24px,6vmin,40px)] rounded-[clamp(6px,1.5vmin,12px)] bg-rose-muted flex items-center justify-center text-rose-400 transition-colors ${selectedId === p.id ? 'text-purple-400' : 'group-hover:text-purple-400'}`}><Package size={14} /></div>
                                                    <div>
                                                        <div className="font-black text-rose-900 text-[clamp(11px,2.5vmin,14px)] uppercase tracking-tight">{p.name}</div>
                                                        <div className="text-[clamp(7px,1.2vmin,8px)] font-black uppercase tracking-widest text-rose-400">{p.category}</div>
                                                    </div>
                                                </td>
                                                <td className="p-[clamp(6px,1.5vmin,16px)] text-center font-mono text-[clamp(11px,2.5vmin,14px)] font-black text-emerald-500 tracking-tighter">${p.price.toFixed(2)}</td>
                                                <td className="p-[clamp(6px,1.5vmin,16px)] text-center font-mono text-[clamp(11px,2.5vmin,14px)] font-black text-rose-500 tracking-tighter">${avgCost.toFixed(2)}</td>
                                                <td className="p-[clamp(6px,1.5vmin,16px)] text-center">
                                                    <span className={`text-[clamp(9px,1.8vmin,12px)] font-black font-mono px-[clamp(6px,1.5vmin,12px)] py-[clamp(2px,0.5vmin,4px)] rounded-[clamp(4px,1vmin,8px)] ${stockCount > 5 ? 'bg-rose-muted text-rose-900' : 'bg-destructive/10 text-destructive border border-destructive/30'}`}>{stockCount} UN</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* DERECHA: FICHA TÉCNICA DEL PRODUCTO */}
                <div
                    ref={detailScroll.ref}
                    {...detailScroll.props}
                    className="flex-1 bg-white flex flex-col min-w-[clamp(200px,30vmin,340px)] overflow-y-auto hide-scrollbar shadow-2xl border-l border-rose-border"
                >
                    {selectedItem ? (
                        <div className="p-[clamp(10px,2.5vmin,32px)] animate-in slide-in-from-right-2 duration-300">
                            <div className="mb-[clamp(12px,3vmin,32px)]">
                                <span className="text-[clamp(7px,1.2vmin,9px)] font-black text-purple-500 uppercase tracking-widest block mb-[clamp(2px,0.5vmin,4px)]">Detalle Maestro</span>
                                <h2 className="text-[clamp(16px,4vmin,28px)] font-black text-rose-900 uppercase tracking-tight leading-tight">{selectedItem.name}</h2>
                                <p className="text-[clamp(8px,1.5vmin,10px)] font-bold text-rose-400 uppercase tracking-widest mt-[clamp(2px,0.5vmin,4px)]">{selectedItem.category}</p>
                            </div>

                            <div className="space-y-[clamp(6px,1.5vmin,16px)] mb-[clamp(12px,3vmin,32px)]">
                                <div className="bg-gradient-to-br from-emerald-600/20 to-transparent rounded-[clamp(12px,2.5vmin,24px)] p-[clamp(8px,2vmin,24px)] border border-emerald-500/20 flex justify-between items-center group">
                                    <div>
                                        <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-emerald-500 uppercase tracking-widest mb-[clamp(2px,0.5vmin,4px)]">Valorización de Stock</div>
                                        <div className="text-[clamp(20px,5vmin,40px)] font-black text-rose-900 font-mono tracking-tighter leading-none">
                                            ${stocks.filter(s => s.itemId === selectedId).reduce((acc, s) => acc + (s.stock * s.averageCost), 0).toFixed(2)}
                                        </div>
                                        <div className="text-[clamp(6px,1vmin,7px)] font-bold text-emerald-600 uppercase mt-[clamp(2px,0.5vmin,4px)]">Capital Invertido Global</div>
                                    </div>
                                    <Coins className="text-emerald-500/30" size={28} />
                                </div>

                                <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,16px)]">
                                    <div className="bg-rose-muted/40 rounded-[clamp(12px,2.5vmin,24px)] p-[clamp(6px,1.5vmin,16px)] border border-rose-border">
                                        <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(2px,0.5vmin,4px)]">Precio Venta</div>
                                        <div className="text-[clamp(14px,3.5vmin,22px)] font-black text-rose-900 font-mono leading-none">${selectedItem.price.toFixed(2)}</div>
                                    </div>
                                    <div className="bg-rose-muted/40 rounded-[clamp(12px,2.5vmin,24px)] p-[clamp(6px,1.5vmin,16px)] border border-rose-border">
                                        <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(2px,0.5vmin,4px)]">Margen Est.</div>
                                        <div className="text-[clamp(14px,3.5vmin,22px)] font-black text-emerald-400 font-mono leading-none">
                                            {(() => {
                                                const sL = stocks.filter(s => s.itemId === selectedId);
                                                const aC = sL.length > 0 ? (sL.reduce((acc, s) => acc + (s.stock * s.averageCost), 0) / (sL.reduce((acc, s) => acc + s.stock, 0) || 1)) : 0;
                                                return `$${(selectedItem.price - aC).toFixed(2)}`;
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => { setKardexBranchId(''); setIsKardexModalOpen(true); }} className="w-full py-[clamp(8px,2vmin,16px)] bg-rose-muted hover:bg-rose-muted text-rose-900 rounded-[clamp(12px,2.5vmin,24px)] border border-rose-border flex items-center justify-center gap-[clamp(4px,1vmin,12px)] transition-all active:scale-95 shadow-lg group mb-[clamp(12px,3vmin,32px)]">
                                <History size={14} className="text-purple-500 group-hover:rotate-12 transition-transform" />
                                <span className="text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest">Ver Kardex de Sede</span>
                            </button>

                            <div className="border-t border-rose-border pt-[clamp(12px,3vmin,32px)]">
                                <h3 className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(6px,1.5vmin,16px)] flex items-center gap-[clamp(4px,1vmin,8px)]"><Store size={10} /> Stock por Sede</h3>
                                <div className="space-y-[clamp(4px,1vmin,8px)]">
                                    {branches.map(b => {
                                        const sR = stocks.find(s => s.branchId === b.id && s.itemId === selectedId);
                                        return (
                                            <div key={b.id} className="bg-rose-muted/50 p-[clamp(6px,1.5vmin,16px)] rounded-[clamp(8px,2vmin,16px)] border border-rose-border/50 hover:border-purple-500/30 transition-all flex justify-between items-center group">
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-500 uppercase truncate block mb-[clamp(2px,0.5vmin,4px)]">{b.name}</span>
                                                    <div className="flex flex-wrap gap-x-[clamp(4px,1vmin,12px)]">
                                                        <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-emerald-500 uppercase">Precio: ${selectedItem.price.toFixed(2)}</span>
                                                        <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-amber-500 uppercase">Costo Prom: ${(sR?.averageCost || 0).toFixed(2)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right ml-[clamp(4px,1vmin,16px)]">
                                                    <span className="text-[clamp(9px,1.8vmin,12px)] font-black text-rose-900 font-mono bg-white px-[clamp(6px,1.5vmin,12px)] py-[clamp(2px,0.5vmin,6px)] rounded-[clamp(4px,1vmin,8px)] border border-rose-border shadow-inner">{sR?.stock || 0} UN</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center p-[clamp(8px,2vmin,24px)] overflow-y-auto">
                            <div className="max-w-[min(100%,260px)] space-y-[clamp(8px,2vmin,16px)]">
                                <div className="bg-rose-muted/40 rounded-[clamp(14px,3vmin,24px)] p-[clamp(12px,3vmin,24px)] border border-rose-border/50">
                                    <div className="w-[clamp(32px,8vmin,48px)] h-[clamp(32px,8vmin,48px)] rounded-[clamp(10px,2.5vmin,16px)] bg-purple-600/10 flex items-center justify-center mx-auto">
                                        <Package size={20} className="text-purple-400" />
                                    </div>
                                    <h3 className="text-[clamp(12px,2.5vmin,15px)] font-black text-rose-900 uppercase tracking-tight mt-[clamp(6px,1.5vmin,12px)]">Inventario</h3>
                                    <p className="text-[clamp(9px,1.5vmin,11px)] text-rose-400 font-bold uppercase tracking-widest mt-[clamp(3px,0.5vmin,6px)] leading-relaxed">Gestiona el stock en todas las sedes.</p>
                                </div>

                                <div className="space-y-[clamp(4px,1vmin,8px)] text-left">
                                    <div className="flex items-start gap-[clamp(6px,1.5vmin,10px)] bg-rose-muted/20 p-[clamp(6px,1.5vmin,10px)] rounded-[clamp(8px,2vmin,12px)] border border-rose-border/40">
                                        <div className="w-[clamp(18px,4vmin,24px)] h-[clamp(18px,4vmin,24px)] rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0"><Search size={10} /></div>
                                        <div className="text-left"><span className="text-[clamp(9px,1.8vmin,11px)] font-black text-rose-900 uppercase block leading-tight">Busca</span><span className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase tracking-wider">Producto en la tabla → ficha detallada.</span></div>
                                    </div>
                                    <div className="flex items-start gap-[clamp(6px,1.5vmin,10px)] bg-rose-muted/20 p-[clamp(6px,1.5vmin,10px)] rounded-[clamp(8px,2vmin,12px)] border border-rose-border/40">
                                        <div className="w-[clamp(18px,4vmin,24px)] h-[clamp(18px,4vmin,24px)] rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0"><Plus size={10} /></div>
                                        <div className="text-left"><span className="text-[clamp(9px,1.8vmin,11px)] font-black text-rose-900 uppercase block leading-tight">Nuevo Movimiento</span><span className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase tracking-wider">Compra, traslado o ajuste de stock.</span></div>
                                    </div>
                                    <div className="flex items-start gap-[clamp(6px,1.5vmin,10px)] bg-rose-muted/20 p-[clamp(6px,1.5vmin,10px)] rounded-[clamp(8px,2vmin,12px)] border border-rose-border/40">
                                        <div className="w-[clamp(18px,4vmin,24px)] h-[clamp(18px,4vmin,24px)] rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0"><Truck size={10} /></div>
                                        <div className="text-left"><span className="text-[clamp(9px,1.8vmin,11px)] font-black text-rose-900 uppercase block leading-tight">Recepciones</span><span className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase tracking-wider">Confirma mercadería recibida.</span></div>
                                    </div>
                                </div>

                                <div className="bg-rose-muted/20 rounded-[clamp(8px,2vmin,12px)] p-[clamp(6px,1.5vmin,12px)] border border-dashed border-rose-border/40">
                                    <p className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase tracking-wider leading-relaxed">Selecciona un producto en la tabla de la izquierda.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL ERP PROFESIONAL: PROCESAMIENTO DE DOCUMENTO / VISTA DETALLE (CAPA SUPERIOR z-700) */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[700] bg-rose-bg/95 backdrop-blur-md flex items-center justify-center p-[clamp(6px,1.5vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-7xl h-[90vh] rounded-[clamp(1.5rem,4vmin,3rem)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        {isReadOnly && (
                            <div className="bg-blue-600/10 border-b border-blue-500/20 py-[clamp(4px,1vmin,8px)] px-[clamp(12px,3vmin,32px)] flex items-center justify-center gap-[clamp(4px,1vmin,8px)]">
                                <ShieldCheck size={12} className="text-blue-500" />
                                <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-blue-500 uppercase tracking-widest">Documento Registrado - Modo Consulta Solo Lectura</span>
                            </div>
                        )}
                        <div className="p-[clamp(10px,2.5vmin,32px)] border-b border-rose-border bg-rose-muted flex flex-col gap-[clamp(6px,1.5vmin,24px)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)]">
                                    <div className="bg-purple-600/20 p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(12px,2.5vmin,24px)] text-purple-500 border border-purple-500/20 shadow-lg"><ShoppingCart size={20} /></div>
                                    <div>
                                        <h3 className="text-[clamp(14px,3.5vmin,24px)] font-black text-rose-900 uppercase tracking-tight">{isReadOnly ? 'Auditoría de Movimiento' : 'Nuevo Movimiento ERP'}</h3>
                                        <p className="text-[clamp(8px,1.5vmin,10px)] font-bold text-rose-400 uppercase tracking-widest mt-[clamp(2px,0.5vmin,4px)]">{isReadOnly ? 'Registro Auditado de Base de Datos' : 'Gestión Centralizada de Stock'}</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-[clamp(4px,1vmin,12px)] text-rose-400 hover:text-rose-900 transition-all hover:rotate-90 bg-white rounded-full border border-rose-border"><X size={18} /></button>
                            </div>

                            {/* ENCABEZADO EXPANDIDO - OCUPA TODO EL ANCHO */}
                            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-[clamp(6px,1.5vmin,24px)] ${isReadOnly ? 'opacity-60 pointer-events-none' : ''}`}>
                                <div className="flex flex-col gap-1.5 relative">
                                    <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Operación</label>
                                    <div className="relative group/sel">
                                        <div className="absolute left-[clamp(6px,1.5vmin,16px)] top-1/2 -translate-y-1/2 text-purple-500 pointer-events-none z-10">
                                            {docType === 'purchase' && <ShoppingCart size={14} />}
                                            {docType === 'transfer_out' && <Truck size={14} />}
                                            {docType === 'adjustment_in' && <PlusCircle size={14} />}
                                            {docType === 'adjustment_out' && <MinusCircle size={14} />}
                                            {docType === 'initial' && <Layers size={14} />}
                                            {docType === 'sale' && <Hash size={14} />}
                                            {docType === 'transfer_in' && <ArrowDownRight size={14} />}
                                        </div>
                                        <select disabled={isReadOnly} value={docType} onChange={e => setDocType(e.target.value as InventoryMovementType)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] pl-[clamp(32px,8vmin,48px)] text-rose-900 font-black uppercase text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-purple-600 appearance-none shadow-inner">
                                            <option value="purchase">Compra (Entrada)</option>
                                            <option value="transfer_out">Traslado (Salida)</option>
                                            <option value="adjustment_in">Ajuste Positivo (+)</option>
                                            <option value="adjustment_out">Ajuste Negativo (-)</option>
                                            <option value="initial">Inventario Inicial</option>
                                            {isReadOnly && <option value="sale">Venta POS</option>}
                                            <option value="transfer_in">Recepción Traslado</option>
                                        </select>
                                        {!isReadOnly && (
                                            <div className="absolute right-[clamp(6px,1.5vmin,16px)] top-1/2 -translate-y-1/2 pointer-events-none text-rose-300">
                                                <Plus size={10} className="rotate-45" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Sede Origen</label>
                                    <select disabled={isReadOnly} value={docBranchId} onChange={e => setDocBranchId(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] text-rose-900 font-black uppercase text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-purple-600 shadow-inner">
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                {docType === 'transfer_out' || docType === 'transfer_in' ? (
                                    <div className="flex flex-col gap-1.5 animate-in slide-in-from-left-2">
                                        <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-amber-500 uppercase tracking-widest ml-1">Sede Relacionada</label>
                                        <select disabled={isReadOnly} required value={docToBranchId} onChange={e => setDocToBranchId(e.target.value)} className="w-full bg-white border border-amber-900/50 rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] text-rose-900 font-black uppercase text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-amber-500 shadow-inner">
                                            <option value="">SELECCIONAR...</option>
                                            {branches.filter(b => b.id !== docBranchId).map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Tercero / Prov</label>
                                        <input disabled={isReadOnly} value={docProvider} onChange={e => setDocProvider(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] uppercase outline-none focus:border-purple-600 shadow-inner" placeholder="NOMBRE..." />
                                    </div>
                                )}

                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Ref / Factura</label>
                                    <input disabled={isReadOnly} value={docReference} onChange={e => setDocReference(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] text-rose-900 font-mono font-black text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-purple-600 shadow-inner" placeholder="DOC-000..." />
                                </div>

                                <div className="flex flex-col gap-1.5 lg:col-span-2">
                                    <label className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Motivo / Observación</label>
                                    <input disabled={isReadOnly} value={docReason} onChange={e => setDocReason(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] text-rose-900 font-bold text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-purple-600 shadow-inner" placeholder="DETALLE DE LA OPERACIÓN..." />
                                </div>
                            </div>
                        </div>

                        {/* GRID ERP */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-rose-muted/30 relative">
                            <table className="w-full text-left border-collapse table-fixed">
                                <thead className="bg-rose-muted/80 backdrop-blur-md text-rose-400 font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest border-b border-rose-border sticky top-0 z-50">
                                    <tr>
                                        <th className="p-[clamp(4px,1vmin,16px)] w-16 text-center">#</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] w-[45%]">Artículo</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] w-[clamp(60px,15vmin,160px)] text-center">Cantidad</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] w-[clamp(60px,15vmin,160px)] text-center">Costo Unit.</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] w-[clamp(80px,18vmin,192px)] text-center">Total Línea</th>
                                        {!isReadOnly && <th className="p-[clamp(4px,1vmin,16px)] w-16"></th>}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rose-border">
                                    {lines.map((line, idx) => (
                                        <tr key={line.id} className="group hover:bg-rose-muted">
                                            <td className="p-[clamp(4px,1vmin,16px)] text-center text-rose-300 font-mono text-[clamp(9px,1.8vmin,12px)]">{idx + 1}</td>
                                            <td className="p-[clamp(4px,1vmin,16px)] relative">
                                                {line.itemId ? (
                                                    <div className={`flex items-center gap-[clamp(4px,1vmin,16px)] bg-rose-muted/40 p-[clamp(4px,1vmin,12px)] rounded-[clamp(8px,2vmin,24px)] border border-rose-border ${isReadOnly ? 'opacity-80' : ''}`}>
                                                        <div className="w-[clamp(24px,6vmin,40px)] h-[clamp(24px,6vmin,40px)] rounded-[clamp(6px,1.5vmin,12px)] bg-rose-muted flex items-center justify-center text-rose-400 shadow-inner"><Package size={16} /></div>
                                                        <div className="text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] uppercase truncate flex-1 tracking-tight">{line.itemName}</div>
                                                        {!isReadOnly && <button onClick={() => updateLine(line.id, { itemId: '', itemName: '' })} className="p-[clamp(2px,0.5vmin,8px)] text-rose-400 hover:text-destructive transition-colors"><X size={12} /></button>}
                                                    </div>
                                                ) : (
                                                    <div className="relative">
                                                        <Search className="absolute left-[clamp(6px,1.5vmin,16px)] top-1/2 -translate-y-1/2 text-rose-300" size={14} />
                                                        <input
                                                            ref={el => { if (el) inputRefs.current[`${line.id}-search`] = el; }}
                                                            value={activeSearchLineId === line.id ? gridSearch : ''}
                                                            onChange={e => { setGridSearch(e.target.value); setActiveSearchLineId(line.id); }}
                                                            onFocus={() => setActiveSearchLineId(line.id)}
                                                            className={`w-full bg-white border rounded-[clamp(10px,2.5vmin,24px)] py-[clamp(6px,1.5vmin,16px)] pl-[clamp(28px,7vmin,48px)] pr-[clamp(8px,2vmin,16px)] text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-blue-600 transition-all ${focusedField?.id === line.id && focusedField?.field === 'search' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'border-rose-border'}`}
                                                            placeholder="BUSCAR PRODUCTO..."
                                                        />
                                                        {activeSearchLineId === line.id && gridSearch.length > 0 && (
                                                            <div className="absolute top-full left-0 w-full bg-rose-muted border border-rose-border rounded-[clamp(10px,2.5vmin,24px)] mt-1 shadow-2xl z-[100] max-h-64 overflow-y-auto animate-in slide-in-from-top-2">
                                                                {catalog.filter(i => i.type === 'product' && (i.name || '').toLowerCase().includes((gridSearch || '').toLowerCase())).map(item => (
                                                                    <button key={item.id} onClick={() => selectProductForLine(line.id, item)} className="w-full p-[clamp(6px,1.5vmin,16px)] text-left hover:bg-blue-600 border-b border-rose-border last:border-0 flex justify-between items-center group/item transition-colors">
                                                                        <div><div className="text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] uppercase tracking-tight">{item.name}</div><div className="text-[clamp(7px,1.2vmin,9px)] font-bold text-rose-400 group-hover/item:text-blue-200 uppercase tracking-widest">{item.category}</div></div>
                                                                        <div className="text-[clamp(11px,2.5vmin,14px)] font-black text-emerald-500 font-mono">${item.price.toFixed(2)}</div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-[clamp(4px,1vmin,16px)]">
                                                <input
                                                    disabled={isReadOnly}
                                                    ref={el => { if (el) inputRefs.current[`${line.id}-qty`] = el; }}
                                                    type="number"
                                                    value={line.qty || ''}
                                                    onChange={e => updateLine(line.id, { qty: parseInt(e.target.value) || 0 })}
                                                    onKeyDown={e => handleKeyDown(e, line.id, 'qty')}
                                                    className={`w-full bg-white border rounded-[clamp(10px,2.5vmin,24px)] p-[clamp(6px,1.5vmin,16px)] text-center text-rose-900 font-black font-mono text-[clamp(14px,3.5vmin,22px)] outline-none transition-all ${isReadOnly ? 'border-rose-border bg-transparent cursor-default' : (focusedField?.id === line.id && focusedField?.field === 'qty' ? 'border-amber-500 ring-4 ring-amber-500/10 animate-pulse' : 'border-rose-border focus:border-purple-600')}`}
                                                    placeholder="0"
                                                />
                                            </td>
                                            <td className="p-[clamp(4px,1vmin,16px)]">
                                                <div className={`w-full bg-rose-muted border rounded-[clamp(10px,2.5vmin,24px)] p-[clamp(6px,1.5vmin,16px)] text-center font-black font-mono text-[clamp(14px,3.5vmin,18px)] shadow-inner ${isReadOnly ? 'text-rose-500 border-rose-border' : 'text-rose-500 border-rose-border'}`}>
                                                    ${line.unitCost.toFixed(2)}
                                                </div>
                                            </td>
                                            <td className="p-[clamp(4px,1vmin,16px)]">
                                                <div className="relative group">
                                                    <DollarSign className={`absolute left-[clamp(6px,1.5vmin,16px)] top-1/2 -translate-y-1/2 transition-colors ${isReadOnly ? 'text-rose-200' : 'text-rose-300 group-focus-within:text-emerald-500'}`} size={14} />
                                                    <input
                                                        disabled={docType === 'adjustment_out' || docType === 'transfer_out' || isReadOnly}
                                                        ref={el => { if (el) inputRefs.current[`${line.id}-total`] = el; }}
                                                        type="number"
                                                        step="0.01"
                                                        value={line.lineTotal || ''}
                                                        onChange={e => updateLine(line.id, { lineTotal: parseFloat(e.target.value) || 0 })}
                                                        onKeyDown={e => handleKeyDown(e, line.id, 'total')}
                                                        className={`w-full border rounded-[clamp(10px,2.5vmin,24px)] py-[clamp(6px,1.5vmin,16px)] pl-[clamp(24px,6vmin,40px)] pr-[clamp(8px,2vmin,16px)] text-right text-rose-900 font-black font-mono text-[clamp(14px,3.5vmin,22px)] outline-none transition-all ${(docType === 'adjustment_out' || docType === 'transfer_out' || isReadOnly) ? 'bg-rose-muted border-rose-border text-rose-400 cursor-default' : (focusedField?.id === line.id && focusedField?.field === 'total' ? 'border-emerald-500 ring-4 ring-emerald-500/10 animate-pulse bg-white' : 'border-rose-border focus:border-purple-600 bg-white')}`}
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </td>
                                            {!isReadOnly && (
                                                <td className="p-[clamp(4px,1vmin,16px)] text-center">
                                                    <button onClick={() => setLines(lines.filter(l => l.id !== line.id))} className="p-[clamp(2px,0.5vmin,8px)] text-rose-200 hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16} /></button>
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* PIE DE DOCUMENTO OPTIMIZADO */}
                        <div className="p-[clamp(6px,1.5vmin,20px)] border-t border-rose-border bg-rose-muted flex items-center justify-between shrink-0">
                            <div className="flex gap-[clamp(6px,1.5vmin,32px)] items-center">
                                <div className="flex flex-col"><span className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Líneas</span><span className="text-[clamp(14px,3.5vmin,22px)] font-black text-rose-900 font-mono">{lines.filter(l => l.itemId).length}</span></div>
                                <div className="flex flex-col"><span className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Total Doc.</span><span className="text-[clamp(14px,3.5vmin,22px)] font-black text-emerald-500 font-mono tracking-tighter">${docTotal.toFixed(2)}</span></div>
                                <div className="h-[clamp(12px,3vmin,32px)] w-px bg-rose-border ml-[clamp(2px,0.5vmin,8px)]"></div>
                                <div className="flex flex-col"><span className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Responsable</span><span className="text-[clamp(9px,1.8vmin,11px)] font-black text-rose-500 uppercase tracking-tight">{currentUser?.name}</span></div>
                            </div>
                            <div className="flex gap-[clamp(4px,1vmin,12px)]">
                                <button onClick={() => setIsModalOpen(false)} className={`px-[clamp(8px,2vmin,24px)] py-[clamp(4px,1vmin,10px)] bg-white text-rose-400 rounded-[clamp(8px,2vmin,16px)] font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest hover:text-rose-900 transition-all border border-rose-border ${isReadOnly ? 'px-[clamp(16px,4vmin,48px)] py-[clamp(6px,1.5vmin,12px)] text-[clamp(9px,1.8vmin,12px)]' : ''}`}>
                                    {isReadOnly ? 'Cerrar Consulta' : 'Descartar'}
                                </button>
                                {!isReadOnly && (
                                    <button onClick={processDocument} className="px-[clamp(10px,2.5vmin,32px)] py-[clamp(4px,1vmin,10px)] bg-purple-600 hover:bg-purple-500 text-white rounded-[clamp(8px,2vmin,16px)] font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest shadow-xl transition-all border-b-2 border-purple-800 active:border-b-0 flex items-center gap-[clamp(4px,1vmin,8px)] active:scale-95">
                                        <CheckCircle2 size={14} /> Procesar Movimiento
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL RECEPCIÓN DE TRASLADOS PENDIENTES (Capa z-650) */}
            {isReceiveModalOpen && (
                <div className="fixed inset-0 z-[650] bg-rose-bg/95 backdrop-blur-md flex items-center justify-center p-[clamp(6px,1.5vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-4xl h-[70vh] rounded-[clamp(1.5rem,4vmin,3rem)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-[clamp(8px,2vmin,24px)] border-b border-rose-border bg-rose-muted flex justify-between items-center">
                            <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)]">
                                <div className="bg-amber-600/20 p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(12px,2.5vmin,24px)] text-amber-500 border border-amber-500/20"><Truck size={20} /></div>
                                <div>
                                    <h3 className="text-[clamp(14px,3.5vmin,22px)] font-black text-rose-900 uppercase tracking-tight leading-none">Validación de Mercadería</h3>
                                    <p className="text-[clamp(7px,1.2vmin,9px)] font-bold text-rose-400 uppercase tracking-widest mt-[clamp(2px,0.5vmin,6px)]">Confirma la entrada de stock a esta sede</p>
                                </div>
                            </div>
                            <button onClick={() => setIsReceiveModalOpen(false)} className="p-[clamp(4px,1vmin,8px)] text-rose-500 hover:text-rose-900"><X size={20} /></button>
                        </div>

                        <div
                            ref={receiveScroll.ref}
                            {...receiveScroll.props}
                            className="flex-1 overflow-y-auto hide-scrollbar p-[clamp(8px,2vmin,24px)] bg-rose-muted/20"
                        >
                            {pendingTransfers.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-rose-300 opacity-30">
                                    <CheckCircle2 size={40} strokeWidth={1} />
                                    <span className="text-[clamp(8px,1.5vmin,10px)] font-black uppercase mt-[clamp(8px,2vmin,16px)]">Todo al día</span>
                                </div>
                            ) : (
                                <div className="space-y-[clamp(4px,1vmin,12px)]">
                                    {pendingTransfers.map(m => (
                                        <div key={m.id} className="bg-white border border-rose-border p-[clamp(6px,1.5vmin,16px)] rounded-[clamp(12px,2.5vmin,24px)] flex items-center justify-between group hover:border-amber-500/30 transition-all">
                                            <div className="flex items-center gap-[clamp(6px,1.5vmin,20px)]">
                                                <div className="w-[clamp(32px,8vmin,48px)] h-[clamp(32px,8vmin,48px)] rounded-[clamp(8px,2vmin,12px)] bg-rose-muted flex items-center justify-center text-amber-500/50 border border-rose-border group-hover:text-amber-500 transition-colors shadow-inner"><Package size={18} /></div>
                                                <div>
                                                    <div className="font-black text-rose-900 uppercase text-[clamp(11px,2.5vmin,14px)]">{m.itemName}</div>
                                                    <div className="text-[clamp(7px,1.2vmin,9px)] font-black text-rose-400 uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)] flex items-center gap-[clamp(4px,1vmin,8px)]">
                                                        <span>Enviado: {formatDateES(m.date)}</span>
                                                        <span className="text-rose-border">•</span>
                                                        <span>Origen: {branches.find(b => b.id === m.relatedBranchId)?.name || 'Desconocido'}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-[clamp(6px,1.5vmin,32px)]">
                                                <div className="text-center">
                                                    <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest mb-[clamp(1px,0.3vmin,2px)]">Cantidad</div>
                                                    <div className="text-[clamp(18px,4.5vmin,28px)] font-black text-rose-900 font-mono tracking-tighter">{m.quantity} UN</div>
                                                </div>
                                                <button
                                                    onClick={() => { if (confirm("¿Confirmas que has recibido y contado físicamente esta mercadería?")) confirmTransferIn(m.id); }}
                                                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-[clamp(8px,2vmin,24px)] py-[clamp(4px,1vmin,12px)] rounded-[clamp(8px,2vmin,16px)] font-black text-[clamp(8px,1.5vmin,10px)] uppercase tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)] shadow-lg transition-all active:scale-95 border-b-2 border-emerald-800 active:border-b-0"
                                                >
                                                    <CheckCircle2 size={14} /> Confirmar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL KARDEX: AUDITORÍA POR SUCURSAL (Capa z-600) */}
            {isKardexModalOpen && selectedItem && (
                <div className="fixed inset-0 z-[600] bg-rose-bg/95 backdrop-blur-md flex items-center justify-center p-[clamp(6px,1.5vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-6xl h-[85vh] rounded-[clamp(1.5rem,4vmin,2.5rem)] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in duration-200">
                        <div className="p-[clamp(8px,2vmin,24px)] border-b border-rose-border bg-rose-muted flex flex-col gap-[clamp(4px,1vmin,16px)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)]">
                                    <div className="w-[clamp(28px,7vmin,48px)] h-[clamp(28px,7vmin,48px)] rounded-[clamp(12px,2.5vmin,24px)] bg-purple-600/20 flex items-center justify-center text-purple-400 border border-purple-500/20"><History size={18} /></div>
                                    <div><h2 className="text-[clamp(14px,3.5vmin,22px)] font-black text-rose-900 uppercase tracking-tight">{selectedItem.name}</h2><p className="text-[clamp(8px,1.5vmin,10px)] font-bold text-rose-400 uppercase tracking-widest">Auditoría de Kardex Cronológico</p></div>
                                </div>
                                <button onClick={() => setIsKardexModalOpen(false)} className="p-[clamp(4px,1vmin,8px)] text-rose-500 hover:text-rose-900 transition-all hover:rotate-90"><X size={20} /></button>
                            </div>

                            {/* SELECTOR DE SUCURSAL PARA FILTRO AUDITORÍA */}
                            <div className="flex items-center justify-end gap-[clamp(4px,1vmin,12px)] bg-rose-muted/50 p-[clamp(4px,1vmin,8px)] rounded-[clamp(12px,2.5vmin,24px)] border border-rose-border self-end mr-[clamp(2px,0.5vmin,8px)]">
                                <div className="flex items-center gap-[clamp(4px,1vmin,8px)] text-rose-400">
                                    <Filter size={10} />
                                    <span className="text-[clamp(7px,1.2vmin,8px)] font-black uppercase tracking-widest">Filtrar por Sede:</span>
                                </div>
                                <select
                                    value={kardexBranchId}
                                    onChange={e => setKardexBranchId(e.target.value)}
                                    className="bg-rose-muted border border-rose-border rounded-[clamp(4px,1vmin,8px)] py-[clamp(2px,0.5vmin,6px)] px-[clamp(4px,1vmin,12px)] text-[clamp(8px,1.5vmin,10px)] font-black text-rose-900 uppercase outline-none focus:border-purple-600 transition-all cursor-pointer shadow-inner"
                                >
                                    <option value="">SELECCIONAR SEDE...</option>
                                    {branches.map(b => (
                                        <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div
                            ref={kardexScroll.ref}
                            {...kardexScroll.props}
                            className="flex-1 overflow-y-auto hide-scrollbar p-[clamp(8px,2vmin,24px)] bg-rose-muted/20 cursor-grab active:cursor-grabbing"
                        >
                            <table className="w-full text-left">
                                <thead className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest border-b border-rose-border sticky top-0 bg-white z-10">
                                    <tr>
                                        <th className="p-[clamp(4px,1vmin,16px)]">Fecha / Hora</th>
                                        <th className="p-[clamp(4px,1vmin,16px)]">Operación</th>
                                        <th className="p-[clamp(4px,1vmin,16px)]">Estado</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] text-center">Cantidad</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] text-center">Stock Result.</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] text-right">Costo Unit.</th>
                                        <th className="p-[clamp(4px,1vmin,16px)] text-center">Documento</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-rose-border">
                                    {(inventoryMovements || [])
                                        .filter(m => m && m.itemId === selectedId && m.branchId === kardexBranchId)
                                        .sort((a, b) => {
                                            const dA = a.date ? new Date(a.date).getTime() : 0;
                                            const dB = b.date ? new Date(b.date).getTime() : 0;
                                            return dA - dB;
                                        })
                                        .map(m => {
                                            if (!m) return null;
                                            const isPositive = ['initial', 'purchase', 'adjustment_in', 'transfer_in'].includes(m.type);
                                            const dateStr = m.date ? formatDateTimeES(m.date) : 'Fecha Inválida';
                                            const qty = Number(m.quantity || 0);
                                            const stock = Number(m.newStock || 0);
                                            const cost = Number(m.unitCost || 0);

                                            return (
                                                <tr key={m.id} className="group hover:bg-rose-muted transition-all">
                                                    <td className="p-[clamp(4px,1vmin,16px)] text-rose-400 font-mono text-[clamp(8px,1.5vmin,10px)]">{dateStr}</td>
                                                    <td className="p-[clamp(4px,1vmin,16px)] text-[clamp(9px,1.8vmin,12px)] font-black text-rose-900 uppercase">{m.type || 'N/A'}</td>
                                                    <td className="p-[clamp(4px,1vmin,16px)]">
                                                        <span className={`text-[clamp(7px,1.2vmin,9px)] font-black uppercase px-[clamp(4px,1vmin,8px)] py-[clamp(1px,0.3vmin,2px)] rounded-full ${m.status === 'completed' || !m.status ? 'bg-emerald-900/20 text-emerald-500' : 'bg-amber-900/20 text-amber-500'}`}>
                                                            {m.status || 'completed'}
                                                        </span>
                                                    </td>
                                                    <td className={`p-[clamp(4px,1vmin,16px)] text-center font-mono font-black text-[clamp(11px,2.5vmin,14px)] ${isPositive ? 'text-emerald-500' : 'text-destructive'}`}>
                                                        {isPositive ? '+' : '-'}{qty}
                                                    </td>
                                                    <td className="p-[clamp(4px,1vmin,16px)] text-center font-mono font-black text-[clamp(11px,2.5vmin,14px)] text-purple-400">{stock}</td>
                                                    <td className="p-[clamp(4px,1vmin,16px)] text-right font-mono font-black text-[clamp(11px,2.5vmin,14px)] text-rose-500">${cost.toFixed(2)}</td>
                                                    <td className="p-[clamp(4px,1vmin,16px)] text-center">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleViewMovementDetail(m); }}
                                                            className="p-[clamp(4px,1vmin,8px)] bg-blue-600/10 text-blue-500 hover:bg-blue-600 hover:text-white rounded-[clamp(4px,1vmin,8px)] transition-all shadow-md group-hover:scale-110 active:scale-95"
                                                            title="Ver Documento ERP"
                                                        >
                                                            <Eye size={14} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    {(!kardexBranchId || (inventoryMovements || []).filter(m => m && m.itemId === selectedId && m.branchId === kardexBranchId).length === 0) && (
                                        <tr><td colSpan={7} className="p-[clamp(24px,6vmin,80px)] text-center text-rose-300 italic font-black uppercase tracking-widest opacity-30">{!kardexBranchId ? 'Selecciona una sede para auditar' : 'Sin movimientos registrados'}</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
