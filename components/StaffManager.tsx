import React, { useState, useMemo, useEffect } from 'react';
import { useBarber } from '../context/BarberContext';
import { useStaff } from '../context/StaffContext';
import { useBranch } from '../context/BranchContext';
import { useSales } from '../context/SalesContext';
import { useTickets } from '../context/TicketsContext';
import { useAgenda } from '../context/AgendaContext';
import {
    Users, Plus, Edit, Shield, Save, RefreshCw,
    X, CheckCircle2, AlertCircle,
    Lock, Store, UserCog, ShieldCheck,
    AtSign, Briefcase, Search, UserMinus, ToggleLeft, ToggleRight,
    ShieldAlert, Pencil, Trash2
} from 'lucide-react';
import { User, Role } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

export const StaffManager = () => {
    const { users, addUser, updateUser, removeUser } = useStaff();
    const { branches } = useBranch();
    const { sales } = useSales();
    const { tickets } = useTickets();
    const { appointments } = useAgenda();
    const { currentUser, showToast } = useBarber();
    const formScroll = useDragScroll();

    const isSuperAdmin = currentUser?.role === 'admin' && !currentUser.branchId;
    const isBranchAdmin = currentUser?.role === 'admin' && !!currentUser.branchId;

    const [editingUserId, setEditingUserId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [username, setUsername] = useState('');
    const [role, setRole] = useState<Role>('estilista');
    const [pin, setPin] = useState('');
    const [branchId, setBranchId] = useState(isBranchAdmin ? (currentUser?.branchId || '') : '');
    const [active, setActive] = useState(true);
    const [canDoPos, setCanDoPos] = useState(false);
    const [telegramId, setTelegramId] = useState('');
    const [listSearch, setListSearch] = useState('');
    const showNotify = (type: 'success' | 'error', msg: string) => {
        showToast(type, type === 'success' ? 'Operación Exitosa' : 'Error', msg);
    };

    const resetForm = () => {
        setEditingUserId(null); setName(''); setUsername(''); setRole('estilista');
        setPin(''); setBranchId(isBranchAdmin ? (currentUser?.branchId || '') : ''); setActive(true); setCanDoPos(false); setTelegramId('');
    };

    const handleEdit = (user: User) => {
        if (user.id === 'u_admin' && currentUser?.id !== 'u_admin') { showNotify('error', 'Sin permisos'); return; }
        setEditingUserId(user.id); setName(user.name); setUsername(user.username || '');
        setRole(user.role); setPin(user.pin); setBranchId(user.branchId || ''); setActive(user.active !== false); setCanDoPos(!!user.canDoPos); setTelegramId(user.telegramId || '');
    };

    const handleDelete = (user: User) => {
        if (user.id === 'u_admin') { showNotify('error', 'No puede eliminarse'); return; }
        if (confirm(`Eliminar a ${user.name}?`)) { removeUser(user.id); showNotify('success', 'Eliminado'); if (editingUserId === user.id) resetForm(); }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: User = { id: editingUserId || crypto.randomUUID(), name, username, role, pin, branchId: branchId || undefined, active, canDoPos, telegramId: telegramId || undefined };
        if (editingUserId) { updateUser(payload); showNotify('success', 'Actualizado'); }
        else { await addUser(payload); showNotify('success', 'Registrado'); }
        resetForm();
    };

    const filteredUsers = useMemo(() => {
        const query = listSearch.toLowerCase();
        let baseList = users;
        if (isBranchAdmin) baseList = users.filter(u => u.branchId === currentUser?.branchId);
        const isSuperAdminLoggedIn = currentUser?.id === '1' || currentUser?.id === 'u_admin' || currentUser?.username === 'admin';
        if (!isSuperAdminLoggedIn) baseList = baseList.filter(u => u.id !== '1' && u.id !== 'u_admin' && u.username !== 'admin');
        return baseList.filter(u => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query) || u.role.toLowerCase().includes(query));
    }, [users, listSearch, isBranchAdmin, currentUser]);

    const activeCount = filteredUsers.filter(u => u.active !== false).length;
    const branchName = branches.find(b => b.id === currentUser?.branchId)?.name || 'Corporativo';

    const canUserBeDeleted = (userId: string) => {
        if (userId === currentUser?.id) return false;
        if (userId === '1' || userId === 'u_admin') return false;
        const hasSales = sales.some(s => s.barberId === userId);
        const hasTickets = tickets.some(t => t.barberId === userId);
        const hasAppointments = appointments.some(a => a.barberId === userId);
        return !hasSales && !hasTickets && !hasAppointments;
    };

    return (
        <div className="h-full flex flex-col lg:flex-row bg-rose-bg animate-in fade-in overflow-hidden font-inter">

            {/* Left: Form */}
            <div ref={formScroll.ref} {...formScroll.props} className="w-full lg:w-[320px] xl:w-[360px] border-r border-rose-border bg-rose-muted/15 overflow-y-auto hide-scrollbar flex flex-col p-[clamp(12px,3vmin,24px)] shrink-0">
                <div className="mb-4 sm:mb-6 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 sm:p-3 rounded-xl sm:rounded-2xl shadow-lg ${editingUserId ? 'bg-yellow-600/20 text-yellow-500' : 'bg-blue-600/20 text-blue-500'}`}>
                            {editingUserId ? <Pencil size={18} /> : <Plus size={18} />}
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-[clamp(14px,3.5vmin,18px)] font-black text-rose-900 uppercase tracking-tight leading-none truncate">{editingUserId ? 'Editar' : 'Nuevo'}</h2>
                            <p className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest mt-1">{isSuperAdmin ? 'Corporativo' : branchName}</p>
                        </div>
                    </div>
                    {editingUserId && <button onClick={resetForm} className="p-1.5 sm:p-2 bg-white text-rose-500 hover:text-rose-900 rounded-lg sm:rounded-xl border transition-all"><X size={14} /></button>}
                </div>

                <form onSubmit={handleSave} className="flex-1 flex flex-col justify-between min-h-0 gap-3 sm:gap-4">
                    <div className="space-y-3 sm:space-y-4">
                        <div><label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em]">Nombre</label>
                            <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-900 font-bold text-[clamp(11px,2.5vmin,13px)] outline-none focus:border-yellow-600 shadow-inner transition-all uppercase" placeholder="NOMBRE" /></div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <div><label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em]">Usuario</label>
                                <div className="relative"><AtSign className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-300" size={12} /><input required value={username} onChange={e => setUsername(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl py-[clamp(8px,2vmin,14px)] pl-8 sm:pl-9 pr-2 sm:pr-3 text-rose-900 font-bold text-[clamp(11px,2.5vmin,13px)] outline-none focus:border-yellow-600 shadow-inner transition-all" placeholder="user" /></div></div>
                            <div><label className="text-[9px] sm:text-[10px] font-black text-yellow-500 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em] flex items-center gap-1"><Lock size={8} /> PIN</label>
                                <input required maxLength={6} value={pin} onChange={e => /^\d*$/.test(e.target.value) && setPin(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-900 font-black text-center text-[clamp(11px,2.5vmin,13px)] outline-none focus:border-yellow-600 shadow-inner tracking-[0.3em] font-mono" placeholder="••••••" /></div>
                        </div>

                        <div><label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em]">Rol</label>
                            <select value={role} onChange={e => setRole(e.target.value as Role)} className="w-full bg-white border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-900 font-black text-[clamp(11px,2.5vmin,12px)] outline-none focus:border-yellow-600 shadow-inner appearance-none cursor-pointer">
                                <option value="estilista">ESTILISTA</option>
                                <option value="reception">RECEPCIÓN</option>
                                <option value="cashier">CAJERO</option>
                                <option value="admin">ADMIN</option>
                                <option value="display">TV</option>
                            </select></div>

                        <div><label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em]"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="inline mr-1 -mt-0.5"><path d="M22 2L11 13"/><path d="M22 2L15 22l-4-9-9-4z"/></svg> Telegram</label>
                            <input value={telegramId} onChange={e => setTelegramId(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-900 font-bold text-[clamp(11px,2.5vmin,13px)] outline-none focus:border-yellow-600 shadow-inner transition-all" placeholder="@username o ID numérico" /></div>

                        <div><label className="text-[9px] sm:text-[10px] font-black text-rose-400 uppercase block mb-1 sm:mb-2 ml-1 tracking-[0.2em]">Sede</label>
                            {isSuperAdmin ? (
                                <select value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-900 font-bold text-[clamp(11px,2.5vmin,12px)] outline-none focus:border-yellow-600 shadow-inner appearance-none cursor-pointer">
                                    <option value="">TODAS</option>
                                    {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                                </select>
                            ) : <div className="w-full bg-rose-muted border border-rose-border rounded-xl p-[clamp(8px,2vmin,14px)] text-rose-500 font-black text-[clamp(11px,2.5vmin,12px)] flex items-center gap-2"><Store size={12} /> {branchName.toUpperCase()}</div>}</div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-4">
                            <button type="button" onClick={() => setActive(!active)} className={`bg-white/60 p-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl border flex items-center justify-between transition-all ${active ? 'border-emerald-500/20' : 'border-rose-border/50'}`}>
                                <div className="text-left min-w-0"><div className="text-[8px] sm:text-[9px] font-black text-rose-400 uppercase tracking-widest">Estado</div><div className={`text-[7px] sm:text-[8px] font-black uppercase mt-0.5 ${active ? 'text-emerald-500' : 'text-destructive'}`}>{active ? 'Activo' : 'Suspendido'}</div></div>
                                <div className={`w-8 sm:w-10 h-4 sm:h-5 rounded-full relative transition-all shrink-0 ${active ? 'bg-emerald-600' : 'bg-rose-muted'}`}>
                                    <div className={`absolute top-0.5 w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow-md transition-all ${active ? 'left-[14px] sm:left-5' : 'left-0.5'}`} />
                                </div>
                            </button>
                            <button type="button" onClick={() => setCanDoPos(!canDoPos)} className={`bg-white/60 p-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl border flex items-center justify-between transition-all ${canDoPos ? 'border-blue-500/20' : 'border-rose-border/50'}`}>
                                <div className="text-left min-w-0"><div className="text-[8px] sm:text-[9px] font-black text-rose-400 uppercase tracking-widest">POS</div><div className={`text-[7px] sm:text-[8px] font-black uppercase mt-0.5 ${canDoPos ? 'text-blue-500' : 'text-rose-300'}`}>{canDoPos ? 'Acceso' : 'Restringido'}</div></div>
                                <div className={`w-8 sm:w-10 h-4 sm:h-5 rounded-full relative transition-all shrink-0 ${canDoPos ? 'bg-blue-600' : 'bg-rose-muted'}`}>
                                    <div className={`absolute top-0.5 w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow-md transition-all ${canDoPos ? 'left-[14px] sm:left-5' : 'left-0.5'}`} />
                                </div>
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white py-[clamp(10px,2.5vmin,16px)] rounded-xl sm:rounded-2xl font-black uppercase text-[clamp(10px,2.5vmin,12px)] tracking-[0.2em] shadow-xl active:scale-95 transition-all border-b-4 border-yellow-800 active:border-b-0 flex items-center justify-center gap-2"><Save size={14} /> {editingUserId ? 'Actualizar' : 'Registrar'}</button>
                </form>
            </div>

            {/* Right: User list */}
            <div className="flex-1 flex flex-col overflow-hidden bg-rose-muted/10 p-[clamp(8px,2vmin,24px)] lg:p-[clamp(12px,3vmin,32px)]">
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                    <div>
                        <h3 className="text-rose-400 font-black text-[clamp(9px,2vmin,11px)] uppercase tracking-[0.3em] flex items-center gap-2"><UserCog size={12} className="text-rose-300" /> EQUIPO</h3>
                        <div className="text-[clamp(8px,1.5vmin,9px)] text-rose-400 font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                            <span className="text-emerald-500">{activeCount} Activos</span><span className="text-rose-border">/</span><span>{filteredUsers.length} Total</span>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-56 lg:w-64">
                        <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 text-rose-300" size={12} />
                        <input value={listSearch} onChange={e => setListSearch(e.target.value)} className="w-full bg-white border border-rose-border rounded-lg sm:rounded-xl py-[clamp(4px,1vmin,10px)] pl-8 sm:pl-9 pr-2 sm:pr-3 text-[clamp(9px,2vmin,10px)] text-rose-900 font-black uppercase tracking-wider outline-none focus:border-yellow-600 transition-all placeholder:text-rose-300 shadow-sm" placeholder="FILTRAR..." />
                        {listSearch && <button onClick={() => setListSearch('')} className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-rose-300 hover:text-rose-900"><X size={10} /></button>}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto hide-scrollbar pb-4 min-h-0">
                    {filteredUsers.length === 0 ? (
                        <div className="h-40 flex flex-col items-center justify-center text-rose-border border-2 border-dashed rounded-2xl bg-rose-muted/10">
                            <Users size={24} className="opacity-20 mb-2" />
                            <span className="text-[clamp(9px,2vmin,10px)] font-black uppercase tracking-widest opacity-30">Sin resultados</span>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(4px,1vmin,8px)]">
                            {filteredUsers.map(user => {
                                const userBranch = branches.find(b => b.id === user.branchId)?.name || 'Corporativo';
                                const isEditing = user.id === editingUserId;
                                const deletable = canUserBeDeleted(user.id);
                                return (
                                    <div key={user.id} className={`bg-white/70 border rounded-xl p-[clamp(6px,1.5vmin,12px)] transition-all group ${isEditing ? 'border-yellow-600 bg-yellow-600/5 ring-2 ring-yellow-600/20 shadow-xl' : 'border-rose-border/50 hover:border-rose-border hover:bg-rose-muted'}`}>
                                        <div className="flex items-start gap-2 sm:gap-3">
                                            <div className={`relative p-0.5 rounded-lg shrink-0 ${user.active !== false ? 'bg-gradient-to-tr from-emerald-500 to-emerald-300' : 'bg-rose-muted'}`}>
                                                <div className="bg-rose-muted p-1.5 rounded-[calc(0.75rem-1px)] text-rose-400 shadow-inner"><Users size={12} className={user.active !== false ? 'text-yellow-500' : 'text-rose-200'} /></div>
                                                {user.active !== false && <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full border-2 border-rose-bg"></div>}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <h4 className="font-black text-rose-900 text-[clamp(11px,2.5vmin,13px)] uppercase tracking-tight truncate">{user.name}</h4>
                                                    {user.role === 'admin' && <Shield size={7} className="text-yellow-500 shrink-0" />}
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                                    <span className="text-[clamp(7px,1.5vmin,8px)] font-black text-rose-400 uppercase">@{user.username}</span>
                                                    <span className={`text-[clamp(6px,1.2vmin,7px)] font-black px-1 py-0.5 rounded border ${user.active !== false ? 'text-emerald-500 border-emerald-500/20' : 'text-destructive border-destructive/20'}`}>{user.active !== false ? 'OK' : 'NO'}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap text-[clamp(7px,1.5vmin,8px)] font-black text-rose-400 uppercase">
                                                    <span className="flex items-center gap-0.5"><Store size={7} className="shrink-0" />{userBranch}</span>
                                                    <span>· {user.role}</span>
                                                    <span>· PIN: {user.pin}</span>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                                <button onClick={() => handleEdit(user)} className="w-7 h-7 flex items-center justify-center bg-rose-muted text-rose-500 hover:bg-yellow-600 hover:text-white rounded-lg transition-all shadow-sm border active:scale-90" title="Editar"><Pencil size={10} /></button>
                                                {deletable && <button onClick={() => handleDelete(user)} className="w-7 h-7 flex items-center justify-center bg-rose-muted text-rose-300 hover:bg-destructive hover:text-white rounded-lg transition-all shadow-sm border active:scale-90" title="Eliminar"><Trash2 size={10} /></button>}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {listSearch === '' && (
                        <button onClick={resetForm} className="w-full bg-rose-muted border-2 border-dashed border-rose-border p-[clamp(8px,2vmin,16px)] rounded-xl flex items-center justify-center gap-3 hover:border-yellow-600/40 transition-all group shadow-inner mt-[clamp(4px,1vmin,8px)]">
                            <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-rose-border group-hover:bg-yellow-600 group-hover:text-white transition-all shadow-lg"><Plus size={12} /></div>
                            <span className="text-[clamp(10px,2.5vmin,11px)] font-black text-rose-300 uppercase tracking-[0.3em] group-hover:text-rose-900">Nuevo</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};
