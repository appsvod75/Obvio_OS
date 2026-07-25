import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { CatalogItem } from '../types';

const API_URL = '/api';

interface Category {
  id: string;
  name: string;
}

interface CatalogContextType {
  catalog: CatalogItem[];
  categories: Category[];
  addItem: (item: CatalogItem) => Promise<boolean>;
  updateItem: (item: CatalogItem) => Promise<boolean>;
  removeItem: (id: string) => Promise<boolean>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (oldName: string, newName: string) => Promise<boolean>;
  removeCategory: (name: string) => Promise<void>;
  setCatalog: React.Dispatch<React.SetStateAction<CatalogItem[]>>;
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const CatalogContext = createContext<CatalogContextType | undefined>(undefined);

export const CatalogProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const addItem = async (item: CatalogItem): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/catalog`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) { setCatalog(prev => [...prev, item]); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateItem = async (item: CatalogItem): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/catalog/${item.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item)
      });
      if (res.ok) { setCatalog(prev => prev.map(i => i.id === item.id ? item : i)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const removeItem = async (id: string): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/catalog/${id}`, { method: 'DELETE' });
      if (res.ok) { setCatalog(prev => prev.filter(i => i.id !== id)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const addCategory = async (name: string) => {
    if (categories.some(c => c.name === name)) return;
    try {
      const res = await fetch(`${API_URL}/categories`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      const data = await res.json();
      if (res.ok) setCategories(prev => [...prev, { id: data.id, name }]);
    } catch (e) { console.error(e); }
  };

  const updateCategory = async (oldName: string, newName: string): Promise<boolean> => {
    if (!oldName || !newName || oldName === newName) return false;
    if (categories.some(c => c.name === newName)) return false;
    try {
      const res = await fetch(`${API_URL}/categories/${encodeURIComponent(oldName)}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName })
      });
      if (res.ok) {
        setCategories(prev => prev.map(c => c.name === oldName ? { ...c, name: newName } : c));
        setCatalog(prev => prev.map(item => item.category === oldName ? { ...item, category: newName } : item));
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const removeCategory = async (name: string) => {
    try {
      const res = await fetch(`${API_URL}/categories/${encodeURIComponent(name)}`, { method: 'DELETE' });
      if (res.ok) {
        const general = categories.find(c => c.name === 'General') || { id: 'general', name: 'General' };
        setCategories(prev => prev.filter(c => c.name !== name));
        setCatalog(prev => prev.map(item => item.category === name ? { ...item, category: general.name, categoryId: general.id } : item));
      }
    } catch (e) { console.error(e); }
  };

  return (
    <CatalogContext.Provider value={{
      catalog, categories, setCatalog, setCategories,
      addItem, updateItem, removeItem,
      addCategory, updateCategory, removeCategory
    }}>
      {children}
    </CatalogContext.Provider>
  );
};

export const useCatalog = () => {
  const context = useContext(CatalogContext);
  if (!context) throw new Error("useCatalog must be used within a CatalogProvider");
  return context;
};
