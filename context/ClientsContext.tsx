import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Client } from '../types';

const API_URL = '/api';

interface ClientsContextType {
  clients: Client[];
  addClient: (client: Client) => Promise<boolean>;
  updateClient: (client: Client) => Promise<boolean>;
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
}

const ClientsContext = createContext<ClientsContextType | undefined>(undefined);

export const ClientsProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([]);

  const addClient = async (client: Client): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/clients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (res.ok) {
        setClients(prev => [...prev, client]);
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateClient = async (client: Client): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/clients/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(client)
      });
      if (res.ok) {
        setClients(prev => prev.map(c => c.id === client.id ? client : c));
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <ClientsContext.Provider value={{ clients, addClient, updateClient, setClients }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) throw new Error("useClients must be used within a ClientsProvider");
  return context;
};
