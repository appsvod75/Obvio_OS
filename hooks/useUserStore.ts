import { useBarber } from '../context/BarberContext';

export function useUserStore() {
  const { users, addUser, updateUser, removeUser } = useBarber();

  const getBarbers = (branchId?: string) =>
    users.filter(u =>
      u.role === 'estilista' &&
      u.active !== false &&
      (!branchId || u.branchId === branchId)
    );

  const getStaffByBranch = (branchId: string) =>
    users.filter(u =>
      u.active !== false &&
      u.branchId === branchId
    );

  return {
    users, getBarbers, getStaffByBranch,
    addUser, updateUser, removeUser,
  };
}
