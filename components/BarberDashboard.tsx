
import React, { useState, useMemo } from 'react';
import { useBarber } from '../context/BarberContext';
import { formatMonthYearES, formatWeekdayES, formatDateES, todayES, isSameDayES, formatTimeES } from '../utils/dates';
import { Calendar as CalendarIcon, DollarSign, Scissors, Clock, Search, LogOut, CheckCircle, User, ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export const BarberDashboard = () => {
    const { currentUser, sales, logout, appointments } = useBarber();

    // --- STATE FOR CALENDAR & AGENDA ---
    const [selectedDate, setSelectedDate] = useState(() => {
        // Default to Today YYYY-MM-DD
        return todayES();
    });

    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Date Range State for Historical Sales Query
    const [historyStartDate, setHistoryStartDate] = useState('');
    const [historyEndDate, setHistoryEndDate] = useState('');

    // --- CALENDAR LOGIC ---
    const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay(); // 0 = Sunday

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };
    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };
    const goToToday = () => {
        const today = new Date();
        setCurrentMonth(today);
        setSelectedDate(todayES());
    };

    // Get all dates where THIS barber has appointments (for the dots)
    const appointmentDates = useMemo(() => {
        const dates = new Set<string>();
        appointments.forEach(a => {
            if (a.barberId === currentUser?.id && a.status !== 'cancelled') {
                dates.add(a.date);
            }
        });
        return dates;
    }, [appointments, currentUser]);

    // --- SELECTED DAY AGENDA ---
    const selectedAgenda = useMemo(() => {
        return appointments
            .filter(a => a.barberId === currentUser?.id && a.date === selectedDate && a.status !== 'cancelled')
            .sort((a, b) => a.time.localeCompare(b.time));
    }, [appointments, currentUser, selectedDate]);

    // --- TODAY'S STATS (REAL TIME) ---
    const mySales = useMemo(() => {
        return sales.filter(s => s.barberId === currentUser?.id);
    }, [sales, currentUser]);

    const todayStats = useMemo(() => {
        const todays = mySales.filter(s => isSameDayES(s.timestamp, todayES() + 'T00:00:00-06:00'));

        const totalMoney = todays.reduce((acc, s) => acc + s.total, 0);
        const totalServices = todays.reduce((acc, s) => acc + s.items.length, 0);

        return { sales: todays, totalMoney, totalServices };
    }, [mySales]);

    // --- HISTORICAL QUERY STATS ---
    const rangeStats = useMemo(() => {
        if (!historyStartDate || !historyEndDate) return null;

        const start = new Date(historyStartDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(historyEndDate);
        end.setHours(23, 59, 59, 999);

        const filtered = mySales.filter(s => {
            const t = new Date(s.timestamp);
            return t >= start && t <= end;
        });

        const totalMoney = filtered.reduce((acc, s) => acc + s.total, 0);
        const totalServices = filtered.reduce((acc, s) => acc + s.items.length, 0);

        return { sales: filtered, totalMoney, totalServices };
    }, [mySales, historyStartDate, historyEndDate]);

    // Helper to render calendar days
    const renderCalendarDays = () => {
        const days = [];
        // Empty slots for days before the 1st
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-full"></div>);
        }

        // Actual days
        for (let d = 1; d <= daysInMonth; d++) {
            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const isSelected = selectedDate === dateStr;
            const hasAppt = appointmentDates.has(dateStr);
            const isToday = dateStr === todayES();

            days.push(
                <button
                    key={d}
                    onClick={() => setSelectedDate(dateStr)}
                    className={`h-10 w-full rounded-lg flex flex-col items-center justify-center relative transition-all ${isSelected
                            ? 'bg-rose-palo text-white font-bold shadow-lg shadow-rose-palo-dark/40'
                            : 'text-rose-400 hover:bg-rose-muted hover:text-rose-900'
                        } ${isToday && !isSelected ? 'border border-rose-border' : ''}`}
                >
                    <span className="text-sm">{d}</span>
                    {hasAppt && (
                        <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? 'bg-white' : 'bg-rose-palo'}`}></span>
                    )}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="min-h-screen bg-rose-bg text-rose-900 flex flex-col">

            {/* HEADER */}
            <header className="bg-white border-b border-rose-border h-16 flex items-center justify-between px-4 sticky top-0 z-40 shadow-md">
                <div className="flex items-center gap-3">
                    <div className="bg-rose-palo p-1.5 rounded shadow-lg shadow-rose-palo-dark/50">
                        <Scissors className="text-rose-900" size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-rose-900 tracking-tight leading-none">Hola, {currentUser?.name?.split(' ')[0] || 'Gestor'}</div>
                        <div className="text-[10px] text-rose-400 font-mono uppercase">Panel de Estilista</div>
                    </div>
                </div>
                <button onClick={logout} className="text-rose-400 hover:text-rose-palo-dark flex items-center gap-2 text-sm font-medium transition-colors">
                    <LogOut size={18} />
                </button>
            </header>

            <main className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full space-y-8">

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* COLUMN 1: CALENDARIO & AGENDA (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* CALENDAR WIDGET */}
                        <div className="bg-white border border-rose-border rounded-xl p-4 shadow-lg">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-rose-900 font-bold flex items-center gap-2 capitalize">
                                    <CalendarIcon className="text-rose-palo" size={18} />
                                    {formatMonthYearES(currentMonth.getFullYear(), currentMonth.getMonth())}
                                </h2>
                                <div className="flex gap-1">
                                    <button onClick={prevMonth} className="p-1 hover:bg-rose-muted rounded text-rose-400"><ChevronLeft size={20} /></button>
                                    <button onClick={goToToday} className="px-2 text-xs font-bold text-rose-500 hover:text-rose-900 uppercase">Hoy</button>
                                    <button onClick={nextMonth} className="p-1 hover:bg-rose-muted rounded text-rose-400"><ChevronRight size={20} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 mb-2 text-center">
                                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                                    <div key={i} className="text-[10px] font-bold text-rose-500 uppercase">{d}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {renderCalendarDays()}
                            </div>
                        </div>

                        {/* AGENDA LIST DETAIL */}
                        <div>
                            <h3 className="text-rose-400 font-bold flex items-center justify-between uppercase text-xs tracking-widest border-b border-rose-border pb-2 mb-4">
                                <span>
                                    Citas del {formatWeekdayES(selectedDate + 'T12:00:00')}, {formatDateES(selectedDate + 'T12:00:00')}
                                </span>
                                <span className="bg-rose-muted text-rose-700 px-2 py-0.5 rounded-full text-[10px]">{selectedAgenda.length}</span>
                            </h3>

                            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                                {selectedAgenda.length === 0 ? (
                                    <div className="bg-rose-muted/30 border border-rose-border/50 border-dashed rounded-xl p-8 text-center text-rose-500">
                                        <Clock size={32} className="mx-auto mb-2 opacity-30" />
                                        <p>Día libre de citas.</p>
                                    </div>
                                ) : (
                                    selectedAgenda.map(appt => {
                                        const isCompleted = appt.status === 'completed';
                                        return (
                                            <div key={appt.id} className={`p-4 rounded-xl border flex justify-between items-center transition-all ${isCompleted ? 'bg-rose-muted/50 border-rose-border opacity-60' : 'bg-white border-rose-border hover:border-rose-palo'}`}>
                                                <div className="flex items-center gap-4">
                                                    <div className="text-center min-w-[50px] bg-rose-bg p-2 rounded-lg border border-rose-border">
                                                        <div className="text-lg font-black text-rose-900 leading-none">{appt.time}</div>
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-rose-900 flex items-center gap-2">
                                                            {appt.clientName}
                                                            {isCompleted && <CheckCircle size={14} className="text-green-500" />}
                                                        </div>
                                                        <div className="text-xs text-rose-400 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-1">
                                                            <span className="bg-rose-muted px-1.5 py-0.5 rounded text-rose-700">{appt.serviceType}</span>
                                                            {appt.clientPhone && <span className="flex items-center gap-1"><MapPin size={10} /> {appt.clientPhone}</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className={`text-[10px] font-bold uppercase px-2 py-1 rounded ${isCompleted ? 'bg-green-900 text-green-400' : 'bg-rose-palo-dark text-white'}`}>
                                                        {isCompleted ? 'Atendido' : 'Agendado'}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>

                    {/* COLUMN 2: PRODUCCIÓN (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">

                        {/* REAL TIME STATS */}
                        <div className="bg-white p-6 rounded-xl border border-rose-border shadow-xl">
                            <h2 className="text-rose-500 font-bold flex items-center gap-2 uppercase text-xs tracking-widest mb-4">
                                <ActivityDot /> Producción Hoy
                            </h2>

                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div className="bg-rose-muted p-3 rounded-lg border border-rose-border">
                                    <div className="text-rose-500 text-[10px] uppercase font-bold mb-1">Total Generado</div>
                                    <div className="text-2xl font-black text-rose-900 text-green-400">${todayStats.totalMoney.toFixed(2)}</div>
                                </div>
                                <div className="bg-rose-muted p-3 rounded-lg border border-rose-border">
                                    <div className="text-rose-500 text-[10px] uppercase font-bold mb-1">Servicios</div>
                                    <div className="text-2xl font-black text-rose-900 text-rose-400">{todayStats.totalServices}</div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-xs text-rose-500 font-bold uppercase mb-2">Últimos trabajos</div>
                                {todayStats.sales.length === 0 ? (
                                    <p className="text-center text-rose-500 text-xs italic py-2">Sin actividad hoy.</p>
                                ) : (
                                    <div className="space-y-1">
                                        {todayStats.sales.slice().reverse().slice(0, 5).map(sale => (
                                            <div key={sale.id} className="flex justify-between items-center text-xs p-2 hover:bg-rose-muted rounded transition-colors">
                                                <span className="text-rose-700 truncate w-2/3">{sale.items.map(i => i.name).join(', ')}</span>
                                                <span className="font-mono text-green-500 font-bold">+${sale.total.toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* HISTORICAL QUERY */}
                        <div className="bg-white rounded-xl border border-rose-border overflow-hidden">
                            <div className="p-4 border-b border-rose-border bg-white">
                                <h2 className="text-rose-900 font-bold flex items-center gap-2 text-sm">
                                    <Search size={16} className="text-rose-400" /> Consultar Historial
                                </h2>
                            </div>

                            <div className="p-4">
                                <div className="space-y-3 mb-4">
                                    <div>
                                        <label className="text-[10px] text-rose-500 uppercase font-bold">Desde</label>
                                        <input
                                            type="date"
                                            value={historyStartDate}
                                            onChange={(e) => setHistoryStartDate(e.target.value)}
                                            className="w-full bg-rose-muted border border-rose-border rounded p-2 text-rose-900 text-xs outline-none focus:border-rose-palo"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-rose-500 uppercase font-bold">Hasta</label>
                                        <input
                                            type="date"
                                            value={historyEndDate}
                                            onChange={(e) => setHistoryEndDate(e.target.value)}
                                            className="w-full bg-rose-muted border border-rose-border rounded p-2 text-rose-900 text-xs outline-none focus:border-rose-palo"
                                        />
                                    </div>
                                </div>

                                {/* RESULTS */}
                                {historyStartDate && historyEndDate && rangeStats ? (
                                    <div className="animate-in fade-in slide-in-from-bottom-2 bg-rose-bg p-3 rounded-lg border border-rose-border">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-rose-400 text-xs">Total Período</span>
                                            <span className="text-lg font-black text-rose-900">${rangeStats.totalMoney.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-rose-500">Servicios</span>
                                            <span className="text-rose-700 font-bold">{rangeStats.totalServices}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-2 text-rose-500 text-xs">
                                        Selecciona fechas para calcular.
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                </div>
            </main>
        </div>
    );
};

const ActivityDot = () => (
    <span className="relative flex h-2 w-2 mr-1">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
    </span>
);
