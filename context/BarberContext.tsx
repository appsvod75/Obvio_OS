
import React, { createContext, useContext, useState, useEffect, useCallback, PropsWithChildren } from 'react';
import { User, Client, CatalogItem, Ticket, Sale, AppConfig, Role, TicketType, InventoryMovement, InventoryMovementType, Branch, BranchStock, CashSession, VideoItem, VideoLog, Appointment, Promotion, MonthlyPlan, CashClosure } from '../types';
import { ToastContainer, ToastMessage, ToastType } from '../components/Toast';
import { useClients } from './ClientsContext';
import { useCatalog } from './CatalogContext';
import { usePromotions } from './PromotionsContext';
import { useAgenda } from './AgendaContext';
import { useStaff } from './StaffContext';
import { useBranch } from './BranchContext';
import { useConfigCtx } from './ConfigContext';
import { useInventory } from './InventoryContext';
import { useTickets } from './TicketsContext';
import { useSales, SaleResult } from './SalesContext';

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
    processSale: (sale: Sale) => Promise<SaleResult | null>;
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
    const {
        stocks, setStocks, inventoryMovements, setInventoryMovements,
        providers, movementReasons,
        getBranchStock: getBranchStockFromCtx,
        registerInventoryMovement: registerInventoryMovementFromCtx,
        transferStock: transferStockFromCtx, confirmTransferIn: confirmTransferInFromCtx,
        addProvider: addProviderFromCtx, addMovementReason: addMovementReasonFromCtx
    } = useInventory();
    const { tickets, setTickets, fetchTickets: fetchTicketsFromCtx, createTicket: createTicketFromCtx, updateTicketStatus: updateTicketStatusFromCtx } = useTickets();
    const { sales, setSales, processSale: processSaleFromCtx, sendInvoiceByEmail: sendInvoiceByEmailFromCtx } = useSales();
    const { config, setConfig, normalizeConfig, updateConfig: updateConfigFromCtx, updateLocalPlaylist: updateLocalPlaylistFromCtx } = useConfigCtx();
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const saved = localStorage.getItem('barber_session');
        return saved ? JSON.parse(saved) : null;
    });
    const [lastActivity, setLastActivity] = useState<number>(Date.now());
    const [cashSession, setCashSession] = useState<CashSession | null>(null);
    const [cashClosures, setCashClosures] = useState<CashClosure[]>([]);
    const [videoLogs, setVideoLogs] = useState<VideoLog[]>([]);
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
                const localVersion = localStorage.getItem('obvio_os_version');

                if (localVersion && localVersion !== serverVersion) {
                    localStorage.setItem('obvio_os_version', serverVersion);
                    showToast('info', 'Actualización', 'Nueva versión disponible. Recargando...');
                    setTimeout(() => {
                        if ('caches' in window) {
                            caches.keys().then(names => Promise.all(names.map(n => caches.delete(n))));
                        }
                        window.location.reload();
                    }, 3000);
                } else if (!localVersion) {
                    localStorage.setItem('obvio_os_version', serverVersion);
                }
            } catch (err) {
                console.log('Error checking version:', err);
            }
        };

        checkForUpdates();
        const interval = setInterval(checkForUpdates, 5000);
        return () => clearInterval(interval);
    }, []);

    // normalizeConfig ahora está en ConfigContext

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
                    canDoPos: u.can_do_pos === 1 || u.can_do_pos === true,
                    telegramId: u.telegram_id || u.telegramId || undefined
                }));

                const normalizedClients = (data.clients || []).map((c: any) => ({
                    ...c,
                    id: String(c.id),
                    birthDate: c.birth_date,
                    referredBy: c.referred_by ? String(c.referred_by) : null,
                    registrationBranchId: c.registration_branch_id ? String(c.registration_branch_id) : null
                }));

                const serviceRecipes = (data.serviceRecipes || []).map((r: any) => ({
                    id: String(r.id), serviceId: String(r.service_id), itemId: String(r.item_id),
                    quantity: parseFloat(r.quantity || 1)
                }));

                const normalizedCatalog = (data.catalog || []).map((item: any) => ({
                    id: String(item.id), name: item.name, type: item.type, price: parseFloat(item.price),
                    category: item.category,
                    categoryId: String(item.category_id || ''),
                    active: item.active === 1 || item.active === true,
                    cost: parseFloat(item.cost || 0),
                    imageUrl: item.imageUrl || item.image_url || undefined,
                    sku: item.sku || undefined,
                    etiqueta: item.etiqueta ? parseFloat(item.etiqueta) : undefined,
                    sugerido: item.sugerido ? parseFloat(item.sugerido) : undefined,
                    isInsumo: item.is_insumo === 1 || item.isInsumo === true,
                    sellable: item.sellable === 0 ? false : (item.sellable === 1 || item.sellable === undefined),
                    minStock: parseFloat(item.min_stock || 0),
                    comboDefinition: typeof item.combo_definition === 'string' ? JSON.parse(item.combo_definition) : item.combo_definition,
                    recipe: serviceRecipes.filter(r => r.serviceId === String(item.id))
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
                                barberIds: (() => {
                                    try {
                                        if (Array.isArray(s.barbers)) return s.barbers.map(String);
                                        if (typeof s.barbers === 'string') {
                                            const parsed = JSON.parse(s.barbers);
                                            return Array.isArray(parsed) ? parsed.map(String) : [];
                                        }
                                        return s.barber_id ? [String(s.barber_id)] : [];
                                    } catch (e) { return []; }
                                })(),
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


    const fetchTickets = async (branchId?: string) => { await fetchTicketsFromCtx(branchId); };
    const createTicket = async (type: TicketType, clientName: string, clientId?: string) => {
        if (!currentUser) return null;
        return await createTicketFromCtx(type, clientName, clientId, currentUser.branchId || branches[0]?.id);
    };
    const updateTicketStatus = async (ticketId: string, status: Ticket['status'], barberId?: string, chair?: string) => {
        await updateTicketStatusFromCtx(ticketId, status, barberId, chair);
    };

    const processSale = async (sale: Sale) => {
        const result = await processSaleFromCtx(sale);
        if (!result) {
            showToast('error', 'Error Venta', 'No se pudo procesar la venta en el servidor.');
            return null;
        }

        if (sale.ticketId) setTickets(prev => prev.filter(t => t.id !== sale.ticketId));

        const stockWarnings = result.stockWarnings || [];

        setStocks(prevStocks => {
            let updatedStocks = [...prevStocks];
            (sale.items || []).forEach(item => {
                const catalogItem = catalog.find(ci => ci.id === item.itemId);
                if (!catalogItem) return;

                const deductStock = (itmId: string, qty: number) => {
                    const stockIdx = updatedStocks.findIndex(s => s.branchId === sale.branchId && s.itemId === itmId);
                    if (stockIdx !== -1) {
                        updatedStocks[stockIdx] = { ...updatedStocks[stockIdx], stock: updatedStocks[stockIdx].stock - qty };
                    }
                };

                if (catalogItem.type === 'product') {
                    deductStock(item.itemId, item.quantity);
                } else if (catalogItem.type === 'service' && catalogItem.recipe) {
                    catalogItem.recipe.forEach(r => deductStock(r.itemId, r.quantity * item.quantity));
                } else if (catalogItem.type === 'combo' && catalogItem.comboDefinition) {
                    (catalogItem.comboDefinition as string[]).forEach(subId => {
                        const subItem = catalog.find(ci => ci.id === subId);
                        if (subItem?.type === 'product') deductStock(subId, item.quantity);
                    });
                }
            });
            return updatedStocks;
        });

        setInventoryMovements(prev => {
            const newMovs: InventoryMovement[] = [];
            (sale.items || []).forEach(item => {
                const catalogItem = catalog.find(ci => ci.id === item.itemId);
                if (!catalogItem) return;

                const createMov = (itmId: string, name: string, qty: number, cost?: number) => {
                    const currentStock = stocks.find(s => s.branchId === sale.branchId && s.itemId === itmId);
                    const prevStock = currentStock?.stock || 0;
                    return {
                        id: Math.random().toString(36).substring(2, 15),
                        branchId: sale.branchId, itemId: itmId, itemName: name,
                        type: 'sale' as InventoryMovementType, quantity: qty,
                        unitCost: cost !== undefined ? cost : (catalogItem.cost || 0),
                        previousStock: prevStock, newStock: prevStock - qty,
                        date: nowES(),
                        reason: `Venta POS #${sale.ticketId || 'POS'}`,
                        status: 'completed' as const
                    };
                };

                if (catalogItem.type === 'product') {
                    newMovs.push(createMov(item.itemId, item.name, item.quantity));
                } else if (catalogItem.type === 'service' && catalogItem.recipe) {
                    catalogItem.recipe.forEach(r => {
                        const recipeItem = catalog.find(ci => ci.id === r.itemId);
                        newMovs.push(createMov(r.itemId, recipeItem?.name || r.itemId, r.quantity * item.quantity, recipeItem?.cost || 0));
                    });
                } else if (catalogItem.type === 'combo' && catalogItem.comboDefinition) {
                    (catalogItem.comboDefinition as string[]).forEach(subId => {
                        const subItem = catalog.find(ci => ci.id === subId);
                        if (subItem?.type === 'product') newMovs.push(createMov(subId, subItem.name, item.quantity));
                    });
                }
            });
            return [...prev, ...newMovs];
        });

        if (sale.clientId) {
            setClients(prevClients => prevClients.map(c => {
                if (c.id === sale.clientId) {
                    const pointsEarned = sale.pointsEarned || 0;
                    const pointsUsed = sale.pointsUsed || 0;
                    return { ...c, points: (c.points || 0) + pointsEarned - pointsUsed, visits: (c.visits || 0) + 1 };
                }
                return c;
            }));
        }

        if (stockWarnings.length > 0) {
            showToast('warning', 'Stock insuficiente', stockWarnings.join(' · '));
        }

        return result;
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

    const updateConfig = async (newConfig: AppConfig): Promise<boolean> => { return await updateConfigFromCtx(newConfig); };

    const addBranch = async (branch: Branch) => { return await addBranchFromCtx(branch); };
    const updateBranch = async (branch: Branch) => { return await updateBranchFromCtx(branch); };
    const upsertMonthlyPlan = async (plan: MonthlyPlan) => { await upsertMonthlyPlanFromCtx(plan); };
    const addCategory = async (name: string) => { await addCategoryFromCtx(name); };
    const updateCategory = async (oldName: string, newName: string): Promise<boolean> => { return await updateCategoryFromCtx(oldName, newName); };
    const removeCategory = async (name: string) => { await removeCategoryFromCtx(name); };
    const getBranchStock = getBranchStockFromCtx;
    const registerInventoryMovement = async (branchId: string, itemId: string, type: InventoryMovementType, quantity: number, unitCost: number = 0, reason: string = '', status: 'pending' | 'completed' = 'completed') => {
        const ok = await registerInventoryMovementFromCtx(branchId, itemId, type, quantity, unitCost, reason, status);
        if (!ok) showToast('error', 'Error Servidor', 'No se pudo registrar el movimiento de inventario.');
        return ok;
    };
    const transferStock = async (fromBranch: string, toBranch: string, itemId: string, quantity: number, reason: string) => { await transferStockFromCtx(fromBranch, toBranch, itemId, quantity, reason); };
    const confirmTransferIn = async (movementId: string) => { confirmTransferInFromCtx(movementId); };
    const addProvider = (name: string) => { addProviderFromCtx(name); };
    const addMovementReason = (reason: string) => { addMovementReasonFromCtx(reason); };
    const updateLocalPlaylist = (playlist: VideoItem[]) => updateLocalPlaylistFromCtx(playlist);
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
            barber, clientName,
            items: (sale.items || []).map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
            subtotal: sale.subtotal, discount: sale.discount, total: sale.total,
            pointsUsed: sale.pointsUsed || 0,
            paymentMethod: (sale.payments || []).map(p => {
                const m: any = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', bitcoin: 'Bitcoin' };
                return m[p.method] || p.method;
            }).join(', ')
        };

        try {
            const res = await fetch(`${API_URL}/send-ticket`, {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ branchId: sale.branchId, email, ticketData })
            });
            const data = await res.json();
            return data.success;
        } catch (e) { console.error(e); return false; }
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
        setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
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
