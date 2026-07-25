
import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { User, Client, CatalogItem, Ticket, Sale, AppConfig, Role, TicketType, InventoryMovement, InventoryMovementType, Branch, BranchStock, CashSession, VideoItem, VideoLog, Appointment, Promotion, MonthlyPlan, CashClosure } from '../types';
import { ToastContainer, ToastMessage, ToastType } from '../components/Toast';
import { useClients } from './ClientsContext';
import { useCatalog } from './CatalogContext';
import { usePromotions } from './PromotionsContext';
import { useAgenda } from './AgendaContext';
import { useStaff } from './StaffContext';
import { useBranch } from './BranchContext';

import { nowES } from '../utils/dates';

// URL de la API e inicialización de Socket
const API_URL = '/api';
import socket from '../lib/socket';

interface BarberContextType {
    currentUser: User | null;
    login: (pin: string) => Promise<boolean>;
    logout: () => void;
    branches: Branch[];
    monthlyPlans: MonthlyPlan[];
    users: User[];
    clients: Client[];
    catalog: CatalogItem[];
    categories: Category[];
    stocks: BranchStock[];
    tickets: Ticket[];
    sales: Sale[];
    config: AppConfig;
    inventoryMovements: InventoryMovement[];
    providers: string[];
    movementReasons: string[];
    cashSession: CashSession | null;
    cashClosures: CashClosure[];
    videoLogs: VideoLog[];
    appointments: Appointment[];
    promotions: Promotion[];
    addBranch: (branch: Branch) => void;
    updateBranch: (branch: Branch) => void;
    upsertMonthlyPlan: (plan: MonthlyPlan) => void;
    addUser: (user: User) => void;
    updateUser: (user: User) => void;
    removeUser: (id: string) => void;
    addClient: (client: Client) => void;
    updateClient: (client: Client) => void;
    createTicket: (type: TicketType, clientName: string, clientId?: string) => Promise<Ticket | null>;
    updateTicketStatus: (ticketId: string, status: Ticket['status'], barberId?: string, chair?: string) => void;
    addItem: (item: CatalogItem) => void;
    updateItem: (item: CatalogItem) => void;
    removeItem: (id: string) => void;
    addCategory: (name: string) => void;
    updateCategory: (oldName: string, newName: string) => void;
    removeCategory: (name: string) => void;
    processSale: (sale: Sale) => Promise<Sale | null>;
    sendInvoiceByEmail: (sale: Sale, clientName: string, email: string) => Promise<boolean>;
    getBranchStock: (branchId: string, itemId: string) => BranchStock | undefined;
    registerInventoryMovement: (branchId: string, itemId: string, type: InventoryMovementType, quantity: number, cost?: number, reason?: string, status?: 'pending' | 'completed') => Promise<boolean>;
    transferStock: (fromBranch: string, toBranch: string, itemId: string, quantity: number, reason: string) => void;
    confirmTransferIn: (movementId: string) => void;
    addProvider: (name: string) => void;
    addMovementReason: (reason: string) => void;
    updateConfig: (config: AppConfig) => void;
    updateLocalPlaylist: (playlist: VideoItem[]) => void;
    logVideoActivity: (videoNames: string[]) => void;
    checkCashSession: (branchId: string, date?: string) => Promise<CashSession | null>;
    openCashSession: (amount: number, branchId?: string) => Promise<boolean>;
    closeCashSession: (summary: Omit<CashClosure, 'id' | 'closedAt'>) => void;
    sendCashCutEmail: (branchId: string, stats: any) => Promise<boolean>;
    addAppointment: (appt: Appointment) => void;
    updateAppointment: (appt: Appointment) => void;
    deleteAppointment: (id: string) => void;
    addPromotion: (promo: Promotion) => void;
    updatePromotion: (promo: Promotion) => void;
    removePromotion: (id: string) => void;
    factoryReset: (segments?: string[], userId?: string) => Promise<boolean>;
    showToast: (type: ToastType, title: string, message: string) => void;
    installApp: () => Promise<void>;
    isInstallable: boolean;
}

const BarberContext = createContext<BarberContextType | undefined>(undefined);

