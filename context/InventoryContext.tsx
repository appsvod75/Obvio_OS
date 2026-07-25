import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { BranchStock, InventoryMovement, InventoryMovementType } from '../types';
import { nowES } from '../utils/dates';

const API_URL = '/api';

interface InventoryContextType {
  stocks: BranchStock[];
  inventoryMovements: InventoryMovement[];
  providers: string[];
  movementReasons: string[];
  getBranchStock: (branchId: string, itemId: string) => BranchStock | undefined;
  registerInventoryMovement: (branchId: string, itemId: string, type: InventoryMovementType, quantity: number, unitCost?: number, reason?: string, status?: 'pending' | 'completed') => Promise<boolean>;
  transferStock: (fromBranch: string, toBranch: string, itemId: string, quantity: number, reason: string) => Promise<void>;
  confirmTransferIn: (movementId: string) => void;
  addProvider: (name: string) => void;
  addMovementReason: (reason: string) => void;
  setStocks: React.Dispatch<React.SetStateAction<BranchStock[]>>;
  setInventoryMovements: React.Dispatch<React.SetStateAction<InventoryMovement[]>>;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

export const InventoryProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [stocks, setStocks] = useState<BranchStock[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
  const [providers, setProviders] = useState<string[]>(['Proveedor Local']);
  const [movementReasons, setMovementReasons] = useState<string[]>(['Compra', 'Ajuste', 'Merma', 'Uso Interno']);

  const getBranchStock = (branchId: string, itemId: string) =>
    stocks.find(s => s.branchId === branchId && s.itemId === itemId);

  const registerInventoryMovement = async (
    branchId: string, itemId: string, type: InventoryMovementType,
    quantity: number, unitCost: number = 0, reason: string = '',
    status: 'pending' | 'completed' = 'completed'
  ): Promise<boolean> => {
    try {
      const payload = {
        id: crypto.randomUUID(), branchId, itemId, type, quantity,
        unitCost, reason, status, relatedBranchId: null
      };
      const res = await fetch(`${API_URL}/inventory-movements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const itemName = 'Producto';
        const newMovement: InventoryMovement = {
          ...payload, date: nowES(), itemName,
          previousStock: 0, newStock: quantity
        };
        setInventoryMovements(prev => [newMovement, ...prev]);
        setStocks(prev => {
          const existing = prev.find(s => s.branchId === branchId && s.itemId === itemId);
          if (existing) {
            return prev.map(s =>
              s.branchId === branchId && s.itemId === itemId
                ? { ...s, stock: s.stock + (['sale', 'adjustment_out', 'transfer_out'].includes(type) ? -quantity : quantity) }
                : s
            );
          } else {
            return [...prev, { id: crypto.randomUUID(), branchId, itemId, stock: quantity, averageCost: unitCost }];
          }
        });
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  const transferStock = async (fromBranch: string, toBranch: string, itemId: string, quantity: number, reason: string) => {
    try {
      const payload = {
        id: crypto.randomUUID(), branchId: fromBranch, itemId,
        type: 'transfer_out' as InventoryMovementType, quantity,
        unitCost: getBranchStock(fromBranch, itemId)?.averageCost || 0,
        reason, relatedBranchId: toBranch, status: 'pending'
      };
      const res = await fetch(`${API_URL}/inventory-movements`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setStocks(prev => prev.map(s =>
          s.branchId === fromBranch && s.itemId === itemId
            ? { ...s, stock: s.stock - quantity } : s
        ));
      }
    } catch (e) { console.error(e); }
  };

  const confirmTransferIn = (movementId: string) => {
    console.log("Confirmación de traslado pendiente de implementación completa en backend");
  };

  const addProvider = (name: string) => {
    if (!providers.includes(name)) setProviders(prev => [...prev, name]);
  };

  const addMovementReason = (reason: string) => {
    if (!movementReasons.includes(reason)) setMovementReasons(prev => [...prev, reason]);
  };

  return (
    <InventoryContext.Provider value={{
      stocks, inventoryMovements, providers, movementReasons,
      getBranchStock, registerInventoryMovement, transferStock, confirmTransferIn,
      addProvider, addMovementReason, setStocks, setInventoryMovements
    }}>
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error("useInventory must be used within a InventoryProvider");
  return context;
};
