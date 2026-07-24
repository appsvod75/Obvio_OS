import { useMemo } from 'react';
import { useBarber } from '../context/BarberContext';
import { hasPermission, getEffectivePermissions, type Permission } from '../types/permissions';

export function usePermissions() {
  const { currentUser } = useBarber();

  const can = useMemo(() => {
    if (!currentUser) return (_perm: Permission) => false;
    return (permission: Permission) =>
      hasPermission(currentUser.role, currentUser.permissionsOverrides, permission);
  }, [currentUser]);

  const permissions = useMemo(() => {
    if (!currentUser) return [];
    return getEffectivePermissions(currentUser.role, currentUser.permissionsOverrides);
  }, [currentUser]);

  const role = currentUser?.role;

  const isSuperAdmin = role === 'superadmin';
  const isAdmin = role === 'admin' || role === 'superadmin';

  return { can, permissions, role, isSuperAdmin, isAdmin, user: currentUser };
}

export function useCan(permission: Permission) {
  const { can } = usePermissions();
  return can(permission);
}
