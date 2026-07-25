
import React, { useState } from 'react';
import { usePromotions } from '../context/PromotionsContext';
import { useConfigCtx } from '../context/ConfigContext';
import { useCatalog } from '../context/CatalogContext';
import {
    Zap, Plus, Trash2, Calendar, Clock, Star, Gift,
    Percent, DollarSign, X, CheckCircle2, Info,
    Sparkles, PartyPopper, Tag, Scissors, Edit,
    Trophy, Coins, UserPlus, Target, Award, Search, Package
} from 'lucide-react';
import { Promotion, PromotionTrigger, PromotionType } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

export const PromotionManager = () => {
    const { promotions, addPromotion, removePromotion, updatePromotion } = usePromotions();
    const { config, updateConfig } = useConfigCtx();
    const { catalog } = useCatalog();
    const scroll = useDragScroll();
    const modalScroll = useDragScroll();
    const [activeTab, setActiveTab] = useState<'promos' | 'loyalty'>('promos');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [lEnabled, setLEnabled] = useState(config.loyalty?.enabled ?? true);
    const [lPointsVisit, setLPointsVisit] = useState(config.loyalty?.pointsPerVisit ?? 1);
    const [lPointsRef, setLPointsRef] = useState(config.loyalty?.referralBonus ?? 2);
    const [lThreshold, setLThreshold] = useState(config.loyalty?.redemptionThreshold ?? 5);
    const [lValue, setLValue] = useState(config.loyalty?.redemptionValue ?? 5.00);

    const [name, setName] = useState('');
    const [type, setType] = useState<PromotionType>('percentage');
    const [value, setValue] = useState('');
    const [trigger, setTrigger] = useState<PromotionTrigger>('always');
    const [daysActive, setDaysActive] = useState<number[]>([]);
    const [hourStart, setHourStart] = useState('00:00');
    const [hourEnd, setHourEnd] = useState('23:59');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [applyTo, setApplyTo] = useState<'all' | 'services' | 'products' | 'specific'>('all');
    const [specificItemId, setSpecificItemId] = useState('');
    const [itemSearch, setItemSearch] = useState('');

    const handleSaveLoyalty = () => {
        updateConfig({
            ...config,
            loyalty: {
                enabled: lEnabled,
                pointsPerVisit: Number(lPointsVisit),
                pointsPerCurrency: config.loyalty?.pointsPerCurrency ?? 0,
                redemptionThreshold: Number(lThreshold),
                redemptionValue: Number(lValue),
                referralBonus: Number(lPointsRef)
            }
        });
        alert("¡Sistema de Lealtad Actualizado!");
    };

    const handleOpenModal = (promo?: Promotion) => {
        if (promo) {
            setEditingId(promo.id);
            setName(promo.name);
            setType(promo.type);
            setValue(promo.value.toString());
            setTrigger(promo.trigger);
            setDaysActive(promo.daysActive || []);
            setHourStart(promo.hourStart || '00:00');
            setHourEnd(promo.hourEnd || '23:59');
            setStartDate(promo.startDate || '');
            setEndDate(promo.endDate || '');
            setApplyTo(promo.applyTo || 'all');
            setSpecificItemId(promo.specificItemId || '');
            const item = catalog.find(i => i.id === promo.specificItemId);
            setItemSearch(item?.name || '');
        } else {
            setEditingId(null);
            setName('');
            setType('percentage');
            setValue('');
            setTrigger('always');
            setDaysActive([]);
            setHourStart('00:00');
            setHourEnd('23:59');
            setStartDate('');
            setEndDate('');
            setApplyTo('all');
            setSpecificItemId('');
            setItemSearch('');
        }
        setIsModalOpen(true);
    };

    const handleSavePromo = (e: React.FormEvent) => {
        e.preventDefault();
        const payload: Promotion = {
            id: editingId || crypto.randomUUID(),
            name, type, value: parseFloat(value),
            trigger, active: true,
            daysActive: trigger === 'days_of_week' ? daysActive : undefined,
            hourStart: (trigger === 'happy_hour' || trigger === 'days_of_week') ? hourStart : undefined,
            hourEnd: (trigger === 'happy_hour' || trigger === 'days_of_week') ? hourEnd : undefined,
            startDate: trigger === 'date_range' ? startDate : undefined,
            endDate: trigger === 'date_range' ? endDate : undefined,
            applyTo,
            specificItemId: applyTo === 'specific' ? specificItemId : undefined
        };
        if (editingId) updatePromotion(payload);
        else addPromotion(payload);
        setIsModalOpen(false);
    };

    const filteredCatalogItems = catalog.filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()));
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    return (
        <div className="h-full flex flex-col bg-rose-bg p-[clamp(8px,2vmin,24px)] animate-in fade-in duration-500 overflow-hidden font-inter">

            <div className="flex flex-col md:flex-row justify-between items-center mb-[clamp(8px,2vmin,16px)] shrink-0 gap-[clamp(8px,2vmin,16px)]">
                <div className="flex items-center gap-[clamp(6px,1.5vmin,12px)]">
                    <Zap className="text-yellow-500 fill-yellow-500" size={20} />
                    <div>
                        <h1 className="text-[clamp(16px,4vmin,24px)] font-black text-rose-900 uppercase tracking-tight leading-none">Marketing Pro</h1>
                        <p className="text-rose-400 text-[clamp(7px,1.2vmin,9px)] font-bold uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)]">Estrategia y Crecimiento</p>
                    </div>
                </div>

                <div className="flex bg-white p-[clamp(2px,0.5vmin,4px)] rounded-[clamp(8px,2vmin,16px)] border border-rose-border shadow-xl">
                    <button onClick={() => setActiveTab('promos')} className={`px-[clamp(8px,2vmin,16px)] py-[clamp(4px,1vmin,8px)] rounded-lg font-black text-[clamp(7px,1.2vmin,9px)] uppercase tracking-widest transition-all flex items-center gap-[clamp(4px,1vmin,8px)] ${activeTab === 'promos' ? 'bg-yellow-600 text-black shadow-lg' : 'text-rose-500 hover:text-rose-900'}`}><Tag size={10} /> Promociones</button>
                    <button onClick={() => setActiveTab('loyalty')} className={`px-[clamp(8px,2vmin,16px)] py-[clamp(4px,1vmin,8px)] rounded-lg font-black text-[clamp(7px,1.2vmin,9px)] uppercase tracking-widest transition-all flex items-center gap-[clamp(4px,1vmin,8px)] ${activeTab === 'loyalty' ? 'bg-yellow-600 text-black shadow-lg' : 'text-rose-500 hover:text-rose-900'}`}><Trophy size={10} /> Lealtad (Puntos)</button>
                </div>

                {activeTab === 'promos' && (
                    <button onClick={() => handleOpenModal()} className="bg-rose-muted hover:bg-white text-rose-900 px-[clamp(10px,2.5vmin,24px)] py-[clamp(4px,1vmin,8px)] rounded-[clamp(8px,2vmin,16px)] font-black text-[clamp(8px,1.5vmin,10px)] uppercase tracking-widest flex items-center gap-[clamp(4px,1vmin,8px)] shadow-xl active:scale-95 transition-all border-b-2 border-rose-border active:border-b-0"><Plus size={14} /> Nueva Estrategia</button>
                )}
            </div>

            <div
                ref={scroll.ref}
                {...scroll.props}
                className="flex-1 overflow-y-auto hide-scrollbar pr-2"
            >
                {activeTab === 'promos' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[clamp(8px,2vmin,16px)] pb-[clamp(12px,3vmin,24px)]">
                        {promotions.map(promo => {
                            const specificItem = catalog.find(i => i.id === promo.specificItemId);
                            return (
                                <div key={promo.id} className="bg-white border border-rose-border rounded-[clamp(16px,4vmin,32px)] p-[clamp(12px,3vmin,20px)] shadow-xl relative group flex flex-col justify-between min-h-[140px]">
                                    <div className="absolute top-[clamp(8px,2vmin,16px)] right-[clamp(8px,2vmin,16px)]">
                                        <div className={`p-[clamp(4px,1vmin,6px)] rounded-lg border ${promo.type === 'percentage' ? 'bg-blue-900/20 border-blue-500/30 text-blue-400' : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400'}`}>{promo.type === 'percentage' ? <Percent size={12} /> : <DollarSign size={12} />}</div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-[clamp(4px,1vmin,8px)] mb-[clamp(4px,1vmin,6px)]">
                                            <span className={`w-[clamp(4px,1vmin,6px)] h-[clamp(4px,1vmin,6px)] rounded-full ${promo.active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-muted'}`}></span>
                                            <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase tracking-widest">{promo.trigger.replace('_', ' ')}</span>
                                        </div>
                                        <h3 className="text-[clamp(11px,2.5vmin,14px)] font-black text-rose-900 uppercase tracking-tight mb-[clamp(4px,1vmin,8px)] pr-8">{promo.name}</h3>

                                        <div className="flex flex-wrap gap-[clamp(4px,1vmin,8px)] mb-[clamp(4px,1vmin,8px)]">
                                            <div className="flex items-center gap-[clamp(4px,1vmin,8px)] text-rose-500 text-[clamp(7px,1.2vmin,9px)] font-bold uppercase bg-rose-muted p-[clamp(4px,1vmin,8px)] rounded-lg border border-rose-border/50 w-fit">
                                                {promo.trigger === 'days_of_week' && <Calendar size={10} className="text-blue-500" />}
                                                {promo.trigger === 'happy_hour' && <Clock size={10} className="text-orange-500" />}
                                                {promo.trigger === 'birthday' && <PartyPopper size={10} className="text-pink-500" />}
                                                {promo.trigger === 'always' && <Sparkles size={10} className="text-yellow-500" />}
                                                <span className="truncate max-w-[120px]">
                                                    {promo.trigger === 'days_of_week' && `${promo.daysActive?.map(d => dayNames[d][0]).join(', ')} | ${promo.hourStart || '00:00'}-${promo.hourEnd || '23:59'}`}
                                                    {promo.trigger === 'happy_hour' && `${promo.hourStart}-${promo.hourEnd}`}
                                                    {promo.trigger === 'birthday' && 'Cumpleaños'}
                                                    {promo.trigger === 'always' && 'Activa'}
                                                </span>
                                            </div>
                                            {promo.applyTo === 'specific' && (
                                                <div className="flex items-center gap-[clamp(4px,1vmin,8px)] text-pink-400 text-[clamp(7px,1.2vmin,9px)] font-black uppercase bg-pink-900/10 p-[clamp(4px,1vmin,8px)] rounded-lg border border-pink-500/20 w-fit">
                                                    <Tag size={8} /> {specificItem?.name || 'Item'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-end mt-[clamp(6px,1.5vmin,12px)]">
                                        <div>
                                            <div className="text-[clamp(16px,4vmin,22px)] font-black text-rose-900 font-mono tracking-tighter">
                                                {promo.type === 'percentage' ? `${promo.value}%` : `$${promo.value}`}
                                                <span className="text-[clamp(7px,1.2vmin,9px)] font-bold text-rose-500 ml-1 uppercase">Off</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-[clamp(2px,0.5vmin,6px)]">
                                            <button onClick={() => handleOpenModal(promo)} className="p-[clamp(4px,1vmin,8px)] bg-rose-muted hover:bg-rose-muted text-rose-500 hover:text-rose-900 rounded-lg transition-all border border-rose-border"><Edit size={10} /></button>
                                            <button onClick={() => removePromotion(promo.id)} className="p-[clamp(4px,1vmin,8px)] bg-rose-muted hover:bg-destructive/20 text-rose-500 hover:text-destructive rounded-lg transition-all border border-rose-border"><Trash2 size={10} /></button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-2 duration-500">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-[clamp(8px,2vmin,20px)]">
                            <div className="lg:col-span-8 space-y-[clamp(8px,2vmin,16px)]">
                                <div className="bg-white border border-rose-border rounded-[clamp(16px,4vmin,32px)] p-[clamp(12px,3vmin,20px)] shadow-2xl">
                                    <div className="flex items-center gap-[clamp(6px,1.5vmin,12px)] mb-[clamp(10px,2.5vmin,20px)]">
                                        <div className="p-[clamp(4px,1vmin,10px)] bg-yellow-600/20 text-yellow-500 rounded-[clamp(8px,2vmin,16px)] border border-yellow-500/20 shadow-lg"><Coins size={16} /></div>
                                        <div>
                                            <h2 className="text-[clamp(11px,2.5vmin,14px)] font-black text-rose-900 uppercase tracking-tight">Acumulación</h2>
                                            <p className="text-[clamp(7px,1.2vmin,8px)] text-rose-400 font-bold uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)]">Reglas de obtención</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(8px,2vmin,16px)]">
                                        <div className="bg-rose-muted border border-rose-border rounded-[clamp(12px,3vmin,24px)] p-[clamp(8px,2vmin,16px)] flex items-center justify-between group hover:border-yellow-600/30 transition-all">
                                            <div><div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase mb-[clamp(2px,0.5vmin,4px)] tracking-widest flex items-center gap-[clamp(2px,0.5vmin,6px)]"><Scissors size={8} /> Por Visita</div><span className="text-[clamp(20px,5vmin,28px)] font-black text-rose-900 font-mono leading-none">{lPointsVisit} <span className="text-[clamp(8px,1.5vmin,10px)] text-rose-400">PTS</span></span></div>
                                            <div className="flex gap-[clamp(2px,0.5vmin,4px)]"><button onClick={() => setLPointsVisit(Math.max(0, lPointsVisit - 1))} className="w-[clamp(24px,6vmin,32px)] h-[clamp(24px,6vmin,32px)] rounded-lg bg-rose-muted text-rose-900 font-bold hover:bg-rose-muted transition-all text-xs">-</button><button onClick={() => setLPointsVisit(lPointsVisit + 1)} className="w-[clamp(24px,6vmin,32px)] h-[clamp(24px,6vmin,32px)] rounded-lg bg-yellow-600 text-black font-bold hover:bg-yellow-500 transition-all text-xs">+</button></div>
                                        </div>
                                        <div className="bg-rose-muted border border-rose-border rounded-[clamp(12px,3vmin,24px)] p-[clamp(8px,2vmin,16px)] flex items-center justify-between group hover:border-blue-600/30 transition-all">
                                            <div><div className="text-[clamp(7px,1.2vmin,8px)] font-black text-blue-500 uppercase mb-[clamp(2px,0.5vmin,4px)] tracking-widest flex items-center gap-[clamp(2px,0.5vmin,6px)]"><UserPlus size={8} /> Referencia</div><span className="text-[clamp(20px,5vmin,28px)] font-black text-rose-900 font-mono leading-none">{lPointsRef} <span className="text-[clamp(8px,1.5vmin,10px)] text-rose-400">PTS</span></span></div>
                                            <div className="flex gap-[clamp(2px,0.5vmin,4px)]"><button onClick={() => setLPointsRef(Math.max(0, lPointsRef - 1))} className="w-[clamp(24px,6vmin,32px)] h-[clamp(24px,6vmin,32px)] rounded-lg bg-rose-muted text-rose-900 font-bold hover:bg-rose-muted transition-all text-xs">-</button><button onClick={() => setLPointsRef(lPointsRef + 1)} className="w-[clamp(24px,6vmin,32px)] h-[clamp(24px,6vmin,32px)] rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-500 transition-all text-xs">+</button></div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-white border border-rose-border rounded-[clamp(16px,4vmin,32px)] p-[clamp(12px,3vmin,20px)] shadow-2xl">
                                    <div className="flex items-center gap-[clamp(6px,1.5vmin,12px)] mb-[clamp(10px,2.5vmin,20px)]">
                                        <div className="p-[clamp(4px,1vmin,10px)] bg-emerald-600/20 text-emerald-500 rounded-[clamp(8px,2vmin,16px)] border border-emerald-500/20 shadow-lg"><Target size={16} /></div>
                                        <div><h2 className="text-[clamp(11px,2.5vmin,14px)] font-black text-rose-900 uppercase tracking-tight">Definición del Premio</h2><p className="text-[clamp(7px,1.2vmin,8px)] text-rose-400 font-bold uppercase tracking-widest mt-[clamp(1px,0.3vmin,2px)]">Qué ganan tus clientes</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(8px,2vmin,16px)]">
                                        <div className="relative"><label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest mb-[clamp(4px,1vmin,6px)] block ml-1">Meta (Puntos)</label><input type="number" value={lThreshold} onChange={e => setLThreshold(Number(e.target.value))} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-black text-[clamp(16px,4vmin,22px)] font-mono text-center outline-none focus:border-yellow-600 shadow-inner" /></div>
                                        <div className="relative"><label className="text-[clamp(7px,1.2vmin,8px)] font-black text-emerald-500 uppercase tracking-widest mb-[clamp(4px,1vmin,6px)] block ml-1">Valor Regalo ($)</label><div className="relative"><span className="absolute left-[clamp(6px,1.5vmin,16px)] top-1/2 -translate-y-1/2 text-rose-700 font-black font-mono text-[clamp(11px,2.5vmin,14px)]">$</span><input type="number" step="0.01" value={lValue} onChange={e => setLValue(Number(e.target.value))} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] pl-[clamp(20px,5vmin,32px)] text-rose-900 font-black text-[clamp(16px,4vmin,22px)] font-mono text-center outline-none focus:border-emerald-600 shadow-inner" /></div></div>
                                    </div>
                                </div>
                            </div>
                            <div className="lg:col-span-4 space-y-[clamp(8px,2vmin,16px)]">
                                <div className="bg-gradient-to-br from-rose-muted to-rose-bg border border-rose-border rounded-[clamp(16px,4vmin,32px)] p-[clamp(12px,3vmin,20px)] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute -right-6 -top-6 text-white/5 rotate-12"><Trophy size={80} /></div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-[clamp(12px,3vmin,24px)]">
                                            <div className="bg-yellow-600 text-black px-[clamp(6px,1.5vmin,12px)] py-[clamp(2px,0.5vmin,4px)] rounded-full font-black text-[clamp(6px,1vmin,7px)] uppercase tracking-widest flex items-center gap-[clamp(2px,0.5vmin,4px)]"><Sparkles size={6} /> VISTA PREVIA TARJETA</div>
                                            <div className="text-right">
                                                <div className="text-[clamp(6px,1vmin,7px)] text-rose-400 font-black uppercase">Saldo Ejemplo</div>
                                                <div className="text-[clamp(16px,4vmin,22px)] font-black text-rose-900 font-mono leading-none">{Math.floor(lThreshold * 0.6)} <span className="text-[clamp(8px,1.5vmin,10px)] text-rose-400">PTS</span></div>
                                            </div>
                                        </div>
                                        <div className="space-y-[clamp(4px,1vmin,8px)] mb-[clamp(12px,3vmin,24px)]">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-900 uppercase tracking-widest flex items-center gap-[clamp(2px,0.5vmin,6px)]"><Award size={8} className="text-yellow-500" /> Meta: {lThreshold} Puntos</div>
                                                <div className="text-[clamp(6px,1vmin,7px)] font-bold text-rose-400 uppercase">Faltan {Math.max(0, lThreshold - Math.floor(lThreshold * 0.6))}</div>
                                            </div>
                                            <div className="h-[clamp(6px,1.5vmin,8px)] w-full bg-rose-muted rounded-full overflow-hidden border border-rose-border shadow-inner">
                                                <div
                                                    className="h-full bg-yellow-600 shadow-[0_0_10px_rgba(202,138,4,0.3)] transition-all duration-500"
                                                    style={{ width: '60%' }}
                                                ></div>
                                            </div>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] flex items-center gap-[clamp(6px,1.5vmin,12px)]">
                                            <div className="p-[clamp(4px,1vmin,8px)] bg-rose-muted rounded-lg text-yellow-500"><Gift size={14} /></div>
                                            <div>
                                                <div className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-900 uppercase">Premio Activo</div>
                                                <div className="text-[clamp(6px,1vmin,7px)] font-bold text-rose-400 uppercase mt-[clamp(1px,0.3vmin,2px)] leading-none">Descuento: <span className="text-emerald-500 font-mono">${Number(lValue).toFixed(2)}</span></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={handleSaveLoyalty} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-[clamp(8px,2vmin,14px)] rounded-[clamp(12px,3vmin,24px)] font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest shadow-xl shadow-emerald-900/20 active:scale-95 transition-all border-b-4 border-emerald-800 active:border-b-0 flex items-center justify-center gap-[clamp(4px,1vmin,8px)]"><CheckCircle2 size={14} /> Guardar Cambios</button>
                                <div className="bg-white p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(12px,3vmin,24px)] border border-rose-border"><p className="text-[clamp(6px,1vmin,7px)] text-rose-400 font-bold uppercase leading-tight text-center">Configura el bono de referencia alto para incentivar que traigan amigos.</p></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[1000] bg-rose-bg/95 backdrop-blur-2xl flex items-center justify-center p-[clamp(6px,1.5vmin,16px)]">
                    <div className="bg-white border border-rose-border w-full max-w-xl rounded-[clamp(1.5rem,4vmin,2.5rem)] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in duration-200">
                        <div className="p-[clamp(10px,2.5vmin,24px)] border-b border-rose-border bg-rose-bg flex justify-between items-center">
                            <div className="flex items-center gap-[clamp(6px,1.5vmin,12px)]">
                                <div className="bg-yellow-600/20 p-[clamp(4px,1vmin,10px)] rounded-[clamp(8px,2vmin,16px)] text-yellow-500 border border-yellow-500/20"><Zap size={16} /></div>
                                <h2 className="text-[clamp(14px,3.5vmin,20px)] font-black text-rose-900 uppercase tracking-tight leading-none">{editingId ? 'Refinar Promo' : 'Nueva Campaña'}</h2>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="p-[clamp(4px,1vmin,8px)] text-rose-500 hover:text-rose-900 transition-all"><X size={18} /></button>
                        </div>
                        <form
                            onSubmit={handleSavePromo}
                            ref={modalScroll.ref}
                            {...modalScroll.props}
                            className="p-[clamp(12px,3vmin,32px)] space-y-[clamp(10px,2.5vmin,24px)] overflow-y-auto max-h-[85vh] hide-scrollbar"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-[clamp(10px,2.5vmin,24px)]">
                                <div className="space-y-[clamp(8px,2vmin,16px)]">
                                    <div className="space-y-[clamp(4px,1vmin,6px)]">
                                        <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest ml-1">Nombre</label>
                                        <input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-bold outline-none focus:border-yellow-600 shadow-inner text-[clamp(9px,1.8vmin,12px)] h-[clamp(31px,7vmin,41px)]" placeholder="Ej: Martes Locos" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,12px)]">
                                        <div className="space-y-[clamp(4px,1vmin,6px)]">
                                            <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest ml-1">Tipo</label>
                                            <select value={type} onChange={e => setType(e.target.value as PromotionType)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-yellow-600 h-[clamp(31px,7vmin,41px)]"><option value="percentage">%</option><option value="fixed_discount">$</option></select>
                                        </div>
                                        <div className="space-y-[clamp(4px,1vmin,6px)]">
                                            <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest ml-1">Valor</label>
                                            <input required type="number" step="0.01" value={value} onChange={e => setValue(e.target.value)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-black text-center text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-yellow-600 shadow-inner h-[clamp(31px,7vmin,41px)]" placeholder="0" />
                                        </div>
                                    </div>

                                    <div className="space-y-[clamp(4px,1vmin,8px)]">
                                        <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest ml-1">Alcance / Qué descuenta</label>
                                        <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,8px)]">
                                            <button type="button" onClick={() => { setApplyTo('all'); setSpecificItemId(''); }} className={`p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(8px,2vmin,12px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase border transition-all ${applyTo === 'all' ? 'bg-white text-black border-white' : 'bg-rose-bg text-rose-500 border-rose-border'}`}>Total Carrito</button>
                                            <button type="button" onClick={() => { setApplyTo('services'); setSpecificItemId(''); }} className={`p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(8px,2vmin,12px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase border transition-all ${applyTo === 'services' ? 'bg-white text-black border-white' : 'bg-rose-bg text-rose-500 border-rose-border'}`}>Solo Servicios</button>
                                            <button type="button" onClick={() => { setApplyTo('products'); setSpecificItemId(''); }} className={`p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(8px,2vmin,12px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase border transition-all ${applyTo === 'products' ? 'bg-white text-black border-white' : 'bg-rose-bg text-rose-500 border-rose-border'}`}>Solo Productos</button>
                                            <button type="button" onClick={() => setApplyTo('specific')} className={`p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(8px,2vmin,12px)] text-[clamp(8px,1.5vmin,10px)] font-black uppercase border transition-all ${applyTo === 'specific' ? 'bg-pink-600 text-white border-pink-500' : 'bg-rose-bg text-rose-500 border-rose-border'}`}>Item Específico</button>
                                        </div>
                                    </div>

                                    {applyTo === 'specific' && (
                                        <div className="space-y-[clamp(4px,1vmin,8px)] animate-in slide-in-from-top-2">
                                            <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-pink-500 uppercase tracking-widest ml-1 flex items-center gap-[clamp(2px,0.5vmin,4px)]"><Search size={8} /> Buscar Item</label>
                                            <div className="relative">
                                                <input value={itemSearch} onChange={e => { setItemSearch(e.target.value); setSpecificItemId(''); }} className={`w-full bg-white border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-bold outline-none shadow-inner text-[clamp(9px,1.8vmin,12px)] h-[clamp(31px,7vmin,41px)] ${specificItemId ? 'border-emerald-500/50' : 'border-rose-border focus:border-rose-palo'}`} placeholder="Ej: Corte Clásico..." />
                                                {specificItemId && <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500" size={12} />}
                                                {itemSearch.length > 0 && !specificItemId && filteredCatalogItems.length > 0 && (
                                                    <div className="absolute top-full left-0 w-full bg-rose-muted border border-rose-border rounded-[clamp(8px,2vmin,16px)] mt-1 shadow-2xl z-[200] max-h-32 overflow-y-auto">
                                                        {filteredCatalogItems.map(item => (<button key={item.id} type="button" onClick={() => { setSpecificItemId(item.id); setItemSearch(item.name); }} className="w-full p-[clamp(4px,1vmin,10px)] text-left text-[clamp(8px,1.5vmin,9px)] font-black text-rose-900 hover:bg-rose-palo border-b border-rose-border last:border-0 flex justify-between items-center transition-colors uppercase"><span>{item.name}</span><span className="text-[clamp(6px,1vmin,7px)] text-rose-500 font-mono">${item.price.toFixed(2)}</span></button>))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-[clamp(8px,2vmin,16px)]">
                                    <div className="space-y-[clamp(4px,1vmin,6px)]">
                                        <label className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-500 uppercase tracking-widest ml-1">Disparador / Cuándo</label>
                                        <select value={trigger} onChange={e => setTrigger(e.target.value as PromotionTrigger)} className="w-full bg-white border border-rose-border rounded-[clamp(8px,2vmin,16px)] p-[clamp(6px,1.5vmin,12px)] text-rose-900 font-black text-[clamp(9px,1.8vmin,12px)] outline-none focus:border-yellow-600 h-[clamp(31px,7vmin,41px)]"><option value="always">Siempre</option><option value="days_of_week">Días Semanales</option><option value="happy_hour">Happy Hour</option><option value="birthday">Cumpleaños</option></select>
                                    </div>

                                    <div className="bg-rose-bg border border-rose-border p-[clamp(8px,2vmin,16px)] rounded-[clamp(12px,3vmin,24px)] flex flex-col gap-[clamp(6px,1.5vmin,16px)] animate-in fade-in">
                                        {trigger === 'days_of_week' && (
                                            <div className="space-y-[clamp(6px,1.5vmin,16px)]">
                                                <div className="flex gap-[clamp(2px,0.5vmin,4px)] justify-between w-full">
                                                    {dayNames.map((d, i) => (
                                                        <button key={i} type="button" onClick={() => { setDaysActive(prev => prev.includes(i) ? prev.filter(day => day !== i) : [...prev, i]); }} className={`w-[clamp(20px,5vmin,28px)] h-[clamp(20px,5vmin,28px)] rounded-full text-[clamp(7px,1.2vmin,8px)] font-black flex items-center justify-center transition-all ${daysActive.includes(i) ? 'bg-yellow-600 text-black shadow-lg shadow-yellow-600/20' : 'bg-rose-muted text-rose-500'}`}>{d[0]}</button>
                                                    ))}
                                                </div>
                                                <div className="pt-[clamp(4px,1vmin,8px)] border-t border-rose-border">
                                                    <label className="text-[clamp(6px,1vmin,7px)] text-rose-400 font-black uppercase mb-[clamp(4px,1vmin,6px)] block text-center">Rango Horario del Día</label>
                                                    <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,12px)] w-full">
                                                        <input type="time" value={hourStart} onChange={e => setHourStart(e.target.value)} className="bg-white border border-rose-border rounded-lg p-[clamp(4px,1vmin,8px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none text-center" />
                                                        <input type="time" value={hourEnd} onChange={e => setHourEnd(e.target.value)} className="bg-white border border-rose-border rounded-lg p-[clamp(4px,1vmin,8px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none text-center" />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {trigger === 'happy_hour' && (
                                            <div className="grid grid-cols-2 gap-[clamp(4px,1vmin,12px)] w-full">
                                                <div className="space-y-[clamp(2px,0.5vmin,4px)]"><label className="text-[clamp(6px,1vmin,7px)] text-rose-400 font-black uppercase">Desde</label><input type="time" value={hourStart} onChange={e => setHourStart(e.target.value)} className="w-full bg-white border border-rose-border rounded-lg p-[clamp(4px,1vmin,8px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none" /></div>
                                                <div className="space-y-[clamp(2px,0.5vmin,4px)]"><label className="text-[clamp(6px,1vmin,7px)] text-rose-400 font-black uppercase">Hasta</label><input type="time" value={hourEnd} onChange={e => setHourEnd(e.target.value)} className="bg-white border border-rose-border rounded-lg p-[clamp(4px,1vmin,8px)] text-rose-900 font-mono text-[clamp(8px,1.5vmin,10px)] outline-none w-full" /></div>
                                            </div>
                                        )}
                                        {trigger === 'always' && <div className="text-center py-[clamp(6px,1.5vmin,16px)] text-[clamp(8px,1.5vmin,9px)] font-black text-emerald-500 uppercase tracking-widest">Activa 24/7 sin restricciones</div>}
                                    </div>
                                </div>
                            </div>
                            <div className="pt-[clamp(6px,1.5vmin,16px)] flex gap-[clamp(6px,1.5vmin,12px)]">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-rose-muted text-rose-500 py-[clamp(8px,2vmin,14px)] rounded-[clamp(12px,3vmin,24px)] font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest">Cerrar</button>
                                <button type="submit" className="flex-[2] bg-yellow-600 hover:bg-yellow-500 text-black py-[clamp(8px,2vmin,14px)] rounded-[clamp(12px,3vmin,24px)] font-black uppercase text-[clamp(8px,1.5vmin,10px)] tracking-widest shadow-2xl active:scale-95 transition-all">Activar Promo</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
