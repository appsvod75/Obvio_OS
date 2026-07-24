import { useBarber } from '../context/BarberContext';

export function useCashStore() {
  const {
    cashSession, cashClosures,
    checkCashSession, openCashSession,
    closeCashSession, sendCashCutEmail,
  } = useBarber();

  return {
    cashSession, cashClosures,
    checkCashSession, openCashSession,
    closeCashSession, sendCashCutEmail,
  };
}
