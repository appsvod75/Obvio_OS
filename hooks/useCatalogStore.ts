import { useBarber } from '../context/BarberContext';
import type { CatalogItem } from '../types';

export function useCatalogStore() {
  const { catalog, categories, addItem, updateItem, removeItem, addCategory } = useBarber();

  const getCatalogItem = (id: string) => catalog.find(i => i.id === id);

  const getServices = () => catalog.filter(i => i.type === 'service' && i.active !== false);
  const getProducts = () => catalog.filter(i => i.type === 'product' && i.active !== false);
  const getCombos = () => catalog.filter(i => i.type === 'combo' && i.active !== false);

  return {
    catalog, categories, getCatalogItem,
    getServices, getProducts, getCombos,
    addItem, updateItem, removeItem, addCategory,
  };
}
