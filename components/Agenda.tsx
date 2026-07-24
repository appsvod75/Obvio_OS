import React, { useState, useMemo, useCallback } from 'react';
import { useBarber } from '../context/BarberContext';
import { Appointment, TicketType } from '../types';
import { Calendar, Clock, User, Scissors, Plus, Check, X, Phone, FileText, Trash2, Edit, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDateES } from '../utils/dates';

const MONTHS = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const DAYS = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

const services = [
    { label: 'Corte', code: 'C' }, { label: 'Barba', code: 'B' },
    { label: 'Corte+Barba', code: 'D' }, { label: 'Tinte/Color', code: 'T' },
    { label: 'Otro', code: 'X' },
];

export const Agenda = ({ navigateView }: { navigateView?: (v: string) => void }) => {
    const { appointments, users, branches, currentUser, addAppointment, updateAppointment, deleteAppointment, createTicket, clients, categories, showToast } = useBarber();

    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [selectedDate, setSelectedDate] = useState(() => {
        const y = today.getFullYear(); const m = String(today.getMonth()+1).padStart(2,'0'); const d = String(today.getDate()).padStart(2,'0');
        return `${y}-${m}-${d}`;
    });

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formDate, setFormDate] = useState(''); const [formTime, setFormTime] = useState('10:00');
    const [formClient, setFormClient] = useState(''); const [formClientId, setFormClientId] = useState<string | undefined>(undefined);
    const [formPhone, setFormPhone] = useState(''); const [formBarber, setFormBarber] = useState('');
    const [formService, setFormService] = useState('Corte'); const [formNotes, setFormNotes] = useState('');
    const [clientSuggestions, setClientSuggestions] = useState<typeof clients>([]);

    const currentBranchId = currentUser?.branchId || branches[0]?.id;
    const barbers = users.filter(u => u.role === 'estilista' && u.active !== false && (u.branchId === currentBranchId || !u.branchId));

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const appointmentsByDate = useMemo(() => {
        const map: Record<string, Appointment[]> = {};
        appointments.forEach(a => { if (a.status === 'pending' || a.status === 'completed') { if (!map[a.date]) map[a.date] = []; map[a.date].push(a); } });
        return map;
    }, [appointments]);

    const dayAppointments = useMemo(() => {
        return (appointmentsByDate[selectedDate] || []).sort((a, b) => a.time.localeCompare(b.time));
    }, [appointmentsByDate, selectedDate]);

    const calendarDays = useMemo(() => {
        const days: (number | null)[] = [];
        for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
        for (let d = 1; d <= daysInMonth; d++) days.push(d);
        return days;
    }, [firstDayOfMonth, daysInMonth]);

    const dateStr = (day: number) => {
        const m = String(currentMonth + 1).padStart(2, '0'); const d = String(day).padStart(2, '0');
        return `${currentYear}-${m}-${d}`;
    };
    const isToday = (day: number) => {
        return today.getDate() === day && today.getMonth() === currentMonth && today.getFullYear() === currentYear;
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formClient.trim()) { showToast('error', 'Falta Cliente', 'Ingresa el nombre del cliente'); return; }
        const payload: Appointment = {
            id: editingId || crypto.randomUUID(), branchId: currentBranchId || '', date: formDate, time: formTime,
            clientId: formClientId, clientName: formClient, clientPhone: formPhone,
            barberId: formBarber || undefined, serviceType: formService, status: editingId ? (appointments.find(a => a.id === editingId)?.status || 'pending') : 'pending', notes: formNotes
        };
        if (editingId) { updateAppointment(payload); showToast('success', 'Cita Actualizada', `Cita de ${formClient} actualizada`); }
        else { addAppointment(payload); showToast('success', 'Cita Creada', `Cita para ${formClient} el ${formDate}`); }
        setShowModal(false); setEditingId(null);
    };

    const openCreate = () => {
        setEditingId(null); setFormDate(selectedDate); setFormTime('10:00');
        setFormClient(''); setFormClientId(undefined); setFormPhone(''); setFormBarber(''); setFormService('Corte'); setFormNotes('');
        setClientSuggestions([]); setShowModal(true);
    };

    const openEdit = (appt: Appointment) => {
        setEditingId(appt.id); setFormDate(appt.date); setFormTime(appt.time); setFormClient(appt.clientName);
        setFormClientId(appt.clientId); setFormPhone(appt.clientPhone || ''); setFormBarber(appt.barberId || '');
        setFormService(appt.serviceType); setFormNotes(appt.notes || ''); setShowModal(true);
    };

    const handleCheckIn = useCallback(async (appt: Appointment) => {
        let type: TicketType = 'C'; const s = appt.serviceType.toLowerCase();
        if (s.includes('barba') && s.includes('corte')) type = 'D';
        else if (s.includes('barba')) type = 'B';
        const existingClient = clients.find(c => c.name.toLowerCase() === appt.clientName.toLowerCase());
        const ticket = await createTicket(type, appt.clientName, existingClient?.id);
        if (ticket) { updateAppointment({ ...appt, status: 'completed' }); showToast('success', 'Atendido', `Ticket ${ticket.fullCode} para ${appt.clientName}`); }
        else showToast('error', 'Error', 'No se pudo generar el ticket');
    }, [clients, createTicket, updateAppointment, showToast]);

    const handleDelete = useCallback((id: string, name: string) => {
        if (window.confirm(`¿Cancelar cita de ${name}?`)) { deleteAppointment(id); showToast('success', 'Cancelada', `Cita de ${name} cancelada`); }
    }, [deleteAppointment, showToast]);

    return (
        <div className="h-full flex flex-col bg-rose-bg p-[clamp(6px,1.5vmin,24px)] animate-in fade-in overflow-hidden">
            <div className="flex flex-col lg:flex-row gap-[clamp(8px,2vmin,24px)] flex-1 min-h-0">
                {/* Calendario */}
                <div className="bg-white rounded-2xl border border-rose-border shadow-sm p-[clamp(8px,2vmin,24px)] lg:w-[400px] xl:w-[450px] shrink-0">
                    <div className="flex items-center justify-between mb-[clamp(8px,2vmin,20px)]">
                        <h2 className="text-[clamp(16px,4vmin,22px)] font-black text-rose-900 uppercase tracking-tight">Agenda</h2>
                        <div className="flex items-center gap-1 sm:gap-2">
                            <button onClick={() => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); } else setCurrentMonth(m => m - 1); }} className="p-1.5 sm:p-2 rounded-xl hover:bg-rose-muted text-rose-500 transition-colors"><ChevronLeft size={16} className="sm:size-[20px]" /></button>
                            <span className="font-black text-rose-900 text-[clamp(12px,3vmin,16px)] min-w-[120px] sm:min-w-[160px] text-center">{MONTHS[currentMonth]} {currentYear}</span>
                            <button onClick={() => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); } else setCurrentMonth(m => m + 1); }} className="p-1.5 sm:p-2 rounded-xl hover:bg-rose-muted text-rose-500 transition-colors"><ChevronRight size={16} className="sm:size-[20px]" /></button>
                        </div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 mb-1">
                        {DAYS.map(d => <div key={d} className="text-center text-[9px] sm:text-[10px] font-black text-rose-400 uppercase tracking-widest py-1 sm:py-2">{d}</div>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((day, i) => {
                            if (day === null) return <div key={`e-${i}`} />;
                            const ds = dateStr(day);
                            const hasApps = (appointmentsByDate[ds]?.length || 0) > 0;
                            const isSel = ds === selectedDate;
                            return (
                                <button key={ds} onClick={() => setSelectedDate(ds)}
                                    className={`relative flex items-center justify-center h-8 sm:h-10 lg:h-12 rounded-lg sm:rounded-xl text-[clamp(11px,2.5vmin,14px)] font-bold transition-all ${isSel ? 'bg-rose-palo text-white shadow-lg' : isToday(day) ? 'bg-rose-muted text-rose-palo-dark' : 'hover:bg-rose-muted text-rose-900'}`}>
                                    {day}
                                    {hasApps && <span className={`absolute bottom-1 w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-rose-palo'}`} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Lista de citas */}
                <div className="bg-white rounded-2xl border border-rose-border shadow-sm p-[clamp(8px,2vmin,24px)] flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-[clamp(8px,2vmin,16px)] shrink-0">
                        <h3 className="text-[clamp(11px,2.5vmin,14px)] font-black uppercase tracking-wider text-rose-500">
                            {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(/^\w/, c => c.toUpperCase())}
                        </h3>
                        <button onClick={openCreate} className="flex items-center gap-1 sm:gap-2 bg-rose-palo text-white px-[clamp(8px,2vmin,16px)] py-[clamp(4px,1vmin,10px)] rounded-lg sm:rounded-xl text-[clamp(10px,2.5vmin,13px)] font-black uppercase shadow-lg active:scale-95 transition-all hover:bg-rose-palo-dark">
                            <Plus size={14} className="sm:size-[16px]" /> Agendar
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-[clamp(4px,1vmin,8px)]">
                        {dayAppointments.length === 0 ? (
                            <div className="text-center py-[clamp(24px,6vmin,48px)] text-rose-400">
                                <Calendar size={28} className="mx-auto mb-2 sm:mb-3 opacity-30" />
                                <p className="font-bold text-[clamp(12px,2.5vmin,14px)]">Sin citas para este día</p>
                            </div>
                        ) : dayAppointments.map(appt => {
                            const barberName = barbers.find(b => b.id === appt.barberId)?.name?.split(' ')[0] || 'Cualquiera';
                            const isCompleted = appt.status === 'completed';
                            const pendingApps = (appointmentsByDate[selectedDate] || []).filter(a => a.status === 'pending').length;
                            return (
                                <div key={appt.id} className={`flex items-center gap-[clamp(8px,2vmin,16px)] p-[clamp(8px,2vmin,16px)] rounded-xl sm:rounded-2xl border transition-all ${isCompleted ? 'bg-rose-muted/30 border-rose-border/50 opacity-60' : 'bg-rose-bg/30 border-rose-border hover:border-rose-palo-light cursor-pointer'}`} onClick={() => !isCompleted && openEdit(appt)}>
                                    <div className="flex flex-col items-center min-w-[50px] sm:min-w-[60px]">
                                        <Clock size={12} className="text-rose-palo mb-0.5 sm:mb-1" />
                                        <span className="text-[clamp(12px,3vmin,16px)] font-black text-rose-900">{appt.time.slice(0, 5)}</span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-rose-900 text-[clamp(13px,3vmin,16px)] truncate">{appt.clientName}</p>
                                        <p className="text-[clamp(10px,2vmin,12px)] font-bold text-rose-400 truncate flex items-center gap-1 sm:gap-2 flex-wrap">
                                            <span><Scissors size={10} className="inline" /> {appt.serviceType}</span>
                                            <span>· {barberName}</span>
                                            {appt.clientPhone && <span>· {appt.clientPhone}</span>}
                                            {appt.notes && <span title={appt.notes}><FileText size={10} className="inline text-rose-300" /></span>}
                                        </p>
                                    </div>
                                    {isCompleted ? (
                                        <span className="text-[9px] sm:text-[10px] font-bold px-2 sm:px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 shrink-0">Hecho</span>
                                    ) : (
                                        <div className="flex gap-1 sm:gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => handleDelete(appt.id, appt.clientName)} className="p-1.5 sm:p-2 rounded-lg sm:rounded-xl bg-rose-50 text-rose-400 hover:bg-rose-100 hover:text-destructive transition-colors"><Trash2 size={14} className="sm:size-[16px]" /></button>
                                            <button onClick={() => handleCheckIn(appt)} className="px-[clamp(8px,2vmin,14px)] py-[clamp(4px,1vmin,8px)] bg-emerald-500 hover:bg-emerald-400 text-white font-bold rounded-lg sm:rounded-xl flex items-center gap-1 sm:gap-2 shadow-lg text-[clamp(10px,2.5vmin,12px)]">
                                                <Check size={12} className="sm:size-[14px]" /> Llegó
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center">
                    <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-[clamp(16px,4vmin,24px)] max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom">
                        <div className="flex items-center justify-between mb-[clamp(12px,3vmin,24px)]">
                            <h3 className="text-[clamp(16px,4vmin,20px)] font-black text-rose-900 uppercase tracking-tight">{editingId ? 'Editar Cita' : 'Nueva Cita'}</h3>
                            <button onClick={() => setShowModal(false)} className="p-1.5 sm:p-2 rounded-xl hover:bg-rose-muted text-rose-400"><X size={18} className="sm:size-[20px]" /></button>
                        </div>
                        <form onSubmit={handleSave} className="space-y-[clamp(8px,2vmin,16px)]">
                            <div>
                                <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Cliente</label>
                                <input required value={formClient} onChange={e => { setFormClient(e.target.value); setFormClientId(undefined); setClientSuggestions(clients.filter(c => c.name.toLowerCase().includes(e.target.value.toLowerCase())).slice(0, 5)); }}
                                    className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors" placeholder="Nombre del cliente" />
                                {clientSuggestions.length > 0 && !formClientId && (
                                    <div className="mt-1 rounded-xl border border-rose-border divide-y divide-rose-border overflow-hidden">
                                        {clientSuggestions.map(c => (
                                            <button key={c.id} type="button" onClick={() => { setFormClient(c.name); setFormClientId(c.id); setFormPhone(c.phone || ''); setClientSuggestions([]); }}
                                                className="w-full text-left p-[clamp(6px,1.5vmin,10px)] text-[clamp(11px,2.5vmin,13px)] font-bold text-rose-900 hover:bg-rose-muted">{c.name}{c.phone ? ` · ${c.phone}` : ''}</button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-[clamp(8px,2vmin,16px)]">
                                <div>
                                    <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Fecha</label>
                                    <input type="date" required value={formDate} onChange={e => setFormDate(e.target.value)}
                                        className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors" />
                                </div>
                                <div>
                                    <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Hora</label>
                                    <input type="time" required value={formTime} onChange={e => setFormTime(e.target.value)}
                                        className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Servicio</label>
                                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                    {[...services, ...(categories || []).filter(c => c.name !== 'General').map(c => ({ label: c.name, code: c.name }))].map(s => (
                                        <button key={s.label} type="button" onClick={() => setFormService(s.label)}
                                            className={`px-[clamp(8px,2vmin,14px)] py-[clamp(4px,1vmin,8px)] rounded-lg text-[clamp(10px,2.5vmin,12px)] font-bold border transition-all ${formService === s.label ? 'bg-rose-palo text-white border-rose-palo' : 'bg-rose-bg text-rose-700 border-rose-border hover:border-rose-palo'}`}>{s.label}</button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Estilista</label>
                                <select value={formBarber} onChange={e => setFormBarber(e.target.value)}
                                    className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors">
                                    <option value="">Cualquiera</option>
                                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Teléfono</label>
                                <input value={formPhone} onChange={e => setFormPhone(e.target.value)}
                                    className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors" placeholder="Opcional" />
                            </div>
                            <div>
                                <label className="text-[9px] sm:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1 sm:mb-1.5 block">Notas</label>
                                <textarea value={formNotes} onChange={e => setFormNotes(e.target.value)} rows={2}
                                    className="w-full p-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-bg border border-rose-border text-[clamp(12px,3vmin,14px)] font-bold outline-none focus:border-rose-palo transition-colors resize-none" />
                            </div>
                            <div className="flex gap-[clamp(8px,2vmin,16px)] pt-[clamp(4px,1vmin,8px)]">
                                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-muted text-rose-700 text-[clamp(11px,2.5vmin,13px)] font-black uppercase transition-colors">Cancelar</button>
                                <button type="submit" className="flex-1 py-[clamp(8px,2vmin,12px)] rounded-xl bg-rose-palo text-white text-[clamp(11px,2.5vmin,13px)] font-black uppercase shadow-lg hover:bg-rose-palo-dark active:scale-95 transition-all">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
