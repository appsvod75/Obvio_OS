import { useBarber } from '../context/BarberContext';

export function usePromotionStore() {
  const { promotions, addPromotion, updatePromotion, removePromotion } = useBarber();

  const getActivePromotions = () => promotions.filter(p => p.active !== false);

  return {
    promotions, getActivePromotions,
    addPromotion, updatePromotion, removePromotion,
  };
}
