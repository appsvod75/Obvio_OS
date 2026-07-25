import React, { useState, useEffect, useCallback } from 'react';
import { useAgenda } from '../context/AgendaContext';
import { Appointment } from '../types';
import { Bell, Clock, Scissors, User, Check } from 'lucide-react';

const API_URL = '/api';

export const AppointmentReminder = () => {
  const { appointments } = useAgenda();
  const [alertAppt, setAlertAppt] = useState<Appointment | null>(null);
  const [snoozedUntil, setSnoozedUntil] = useState<Record<string, number>>({});
  const [confirmedIds, setConfirmedIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem('appointment_confirmed');
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());

  const sendTelegramReminder = useCallback(async (appt: Appointment) => {
    try {
      await fetch(`${API_URL}/send-telegram-reminder`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appt.id })
      });
    } catch (e) { /* Telegram es opcional */ }
  }, []);

  const checkAppointments = useCallback(() => {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const in30Min = currentMinutes + 30;

    for (const appt of appointments) {
      if (confirmedIds.has(appt.id)) continue;
      if (appt.status === 'completed' || appt.status === 'cancelled') continue;
      if (appt.date !== today) continue;

      const [h, m] = appt.time.split(':').map(Number);
      const apptMinutes = h * 60 + m;

      if (apptMinutes > currentMinutes && apptMinutes <= in30Min) {
        if (snoozedUntil[appt.id] && Date.now() < snoozedUntil[appt.id]) continue;

        if (!notifiedIds.has(appt.id)) {
          setNotifiedIds(prev => new Set(prev).add(appt.id));
          sendTelegramReminder(appt);
        }

        setAlertAppt(appt);
        return;
      }
    }
    setAlertAppt(null);
  }, [appointments, snoozedUntil, confirmedIds, notifiedIds, sendTelegramReminder]);

  useEffect(() => {
    checkAppointments();
    const interval = setInterval(checkAppointments, 30000);
    return () => clearInterval(interval);
  }, [checkAppointments]);

  const handleSnooze = () => {
    if (!alertAppt) return;
    setSnoozedUntil(prev => ({ ...prev, [alertAppt.id]: Date.now() + 5 * 60 * 1000 }));
    setAlertAppt(null);
  };

  const handleConfirm = () => {
    if (!alertAppt) return;
    setConfirmedIds(prev => {
      const next = new Set(prev).add(alertAppt.id);
      localStorage.setItem('appointment_confirmed', JSON.stringify([...next]));
      return next;
    });
    setAlertAppt(null);
  };

  if (!alertAppt) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-rose-border overflow-hidden animate-in zoom-in-95">
        <div className="bg-rose-palo p-5 flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
            <Bell size={28} className="text-white" />
          </div>
          <div>
            <h2 className="text-white font-black text-lg uppercase tracking-tight">Próximo Cliente</h2>
            <p className="text-white/80 text-xs font-bold uppercase tracking-widest mt-0.5">Llegará en breve</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3 bg-rose-muted/50 p-4 rounded-2xl border border-rose-border">
            <div className="w-10 h-10 bg-rose-palo/20 rounded-xl flex items-center justify-center text-rose-palo-dark shrink-0">
              <User size={20} />
            </div>
            <div>
              <div className="font-black text-rose-900 text-lg uppercase tracking-tight">{alertAppt.clientName}</div>
              <div className="text-rose-500 text-xs font-bold uppercase tracking-widest mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-1"><Clock size={10} /> {alertAppt.time}</span>
                <span className="flex items-center gap-1"><Scissors size={10} /> {alertAppt.serviceType}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleSnooze}
              className="bg-rose-muted hover:bg-rose-surface text-rose-700 py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 border border-rose-border"
            >
              <Clock size={14} /> Recordar en 5 min
            </button>
            <button
              onClick={handleConfirm}
              className="bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl font-black uppercase text-xs tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg border-b-4 border-emerald-800 active:border-b-0"
            >
              <Check size={14} /> Confirmado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
