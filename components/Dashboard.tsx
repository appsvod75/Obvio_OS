
import React, { useState, useEffect } from 'react';
import { useBarber } from '../context/BarberContext';
import { useConfigCtx } from '../context/ConfigContext';
import { POS } from './POS';
import { Reception } from './Reception';
import { QueueDisplay } from './QueueDisplay';
import { BarberDashboard } from './BarberDashboard';
import { Agenda } from './Agenda';
import { CashReport } from './CashReport';
import { InventoryManager } from './InventoryManager';
import { ClientManager } from './ClientManager';
import { CatalogManager } from './CatalogManager';
import { BranchManager } from './BranchManager';
import { StaffManager } from './StaffManager';
import { SettingsManager } from './SettingsManager';
import { SalesHistory } from './SalesHistory';
import { PromotionManager } from './PromotionManager';
import { ReportingDashboard } from './ReportingDashboard';
import {
  LogOut, Scissors, Tv, Users, Store, Package, Settings,
  DollarSign, ArrowLeft, Tag, Wrench, UserCog, Calendar, LayoutGrid, Clock, Zap,
  BarChart3, Download
} from 'lucide-react';

export const Dashboard = () => {
  const { config } = useConfigCtx();
  const { currentUser, logout, installApp, isInstallable } = useBarber();
  const [hiddenPanels, setHiddenPanels] = useState<string[]>(() => config?.hiddenPanels || []);
  useEffect(() => {
    setHiddenPanels(config?.hiddenPanels || []);
  }, [config?.hiddenPanels]);
  // Debug: dump config to window for console access
  useEffect(() => { (window as any).__obvio_config = config; }, [config]);

  const [view, setView] = useState<string>(() => {
    const savedView = localStorage.getItem('last_view');
    if (savedView) return savedView;

    if (currentUser?.role === 'cashier') return 'pos';
    if (currentUser?.role === 'estilista') return 'barber_dash';
    if (currentUser?.role === 'reception') return 'reception';
    return 'menu';
  });

  const handleNavigate = (newView: string) => {
    setView(newView);
    localStorage.setItem('last_view', newView);
  };

  if (!currentUser) {
    return (
      <div className="h-screen bg-rose-bg flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-rose-500 font-bold uppercase tracking-widest text-[10px]">Iniciando BarberOS...</p>
        </div>
      </div>
    );
  }

  if (view === 'display') {
    return (
      <div className="fixed inset-0 z-50 bg-rose-muted">
        <QueueDisplay onClose={() => setView('menu')} />
      </div>
    );
  }

  const renderContent = () => {
    switch (view) {
      case 'pos': return <POS navigateView={handleNavigate} />;
      case 'reception': return <Reception navigateView={handleNavigate} />;
      case 'agenda': return <Agenda navigateView={handleNavigate} />;
      case 'cash_cut': return <CashReport navigateView={handleNavigate} />;
      case 'sales': return <SalesHistory navigateView={handleNavigate} />;
      case 'sales_pos': return <SalesHistory navigateView={handleNavigate} hideSummary />;
      case 'inventory': return <InventoryManager />;
      case 'clients': return <ClientManager />;
      case 'products': return <CatalogManager />;
      case 'branches': return <BranchManager />;
      case 'staff': return <StaffManager />;
      case 'promotions': return <PromotionManager />;
      case 'reports': return <ReportingDashboard />;
      case 'config_tv': return <SettingsManager initialTab="tv" />;
      case 'config_master': return <SettingsManager initialTab="master" />;
      case 'barber_dash': return <BarberDashboard />;
      case 'menu':
      default:
        if (currentUser?.role === 'admin') {
          return <AdminGridMenu />;
        }
        if (currentUser?.role === 'cashier') return <POS navigateView={handleNavigate} />;
        if (currentUser?.role === 'estilista') return <BarberDashboard />;
        if (currentUser?.role === 'reception') return <Reception navigateView={handleNavigate} />;
        return <AdminGridMenu />;
    }
  };

  const AdminGridMenu = () => {
    const items = [
      { view: 'pos', panelId: 'pos', icon: <Store style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-green-400" />, label: 'Caja', color: 'hover:bg-red-600' },
      { view: 'reception', panelId: 'reception', icon: <Users style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-blue-400" />, label: 'Recepción', color: 'hover:bg-blue-600' },
      { view: 'reports', panelId: 'reports', icon: <BarChart3 style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-blue-500" />, label: 'Reportes', color: 'hover:bg-blue-500' },
      { view: 'agenda', panelId: 'agenda', icon: <Calendar style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-violet-400" />, label: 'Agenda', color: 'hover:bg-violet-600' },
      { view: 'clients', panelId: 'clients', icon: <UserCog style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-teal-400" />, label: 'Clientes', color: 'hover:bg-teal-600' },
      { view: 'products', panelId: 'catalog', icon: <Tag style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-pink-400" />, label: 'Catálogo', color: 'hover:bg-pink-600' },
      { view: 'inventory', panelId: 'inventory', icon: <Package style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-purple-400" />, label: 'Inventario', color: 'hover:bg-purple-600' },
      { view: 'promotions', panelId: 'promotions', icon: <Zap style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-yellow-400" />, label: 'Promociones', color: 'hover:bg-yellow-600' },
      { view: 'branches', panelId: 'branches', icon: <Store style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-cyan-400" />, label: 'Sucursales', color: 'hover:bg-cyan-600' },
      { view: 'staff', panelId: 'staff', icon: <Users style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-yellow-400" />, label: 'Equipo', color: 'hover:bg-yellow-600' },
      { view: 'sales', panelId: 'sales', icon: <Clock style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-blue-400" />, label: 'Ventas', color: 'hover:bg-blue-800' },
      { view: 'cash_cut', panelId: 'cash_cut', icon: <DollarSign style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-emerald-400" />, label: 'Corte Caja', color: 'hover:bg-emerald-600' },
      { view: 'display', panelId: 'display', icon: <Tv style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-indigo-400" />, label: 'Pantalla TV', color: 'hover:bg-indigo-600' },
      { view: 'config_tv', panelId: 'settings_tv', icon: <Wrench style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-orange-400" />, label: 'Ajustes TV', color: 'hover:bg-orange-600' },
      { view: 'config_master', panelId: 'settings_master', icon: <Settings style={{ width: 'clamp(15px,3.4vmin,27px)', height: 'clamp(15px,3.4vmin,27px)' }} className="text-rose-400" />, label: 'Config', color: 'hover:bg-rose-500' },
    ].filter(i => !hiddenPanels.includes(i.panelId));
    return (
    <div className="p-6 max-w-7xl mx-auto animate-in zoom-in duration-200">
      <h2 className="text-2xl font-light text-rose-400 mb-6">Hola, <span className="text-rose-900 font-bold">{currentUser?.name}</span>. ¿Qué deseas hacer hoy?</h2>
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-4 auto-rows-fr">
        {items.map(item => (
          <MenuButton key={item.view} onClick={() => handleNavigate(item.view)} icon={item.icon} label={item.label} color={item.color} />
        ))}
      </div>
    </div>
  );
  };

  const MenuButton = ({ onClick, icon, label, color }: any) => (
    <button onClick={onClick} className={`bg-rose-muted group p-[clamp(6px,1.5vmin,12px)] rounded-[clamp(6px,1.5vmin,12px)] border border-rose-border transition-all shadow-lg flex flex-col items-center justify-center gap-[clamp(2px,0.5vmin,8px)] aspect-square ${color} hover:border-rose-palo/20`}>
      <div className="bg-white group-hover:bg-rose-palo/20 p-[clamp(4px,1vmin,10px)] rounded-full transition-colors">
        {React.cloneElement(icon, { className: `${icon.props.className} group-hover:text-white` })}
      </div>
      <span className="text-rose-900 font-bold text-[clamp(5px,1.2vmin,9px)] truncate max-w-full leading-tight text-center">{label}</span>
    </button>
  );

  const showHeader = view !== 'display';
  const isUserAdmin = currentUser?.role === 'admin';

  return (
    <div className="h-screen flex flex-col bg-rose-bg relative">
      {showHeader && (
        <header className="bg-white border-b border-rose-border h-14 flex items-center justify-between px-6 sticky top-0 z-40 shadow-md">
          <div className="flex items-center gap-4">
            {view !== 'menu' && isUserAdmin && (
              <button onClick={() => handleNavigate('menu')} className="bg-rose-muted hover:bg-rose-border p-2 rounded-full text-rose-500 hover:text-rose-900 transition-colors">
                <ArrowLeft size={20} />
              </button>
            )}
            <div className="flex items-center gap-3">
              {config.logoUrl ? <img src={config.logoUrl} alt="Logo" className="h-8 w-auto" /> : <div className="bg-red-600 p-1.5 rounded"><Scissors className="text-white" size={18} /></div>}
              <span className="font-bold text-base text-rose-900 hidden sm:block">{config.salonName}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isUserAdmin && (
              <div onClick={() => handleNavigate('menu')} className="hidden sm:flex items-center gap-2 text-rose-400 hover:text-rose-900 cursor-pointer px-3 py-1 rounded-lg hover:bg-rose-muted">
                <LayoutGrid size={16} /> <span className="text-sm font-medium">Menú Principal</span>
              </div>
            )}
            {isUserAdmin && <div className="h-6 w-px bg-rose-border mx-2"></div>}
            {isInstallable && (
              <button
                onClick={installApp}
                className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-purple-900/20 active:scale-95 transition-all animate-pulse"
              >
                <Download size={14} /> Instalar
              </button>
            )}
            <button onClick={logout} className="text-rose-400 hover:text-red-500 flex items-center gap-2 text-sm font-medium ml-2">
              <LogOut size={16} /> <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>
      )}
      <main className="flex-1 overflow-hidden">{renderContent()}</main>
    </div>
  );
};
