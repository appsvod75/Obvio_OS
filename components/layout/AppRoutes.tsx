import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useBarber } from '../../context/BarberContext';
import { Login } from '../Login';
import { QueueDisplay } from '../QueueDisplay';
import { DashboardHome } from './DashboardHome';
import { POS } from '../POS';
import { Reception } from '../Reception';
import { Agenda } from '../Agenda';
import { CashReport as CashReportPage } from '../CashReport';
import { SalesHistory } from '../SalesHistory';
import { InventoryManager } from '../InventoryManager';
import { ClientManager } from '../ClientManager';
import { CatalogManager } from '../CatalogManager';
import { BranchManager } from '../BranchManager';
import { StaffManager } from '../StaffManager';
import { SettingsManager } from '../SettingsManager';
import { PromotionManager } from '../PromotionManager';
import { ReportingDashboard } from '../ReportingDashboard';
import { BarberDashboard } from '../BarberDashboard';
import { CheckInView } from '../CheckInView';
import { ConsultarProducto } from '../ConsultarProducto';
import { MainLayout } from './MainLayout';
import { useNavigateView } from './ViewWrapper';

function POSPage() { const navigateView = useNavigateView(); return <POS navigateView={navigateView} />; }
function ReceptionPage() { const navigateView = useNavigateView(); return <Reception navigateView={navigateView} />; }
function AgendaPage() { const navigateView = useNavigateView(); return <Agenda navigateView={navigateView} />; }
function CashReportPageWrapper() { const navigateView = useNavigateView(); return <CashReportPage navigateView={navigateView} />; }
function SalesHistoryPage() { const navigateView = useNavigateView(); return <SalesHistory navigateView={navigateView} />; }
function SalesHistoryCashierPage() { const navigateView = useNavigateView(); return <SalesHistory navigateView={navigateView} hideSummary />; }
function SettingsTVPage() { return <SettingsManager initialTab="tv" />; }
function SettingsMasterPage() { return <SettingsManager initialTab="master" />; }

const roleDefaultRoute: Record<string, string> = {
  estilista: '/dashboard/checkin', reception: '/dashboard/reception',
  cashier: '/dashboard/pos', ventas_caja: '/dashboard/pos',
  superadmin: '/dashboard', admin: '/dashboard',
};

function AuthRedirect() {
  const { currentUser } = useBarber();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) return;
    const defaultRoute = roleDefaultRoute[currentUser.role] || '/dashboard';
    const currentPath = location.pathname;

    // Only redirect if user is on a non-admin route they shouldn't access
    const adminRoutes = ['/dashboard/staff', '/dashboard/branches', '/dashboard/settings', '/dashboard/settings/tv', '/dashboard/inventory', '/dashboard/promotions', '/dashboard/reports', '/dashboard/cash'];
    const staffRoutes = ['/dashboard/checkin'];

    if (adminRoutes.includes(currentPath) && !['superadmin', 'admin'].includes(currentUser.role)) {
      navigate(defaultRoute, { replace: true });
    }
    if (currentPath === '/dashboard' && currentUser.role === 'estilista') {
      navigate('/dashboard/checkin', { replace: true });
    }
  }, [currentUser, location.pathname]);

  return null;
}

export function AppRoutes() {
  const { currentUser, config } = useBarber();
  const [showWelcome, setShowWelcome] = useState(true);
  const prevUserRef = useRef(currentUser);

  // Mostrar saludo cada vez que el usuario pasa de no logueado a logueado
  useEffect(() => {
    if (!prevUserRef.current && currentUser) {
      setShowWelcome(true);
    }
    prevUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    if (!showWelcome) return;
    const t = setTimeout(() => setShowWelcome(false), 1500);
    return () => clearTimeout(t);
  }, [showWelcome]);

  if (!currentUser) return <Login />;
  if (currentUser.role === 'display') return <QueueDisplay />;

  if (showWelcome) {
    return (
      <div className="h-screen bg-rose-bg flex items-center justify-center animate-in fade-in duration-700">
        <div className="text-center px-6 animate-in zoom-in duration-500">
          <div className="text-6xl sm:text-7xl lg:text-8xl mb-4 inline-block" style={{ animation: 'wave 1.5s ease-in-out infinite', transformOrigin: '70% 70%' }}>
            👋
          </div>
          <p className="text-xl sm:text-2xl lg:text-3xl font-black animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <span className="text-shimmer">Bienvenid@,</span>{' '}
            <span className="text-rose-800">{currentUser?.name}</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <AuthRedirect />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<DashboardHome />} />
          <Route path="/dashboard/checkin" element={<CheckInView />} />
          <Route path="/dashboard/pos" element={<POSPage />} />
          <Route path="/dashboard/reception" element={<ReceptionPage />} />
          <Route path="/dashboard/agenda" element={<AgendaPage />} />
          <Route path="/dashboard/cash" element={<CashReportPageWrapper />} />
          <Route path="/dashboard/sales" element={<SalesHistoryPage />} />
          <Route path="/dashboard/sales/cashier" element={<SalesHistoryCashierPage />} />
          <Route path="/dashboard/inventory" element={<InventoryManager />} />
          <Route path="/dashboard/clients" element={<ClientManager />} />
          <Route path="/dashboard/catalog" element={<CatalogManager />} />
          <Route path="/dashboard/branches" element={<BranchManager />} />
          <Route path="/dashboard/staff" element={<StaffManager />} />
          <Route path="/dashboard/promotions" element={<PromotionManager />} />
          <Route path="/dashboard/reports" element={<ReportingDashboard />} />
          <Route path="/dashboard/barber" element={<BarberDashboard />} />
          <Route path="/dashboard/lookup" element={<ConsultarProducto />} />
          <Route path="/dashboard/settings/tv" element={<SettingsTVPage />} />
          <Route path="/dashboard/settings" element={<SettingsMasterPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </>
  );
}
