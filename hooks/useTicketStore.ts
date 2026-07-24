import { useBarber } from '../context/BarberContext';
import type { Ticket, TicketType } from '../types';

export function useTicketStore() {
  const { tickets, createTicket, updateTicketStatus } = useBarber();

  const getActiveTickets = (branchId?: string) =>
    tickets.filter(t =>
      (t.status === 'waiting' || t.status === 'serving') &&
      (!branchId || t.branchId === branchId)
    );

  const getTicketsByBranch = (branchId: string) =>
    tickets.filter(t => t.branchId === branchId);

  return {
    tickets, getActiveTickets, getTicketsByBranch,
    createTicket, updateTicketStatus,
  };
}
