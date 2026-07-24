import { useBarber } from '../context/BarberContext';
import type { Appointment } from '../types';

export function useAppointmentStore() {
  const { appointments, addAppointment, updateAppointment, deleteAppointment } = useBarber();

  const getAppointmentsByDate = (date: string) =>
    appointments.filter(a => a.date === date);

  const getAppointmentsByBarber = (barberId: string) =>
    appointments.filter(a => a.barberId === barberId);

  const getTodayAppointments = () => {
    const today = new Date().toISOString().split('T')[0];
    return getAppointmentsByDate(today);
  };

  return {
    appointments, getAppointmentsByDate, getAppointmentsByBarber, getTodayAppointments,
    addAppointment, updateAppointment, deleteAppointment,
  };
}
