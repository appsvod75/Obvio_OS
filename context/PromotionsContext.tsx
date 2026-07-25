import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Promotion } from '../types';

const API_URL = '/api';

interface PromotionsContextType {
  promotions: Promotion[];
  addPromotion: (promo: Promotion) => Promise<boolean>;
  updatePromotion: (promo: Promotion) => Promise<boolean>;
  removePromotion: (id: string) => Promise<boolean>;
  setPromotions: React.Dispatch<React.SetStateAction<Promotion[]>>;
}

const PromotionsContext = createContext<PromotionsContextType | undefined>(undefined);

export const PromotionsProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);

  const addPromotion = async (promo: Promotion): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/promotions`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      if (res.ok) { setPromotions(prev => [...prev, promo]); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updatePromotion = async (promo: Promotion): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/promotions/${promo.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promo)
      });
      if (res.ok) { setPromotions(prev => prev.map(p => p.id === promo.id ? promo : p)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const removePromotion = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/promotions/${id}`, { method: 'DELETE' });
      if (res.ok) { setPromotions(prev => prev.filter(p => p.id !== id)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <PromotionsContext.Provider value={{ promotions, addPromotion, updatePromotion, removePromotion, setPromotions }}>
      {children}
    </PromotionsContext.Provider>
  );
};

export const usePromotions = () => {
  const context = useContext(PromotionsContext);
  if (!context) throw new Error("usePromotions must be used within a PromotionsProvider");
  return context;
};
