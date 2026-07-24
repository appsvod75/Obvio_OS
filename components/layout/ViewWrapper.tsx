import { useNavigate } from 'react-router-dom';

const VIEW_ROUTE_MAP: Record<string, string> = {
  pos: '/dashboard/pos',
  reception: '/dashboard/reception',
  menu: '/dashboard',
  cash_cut: '/dashboard/cash',
  sales: '/dashboard/sales',
  sales_pos: '/dashboard/sales?mode=cashier',
  inventory: '/dashboard/inventory',
  clients: '/dashboard/clients',
  products: '/dashboard/catalog',
  branches: '/dashboard/branches',
  staff: '/dashboard/staff',
  promotions: '/dashboard/promotions',
  reports: '/dashboard/reports',
  config_tv: '/dashboard/settings/tv',
  config_master: '/dashboard/settings',
  agenda: '/dashboard/agenda',
  barber_dash: '/dashboard/barber',
  display: '/dashboard/display',
};

export function useNavigateView() {
  const navigate = useNavigate();

  const navigateView = (view: string) => {
    const route = VIEW_ROUTE_MAP[view];
    if (route) navigate(route);
  };

  return navigateView;
}
