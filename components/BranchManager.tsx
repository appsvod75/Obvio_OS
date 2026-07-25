
import React, { useState, useMemo, useEffect } from 'react';
import { useBranch } from '../context/BranchContext';
import {
    Store, Plus, Edit, MapPin, Phone, Link2,
    CheckCircle2, Zap, Save, RefreshCw,
    AlertCircle, ShieldCheck, Globe, Target, Calendar,
    Percent, Ticket, ArrowRightLeft, Mail, ChevronRight, LayoutList,
    TrendingUp, Activity
} from 'lucide-react';
import { Branch, MonthlyPlan } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

export const BranchManager = () => {
    const { branches, addBranch, updateBranch, monthlyPlans, upsertMonthlyPlan } = useBranch();
    const branchScroll = useDragScroll();

    const [activeTab, setActiveTab] = useState<'config' | 'plan'>('config');

    const [editingBranchId, setEditingBranchId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [address, setAddress] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [webhookUrl, setWebhookUrl] = useState('');
    const [reportEmail, setReportEmail] = useState('');
    const [active, setActive] = useState(true);
    const [hasReception, setHasReception] = useState(true);
    const [defaultGoal, setDefaultGoal] = useState('5000');
    const [defaultDays, setDefaultDays] = useState('26');
    const [defaultProdPct, setDefaultProdPct] = useState('10');
    const [autoCloseTime, setAutoCloseTime] = useState('22:00:00');
    const [autoCloseEnabled, setAutoCloseEnabled] = useState(false);

    const [planBranchId, setPlanBranchId] = useState('');
    const [planMonth, setPlanMonth] = useState(new Date().getMonth());
    const [planYear, setPlanYear] = useState(new Date().getFullYear());
    const [planGoal, setPlanGoal] = useState('');
    const [planDays, setPlanDays] = useState('');
    const [planProdPct, setPlanProdPct] = useState('10');

    const [notify, setNotify] = useState<{ type: 'success' | 'error', msg: string } | null>(null);

    const showNotify = (type: 'success' | 'error', msg: string) => {
        setNotify({ type, msg });
        setTimeout(() => setNotify(null), 3000);
    };

    const handleEditBranch = (branch: Branch) => {
        setEditingBranchId(branch.id);
        setName(branch.name);
        setAddress(branch.address || '');
        setPhone(branch.phone || '');
        setEmail(branch.email || '');
        setWebhookUrl(branch.webhookUrl || '');
        setReportEmail(branch.reportEmail || '');
        setActive(branch.active);
        setHasReception(branch.hasReception || false);
        setDefaultGoal((branch.defaultMonthlyGoal || 5000).toString());
        setDefaultDays((branch.defaultWorkingDays || 26).toString());
        setDefaultProdPct((branch.defaultProductGoalPercent || 10).toString());
        setAutoCloseTime(branch.autoCloseTime || '22:00:00');
        setAutoCloseEnabled(branch.autoCloseEnabled || false);
        setActiveTab('config');
    };

    const handleSaveBranch = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Branch = {
            id: editingBranchId || crypto.randomUUID(),
            name, address, phone, email, webhookUrl, reportEmail, active, hasReception,
            defaultMonthlyGoal: parseFloat(defaultGoal),
            defaultWorkingDays: parseInt(defaultDays),
            defaultProductGoalPercent: parseFloat(defaultProdPct),
            autoCloseTime,
            autoCloseEnabled
        };

        let success = false;
        if (editingBranchId) {
            success = await updateBranch(payload);
        } else {
            success = await addBranch(payload);
        }

        if (success) {
            showNotify('success', editingBranchId ? 'Sucursal actualizada' : 'Sucursal creada');
            resetBranchForm();
        } else {
            showNotify('error', 'Error al sincronizar con el VPS');
        }
    };

    const resetBranchForm = () => {
        setEditingBranchId(null);
        setName('');
        setAddress('');
        setPhone('');
        setEmail('');
        setWebhookUrl('');
        setReportEmail('');
        setActive(true);
        setHasReception(true);
        setDefaultGoal('5000');
        setDefaultDays('26');
        setDefaultProdPct('10');
        setAutoCloseTime('22:00:00');
        setAutoCloseEnabled(false);
        setPlanBranchId('');
    };

    const handleSavePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!planBranchId) return showNotify('error', 'Selecciona una sucursal');
        const payload: MonthlyPlan = {
            id: crypto.randomUUID(),
            branchId: planBranchId,
            month: planMonth,
            year: planYear,
            goal: parseFloat(planGoal),
            workingDays: parseInt(planDays),
            productGoalPercent: parseFloat(planProdPct)
        };
        upsertMonthlyPlan(payload);
        showNotify('success', 'Plan mensual guardado');
        setPlanGoal('');
        setPlanDays('');
        setPlanBranchId('');
    };

    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const years = [2024, 2025, 2026];

    // Precargar plan existente al seleccionar sucursal+mes+año
    useEffect(() => {
        if (!planBranchId) return;
        const existing = monthlyPlans.find(p =>
            p.branchId === planBranchId && p.month === planMonth && p.year === planYear
        );
        if (existing) {
            setPlanGoal(existing.goal.toString());
            setPlanDays(existing.workingDays.toString());
            setPlanProdPct(existing.productGoalPercent.toString());
        } else if (!planGoal && !planDays) {
            // No hacer nada, dejar vacío para nuevo plan
        }
    }, [planBranchId, planMonth, planYear, monthlyPlans]);

    return (
        <div className="h-full flex flex-col md:flex-row bg-rose-bg animate-in fade-in duration-500 overflow-hidden font-inter">

            {notify && (
                <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] px-[clamp(12px,3vmin,24px)] py-[clamp(8px,2vmin,12px)] rounded-2xl shadow-2xl flex items-center gap-[clamp(6px,1.5vmin,12px)] font-bold border ${notify.type === 'success' ? 'bg-emerald-600/90 text-white border-emerald-400' : 'bg-destructive text-white border-destructive'}`}>
                    {notify.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span className="text-[clamp(9px,1.8vmin,12px)]">{notify.msg}</span>
                </div>
            )}

            <div className="w-full md:w-[clamp(300px,40vmin,420px)] border-r border-rose-border bg-rose-muted/10 overflow-hidden flex flex-col shrink-0 h-full">

                <div className="p-[clamp(8px,2vmin,16px)] border-b border-rose-border bg-rose-bg shrink-0">
                    <div className="flex bg-white p-[clamp(2px,0.5vmin,4px)] rounded-[clamp(8px,2vmin,16px)] border border-rose-border shadow-xl">
                        <button
                            onClick={() => setActiveTab('config')}
                            className={`flex-1 py-[clamp(4px,1vmin,6px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'config' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' : 'text-rose-400 hover:text-rose-500'}`}
                        >
                            Configuración
                        </button>
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`flex-1 py-[clamp(4px,1vmin,6px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'plan' ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-900/20' : 'text-rose-400 hover:text-rose-500'}`}
                        >
                            Plan Mensual
                        </button>
                    </div>
                </div>

                <div className="flex-1 p-[clamp(10px,2.5vmin,20px)] overflow-y-auto">
                    {activeTab === 'config' ? (
                        <form onSubmit={handleSaveBranch} className="h-full flex flex-col animate-in slide-in-from-left-2 duration-300">
                            <div className="space-y-[clamp(4px,1vmin,10px)]">
                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-400 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest">Nombre Comercial</label>
                                    <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-bold text-[clamp(11px,2.5vmin,14px)] outline-none focus:border-cyan-600 uppercase shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="EJ: SUCURSAL CENTRO" />
                                </div>

                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-emerald-500 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)]"><Mail size={10} /> Webhook GAS (Emails)</label>
                                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none focus:border-emerald-500 shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="https://script.google.com/..." />
                                </div>

                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-blue-500 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)]"><Mail size={10} /> Correo para Reportes (Cierre de Caja)</label>
                                    <input value={reportEmail} onChange={e => setReportEmail(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none focus:border-blue-500 shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="reportes@ejemplo.com" />
                                </div>

                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-400 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest">Ubicación Física</label>
                                    <input value={address} onChange={e => setAddress(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 text-[clamp(9px,1.8vmin,12px)] outline-none shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="Dirección exacta..." />
                                </div>

                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-400 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest">Teléfono Directo</label>
                                    <div className="relative">
                                        <Phone className="absolute left-[clamp(6px,1.5vmin,12px)] top-1/2 -translate-y-1/2 text-rose-400" size={12} />
                                        <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] pl-[clamp(28px,7vmin,40px)] text-rose-900 font-mono text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-cyan-600 shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="Ej: 2222-3333" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,8px)] pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setActive(!active)}
                                        className={`flex flex-col p-[clamp(6px,1.5vmin,12px)] rounded-2xl border transition-all duration-300 text-left ${active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-destructive/5 border-destructive/20'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase tracking-[0.2em]">Estado</span>
                                            <div className={`w-[clamp(24px,6vmin,32px)] h-[clamp(12px,3vmin,16px)] rounded-full relative shadow-inner transition-colors duration-300 ${active ? 'bg-emerald-600' : 'bg-destructive'}`}>
                                                <div className={`absolute top-0.5 w-[clamp(8px,2vmin,12px)] h-[clamp(8px,2vmin,12px)] bg-white rounded-full shadow transition-all duration-300 ${active ? 'left-[calc(100%-14px)]' : 'left-0.5'}`} />
                                            </div>
                                        </div>
                                        <span className={`text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest ${active ? 'text-emerald-500' : 'text-destructive'}`}>
                                            {active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setHasReception(!hasReception)}
                                        className={`flex flex-col p-[clamp(6px,1.5vmin,12px)] rounded-2xl border transition-all duration-300 text-left ${hasReception ? 'bg-blue-500/5 border-blue-500/20' : 'bg-cyan-500/5 border-cyan-500/20'}`}
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase tracking-[0.2em]">Modo Fac.</span>
                                            <div className={`w-[clamp(24px,6vmin,32px)] h-[clamp(12px,3vmin,16px)] rounded-full relative shadow-inner transition-colors duration-300 ${hasReception ? 'bg-blue-600' : 'bg-cyan-600'}`}>
                                                <div className={`absolute top-0.5 w-[clamp(8px,2vmin,12px)] h-[clamp(8px,2vmin,12px)] bg-white rounded-full shadow transition-all duration-300 ${hasReception ? 'left-[calc(100%-14px)]' : 'left-0.5'}`} />
                                            </div>
                                        </div>
                                        <span className={`text-[clamp(8px,1.5vmin,10px)] font-black uppercase tracking-widest ${hasReception ? 'text-blue-500' : 'text-cyan-500'}`}>
                                            {hasReception ? 'Ticket' : 'Directo'}
                                        </span>
                                    </button>
                                </div>

                                <div className="p-[clamp(8px,2vmin,16px)] bg-white/50 border border-rose-border rounded-3xl space-y-[clamp(4px,1vmin,8px)]">
                                    <div className="flex items-center justify-between">
                                        <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-500 uppercase tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)]">
                                            <RefreshCw size={12} className={autoCloseEnabled ? "animate-spin-slow text-emerald-500" : "text-rose-400"} />
                                            Cierre Automático
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setAutoCloseEnabled(!autoCloseEnabled)}
                                            className={`w-[clamp(32px,8vmin,40px)] h-[clamp(16px,4vmin,20px)] rounded-full relative transition-all duration-300 shadow-xl ${autoCloseEnabled ? 'bg-emerald-600' : 'bg-rose-muted/60'}`}
                                        >
                                            <div className={`absolute top-1 w-[clamp(10px,2.5vmin,12px)] h-[clamp(10px,2.5vmin,12px)] bg-white rounded-full transition-all duration-300 ${autoCloseEnabled ? 'left-[calc(100%-14px)]' : 'left-1'}`} />
                                        </button>
                                    </div>
                                    {autoCloseEnabled && (
                                        <div className="flex items-center gap-[clamp(4px,1vmin,10px)] animate-in slide-in-from-top-1 duration-200">
                                            <div className="flex-1">
                                                <p className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(2px,0.5vmin,4px)] ml-1">HORA DE CIERRE</p>
                                                <input
                                                    type="time"
                                                    step="1"
                                                    value={autoCloseTime}
                                                    onChange={e => setAutoCloseTime(e.target.value)}
                                                    className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(4px,1vmin,10px)] text-emerald-500 font-black font-mono text-center outline-none focus:border-emerald-600 shadow-inner h-[clamp(24px,5vmin,31px)]"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-[clamp(10px,2.5vmin,16px)] rounded-[clamp(12px,3vmin,24px)] font-black uppercase text-[clamp(9px,1.8vmin,12px)] tracking-[0.2em] shadow-xl active:scale-95 transition-all border-b-4 border-cyan-800 active:border-b-0 flex items-center justify-center gap-[clamp(6px,1.5vmin,12px)]">
                                    <Save size={14} /> {editingBranchId ? 'Actualizar Sede' : 'Registrar Sede'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <form onSubmit={handleSavePlan} className="h-full flex flex-col animate-in slide-in-from-right-2 duration-300">
                            <div className="space-y-[clamp(6px,1.5vmin,14px)]">
                                <div>
                                    <label className="text-[clamp(8px,1.5vmin,10px)] font-black text-yellow-500 uppercase block mb-[clamp(2px,0.5vmin,4px)] ml-1 tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)]"><Store size={10} /> Seleccionar Sede Target</label>
                                    <select required value={planBranchId} onChange={e => setPlanBranchId(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-black uppercase text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-yellow-600 appearance-none shadow-inner h-[clamp(28px,6vmin,37px)]">
                                        <option value="">-- ELIGE SEDE --</option>
                                        {branches.map(b => <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,12px)]">
                                    <div className="space-y-[clamp(4px,1vmin,6px)]">
                                        <label className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Mes Operativo</label>
                                        <select value={planMonth} onChange={e => setPlanMonth(parseInt(e.target.value))} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-bold text-[clamp(9px,1.8vmin,12px)] shadow-inner h-[clamp(28px,6vmin,37px)]">
                                            {months.map((m, i) => <option key={i} value={i}>{m}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-[clamp(4px,1vmin,6px)]">
                                        <label className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1">Año</label>
                                        <select value={planYear} onChange={e => setPlanYear(parseInt(e.target.value))} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-bold text-[clamp(9px,1.8vmin,12px)] shadow-inner h-[clamp(28px,6vmin,37px)]">
                                            {years.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="bg-white/50 p-[clamp(10px,2.5vmin,20px)] rounded-[clamp(1.5rem,4vmin,2.5rem)] border border-rose-border space-y-[clamp(6px,1.5vmin,14px)] shadow-2xl">
                                    <div className="space-y-[clamp(2px,0.5vmin,4px)]">
                                        <label className="text-[clamp(8px,1.5vmin,9px)] font-black text-yellow-500 uppercase tracking-widest ml-1">Meta Venta Bruta ($)</label>
                                        <input required type="number" value={planGoal} onChange={e => setPlanGoal(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,14px)] text-rose-900 font-black font-mono text-[clamp(18px,4.5vmin,28px)] outline-none focus:border-yellow-600 shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="0.00" />
                                    </div>
                                    <div className="space-y-[clamp(2px,0.5vmin,4px)]">
                                        <label className="text-[clamp(8px,1.5vmin,9px)] font-black text-blue-500 uppercase tracking-widest ml-1">Días Laborales Confirmados</label>
                                        <input required type="number" value={planDays} onChange={e => setPlanDays(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,14px)] text-rose-900 font-black font-mono text-[clamp(18px,4.5vmin,28px)] outline-none focus:border-blue-600 shadow-inner h-[clamp(28px,6vmin,37px)]" placeholder="Ej: 26" />
                                    </div>
                                    <div className="space-y-[clamp(4px,1vmin,8px)] pt-2">
                                        <div className="flex justify-between items-center mb-0.5">
                                            <label className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase tracking-widest ml-1 flex items-center gap-[clamp(2px,0.5vmin,4px)]"><Percent size={8} /> Cuota de Productos</label>
                                            <span className="text-[clamp(11px,2.5vmin,14px)] font-black text-yellow-500 font-mono">{planProdPct}%</span>
                                        </div>
                                        <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)]">
                                            <input type="range" min="0" max="50" step="5" value={planProdPct} onChange={e => setPlanProdPct(e.target.value)} className="flex-1 h-[clamp(4px,1vmin,6px)] bg-white rounded-lg appearance-none cursor-pointer accent-yellow-600" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-auto">
                                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-black py-[clamp(10px,2.5vmin,16px)] rounded-[clamp(12px,3vmin,24px)] font-black uppercase text-[clamp(9px,1.8vmin,12px)] tracking-[0.2em] shadow-xl active:scale-95 transition-all border-b-4 border-yellow-800 active:border-b-0 flex items-center justify-center gap-[clamp(6px,1.5vmin,12px)]">
                                    <Save size={14} /> Guardar Estrategia
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>

            <div className="flex-1 flex flex-col overflow-hidden bg-rose-muted/10 p-[clamp(12px,3vmin,40px)]">
                <div className="mb-[clamp(12px,3vmin,32px)] flex items-center justify-between shrink-0">
                    <div className="flex flex-col gap-[clamp(2px,0.5vmin,4px)]">
                        <h3 className="text-rose-400 font-black text-[clamp(9px,2vmin,11px)] uppercase tracking-[0.5em] flex items-center gap-[clamp(4px,1vmin,12px)]">
                            <Globe size={14} className="text-rose-300" /> NETWORK DECK
                        </h3>
                        <p className="text-[clamp(7px,1.2vmin,9px)] text-rose-300 font-bold uppercase tracking-widest">Sedes activas en la red corporativa</p>
                    </div>
                    <div className="bg-white px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,8px)] rounded-full border border-rose-border shadow-lg">
                        <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-500 uppercase tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)]">
                            <Activity size={12} className="text-emerald-500" /> Sedes Online: {branches.length}
                        </span>
                    </div>
                </div>

                <div
                    ref={branchScroll.ref}
                    {...branchScroll.props}
                    className="flex-1 overflow-y-auto hide-scrollbar"
                >
                    <div className="space-y-[clamp(6px,1.5vmin,12px)] pb-[clamp(16px,4vmin,40px)]">
                        {branches.map(branch => {
                            const currentPlan = monthlyPlans.find(p => p.branchId === branch.id && p.month === new Date().getMonth() && p.year === new Date().getFullYear());
                            const isEditing = branch.id === editingBranchId;

                            return (
                                <div
                                    key={branch.id}
                                    className={`bg-white/70 border rounded-[clamp(12px,3vmin,24px)] p-[clamp(8px,2vmin,16px)] transition-all duration-300 group flex flex-col lg:flex-row items-center gap-[clamp(8px,2vmin,24px)] ${isEditing ? 'border-cyan-600 bg-cyan-600/5 ring-2 ring-cyan-600/10' : 'border-rose-border hover:border-rose-border hover:bg-rose-muted'}`}
                                >
                                    <div className="flex items-center gap-[clamp(6px,1.5vmin,16px)] shrink-0">
                                        <div className={`p-[clamp(6px,1.5vmin,14px)] rounded-[clamp(12px,3vmin,24px)] shadow-xl transition-all ${branch.active ? 'bg-cyan-600/20 text-cyan-500 border border-cyan-500/20' : 'bg-rose-muted text-rose-400'}`}>
                                            <Store size={18} />
                                        </div>
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-rose-900 text-[clamp(14px,3.5vmin,20px)] uppercase tracking-tight truncate group-hover:text-cyan-400 transition-colors leading-none">{branch.name}</h4>
                                        <div className="flex flex-col gap-[clamp(2px,0.5vmin,4px)] mt-[clamp(4px,1vmin,8px)]">
                                            <div className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-[clamp(2px,0.5vmin,6px)] truncate">
                                                <MapPin size={8} className="text-rose-300 shrink-0" /> {branch.address || 'Sin dirección'}
                                            </div>
                                            {branch.phone && (
                                                <div className="text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-300 uppercase tracking-widest flex items-center gap-[clamp(2px,0.5vmin,6px)]">
                                                    <Phone size={8} className="text-rose-border shrink-0" /> {branch.phone}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-[clamp(4px,1vmin,8px)] shrink-0">
                                        <span className={`flex items-center gap-[clamp(2px,0.5vmin,6px)] text-[clamp(7px,1.2vmin,8px)] font-black px-[clamp(6px,1.5vmin,12px)] py-[clamp(2px,0.5vmin,4px)] rounded-full uppercase tracking-widest transition-all ${branch.active ? 'bg-emerald-900/20 text-emerald-500 border border-emerald-500/20' : 'bg-destructive/10 text-destructive border border-destructive/20'}`}>
                                            <div className={`w-[clamp(4px,1vmin,6px)] h-[clamp(4px,1vmin,6px)] rounded-full ${branch.active ? 'bg-emerald-500 animate-pulse' : 'bg-destructive'}`}></div>
                                            {branch.active ? 'Operativa' : 'Cerrada'}
                                        </span>
                                        <span className={`flex items-center gap-[clamp(2px,0.5vmin,6px)] text-[clamp(7px,1.2vmin,8px)] font-black px-[clamp(6px,1.5vmin,12px)] py-[clamp(2px,0.5vmin,4px)] rounded-full uppercase tracking-widest transition-all border ${branch.hasReception ? 'bg-blue-900/20 text-blue-400 border-blue-400/20' : 'bg-rose-muted/40 text-rose-500 border-rose-border'}`}>
                                            {branch.hasReception ? <Ticket size={8} /> : <ArrowRightLeft size={8} />}
                                            {branch.hasReception ? 'Ticket' : 'Directo'}
                                        </span>
                                    </div>

                                    <div className="bg-rose-muted/40 px-[clamp(8px,2vmin,20px)] py-[clamp(4px,1vmin,10px)] rounded-[clamp(8px,2vmin,16px)] border border-rose-border/50 flex items-center gap-[clamp(8px,2vmin,24px)] shrink-0 lg:w-[clamp(180px,30vmin,260px)]">
                                        <div className="flex flex-col">
                                            <span className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Meta {months[new Date().getMonth()]}</span>
                                            {currentPlan ? (
                                                <span className="text-[clamp(11px,2.5vmin,14px)] font-black text-rose-900 font-mono">${currentPlan.goal.toLocaleString()}</span>
                                            ) : (
                                                <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-destructive uppercase tracking-tighter">N/A</span>
                                            )}
                                        </div>
                                        <div className="h-[clamp(16px,4vmin,24px)] w-px bg-rose-border"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[clamp(6px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Días</span>
                                            {currentPlan ? (
                                                <span className="text-[clamp(11px,2.5vmin,14px)] font-black text-blue-400 font-mono">{currentPlan.workingDays}</span>
                                            ) : (
                                                <span className="text-[clamp(8px,1.5vmin,10px)] font-black text-destructive uppercase tracking-tighter">N/A</span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="shrink-0 flex items-center gap-[clamp(6px,1.5vmin,12px)]">
                                        <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-border font-mono tracking-tighter hidden xl:block">ID:{branch.id.substring(0, 4)}</span>
                                        <button
                                            onClick={() => handleEditBranch(branch)}
                                            className="p-[clamp(6px,1.5vmin,12px)] bg-rose-muted text-rose-500 hover:bg-rose-surface hover:text-rose-900 rounded-[clamp(8px,2vmin,16px)] transition-all shadow-md active:scale-90 border border-rose-border group-hover:border-rose-border"
                                        >
                                            <Edit size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        <button
                            onClick={resetBranchForm}
                            className="w-full bg-rose-muted border-2 border-dashed border-rose-border p-[clamp(12px,3vmin,24px)] rounded-[clamp(12px,3vmin,24px)] flex items-center justify-center gap-[clamp(6px,1.5vmin,16px)] hover:border-cyan-600/30 hover:bg-cyan-600/[0.02] transition-all group shadow-inner"
                        >
                            <Plus size={16} className="text-rose-border group-hover:text-cyan-500 group-hover:rotate-90 transition-all duration-300" />
                            <span className="text-[clamp(9px,1.8vmin,12px)] font-black text-rose-300 uppercase tracking-[0.3em] group-hover:text-cyan-600 transition-colors">Vincular Nueva Sede a la Red</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
