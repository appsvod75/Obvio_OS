import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useConfigStore } from '../../hooks/useConfigStore';
import { usePermissions } from '../../hooks/usePermissions';
import {
  Store, Users, BarChart3, Calendar, UserCog, Tag, Package,
  Zap, Clock, DollarSign, Tv, Wrench, Settings, ShoppingCart,
} from 'lucide-react';

const pathToPanelId: Record<string, string> = {
  '/dashboard/pos': 'pos', '/dashboard/reception': 'reception', '/dashboard/reports': 'reports',
  '/dashboard/agenda': 'agenda', '/dashboard/clients': 'clients', '/dashboard/catalog': 'catalog',
  '/dashboard/inventory': 'inventory', '/dashboard/promotions': 'promotions', '/dashboard/branches': 'branches',
  '/dashboard/staff': 'staff', '/dashboard/sales': 'sales', '/dashboard/cash': 'cash_cut',
  '/dashboard/display': 'display', '/dashboard/settings/tv': 'settings_tv', '/dashboard/settings': 'settings_master',
  '/dashboard/checkin': 'checkin',
};

interface MenuButtonConfig {
  label: string;
  icon: React.ReactNode;
  path: string;
  color: string;
  permission?: string;
  roles?: string[];
}

const menuButtons: MenuButtonConfig[] = [
  { label: 'POS', icon: <Store size={40} className="text-rose-palo-dark" />, path: '/dashboard/pos', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Recepción', icon: <Users size={40} className="text-rose-palo-dark" />, path: '/dashboard/reception', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Reportes', icon: <BarChart3 size={40} className="text-rose-palo-dark" />, path: '/dashboard/reports', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Agenda', icon: <Calendar size={40} className="text-rose-palo-dark" />, path: '/dashboard/agenda', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30', roles: ['superadmin', 'admin', 'reception'] },
  { label: 'Clientes', icon: <UserCog size={40} className="text-rose-palo-dark" />, path: '/dashboard/clients', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30', roles: ['superadmin', 'admin', 'reception'] },
  { label: 'Catálogo', icon: <Tag size={40} className="text-rose-palo-dark" />, path: '/dashboard/catalog', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Inventario', icon: <Package size={40} className="text-rose-palo-dark" />, path: '/dashboard/inventory', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Promociones', icon: <Zap size={40} className="text-rose-palo-dark" />, path: '/dashboard/promotions', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Sucursales', icon: <Store size={40} className="text-rose-palo-dark" />, path: '/dashboard/branches', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Equipo', icon: <Users size={40} className="text-rose-palo-dark" />, path: '/dashboard/staff', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Ventas', icon: <Clock size={40} className="text-rose-palo-dark" />, path: '/dashboard/sales', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Corte Caja', icon: <DollarSign size={40} className="text-rose-palo-dark" />, path: '/dashboard/cash', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Pantalla TV', icon: <Tv size={40} className="text-rose-palo-dark" />, path: '/dashboard/display', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Ajustes TV', icon: <Wrench size={40} className="text-rose-palo-dark" />, path: '/dashboard/settings/tv', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Configuración', icon: <Settings size={40} className="text-rose-palo-dark" />, path: '/dashboard/settings', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30' },
  { label: 'Marcación', icon: <Clock size={40} className="text-rose-palo-dark" />, path: '/dashboard/checkin', color: 'hover:bg-rose-palo/10 hover:border-rose-palo/30', roles: ['estilista', 'reception', 'cashier', 'ventas_caja'] },
];

export function DashboardHome() {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const { config } = useConfigStore();
  const { can } = usePermissions();
  const hiddenPanels: string[] = (config as any)?.hiddenPanels || [];
  (window as any).__obvio_config = config;

  const visibleButtons = menuButtons.filter(btn => {
    const panelId = pathToPanelId[btn.path];
    if (panelId && hiddenPanels.includes(panelId)) return false;
    if (btn.roles && !btn.roles.includes(currentUser?.role || '')) return false;
    if (btn.permission && !can(btn.permission as any)) return false;
    return true;
  });

  return (
    <div className="p-4 lg:p-5 max-w-7xl mx-auto animate-in zoom-in duration-200 overflow-y-auto h-full">
      <h2 className="text-base sm:text-lg font-light text-rose-500 mb-4 sm:mb-5">
        Hola, <span className="text-rose-900 font-bold">{currentUser?.name}</span>
      </h2>

      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2 sm:gap-2.5 auto-rows-fr justify-items-center">
        {visibleButtons.map(btn => (
          <button
            key={btn.path}
            onClick={() => navigate(btn.path)}
            className={`w-full bg-white group p-1.5 sm:p-2.5 rounded-lg sm:rounded-xl border border-rose-border/60 transition-all shadow-sm flex flex-col items-center justify-center gap-1 sm:gap-1.5 aspect-square ${btn.color} hover:shadow-md`}
          >
            <div className="bg-rose-muted group-hover:bg-rose-palo/20 p-1.5 sm:p-2 rounded-full transition-colors">
              {React.cloneElement(btn.icon, {})}
            </div>
            <span className="text-rose-800 font-bold text-[11px] sm:text-xs truncate max-w-full leading-tight">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
