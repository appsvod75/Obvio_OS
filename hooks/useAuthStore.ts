import { useBarber } from '../context/BarberContext';

export function useAuthStore() {
  const { currentUser, login, logout, installApp, isInstallable } = useBarber();
  return { currentUser, login, logout, installApp, isInstallable };
}