export const BarberProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const { branches, setBranches, monthlyPlans, setMonthlyPlans, addBranch: addBranchFromCtx, updateBranch: updateBranchFromCtx, upsertMonthlyPlan: upsertMonthlyPlanFromCtx } = useBranch();
    const { users, setUsers, addUser: addUserFromCtx, updateUser: updateUserFromCtx, removeUser: removeUserFromCtx } = useStaff();
    const { clients, setClients, addClient: addClientFromCtx, updateClient: updateClientFromCtx } = useClients();
    const {
        catalog, setCatalog, categories, setCategories,
        addItem: addItemFromCtx, updateItem: updateItemFromCtx, removeItem: removeItemFromCtx,
        addCategory: addCategoryFromCtx, updateCategory: updateCategoryFromCtx, removeCategory: removeCategoryFromCtx
    } = useCatalog();
    const [stocks, setStocks] = useState<BranchStock[]>([]);
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [sales, setSales] = useState<Sale[]>([]);
    const [config, setConfig] = useState<any>({});
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('barber_session');
        return saved ? JSON.parse(saved) : null;
    });
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [inventoryMovements, setInventoryMovements] = useState<InventoryMovement[]>([]);
    const [cashSession, setCashSession] = useState<CashSession | null>(null);
    const [cashClosures, setCashClosures] = useState<CashClosure[]>([]);
    const [videoLogs, setVideoLogs] = useState<VideoLog[]>([]);
    const [providers, setProviders] = useState<string[]>(['Proveedor Local']);
    const [movementReasons, setMovementReasons] = useState<string[]>(['Compra', 'Ajuste', 'Merma', 'Uso Interno']);
    const { appointments, setAppointments, addAppointment: addAppointmentFromCtx, updateAppointment: updateAppointmentFromCtx, deleteAppointment: deleteAppointmentFromCtx } = useAgenda();
    const { promotions, setPromotions, addPromotion: addPromotionFromCtx, updatePromotion: updatePromotionFromCtx, removePromotion: removePromotionFromCtx } = usePromotions();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);


    // 0. PWA INSTALLATION LOGIC
    useEffect(() => {
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);

            // Solo lo hacemos instalable para dispositivos móviles/tablets
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            if (isMobile) {
                setIsInstallable(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handler);

        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstallable(false);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const installApp = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User responded to the install prompt: ${outcome}`);
        setIsInstallable(false);
        setDeferredPrompt(null);
    };

    // 0.5. VERSION CHECK & FORCE UPDATE (cada 60s)
    useEffect(() => {
        const checkForUpdates = async () => {
            try {
                const response = await fetch(`./version.json?t=${Date.now()}`, { cache: 'no-cache' });
                const data = await response.json();
                const serverVersion = data.version;
                const localVersion = localStorage.getItem('barberos_version');

                if (localVersion && localVersion !== serverVersion) {
                    localStorage.setItem('barberos_version', serverVersion);
                    showToast('info', 'Actualización', 'Nueva versión disponible. Recargando...');
                    setTimeout(() => {
                        if ('caches' in window) {
                            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
                        }
                        window.location.reload();
                    }, 3000);
                } else if (!localVersion) {
                    localStorage.setItem('barberos_version', serverVersion);
                }
            } catch (err) {
                console.log('Error checking version:', err);
            }
        };

        checkForUpdates();
        const interval = setInterval(checkForUpdates, 5000);
        return () => clearInterval(interval);
    }, []);

    // Helper para normalizar la configuración (DB -> State)
    const normalizeConfig = useCallback((data: any) => {
        if (!data) return config;
        return {
            ...data,
            videoSource: data.video_source || data.videoSource,
            youtubeVideoId: data.youtube_video_id || data.youtubeVideoId,
            tickerMessage: data.ticker_message || data.tickerMessage,
            tickerSpeed: data.ticker_speed || data.tickerSpeed,
            salonName: data.salon_name || data.salonName,
            salonAddress: data.salon_address || data.salonAddress,
            salonPhone: data.salon_phone || data.salonPhone,
            ticketFooter: data.ticket_footer || data.ticketFooter,
            logoUrl: data.logo_url || data.logoUrl,
            webhookUrl: data.webhook_url || data.webhookUrl,
            ticketSize: data.ticket_size || data.ticketSize,
            loyalty: {
                enabled: (data.loyalty_enabled === 1 || data.loyalty_enabled === true) || (data.loyalty?.enabled),
                pointsPerVisit: parseFloat(data.loyalty_points_per_visit || data.loyalty?.pointsPerVisit || 0),
                redemptionThreshold: parseInt(data.loyalty_redemption_threshold || data.loyalty?.redemptionThreshold || 0),
                redemptionValue: parseFloat(data.loyalty_redemption_value || data.loyalty?.redemptionValue || 0),
                referralBonus: parseFloat(data.loyalty_referral_bonus || data.loyalty?.referralBonus || 0)
            },
            videoPlaylist: data.videoPlaylist || data.video_playlist || [],
            hiddenPanels: data.hiddenPanels || (data.hidden_panels ? (typeof data.hidden_panels === 'string' ? JSON.parse(data.hidden_panels) : data.hidden_panels) : []),
            latitude: parseFloat(data.latitude || data.lat || 0),
            longitude: parseFloat(data.longitude || data.lng || 0),
            geofenceRadius: parseInt(data.geofence_radius || data.geofenceRadius || 10),
        };
    }, [config]);

    // 1. CARGA INICIAL DESDE MYSQL (SYNC)
    const syncData = useCallback(async () => {
        try {
            const savedSession = localStorage.getItem('barber_session');
            const user = savedSession ? JSON.parse(savedSession) : null;
            const branchParam = user?.branchId ? `?branchId=${user.branchId}` : '';

            const res = await fetch(`${API_URL}/sync${branchParam}`);
            const data = await res.json();
            if (data) {
                const normalizedBranches = (data.branches || []).map((b: any) => ({
                    id: String(b.id), name: b.name, address: b.address, phone: b.phone, email: b.email,
                    webhookUrl: b.webhook_url,
                    active: b.active === 1 || b.active === true,
                    hasReception: b.has_reception === 1 || b.has_reception === true,
                    defaultMonthlyGoal: b.default_monthly_goal,
                    defaultProductGoalPercent: b.default_product_goal_percent,
                    defaultWorkingDays: b.default_working_days,
                    autoCloseTime: b.auto_close_time,
                    autoCloseEnabled: b.auto_close_enabled === 1 || b.auto_close_enabled === true
                }));

                const normalizedUsers = (data.users || []).map((u: any) => ({
                    id: String(u.id), name: u.name, username: u.username, role: u.role, pin: u.pin,
                    active: u.active === 1 || u.active === true,
                    branchId: u.branch_id ? String(u.branch_id) : null,
                    canDoPos: u.can_do_pos === 1 || u.can_do_pos === true
                }));

                const normalizedClients = (data.clients || []).map((c: any) => ({
                    ...c,
                    id: String(c.id),
                    birthDate: c.birth_date,
                    referredBy: c.referred_by ? String(c.referred_by) : null,
                    registrationBranchId: c.registration_branch_id ? String(c.registration_branch_id) : null
                }));

                const normalizedCatalog = (data.catalog || []).map((item: any) => ({
                    id: String(item.id), name: item.name, type: item.type, price: parseFloat(item.price),
                    category: item.category,
                    categoryId: String(item.category_id || ''),
                    active: item.active === 1 || item.active === true,
                    cost: parseFloat(item.cost || 0),
                    comboDefinition: typeof item.combo_definition === 'string' ? JSON.parse(item.combo_definition) : item.combo_definition
                }));

                const normalizedStocks = (data.stocks || []).map((s: any) => ({
                    id: String(s.id), branchId: String(s.branch_id), itemId: String(s.item_id), stock: s.stock,
                    averageCost: parseFloat(s.average_cost || 0)
                }));

                const normalizedConfig = normalizeConfig({
                    ...data.config,
                    videoPlaylist: data.videoPlaylist
                });

                const normalizedPromotions = (data.promotions || []).map((p: any) => {
                    // Normalización de campos (DB snake_case vs State camelCase)
                    const trigger = (p as any).trigger_type || p.trigger;
                    let days = (p as any).days_active || p.daysActive;

                    // Manejo defensivo de JSON string de días (por si viene de MySQL como string)
                    if (typeof days === 'string') {
                        try { days = JSON.parse(days); } catch { days = []; }
                    }

                    const startD = (p as any).start_date || p.startDate;
                    const endD = (p as any).end_date || p.endDate;

                    return {
                        id: p.id, name: p.name, type: p.type, value: parseFloat(p.value),
                        active: p.active === 1 || p.active === true,
                        trigger: trigger,
                        daysActive: days,
                        hourStart: p.hour_start, hourEnd: p.hour_end,
                        startDate: startD, endDate: endD,
                        applyTo: p.apply_to, specificItemId: p.specific_item_id
                    };
                }).filter(Boolean);

                setBranches(normalizedBranches.filter(Boolean));
                setUsers(normalizedUsers.filter(Boolean));
                setClients(normalizedClients.filter(Boolean));
                setCatalog(normalizedCatalog.filter(Boolean));
                setStocks(normalizedStocks.filter(Boolean));
                setConfig(normalizedConfig);
                if (data.categories) {
                    const cats = data.categories.map((c: any) =>
                        typeof c === 'string' ? { id: c, name: c } : c
                    );
                    setCategories(cats);
                }
                setPromotions(normalizedPromotions.filter(Boolean));
                setMonthlyPlans((data.monthlyPlans || []).map((p: any) => ({
                    ...p, branchId: p.branch_id, productGoalPercent: p.product_goal_percent, workingDays: p.working_days
                })).filter(Boolean));
                setAppointments((data.appointments || []).map((a: any) => ({
                    ...a, branchId: a.branch_id, clientId: a.client_id, clientName: a.client_name, clientPhone: a.client_phone,
                    barberId: a.barber_id, serviceType: a.service_type
                })).filter(Boolean));
                setInventoryMovements((data.inventoryMovements || []).map((m: any) => ({
                    id: String(m.id),
                    branchId: String(m.branch_id),
                    itemId: String(m.item_id),
                    type: m.type,
                    quantity: parseFloat(m.quantity || 0),
                    reason: m.reason,
                    date: m.date,
                    newStock: parseFloat(m.new_stock || 0),
                    unitCost: parseFloat(m.unit_cost || 0),
                    relatedBranchId: m.related_branch_id ? String(m.related_branch_id) : null,
                    itemName: m.item_name || 'Producto Desconocido'
                })).filter(Boolean));

                if (data.cashSession) {
                    setCashSession({
                        id: String(data.cashSession.id),
                        branchId: String(data.cashSession.branch_id),
                        openingAmount: parseFloat(data.cashSession.opening_amount || 0),
                        openedAt: data.cashSession.opened_at,
                        openedBy: data.cashSession.opened_by
                    });
                } else {
                    setCashSession(null);
                }

                if (data.cashClosures) {
                    setCashClosures((data.cashClosures || []).map((c: any) => ({
                        id: String(c.id),
                        branchId: String(c.branch_id),
                        openedAt: c.opened_at,
                        closedAt: c.closed_at,
                        openedBy: c.opened_by,
                        openingAmount: parseFloat(c.opening_amount || 0),
                        totalSales: parseFloat(c.total_sales || 0),
                        totalCash: parseFloat(c.total_cash || 0),
                        totalCard: parseFloat(c.total_card || 0),
                        totalTransfer: parseFloat(c.total_transfer || 0),
                        totalBitcoin: parseFloat(c.total_bitcoin || 0),
                        servicesTotal: parseFloat(c.services_total || 0),
                        productsTotal: parseFloat(c.products_total || 0),
                        combosTotal: parseFloat(c.combos_total || 0),
                        operationsCount: parseInt(c.operations_count || 0)
                    })));
                }

                if (data.sales) {
                    const normalizedSales = (data.sales || []).map((s: any) => {
                        try {
                            return {
                                id: String(s.id),
                                branchId: String(s.branch_id),
                                ticketId: s.ticket_id,
                                clientId: s.client_id ? String(s.client_id) : null,
                                barberId: s.barber_id ? String(s.barber_id) : null,
                                timestamp: s.timestamp,
                                total: parseFloat(s.total || 0),
                                subtotal: parseFloat(s.subtotal || 0),
                                discount: parseFloat(s.discount || 0),
                                pointsEarned: parseFloat(s.points_earned || 0),
                                pointsUsed: parseFloat(s.points_used || 0),
                                items: (typeof s.items === 'string' ? JSON.parse(s.items) : (s.items || [])).map((i: any) => ({
                                    ...i,
                                    itemId: String(i.item_id || i.itemId),
                                    price: parseFloat(i.price || 0)
                                })),
                                payments: (typeof s.payments === 'string' ? JSON.parse(s.payments) : (s.payments || [])).map((p: any) => ({
                                    ...p,
                                    amount: parseFloat(p.amount || 0)
                                }))
                            };
                        } catch (e) {
                            console.error("Error parsing sale:", s.id, e);
                            return null;
                        }
                    }).filter(Boolean);
                    setSales(normalizedSales);
                }
                if (user) {
                    fetchTickets(user.branchId);
                }
            }
        } catch (e) {
            console.error("Error sincronizando con VPS:", e);
        }
    }, []);

    const factoryReset = async (segments: string[] = ['full']) => {
        try {
            const res = await fetch(`${API_URL}/admin/reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ segments, userId: currentUser?.id })
            });
            if (res.ok) {
                await syncData();
                return true;
            }
        } catch (e) {
            console.error("Error en reset:", e);
        }
        return false;
    };

    // 1. CARGA INICIAL DESDE MYSQL (SYNC)
    useEffect(() => {
        syncData();
    }, [syncData]);

    // 0.7. SOCKET.IO REAL-TIME SYNC - Listeners globales (siempre activos)
    useEffect(() => {
        let syncTimeout: ReturnType<typeof setTimeout> | null = null;

        const debouncedSync = (reason?: string) => {
            if (syncTimeout) clearTimeout(syncTimeout);
            syncTimeout = setTimeout(() => {
                console.log("🔄 [SOCKET] Sincronización requerida por el servidor...", reason || '');
                syncData();
                if (reason && reason !== 'tickets' && reason !== 'attendance') {
                    showToast('info', 'Actualización de Datos', 'Los datos se han actualizado en tiempo real.');
                }
                syncTimeout = null;
            }, 500);
        };

        socket.on('sync_needed', (data?: { reason?: string }) => {
            debouncedSync(data?.reason);
        });
        socket.on('force_logout', () => {
            console.log("🔒 [SOCKET] Deslogueo forzado por actualización diaria...");
            logout();
            window.location.reload();
        });
        socket.on('config_init', (serverConfig: any) => {
            if (serverConfig && Object.keys(serverConfig).length > 0) {
                setConfig(normalizeConfig(serverConfig));
            }
        });
        socket.on('config_update', (updatedConfig: any) => {
            const normalized = normalizeConfig(updatedConfig);
            setConfig(normalized);
            showToast('info', 'Ajustes Actualizados', 'Los cambios en la configuración se han aplicado en tiempo real.');
        });
        socket.on('attendance_update', (data: { userId: string; type: string; timestamp: string }) => {
            console.log("📋 [SOCKET] Marcación recibida:", data);
            debouncedSync('attendance');
        });
        return () => {
            socket.off('sync_needed'); socket.off('force_logout');
            socket.off('config_init'); socket.off('config_update');
            socket.off('attendance_update');
            if (syncTimeout) clearTimeout(syncTimeout);
        };
    }, [syncData]);

    // Join branch room (solo cuando hay branchId)
    useEffect(() => {
        if (!currentUser?.branchId) return;
        socket.emit('join_branch', currentUser.branchId);
        socket.on('tickets_update', (updatedTickets: Ticket[]) => setTickets(updatedTickets));
        return () => { socket.off('tickets_update'); };
    }, [currentUser?.branchId]);

    // 2. MONITOR DE INACTIVIDAD (30 MINUTOS)
    useEffect(() => {
        if (!currentUser) return;

        const INACTIVITY_LIMIT = 30 * 60 * 1000; // 30 mins

        const checkInactivity = setInterval(() => {
            const now = Date.now();
            if (now - lastActivity > INACTIVITY_LIMIT) {
                console.log("Sesión expirada por inactividad");
                logout();
            }
        }, 60000); // Revisar cada minuto

        const updateActivity = () => setLastActivity(Date.now());

        window.addEventListener('mousemove', updateActivity);
        window.addEventListener('keydown', updateActivity);
        window.addEventListener('click', updateActivity);
        window.addEventListener('touchstart', updateActivity);

        return () => {
            clearInterval(checkInactivity);
            window.removeEventListener('mousemove', updateActivity);
            window.removeEventListener('keydown', updateActivity);
            window.removeEventListener('click', updateActivity);
            window.removeEventListener('touchstart', updateActivity);
        };
    }, [currentUser, lastActivity]);

    // 3. LOGIN REAL CONTRA MYSQL
    const login = async (pin: string) => {
        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pin })
            });
            const data = await res.json();
            if (data.success) {
                setCurrentUser(data.user);
                setLastActivity(Date.now());
                localStorage.setItem('barber_session', JSON.stringify(data.user));
                // Cargar tickets activos para su sucursal
                fetchTickets(data.user.branchId);

                return true;
            }
        } catch (e) { console.error(e); }
        return false;
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('barber_session');
        localStorage.removeItem('last_view');
    };


    const fetchTickets = async (branchId?: string) => {
        try {
            const url = branchId ? `${API_URL}/tickets?branchId=${branchId}` : `${API_URL}/tickets`;
            const res = await fetch(url);
            const data = await res.json();
            const normalized = (data || []).map((t: any) => ({
                id: String(t.id),
                branchId: String(t.branch_id),
                sequenceNumber: t.sequence_number,
                fullCode: t.full_code,
                type: t.type,
                clientName: t.client_name,
                clientId: t.client_id ? String(t.client_id) : null,
                status: t.status,
                barberId: t.barber_id ? String(t.barber_id) : null,
                chair: t.chair,
                createdAt: t.created_at
            }));
            setTickets(normalized);
        } catch (e) { console.error(e); }
    };

    const createTicket = async (type: TicketType, clientName: string, clientId?: string) => {
        if (!currentUser) return null;
        const branchId = currentUser.branchId || branches[0].id;

        // Calcular secuencia localmente para velocidad (el server validará)
        const branchTickets = tickets.filter(t => t.branchId === branchId);
        const sequenceNumber = branchTickets.length > 0 ? Math.max(...branchTickets.map(t => t.sequenceNumber)) + 1 : 1;

        const newTicket: Ticket = {
            id: Math.random().toString(36).substring(2, 15),
            branchId,
            sequenceNumber,
            fullCode: `${type}-${sequenceNumber.toString().padStart(3, '0')}`,
            type,
            clientName,
            clientId,
            status: 'waiting',
            createdAt: nowES()
        };

        try {
            const res = await fetch(`${API_URL}/tickets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newTicket)
            });
            if (res.ok) {
                setTickets(prev => [...prev, newTicket]);
                return newTicket;
            }
        } catch (e) { console.error(e); }
        return null;
    };

    const updateTicketStatus = async (ticketId: string, status: Ticket['status'], barberId?: string, chair?: string) => {
        try {
            await fetch(`${API_URL}/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, barberId, chair })
            });
            setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status, barberId, chair } : t));
        } catch (e) { console.error(e); }
    };

    const processSale = async (sale: Sale) => {
        try {
            const res = await fetch(`${API_URL}/sales`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sale)
            });
            if (res.ok) {
                setSales(prev => [...prev, sale]);
                if (sale.ticketId) setTickets(prev => prev.filter(t => t.id !== sale.ticketId));

                // Optimistic stock update
                        setStocks(prevStocks => {
                    let updatedStocks = [...prevStocks];
                    (sale.items || []).forEach(item => {
                        const catalogItem = catalog.find(ci => ci.id === item.itemId);
                        if (!catalogItem) return;

                        const deductStock = (itmId: string, qty: number) => {
                            const stockIdx = updatedStocks.findIndex(s => s.branchId === sale.branchId && s.itemId === itmId);
                            if (stockIdx !== -1) {
                                updatedStocks[stockIdx] = {
                                    ...updatedStocks[stockIdx],
                                    stock: updatedStocks[stockIdx].stock - qty
                                };
                            }
                        };

                        if (catalogItem.type === 'product') {
                            deductStock(item.itemId, item.quantity);
                        } else if (catalogItem.type === 'combo' && catalogItem.comboDefinition) {
                            (catalogItem.comboDefinition as string[]).forEach(subId => {
                                const subItem = catalog.find(ci => ci.id === subId);
                                if (subItem?.type === 'product') {
                                    deductStock(subId, item.quantity);
                                }
                            });
                        }
                    });
                    return updatedStocks;
                });

                // Optimistic Kardex update (Movements)
                setInventoryMovements(prev => {
                    const newMovs: InventoryMovement[] = [];
                    (sale.items || []).forEach(item => {
                        const catalogItem = catalog.find(ci => ci.id === item.itemId);
                        if (!catalogItem) return;

                        const createMov = (itmId: string, name: string, qty: number) => {
                            const currentStock = stocks.find(s => s.branchId === sale.branchId && s.itemId === itmId);
                            const prevStock = currentStock?.stock || 0;
                            return {
                                id: Math.random().toString(36).substring(2, 15),
                                branchId: sale.branchId,
                                itemId: itmId,
                                itemName: name,
                                type: 'sale' as InventoryMovementType,
                                quantity: qty,
                                unitCost: catalogItem.cost || 0,
                                previousStock: prevStock,
                                newStock: prevStock - qty,
                                date: nowES(),
                                reason: `Venta POS #${sale.ticketId || 'POS'}`,
                                status: 'completed' as const
                            };
                        };

                        if (catalogItem.type === 'product') {
                            newMovs.push(createMov(item.itemId, item.name, item.quantity));
                        } else if (catalogItem.type === 'combo' && catalogItem.comboDefinition) {
                            (catalogItem.comboDefinition as string[]).forEach(subId => {
                                const subItem = catalog.find(ci => ci.id === subId);
                                if (subItem?.type === 'product') {
                                    newMovs.push(createMov(subId, subItem.name, item.quantity));
                                }
                            });
                        }
                    });
                    return [...prev, ...newMovs];
                });

                // Optimistic Client Points update
                if (sale.clientId) {
                    setClients(prevClients => prevClients.map(c => {
                        if (c.id === sale.clientId) {
                            const pointsEarned = sale.pointsEarned || 0;
                            const pointsUsed = sale.pointsUsed || 0;
                            return {
                                ...c,
                                points: (c.points || 0) + pointsEarned - pointsUsed,
                                visits: (c.visits || 0) + 1
                            };
                        }
                        return c;
                    }));
                }

                return sale;
            } else {
                console.error("Error backend sale:", res.status, res.statusText);
                try {
                    const errData = await res.json();
                    showToast('error', 'Error Venta', errData.error || res.statusText);
                } catch (jsonErr) {
                    showToast('error', 'Error Venta', `${res.status} ${res.statusText}`);
                }
                return null;
            }
        } catch (e) {
            console.error(e);
            showToast('error', 'Error Conexión', String(e));
            return null;
        }
    };

    const checkCashSession = async (branchId: string, date?: string) => {
        try {
            const res = await fetch(`${API_URL}/cash-session?branchId=${branchId}&date=${date || ''}`);
            const data = await res.json();
            setCashSession(data);
            return data;
        } catch (e) { return null; }
    };

    const openCashSession = async (amount: number, branchId?: string) => {
        if (!currentUser) return false;
        const targetBranchId = branchId || currentUser.branchId || branches[0].id;
        const payload = {
            id: crypto.randomUUID(),
            branchId: targetBranchId,
            openingAmount: amount,
            openedBy: currentUser.id
        };

        try {
            const res = await fetch(`${API_URL}/cash-session`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                setCashSession({ ...payload, openedAt: nowES() } as any);
                return true;
            }
        } catch (e) { console.error(e); }
        return false;
    };

    // --- FUNCIONES LEGACY / PLACEHOLDERS (Para migración gradual) ---
    // --- FUNCIONES REALES DE ESCRITURA ---
    const addUser = async (user: User) => { await addUserFromCtx(user); };
    const updateUser = async (user: User) => { await updateUserFromCtx(user); };
    const removeUser = async (id: string) => { await removeUserFromCtx(id); };

    const addClient = async (client: Client) => {
        const ok = await addClientFromCtx(client);
        if (ok) {
            // Actualización optimista del Bono de Referencia para el padrino
            if (client.referredBy && config.loyalty?.enabled) {
                const bonus = config.loyalty.referralBonus || 0;
                if (bonus > 0) {
                    setClients(prevClients => prevClients.map(c => {
                        if (c.id === client.referredBy) {
                            return { ...c, points: (c.points || 0) + bonus };
                        }
                        return c;
                    }));
                }
            }
        }
    };

    const updateClient = async (client: Client) => {
        await updateClientFromCtx(client);
    };

    const addItem = async (item: CatalogItem) => { await addItemFromCtx(item); };
    const updateItem = async (item: CatalogItem) => { await updateItemFromCtx(item); };
    const removeItem = async (id: string) => { await removeItemFromCtx(id); };

    const addAppointment = async (appt: Appointment) => { await addAppointmentFromCtx(appt); };
    const updateAppointment = async (appt: Appointment) => { await updateAppointmentFromCtx(appt); };
    const deleteAppointment = async (id: string) => { await deleteAppointmentFromCtx(id); };

    const updateConfig = async (newConfig: AppConfig): Promise<boolean> => {
        try {
            const res = await fetch(`${API_URL}/config`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newConfig)
            });
            if (res.ok) {
                setConfig(newConfig);
                return true;
            }
            return false;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const addBranch = async (branch: Branch) => { return await addBranchFromCtx(branch); };
    const updateBranch = async (branch: Branch) => { return await updateBranchFromCtx(branch); };
    const upsertMonthlyPlan = async (plan: MonthlyPlan) => { await upsertMonthlyPlanFromCtx(plan); };
    const addCategory = async (name: string) => { await addCategoryFromCtx(name); };
    const updateCategory = async (oldName: string, newName: string): Promise<boolean> => { return await updateCategoryFromCtx(oldName, newName); };
    const removeCategory = async (name: string) => { await removeCategoryFromCtx(name); };
    const getBranchStock = (branchId: string, itemId: string) => stocks.find(s => s.branchId === branchId && s.itemId === itemId);
    const registerInventoryMovement = async (branchId: string, itemId: string, type: InventoryMovementType, quantity: number, unitCost: number = 0, reason: string = '', status: 'pending' | 'completed' = 'completed') => {
        try {
            const payload = {
                id: crypto.randomUUID(),
                branchId,
                itemId,
                type,
                quantity,
                unitCost,
                reason,
                status,
                relatedBranchId: null
            };
            const res = await fetch(`${API_URL}/inventory-movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Actualización optimista local
                const newMovement: InventoryMovement = {
                    ...payload,
                    date: nowES(),
                    itemName: catalog.find(i => i.id === itemId)?.name || 'Item',
                    previousStock: 0, // Estimado
                    newStock: quantity // Estimado
                };
                setInventoryMovements(prev => [newMovement, ...prev]);

                // Actualizar stock local
                setStocks(prev => {
                    const existingRequest = prev.find(s => s.branchId === branchId && s.itemId === itemId);
                    if (existingRequest) {
                        return prev.map(s => s.branchId === branchId && s.itemId === itemId ? { ...s, stock: s.stock + (['sale', 'adjustment_out', 'transfer_out'].includes(type) ? -quantity : quantity) } : s);
                    } else {
                        return [...prev, { id: crypto.randomUUID(), branchId, itemId, stock: quantity, averageCost: unitCost }];
                    }
                });
                return true;
            } else {
                console.error("Error backend inv:", res.status, res.statusText);
                try {
                    const errData = await res.json();
                    showToast('error', 'Error Servidor', errData.error || res.statusText);
                } catch (jsonErr) {
                    showToast('error', 'Error Servidor', `${res.status} ${res.statusText}`);
                }
                return false;
            }
        } catch (e) {
            console.error(e);
            showToast('error', 'Error Conexión', String(e));
            return false;
        }
    };

    const transferStock = async (fromBranch: string, toBranch: string, itemId: string, quantity: number, reason: string) => {
        try {
            const payload = {
                id: crypto.randomUUID(),
                branchId: fromBranch,
                itemId,
                type: 'transfer_out',
                quantity,
                unitCost: getBranchStock(fromBranch, itemId)?.averageCost || 0,
                reason,
                relatedBranchId: toBranch,
                status: 'pending'
            };
            const res = await fetch(`${API_URL}/inventory-movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                // Actualizar stock local (salida)
                setStocks(prev => prev.map(s => s.branchId === fromBranch && s.itemId === itemId ? { ...s, stock: s.stock - quantity } : s));
            }
        } catch (e) { console.error(e); }
    };

    const confirmTransferIn = async (movementId: string) => {
        // Lógica simplificada: en server real debería haber endpoint específico o manejo automático
        console.log("Confirmación de traslado pendiente de implementación completa en backend");
    };
    const addProvider = (name: string) => { if (!providers.includes(name)) setProviders(prev => [...prev, name]); };
    const addMovementReason = (reason: string) => { if (!movementReasons.includes(reason)) setMovementReasons(prev => [...prev, reason]); };
    const updateLocalPlaylist = (playlist: VideoItem[]) => setConfig((prev: any) => ({ ...prev, videoPlaylist: playlist }));
    const logVideoActivity = () => { };
    const closeCashSession = async (summary: Omit<CashClosure, 'id' | 'closedAt'>) => {
        if (!cashSession) return;
        try {
            const res = await fetch(`${API_URL}/cash-session/${cashSession.id}/close`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(summary)
            });
            if (res.ok) {
                setCashSession(null);
                showToast('success', 'Caja Cerrada', 'El corte de caja se ha registrado correctamente.');
                syncData(); // Recargar para ver el historial actualizado
            }
        } catch (e) {
            console.error("Error al cerrar caja:", e);
            showToast('error', 'Error de Cierre', 'No se pudo registrar el cierre en el servidor.');
        }
    };
    const sendCashCutEmail = async (branchId: string, reportData: any) => {
        try {
            const res = await fetch(`${API_URL}/send-cash-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchId, reportData })
            });
            const data = await res.json();
            return data.success;
        } catch (e) {
            console.error(e);
            return false;
        }
    };
    const sendInvoiceByEmail = async (sale: Sale, clientName: string, email: string) => {
        const barber = users.find(u => u.id === sale.barberId)?.name || 'N/A';
        const dateObj = new Date(sale.timestamp);

        const ticketData = {
            saleId: (sale.id || '').substring(0, 8).toUpperCase(),
            date: dateObj.toLocaleDateString('es-ES'),
            time: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            barber: barber,
            clientName: clientName,
            items: (sale.items || []).map(i => ({
                name: i.name,
                quantity: i.quantity,
                price: i.price
            })),
            subtotal: sale.subtotal,
            discount: sale.discount,
            total: sale.total,
            pointsUsed: sale.pointsUsed || 0,
            paymentMethod: (sale.payments || []).map(p => {
                const m: any = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', bitcoin: 'Bitcoin' };
                return m[p.method] || p.method;
            }).join(', ')
        };

        try {
            const res = await fetch(`${API_URL}/send-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    branchId: sale.branchId,
                    email,
                    ticketData
                })
            });
            const data = await res.json();
            return data.success;
        } catch (e) {
            console.error(e);
            return false;
        }
    };

    const addPromotion = async (promo: Promotion) => {
        const ok = await addPromotionFromCtx(promo);
        if (ok) showToast('success', 'Promoción Guardada', `La promoción ${promo.name} ha sido registrada.`);
    };
    const updatePromotion = async (promo: Promotion) => {
        const ok = await updatePromotionFromCtx(promo);
        if (ok) showToast('success', 'Promoción Actualizada', `La promoción ${promo.name} ha sido actualizada.`);
    };
    const removePromotion = async (id: string) => {
        const ok = await removePromotionFromCtx(id);
        if (ok) showToast('warning', 'Promoción Eliminada', 'La promoción ha sido removida del sistema.');
    };

    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const showToast = (type: ToastType, title: string, message: string) => {
        const id = crypto.randomUUID();
        setToasts(prev => [...prev, { id, type, title, message }]);
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 8000);
    };
    const removeToast = (id: string) => setToasts(prev => prev.filter(t => t.id !== id));

    // Update document title and favicon from config
    useEffect(() => {
        if (config?.salonName) {
            document.title = config.salonName;
        }
        if (config?.logoUrl) {
            let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
            if (!link) { link = document.createElement('link'); link.rel = 'icon'; document.head.appendChild(link); }
            link.href = config.logoUrl;
            let appleLink = document.querySelector<HTMLLinkElement>("link[rel~='apple-touch-icon']");
            if (!appleLink) { appleLink = document.createElement('link'); appleLink.rel = 'apple-touch-icon'; document.head.appendChild(appleLink); }
            appleLink.href = config.logoUrl;
        }
    }, [config?.salonName, config?.logoUrl]);

    return (
        <BarberContext.Provider value={{
            currentUser, login, logout,
            branches, monthlyPlans, users, clients, catalog, categories, stocks, tickets, sales, config, inventoryMovements, providers, movementReasons, cashSession, cashClosures, videoLogs, appointments, promotions,
            addBranch, updateBranch, upsertMonthlyPlan, addUser, updateUser, removeUser, addClient, updateClient, createTicket, updateTicketStatus,
            addItem, updateItem, removeItem, addCategory, updateCategory, removeCategory, processSale, sendInvoiceByEmail, getBranchStock, registerInventoryMovement, transferStock, confirmTransferIn,
            addProvider, addMovementReason, updateConfig, updateLocalPlaylist, logVideoActivity, checkCashSession, openCashSession, closeCashSession, sendCashCutEmail,
            addAppointment, updateAppointment, deleteAppointment, addPromotion, updatePromotion, removePromotion, factoryReset,
            showToast, installApp, isInstallable,
        }}>
            {children}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </BarberContext.Provider>
    );
};

export const useBarber = () => {
    const context = useContext(BarberContext);
    if (!context) throw new Error("useBarber must be used within a BarberProvider");
    return context;
};
