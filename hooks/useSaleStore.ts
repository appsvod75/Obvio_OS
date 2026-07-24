import { useBarber } from '../context/BarberContext';
import type { Sale } from '../types';

export function useSaleStore() {
  const { sales, processSale, sendInvoiceByEmail } = useBarber();

  const getSalesByBranch = (branchId: string) =>
    sales.filter(s => s.branchId === branchId);

  const getSalesByDate = (date: string) =>
    sales.filter(s => s.timestamp.startsWith(date));

  const getSalesByRange = (start: string, end: string) =>
    sales.filter(s => s.timestamp >= start && s.timestamp <= end);

  const getTodaySales = () => {
    const today = new Date().toISOString().split('T')[0];
    return getSalesByDate(today);
  };

  return {
    sales, getSalesByBranch, getSalesByDate,
    getSalesByRange, getTodaySales,
    processSale, sendInvoiceByEmail,
  };
}
