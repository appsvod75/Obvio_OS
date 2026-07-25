import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Ticket, TicketType } from '../types';
import { nowES } from '../utils/dates';

const API_URL = '/api';

interface TicketsContextType {
  tickets: Ticket[];
  fetchTickets: (branchId?: string) => Promise<void>;
  createTicket: (type: TicketType, clientName: string, clientId?: string, branchId?: string) => Promise<Ticket | null>;
  updateTicketStatus: (ticketId: string, status: Ticket['status'], barberId?: string, chair?: string) => Promise<void>;
  setTickets: React.Dispatch<React.SetStateAction<Ticket[]>>;
}

const TicketsContext = createContext<TicketsContextType | undefined>(undefined);

export const TicketsProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);

  const fetchTickets = async (branchId?: string) => {
    try {
      const url = branchId ? `${API_URL}/tickets?branchId=${branchId}` : `${API_URL}/tickets`;
      const res = await fetch(url);
      const data = await res.json();
      const normalized = (data || []).map((t: any) => ({
        id: String(t.id),
        branchId: String(t.branch_id),
        sequenceNumber: t.sequence_number,
        fullCode: t.full_code,
        type: t.type,
        clientName: t.client_name,
        clientId: t.client_id ? String(t.client_id) : null,
        status: t.status,
        barberId: t.barber_id ? String(t.barber_id) : null,
        chair: t.chair,
        createdAt: t.created_at
      }));
      setTickets(normalized);
    } catch (e) { console.error(e); }
  };

  const createTicket = async (type: TicketType, clientName: string, clientId?: string, branchId?: string): Promise<Ticket | null> => {
    if (!branchId) return null;
    const branchTickets = tickets.filter(t => t.branchId === branchId);
    const sequenceNumber = branchTickets.length > 0 ? Math.max(...branchTickets.map(t => t.sequenceNumber)) + 1 : 1;

    const newTicket: Ticket = {
      id: Math.random().toString(36).substring(2, 15),
      branchId,
      sequenceNumber,
      fullCode: `${type}-${sequenceNumber.toString().padStart(3, '0')}`,
      type,
      clientName,
      clientId,
      status: 'waiting',
      createdAt: nowES()
    };

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTicket)
      });
      if (res.ok) {
        setTickets(prev => [...prev, newTicket]);
        return newTicket;
      }
    } catch (e) { console.error(e); }
    return null;
  };

  const updateTicketStatus = async (ticketId: string, status: Ticket['status'], barberId?: string, chair?: string) => {
    try {
      await fetch(`${API_URL}/tickets/${ticketId}/status`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, barberId, chair })
      });
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, barberId, chair } : t));
    } catch (e) { console.error(e); }
  };

  return (
    <TicketsContext.Provider value={{ tickets, fetchTickets, createTicket, updateTicketStatus, setTickets }}>
      {children}
    </TicketsContext.Provider>
  );
};

export const useTickets = () => {
  const context = useContext(TicketsContext);
  if (!context) throw new Error("useTickets must be used within a TicketsProvider");
  return context;
};
