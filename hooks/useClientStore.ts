import { useBarber } from '../context/BarberContext';
import type { Client } from '../types';

export function useClientStore() {
  const { clients, addClient, updateClient } = useBarber();

  const getClient = (id?: string) => id ? clients.find(c => c.id === id) : undefined;
  const getClientByName = (name: string) =>
    clients.filter(c => c.name.toLowerCase().includes(name.toLowerCase()));

  return { clients, getClient, getClientByName, addClient, updateClient };
}
