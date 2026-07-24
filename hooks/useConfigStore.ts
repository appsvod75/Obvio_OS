import { useBarber } from '../context/BarberContext';

export function useConfigStore() {
  const { config, updateConfig } = useBarber();
  return { config, updateConfig };
}
