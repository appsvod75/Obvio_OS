import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../hooks/useAuthStore';
import { useConfigStore } from '../../hooks/useConfigStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useBranchStore } from '../../hooks/useBranchStore';
import { AppointmentReminder } from '../AppointmentReminder';
import {
  LogOut, Scissors, Store, Package, Settings,
  DollarSign, LayoutGrid, Calendar, Users, Tag,
  UserCog, BarChart3, Tv, Wrench, Zap, Clock,
    Download, ChevronLeft, ChevronRight, Menu,
  ShoppingCart,
} from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  permission?: string;
  roles?: string[];
}

const mainNavItems: NavItem[] = [
  { label: 'Menú', icon: <LayoutGrid size={20} />, path: '/dashboard', roles: ['superadmin', 'admin'] },
  { label: 'POS', icon: <ShoppingCart size={20} />, path: '/dashboard/pos', roles: ['superadmin', 'admin', 'cashier', 'ventas_caja'] },
  { label: 'Marcación', icon: <Clock size={20} />, path: '/dashboard/checkin', roles: ['estilista', 'reception', 'cashier', 'ventas_caja'] },
  { label: 'Recepción', icon: <Users size={20} />, path: '/dashboard/reception', roles: ['superadmin', 'admin', 'reception'] },
  { label: 'Agenda', icon: <Calendar size={20} />, path: '/dashboard/agenda', roles: ['superadmin', 'admin', 'reception'] },
  { label: 'Clientes', icon: <UserCog size={20} />, path: '/dashboard/clients', roles: ['superadmin', 'admin', 'reception'] },
  { label: 'Catálogo', icon: <Tag size={20} />, path: '/dashboard/catalog', roles: ['superadmin', 'admin'] },
  { label: 'Inventario', icon: <Package size={20} />, path: '/dashboard/inventory', roles: ['superadmin', 'admin'] },
  { label: 'Promociones', icon: <Zap size={20} />, path: '/dashboard/promotions', roles: ['superadmin', 'admin'] },
  { label: 'Ventas', icon: <Clock size={20} />, path: '/dashboard/sales', roles: ['superadmin', 'admin', 'cashier', 'ventas_caja'] },
  { label: 'Corte Caja', icon: <DollarSign size={20} />, path: '/dashboard/cash', roles: ['superadmin', 'admin', 'cashier'] },
  { label: 'Sucursales', icon: <Store size={20} />, path: '/dashboard/branches', roles: ['superadmin', 'admin'] },
  { label: 'Equipo', icon: <Users size={20} />, path: '/dashboard/staff', roles: ['superadmin', 'admin'] },
  { label: 'Reportes', icon: <BarChart3 size={20} />, path: '/dashboard/reports', roles: ['superadmin', 'admin'] },
  { label: 'Pantalla TV', icon: <Tv size={20} />, path: '/dashboard/display', roles: ['superadmin', 'admin'] },
  { label: 'Ajustes TV', icon: <Wrench size={20} />, path: '/dashboard/settings/tv', roles: ['superadmin', 'admin'] },
  { label: 'Configuración', icon: <Settings size={20} />, path: '/dashboard/settings', roles: ['superadmin', 'admin'] },
];

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout, installApp, isInstallable } = useAuthStore();
  const { config } = useConfigStore();
  const { can } = usePermissions();
  const { branches } = useBranchStore();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check if user has checked in today
  const isAdmin = currentUser?.role === 'superadmin' || currentUser?.role === 'admin';
  const today = new Date().toISOString().split('T')[0];
  const stored = localStorage.getItem(`attendance_${currentUser?.id}`);
  const hasCheckin = stored?.startsWith(today) && stored?.includes('CHECK_IN');
  const isLocked = !isAdmin && !hasCheckin;

  useEffect(() => {
    if (isLocked && location.pathname !== '/dashboard/checkin') {
      navigate('/dashboard/checkin', { replace: true });
    }
  }, [isLocked, location.pathname]);

  if (!currentUser) return null;

  const pathToPanelId: Record<string, string> = {
    '/dashboard/pos': 'pos',
    '/dashboard/reception': 'reception',
    '/dashboard/agenda': 'agenda',
    '/dashboard/clients': 'clients',
    '/dashboard/catalog': 'catalog',
    '/dashboard/inventory': 'inventory',
    '/dashboard/promotions': 'promotions',
    '/dashboard/sales': 'sales',
    '/dashboard/cash': 'cash_cut',
    '/dashboard/branches': 'branches',
    '/dashboard/staff': 'staff',
    '/dashboard/reports': 'reports',
    '/dashboard/display': 'display',
    '/dashboard/checkin': 'checkin',
    '/dashboard/settings/tv': 'settings_tv',
    '/dashboard/settings': 'settings_master',
  };
  const hiddenPanels: string[] = config?.hiddenPanels || [];

  const visibleItems = mainNavItems.filter(item => {
    if (item.roles && !item.roles.includes(currentUser.role)) return false;
    if (item.permission && !can(item.permission as any)) return false;
    const panelId = pathToPanelId[item.path];
    if (panelId && hiddenPanels.includes(panelId)) return false;
    if (isLocked && item.path !== '/dashboard/checkin') return false;
    return true;
  });

  const navigateWithFallback = (path: string) => {
    navigate(path);
    setSidebarOpen(false);
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  };

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const SidebarContent = () => (
    <div className="min-h-full bg-white border-r border-rose-border">
      <div className="sticky top-0 z-10 bg-white p-4 border-b border-rose-border flex items-center gap-3">
        {config.logoUrl ? (
          <img src={config.logoUrl} alt="Logo" className="h-8 w-auto" />
        ) : (
          <div className="bg-rose-palo p-1.5 rounded shrink-0">
            <Scissors className="text-white" size={18} />
          </div>
        )}
        <span className="font-bold text-sm text-rose-900 truncate">
          {config.salonName}
        </span>
      </div>

      <div className="p-2 space-y-1">
        {visibleItems.map(item => (
          <button
            key={item.path}
            tabIndex={-1}
            onClick={() => navigateWithFallback(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
              isActive(item.path)
                ? 'bg-rose-palo/10 text-rose-palo-dark border border-rose-palo/20'
                : 'text-rose-700/70 hover:text-rose-900 hover:bg-rose-muted'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="sticky bottom-0 bg-white p-3 border-t border-rose-border space-y-2">
        {isInstallable && (
          <button
            onClick={installApp}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-palo/10 text-rose-palo-dark text-xs font-black uppercase tracking-widest hover:bg-rose-palo/20 transition-all"
          >
            <Download size={14} /> Instalar App
          </button>
        )}
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-rose-400 hover:text-destructive hover:bg-destructive/10 transition-all text-sm"
        >
          <LogOut size={18} /> <span>Cerrar Sesión</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="h-[100dvh] w-screen flex bg-rose-bg text-rose-900 overflow-hidden">
      <AppointmentReminder />
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-rose-palo-dark/20 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 bg-white overflow-y-auto w-72 transition-transform duration-300 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ overscrollBehavior: 'contain', scrollBehavior: 'auto', overflowAnchor: 'none' }}
      >
        <SidebarContent />
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <header className="h-14 bg-white border-b border-rose-border flex items-center justify-between px-4 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            {!isLocked && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <Menu size={20} />
              </button>
            )}
            <span className="text-rose-500 text-sm hidden sm:block">
              {currentUser.name}
            </span>
            <span className="bg-rose-palo/10 text-rose-palo-dark text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full">
              {currentUser.role === 'superadmin' ? 'SUPER ADMIN' : currentUser.role.toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {branches.length > 1 && (
              <span className="text-rose-500 text-xs hidden md:block">
                {branches.find(b => b.id === currentUser.branchId)?.name || ''}
              </span>
            )}
            {isInstallable && (
              <button
                onClick={installApp}
                className="bg-rose-palo text-white px-3 py-1.5 rounded-lg font-black uppercase text-[9px] tracking-widest flex items-center gap-1.5 shadow-lg animate-pulse hover:bg-rose-palo-dark transition-all active:scale-95"
                title="Instalar App"
              >
                <Download size={12} /> Instalar
              </button>
            )}
            {!isLocked && (
              <button
                onClick={() => navigate('/dashboard')}
                className="text-rose-400 hover:text-rose-700 p-2 rounded-xl hover:bg-rose-muted transition-all"
                title="Inicio"
              >
                <LayoutGrid size={16} />
              </button>
            )}
            <button
              onClick={logout}
              className="text-rose-400 hover:text-destructive p-2 rounded-xl hover:bg-destructive/10 transition-all"
              title="Cerrar Sesión"
            >
              <LogOut size={16} />
            </button>
          </div>
        </header>

        <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
