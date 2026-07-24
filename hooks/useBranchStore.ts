import { useBarber } from '../context/BarberContext';

export function useBranchStore() {
  const {
    branches, monthlyPlans,
    addBranch, updateBranch, upsertMonthlyPlan,
  } = useBarber();

  const getCurrentBranch = (branchId?: string) =>
    branches.find(b => b.id === branchId);

  return {
    branches, monthlyPlans, getCurrentBranch,
    addBranch, updateBranch, upsertMonthlyPlan,
  };
}
