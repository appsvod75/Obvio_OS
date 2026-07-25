import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Appointment } from '../types';

const API_URL = '/api';

interface AgendaContextType {
  appointments: Appointment[];
  addAppointment: (appt: Appointment) => Promise<boolean>;
  updateAppointment: (appt: Appointment) => Promise<boolean>;
  deleteAppointment: (id: string) => Promise<boolean>;
  setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
}

const AgendaContext = createContext<AgendaContextType | undefined>(undefined);

export const AgendaProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  const addAppointment = async (appt: Appointment): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appt)
      });
      if (res.ok) { setAppointments(prev => [...prev, appt]); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateAppointment = async (appt: Appointment): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments/${appt.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(appt)
      });
      if (res.ok) { setAppointments(prev => prev.map(a => a.id === appt.id ? appt : a)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const deleteAppointment = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/appointments/${id}`, { method: 'DELETE' });
      if (res.ok) { setAppointments(prev => prev.filter(a => a.id !== id)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <AgendaContext.Provider value={{ appointments, addAppointment, updateAppointment, deleteAppointment, setAppointments }}>
      {children}
    </AgendaContext.Provider>
  );
};

export const useAgenda = () => {
  const context = useContext(AgendaContext);
  if (!context) throw new Error("useAgenda must be used within a AgendaProvider");
  return context;
};
