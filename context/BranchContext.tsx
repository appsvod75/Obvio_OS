import React, { createContext, useContext, useState, PropsWithChildren } from 'react';
import { Branch, MonthlyPlan } from '../types';

const API_URL = '/api';

interface BranchContextType {
  branches: Branch[];
  monthlyPlans: MonthlyPlan[];
  addBranch: (branch: Branch) => Promise<boolean>;
  updateBranch: (branch: Branch) => Promise<boolean>;
  upsertMonthlyPlan: (plan: MonthlyPlan) => Promise<boolean>;
  setBranches: React.Dispatch<React.SetStateAction<Branch[]>>;
  setMonthlyPlans: React.Dispatch<React.SetStateAction<MonthlyPlan[]>>;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

export const BranchProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [monthlyPlans, setMonthlyPlans] = useState<MonthlyPlan[]>([]);

  const addBranch = async (branch: Branch): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/branches`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
      if (res.ok) { setBranches(prev => [...prev, branch]); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const updateBranch = async (branch: Branch): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/branches/${branch.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(branch)
      });
      if (res.ok) { setBranches(prev => prev.map(b => b.id === branch.id ? branch : b)); return true; }
    } catch (e) { console.error(e); }
    return false;
  };

  const upsertMonthlyPlan = async (plan: MonthlyPlan): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/monthly-plans`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(plan)
      });
      if (res.ok) {
        setMonthlyPlans(prev => {
          const filtered = prev.filter(p => !(p.branchId === plan.branchId && p.month === plan.month && p.year === plan.year));
          return [...filtered, plan];
        });
        return true;
      }
    } catch (e) { console.error(e); }
    return false;
  };

  return (
    <BranchContext.Provider value={{ branches, monthlyPlans, addBranch, updateBranch, upsertMonthlyPlan, setBranches, setMonthlyPlans }}>
      {children}
    </BranchContext.Provider>
  );
};

export const useBranch = () => {
  const context = useContext(BranchContext);
  if (!context) throw new Error("useBranch must be used within a BranchProvider");
  return context;
};
