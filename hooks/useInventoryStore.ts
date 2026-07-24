import { useBarber } from '../context/BarberContext';
import type { InventoryMovementType } from '../types';

export function useInventoryStore() {
  const {
    stocks, inventoryMovements, providers, movementReasons,
    getBranchStock, registerInventoryMovement,
    transferStock, confirmTransferIn,
    addProvider, addMovementReason,
  } = useBarber();

  const getLowStockItems = (threshold: number = 5) =>
    stocks.filter(s => s.stock <= threshold);

  const getMovementsByItem = (itemId: string) =>
    inventoryMovements.filter(m => m.itemId === itemId);

  return {
    stocks, inventoryMovements, providers, movementReasons,
    getBranchStock, registerInventoryMovement,
    transferStock, confirmTransferIn,
    addProvider, addMovementReason,
    getLowStockItems, getMovementsByItem,
  };
}
