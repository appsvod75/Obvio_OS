import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Sale } from '../types';

const API_URL = '/api';

interface SalesContextType {
  sales: Sale[];
  processSale: (sale: Sale) => Promise<Sale | null>;
  sendInvoiceByEmail: (sale: Sale, clientName: string, email: string) => Promise<boolean>;
  setSales: React.Dispatch<React.SetStateAction<Sale[]>>;
}

const SalesContext = createContext<SalesContextType | undefined>(undefined);

export const SalesProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [sales, setSales] = useState<Sale[]>([]);

  const processSale = async (sale: Sale): Promise<Sale | null> => {
    try {
      const res = await fetch(`${API_URL}/sales`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sale)
      });
      if (res.ok) {
        setSales(prev => [...prev, sale]);
        return sale;
      } else {
        const errData = await res.json().catch(() => ({}));
        console.error("Error backend sale:", res.status, errData.error || res.statusText);
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
  };

  const sendInvoiceByEmail = async (sale: Sale, clientName: string, email: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/send-ticket`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branchId: sale.branchId, email, ticketData: { sale, clientName } })
      });
      const data = await res.json();
      return data.success;
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <SalesContext.Provider value={{ sales, processSale, sendInvoiceByEmail, setSales }}>
      {children}
    </SalesContext.Provider>
  );
};

export const useSales = () => {
  const context = useContext(SalesContext);
  if (!context) throw new Error("useSales must be used within a SalesProvider");
  return context;
};
