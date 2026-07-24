import React, { useState, useMemo, useRef } from 'react';
import { useBarber } from '../context/BarberContext';
import {
    Search, Plus, FileSpreadsheet, Edit, X, UserPlus,
    Mail, Calendar, FileText, Info, AlertCircle, CheckCircle, Download, FileCheck, Star, Trophy, Gift
} from 'lucide-react';
import { formatDateES } from '../utils/dates';
import { Client } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

export const ClientManager = () => {
    const { clients, addClient, updateClient, config } = useBarber();
    const scroll = useDragScroll();
    const [search, setSearch] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [editingClient, setEditingClient] = useState<Client | null>(null);

    const [importCount, setImportCount] = useState(0);
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [notes, setNotes] = useState('');
    const [referrerSearch, setReferrerSearch] = useState('');
    const [selectedReferrerId, setSelectedReferrerId] = useState<string | undefined>(undefined);

    const filtered = useMemo(() => {
        const lower = search.toLowerCase();
        return clients.filter(c =>
            c.name.toLowerCase().includes(lower) ||
            (c.phone && c.phone.includes(lower)) ||
            (c.email && c.email.toLowerCase().includes(lower))
        );
    }, [clients, search]);

    const filteredReferrers = useMemo(() => {
        if (referrerSearch.length < 1) return [];
        return clients.filter(c => c.name.toLowerCase().includes(referrerSearch.toLowerCase())).slice(0, 5);
    }, [clients, referrerSearch]);

    const handleOpenModal = (client?: Client) => {
        if (client) {
            setEditingClient(client);
            setName(client.name); setPhone(client.phone || ''); setEmail(client.email || '');
            setBirthDate(client.birthDate || ''); setNotes(client.notes || '');
            setReferrerSearch(client.referredBy ? (clients.find(c => c.id === client.referredBy)?.name || '') : '');
            setSelectedReferrerId(client.referredBy);
        } else {
            setEditingClient(null); setName(''); setPhone(''); setEmail('');
            setBirthDate(''); setNotes(''); setReferrerSearch(''); setSelectedReferrerId(undefined);
        }
        setIsModalOpen(true);
    };

    const resetImport = () => { setImportCount(0); setFileName(''); };
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { setFileName(file.name); setImportCount(Math.floor(Math.random() * 50) + 5); }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const client: Client = {
            id: editingClient?.id || crypto.randomUUID(), name, phone: phone || undefined,
            email: email || undefined, birthDate: birthDate || undefined,
            notes: notes || undefined, referredBy: selectedReferrerId || undefined,
            visits: editingClient?.visits || 0, points: editingClient?.points || 0,
        };
        if (editingClient) updateClient(client);
        else addClient(client);
        setIsModalOpen(false);
    };

    return (
        <div className="h-full flex flex-col bg-rose-bg p-[clamp(6px,1.5vmin,24px)] animate-in fade-in overflow-hidden">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-[clamp(6px,1.5vmin,16px)] mb-[clamp(6px,1.5vmin,20px)] shrink-0">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[clamp(6px,1.5vmin,16px)] w-full sm:w-auto">
                    <div className="relative w-full sm:w-[clamp(180px,30vmin,280px)]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" size={14} />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl py-[clamp(6px,1.5vmin,12px)] pl-9 sm:pl-10 pr-3 text-[clamp(10px,2vmin,13px)] text-rose-900 focus:border-teal-500 outline-none transition-all shadow-inner" placeholder="Buscar..." />
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                        <button onClick={() => setIsImportModalOpen(true)} className="flex-1 sm:flex-none bg-white text-rose-500 px-[clamp(8px,2vmin,24px)] py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black text-[clamp(9px,2vmin,10px)] uppercase tracking-widest border border-rose-border hover:text-rose-900 transition-all flex items-center justify-center gap-2">
                            <FileSpreadsheet size={12} /> Importar
                        </button>
                        <button onClick={() => handleOpenModal()} className="flex-1 sm:flex-none bg-teal-600 hover:bg-teal-500 text-white px-[clamp(8px,2vmin,32px)] py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black text-[clamp(9px,2vmin,10px)] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border-b-4 border-teal-800 active:border-b-0">
                            <Plus size={14} /> Nuevo
                        </button>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div ref={scroll.ref} {...scroll.props} className="flex-1 overflow-auto hide-scrollbar bg-white/80 rounded-xl sm:rounded-2xl lg:rounded-[2rem] border border-rose-border">
                    <table className="w-full text-left border-collapse min-w-[500px]">
                        <thead className="bg-white text-rose-400 font-black uppercase text-[clamp(8px,1.5vmin,10px)] sticky top-0 z-10 border-b border-rose-border tracking-[0.2em] shadow-sm">
                            <tr>
                                <th className="p-[clamp(8px,2vmin,20px)]">Cliente</th>
                                <th className="p-[clamp(8px,2vmin,20px)] text-center hidden sm:table-cell">Cumpleaños</th>
                                <th className="p-[clamp(8px,2vmin,20px)] hidden md:table-cell">Fidelidad</th>
                                <th className="p-[clamp(8px,2vmin,20px)] text-center w-16 sm:w-20">Acción</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-border">
                            {filtered.length === 0 ? (
                                <tr><td colSpan={4} className="p-[clamp(24px,6vmin,80px)] text-center text-rose-400 italic font-bold uppercase tracking-widest opacity-30">Sin clientes</td></tr>
                            ) : filtered.map(c => {
                                const threshold = config.loyalty?.redemptionThreshold || 5;
                                const currentPoints = c.points || 0;
                                const progress = Math.min(100, (currentPoints / threshold) * 100);
                                const canRedeem = currentPoints >= threshold;
                                return (
                                    <tr key={c.id} className="hover:bg-rose-muted transition-colors group">
                                        <td className="p-[clamp(8px,2vmin,20px)]">
                                            <div className="flex items-center gap-2 sm:gap-4">
                                                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-rose-muted flex items-center justify-center text-rose-400 group-hover:bg-teal-600/20 group-hover:text-teal-500 transition-all shrink-0">
                                                    <UserPlus size={12} />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-black text-rose-900 text-[clamp(11px,2.5vmin,14px)] uppercase tracking-tight truncate">{c.name}</div>
                                                    <div className="text-[clamp(9px,1.8vmin,10px)] text-rose-400 font-bold mt-0.5 truncate">
                                                        {c.phone || 'Sin teléfono'} {c.email && <span className="hidden xs:inline">· {c.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-[clamp(8px,2vmin,20px)] text-center hidden sm:table-cell">
                                            {c.birthDate ? (
                                                <div className="inline-flex items-center gap-1 sm:gap-2 px-1.5 sm:px-3 py-1 bg-white rounded-lg border text-[clamp(9px,2vmin,10px)] text-rose-500 font-mono">
                                                    <Calendar size={10} className="text-rose-400" />
                                                    {formatDateES(c.birthDate).toUpperCase()}
                                                </div>
                                            ) : <span className="text-rose-border text-[clamp(9px,2vmin,10px)] font-black italic">N/A</span>}
                                        </td>
                                        <td className="p-[clamp(8px,2vmin,20px)] hidden md:table-cell">
                                            <div className="flex flex-col gap-1 max-w-[200px]">
                                                <div className="flex justify-between items-end">
                                                    <div className="flex items-center gap-1">
                                                        <Star size={10} className={canRedeem ? 'text-yellow-500 fill-yellow-500' : 'text-rose-300'} />
                                                        <span className={`text-[clamp(8px,1.5vmin,9px)] font-black uppercase tracking-widest ${canRedeem ? 'text-yellow-500' : 'text-rose-400'}`}>{currentPoints}/{threshold}</span>
                                                    </div>
                                                    {canRedeem ? <span className="text-[clamp(7px,1.2vmin,8px)] font-black bg-yellow-600 text-black px-1.5 sm:px-2 py-0.5 rounded-md animate-pulse">¡Premio!</span> :
                                                        <span className="text-[clamp(7px,1.2vmin,8px)] font-bold text-rose-400 uppercase">Faltan {threshold - currentPoints}</span>}
                                                </div>
                                                <div className="h-1 w-full bg-white rounded-full overflow-hidden border shadow-inner">
                                                    <div className={`h-full transition-all duration-1000 ${canRedeem ? 'bg-yellow-500' : 'bg-teal-600'}`} style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-[clamp(8px,2vmin,20px)] text-center">
                                            <button onClick={() => handleOpenModal(c)} className="p-[clamp(6px,1.5vmin,12px)] bg-rose-muted hover:bg-rose-surface hover:text-rose-900 rounded-lg sm:rounded-xl text-rose-500 transition-all shadow-md active:scale-95" title="Editar">
                                                <Edit size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
            </div>

            {/* Modal Cliente */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[500] bg-rose-bg/95 backdrop-blur-md flex items-center justify-center p-[clamp(8px,2vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-[min(90vw,500px)] rounded-[clamp(16px,3vmin,40px)] shadow-2xl overflow-hidden animate-in zoom-in max-h-[90vh] flex flex-col">
                        <div className="p-[clamp(12px,3vmin,24px)] border-b bg-rose-muted flex justify-between items-center shrink-0">
                            <div className="flex items-center gap-2 sm:gap-3">
                                <div className="bg-teal-600/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-teal-500"><UserPlus size={18} /></div>
                                <h2 className="text-[clamp(16px,3.5vmin,20px)] font-black text-rose-900 uppercase tracking-tight">{editingClient ? 'Editar' : 'Nuevo'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 bg-rose-muted text-rose-500 hover:text-rose-900 rounded-full"><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-[clamp(12px,3vmin,32px)] space-y-[clamp(8px,2vmin,24px)] overflow-y-auto">
                            <div><label className="text-[clamp(9px,2vmin,10px)] font-black text-rose-400 uppercase block mb-1 ml-1">Nombre *</label>
                                <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border rounded-xl p-[clamp(8px,2vmin,16px)] text-rose-900 font-bold text-[clamp(12px,2.5vmin,14px)] outline-none focus:border-teal-500 shadow-inner" placeholder="Nombre" /></div>
                            <div className="grid grid-cols-2 gap-[clamp(8px,2vmin,16px)]">
                                <div><label className="text-[clamp(9px,2vmin,10px)] font-black text-rose-400 uppercase block mb-1 ml-1">Teléfono</label>
                                    <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border rounded-xl p-[clamp(8px,2vmin,16px)] text-rose-900 font-bold text-[clamp(12px,2.5vmin,14px)] outline-none focus:border-teal-500 shadow-inner font-mono" placeholder="7777-8888" type="tel" /></div>
                                <div><label className="text-[clamp(9px,2vmin,10px)] font-black text-teal-500 uppercase block mb-1 ml-1">Cumpleaños</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-400" size={14} />
                                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full bg-white border rounded-xl py-[clamp(8px,2vmin,16px)] pl-9 sm:pl-11 pr-3 text-rose-900 font-bold outline-none focus:border-teal-500 shadow-inner font-mono text-[clamp(12px,2.5vmin,14px)]" />
                                    </div></div>
                            </div>
                            <div><label className="text-[clamp(9px,2vmin,10px)] font-black text-rose-400 uppercase block mb-1 ml-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-400" size={14} />
                                    <input value={email} onChange={e => setEmail(e.target.value.toLowerCase())} className="w-full bg-white border rounded-xl py-[clamp(8px,2vmin,16px)] pl-9 sm:pl-11 pr-3 text-rose-900 font-bold outline-none focus:border-teal-500 shadow-inner text-[clamp(12px,2.5vmin,14px)]" placeholder="email@correo.com" type="email" />
                                </div></div>
                            <div className="relative"><label className="text-[clamp(9px,2vmin,10px)] font-black text-blue-500 uppercase block mb-1 ml-1 flex items-center gap-1"><Gift size={10} /> Referido por</label>
                                <div className="relative">
                                    <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-300" size={12} />
                                    <input value={referrerSearch} onChange={e => { setReferrerSearch(e.target.value); setSelectedReferrerId(undefined); }} className={`w-full bg-white border rounded-xl py-[clamp(8px,2vmin,16px)] pl-9 sm:pl-11 pr-3 text-rose-900 font-bold outline-none shadow-inner text-[clamp(12px,2.5vmin,14px)] ${selectedReferrerId ? 'border-emerald-500/50' : 'focus:border-blue-600'}`} placeholder="Buscar..." />
                                    {selectedReferrerId && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={14} />}
                                </div>
                                {referrerSearch.length > 0 && !selectedReferrerId && filteredReferrers.length > 0 && (
                                    <div className="absolute top-full left-0 w-full bg-rose-muted border rounded-xl mt-1 shadow-2xl z-[150] max-h-32 overflow-y-auto">
                                        {filteredReferrers.map(r => (
                                            <button key={r.id} type="button" onClick={() => { setSelectedReferrerId(r.id); setReferrerSearch(r.name); }} className="w-full p-[clamp(6px,1.5vmin,12px)] text-left text-[clamp(9px,2vmin,10px)] font-bold text-rose-900 hover:bg-blue-600 border-b last:border-0 flex justify-between items-center">
                                                <span>{r.name.toUpperCase()}</span>
                                                <span className="text-[clamp(7px,1.5vmin,8px)] text-rose-400 font-mono">{r.phone}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div><label className="text-[clamp(9px,2vmin,10px)] font-black text-rose-400 uppercase block mb-1 ml-1 flex items-center gap-1"><FileText size={10} /> Notas</label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)} className="w-full bg-white border rounded-xl p-[clamp(8px,2vmin,16px)] text-rose-900 outline-none focus:border-teal-500 shadow-inner h-[clamp(48px,8vmin,96px)] resize-none text-[clamp(12px,2.5vmin,14px)]" placeholder="Preferencias..." /></div>
                            <div className="flex gap-[clamp(8px,2vmin,16px)] pt-2">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-rose-muted text-rose-500 py-[clamp(8px,2vmin,16px)] rounded-xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-widest transition-all">Cancelar</button>
                                <button type="submit" className="flex-1 bg-teal-600 hover:bg-teal-500 text-white py-[clamp(8px,2vmin,16px)] rounded-xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-widest shadow-lg active:scale-95 transition-all border-b-4 border-teal-800 active:border-b-0">{editingClient ? 'Actualizar' : 'Guardar'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Importar */}
            {isImportModalOpen && (
                <div className="fixed inset-0 z-[500] bg-rose-bg/95 backdrop-blur-md flex items-center justify-center p-[clamp(8px,2vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-[min(90vw,450px)] rounded-[clamp(16px,3vmin,40px)] shadow-2xl overflow-hidden animate-in zoom-in">
                        <div className="p-[clamp(12px,3vmin,20px)] border-b bg-rose-muted flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-1.5 sm:p-2 rounded-lg sm:rounded-xl text-blue-500"><FileSpreadsheet size={16} /></div>
                                <div><h2 className="text-[clamp(14px,3.5vmin,18px)] font-black text-rose-900 uppercase tracking-tight">Importar</h2><p className="text-rose-400 text-[clamp(8px,1.5vmin,9px)] mt-0.5 font-bold uppercase tracking-widest">Migra tus clientes</p></div>
                            </div>
                            <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className="p-1.5 bg-rose-muted text-rose-500 hover:text-rose-900 rounded-full"><X size={14} /></button>
                        </div>
                        <div className="p-[clamp(12px,3vmin,20px)] space-y-3">
                            <div className="space-y-1.5 sm:space-y-2">
                                <h3 className="text-rose-400 font-black text-[clamp(8px,1.5vmin,9px)] uppercase flex items-center gap-2"><Info size={10} className="text-blue-500" /> Formato</h3>
                                <ImportTip step="1" text="Columnas: Nombre, Teléfono, Email, Fecha Nac." />
                                <ImportTip step="2" text="Encabezados opcionales" />
                                <ImportTip step="3" text="Respetar orden de columnas" />
                            </div>
                            <div onClick={() => fileInputRef.current?.click()} className={`border-2 border-dashed rounded-2xl p-[clamp(12px,3vmin,20px)] flex flex-col items-center text-center cursor-pointer transition-all ${importCount > 0 ? 'border-emerald-500/50 bg-emerald-500/5' : 'hover:border-blue-500/50'}`}>
                                <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept=".csv,.xlsx,.xls" className="hidden" />
                                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mb-1 sm:mb-2 group-hover:scale-110 transition-transform ${importCount > 0 ? 'bg-emerald-600/20 text-emerald-500' : 'bg-blue-600/10 text-blue-500'}`}>
                                    {importCount > 0 ? <FileCheck size={14} /> : <FileSpreadsheet size={14} />}
                                </div>
                                {importCount > 0 ? (
                                    <><div className="font-black text-emerald-500 text-[clamp(10px,2.5vmin,12px)] uppercase">{fileName}</div><div className="text-[clamp(7px,1.5vmin,8px)] text-rose-500 font-bold mt-1 flex items-center gap-1"><CheckCircle size={8} /> {importCount} registros</div></>
                                ) : (
                                    <><div className="font-black text-rose-900 text-[clamp(10px,2.5vmin,12px)] uppercase">Subir archivo</div><p className="text-rose-400 text-[clamp(7px,1.5vmin,8px)] mt-1 font-bold">.csv, .xlsx</p></>
                                )}
                            </div>
                        </div>
                        <div className="p-[clamp(12px,3vmin,20px)] bg-rose-muted border-t flex gap-3">
                            <button onClick={() => { setIsImportModalOpen(false); resetImport(); }} className="flex-1 bg-white text-rose-400 py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black uppercase text-[clamp(9px,2vmin,10px)] tracking-widest hover:text-rose-900">Cancelar</button>
                            <button disabled={importCount === 0} className={`flex-1 py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black uppercase text-[clamp(9px,2vmin,10px)] tracking-widest shadow-xl transition-all ${importCount > 0 ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95' : 'bg-rose-muted text-rose-200 cursor-not-allowed'}`}>Procesar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const ImportTip = ({ step, text }: { step: string, text: string }) => (
    <div className="flex gap-2 sm:gap-3 items-start bg-rose-muted/50 p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-rose-border/40">
        <div className="w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-blue-600 flex items-center justify-center text-[clamp(6px,1.2vmin,8px)] font-black text-white shrink-0 mt-0.5">{step}</div>
        <p className="text-[clamp(8px,1.5vmin,9px)] text-rose-500 leading-tight font-bold uppercase">{text}</p>
    </div>
);
