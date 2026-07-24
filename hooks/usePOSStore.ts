import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useBarber } from '../context/BarberContext';
import type { SaleItem, Sale, Payment, PaymentMethod, Client, CatalogItem, Promotion } from '../types';
import { nowES } from '../utils/dates';

export function usePOSStore(branchOverride?: string) {
  const {
    catalog, tickets, users, processSale, currentUser,
    getBranchStock, branches, clients, config, logout,
    cashSession, openCashSession, sales, sendInvoiceByEmail,
    addClient, promotions, showToast,
  } = useBarber();

  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(branchOverride || null);
  const currentBranchId = useMemo(() => {
    return selectedBranchId || currentUser?.branchId || (branches.length > 0 ? branches[0].id : '');
  }, [selectedBranchId, currentUser?.branchId, branches]);

  const currentBranch = useMemo(() => branches.find(b => b.id === currentBranchId), [branches, currentBranchId]);

  const [cart, setCart] = useState<SaleItem[]>([]);
  const [selectedBarber, setSelectedBarber] = useState<string>(currentUser?.role === 'estilista' ? currentUser.id : '');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [posMode, setPosMode] = useState<'ticket' | 'direct'>(() => {
    return currentBranch?.hasReception === false ? 'direct' : 'ticket';
  });
  const [selectedDirectClient, setSelectedDirectClient] = useState<string>('');
  const [clientSearch, setClientSearch] = useState('');
  const [selectedTicket, setSelectedTicket] = useState<string>('');
  const [usePoints, setUsePoints] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [currentPaymentMethod, setCurrentPaymentMethod] = useState<PaymentMethod>('cash');
  const [amountInput, setAmountInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [openingAmount, setOpeningAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptEmail, setReceiptEmail] = useState('');
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Modal states
  const [showOpenSessionModal, setShowOpenSessionModal] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showComboModal, setShowComboModal] = useState<CatalogItem | null>(null);

  // New client form
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientBirth, setNewClientBirth] = useState('');
  const [newClientNotes, setNewClientNotes] = useState('');
  const [newClientReferrerSearch, setNewClientReferrerSearch] = useState('');
  const [newClientSelectedReferrerId, setNewClientSelectedReferrerId] = useState<string | undefined>(undefined);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentBranch) {
      setPosMode(currentBranch.hasReception === false ? 'direct' : 'ticket');
    }
  }, [currentBranch?.hasReception, currentBranchId]);

  useEffect(() => {
    if (branches.length > 0 && currentBranchId && !cashSession) {
      setShowOpenSessionModal(true);
    }
  }, [branches.length, currentBranchId, cashSession]);

  useEffect(() => {
    if (currentSale && currentSale.clientId) {
      const client = clients.find(c => c.id === currentSale.clientId);
      setReceiptEmail(client?.email || '');
    } else {
      setReceiptEmail('');
    }
  }, [currentSale, clients]);

  const activeClientId = posMode === 'direct' ? selectedDirectClient : (tickets.find(t => t.id === selectedTicket)?.clientId);
  const activeClient = useMemo(() => clients.find(c => c.id === activeClientId), [clients, activeClientId]);

  const activePromotion = useMemo(() => {
    const currentDay = currentTime.getDay();
    const currentH = currentTime.getHours();
    const currentM = currentTime.getMinutes();
    const currentVal = currentH * 60 + currentM;
    const todayStr = `${currentTime.getFullYear()}-${String(currentTime.getMonth() + 1).padStart(2, '0')}-${String(currentTime.getDate()).padStart(2, '0')}`;

    const checkHours = (p: Promotion) => {
      if (!p.hourStart || !p.hourEnd) return true;
      const [sh, sm] = p.hourStart.split(':').map(Number);
      const [eh, em] = p.hourEnd.split(':').map(Number);
      const startVal = sh * 60 + sm;
      const endVal = eh * 60 + em;
      return currentVal >= startVal && currentVal <= endVal;
    };

    return (promotions || []).find(p => {
      if (!p || !p.active) return false;
      const { trigger, daysActive, startDate, endDate } = p;
      if (trigger === 'always') return true;
      if (trigger === 'date_range') {
        if (!startDate || !endDate) return false;
        const s = startDate.split('T')[0];
        const e = endDate.split('T')[0];
        return todayStr >= s && todayStr <= e;
      }
      if (trigger === 'happy_hour') return checkHours(p);
      if (trigger === 'days_of_week') {
        const days = Array.isArray(daysActive) ? daysActive : [];
        if (!days.includes(currentDay)) return false;
        return checkHours(p);
      }
      if (trigger === 'birthday' && activeClient?.birthDate) {
        const b = activeClient.birthDate.split('T')[0];
        const [, m, d] = b.split('-');
        return Number(m) === (currentTime.getMonth() + 1) && Number(d) === currentTime.getDate();
      }
      return false;
    }) || null;
  }, [promotions, activeClient, currentTime]);

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const discountFromPromo = useMemo(() => {
    if (!activePromotion) return 0;
    let base = 0;
    if (activePromotion.applyTo === 'all') base = subtotal;
    else if (activePromotion.applyTo === 'services') {
      base = cart.reduce((s, i) => {
        const catItem = catalog.find(c => c.id === i.itemId);
        return catItem?.type === 'service' ? s + (i.price * i.quantity) : s;
      }, 0);
    } else if (activePromotion.applyTo === 'products') {
      base = cart.reduce((s, i) => {
        const catItem = catalog.find(c => c.id === i.itemId);
        return catItem?.type === 'product' ? s + (i.price * i.quantity) : s;
      }, 0);
    } else if (activePromotion.applyTo === 'specific' && activePromotion.specificItemId) {
      base = cart.reduce((s, i) => i.itemId === activePromotion.specificItemId ? s + (i.price * i.quantity) : s, 0);
    }
    if (base === 0) return 0;
    return activePromotion.type === 'percentage' ? base * (activePromotion.value / 100) : Math.min(base, activePromotion.value);
  }, [activePromotion, subtotal, cart, catalog]);

  const discountFromPoints = useMemo(() => {
    const loyalty = config?.loyalty || { enabled: false, redemptionThreshold: 9999, redemptionValue: 0 };
    if (usePoints && activeClient && loyalty.enabled && (activeClient.points || 0) >= loyalty.redemptionThreshold) {
      return loyalty.redemptionValue;
    }
    return 0;
  }, [usePoints, activeClient, config]);

  const totalDiscount = discountFromPromo + discountFromPoints;
  const rawTotal = Math.max(0, subtotal - totalDiscount);
  const totalPaid = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [payments]);
  const remainingBalance = Math.max(0, rawTotal - totalPaid);
  const displayChange = Math.max(0, totalPaid - rawTotal);

  const barbers = users.filter(u => u.role === 'estilista' && u.active !== false && (!u.branchId || u.branchId === currentBranchId));
  const activeTickets = tickets.filter(t => (t.status === 'serving' || t.status === 'waiting') && t.branchId === currentBranchId);

  const categoryChips = useMemo(() => {
    const cats = new Set<string>();
    catalog.forEach(item => { if (item.active !== false && item.category) cats.add(item.category); });
    return Array.from(cats).sort();
  }, [catalog]);

  const filteredCatalog = catalog.filter(item => {
    if (!item || item.active === false) return false;
    const catFilter = !selectedCategory || item.category === selectedCategory;
    if (!catFilter) return false;
    const search = catalogSearch.toLowerCase();
    if (!search) return true;
    const nameMatch = (item.name || '').toLowerCase().includes(search);
    const catMatch = (item.category || '').toLowerCase().includes(search);
    return nameMatch || catMatch;
  });

  const filteredClients = clientSearch.length > 0
    ? clients.filter(c => (c.name || '').toLowerCase().includes(clientSearch.toLowerCase()))
    : [];

  const filteredReferrersForNewClient = useMemo(() => {
    return newClientReferrerSearch.length > 1
      ? clients.filter(c => (c.name || '').toLowerCase().includes(newClientReferrerSearch.toLowerCase()))
      : [];
  }, [clients, newClientReferrerSearch]);

  const showAddClientButton = posMode === 'direct' && clientSearch.length > 2 && filteredClients.length === 0 && !selectedDirectClient;

  const getStock = useCallback((itemId: string) => {
    return getBranchStock(currentBranchId || '', itemId)?.stock || 0;
  }, [getBranchStock, currentBranchId]);

  const addToCart = useCallback((item: CatalogItem) => {
    if (posMode === 'direct' && !selectedDirectClient) {
      showToast('error', 'Seleccionar Cliente', 'Primero debes seleccionar un cliente para agregar servicios');
      return;
    }
    if (item.type === 'product' && (getStock(item.id) - (cart.find(i => i.itemId === item.id)?.quantity || 0)) <= 0) {
      showToast('error', 'Sin stock', 'No hay suficientes unidades disponibles');
      return;
    }
    setCart(prev => {
      const exists = prev.find(i => i.itemId === item.id);
      if (exists) return prev.map(i => i.itemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { itemId: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  }, [getStock, cart, posMode, selectedDirectClient, showToast]);

  const removeFromCart = useCallback((itemId: string) => {
    setCart(prev => {
      const nextCart = prev.filter(i => i.itemId !== itemId);
      if (nextCart.length === 0) {
        setPayments([]);
        setAmountInput('');
      }
      return nextCart;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setPayments([]);
    setAmountInput('');
    setErrorMsg('');
  }, []);

  const handleTicketSelect = useCallback((ticketId: string) => {
    setSelectedTicket(ticketId);
    setUsePoints(false);
    const t = tickets.find(tick => tick.id === ticketId);
    if (t) {
      if (t.barberId) setSelectedBarber(t.barberId);
      const map = config.ticketProductMap;
      const getSI = (id: string) => {
        const m = catalog.find(i => i.id === id);
        return m ? { itemId: m.id, name: m.name, price: m.price, quantity: 1 } : null;
      };
      const findFallback = (type: string) => {
        const typeMap: Record<string, string> = { C: 'corte', B: 'barba', D: 'combo' };
        const keyword = typeMap[type] || '';
        const match = catalog.find(i => i.type === 'service' && i.name.toLowerCase().includes(keyword));
        return match ? { itemId: match.id, name: match.name, price: match.price, quantity: 1 } : null;
      };
      const newItems: SaleItem[] = [];
      if (t.type === 'C') { const i = getSI(map?.C || '') || findFallback('C'); if (i) newItems.push(i); }
      else if (t.type === 'B') { const i = getSI(map?.B || '') || findFallback('B'); if (i) newItems.push(i); }
      else if (t.type === 'D') {
        const i = getSI(map?.D || '') || findFallback('D');
        if (i) newItems.push(i);
      }
      setCart(newItems);
    }
  }, [tickets, catalog, config.ticketProductMap]);

  const addPayment = useCallback(() => {
    const val = amountInput === '' ? remainingBalance : parseFloat(amountInput);
    if (isNaN(val) || val <= 0) return;
    setPayments([...payments, { method: currentPaymentMethod, amount: val }]);
    setAmountInput('');
    setErrorMsg('');
  }, [amountInput, remainingBalance, payments, currentPaymentMethod]);

  const handleCheckout = useCallback(async () => {
    console.log("handleCheckout called, cart:", cart.length, "barber:", selectedBarber, "paid:", totalPaid, "total:", rawTotal);
    if (cart.length === 0) { showToast('warning', 'Carrito vacío', 'Agrega productos para continuar'); return; }
    if (!selectedBarber) { showToast('error', 'Falta Estilista', 'Debes seleccionar un estilista'); return; }
    if (posMode === 'direct' && !activeClientId) { showToast('error', 'Falta Cliente', 'Debes seleccionar un cliente'); return; }
    if (totalPaid < rawTotal - 0.01) { showToast('warning', 'Pago incompleto', 'El monto recibido es menor al total'); return; }

    const pointsEarned = activeClientId && config.loyalty?.enabled ? (config.loyalty.pointsPerVisit || 0) : 0;

    const sale: Sale = {
      id: crypto.randomUUID(), branchId: currentBranchId || '',
      ticketId: posMode === 'ticket' ? selectedTicket : undefined,
      clientId: activeClientId || null, barberId: selectedBarber || null,
      items: cart, subtotal, discount: totalDiscount, total: rawTotal,
      payments: [...payments], timestamp: nowES(),
      appliedPromotionId: activePromotion?.id,
      pointsUsed: usePoints ? config.loyalty?.redemptionThreshold : 0,
      pointsEarned,
    };

    console.log("Calling processSale...");
    const finalSale = await processSale(sale);
    console.log("processSale returned:", finalSale);
    if (finalSale) {
      console.log("Setting currentSale and showReceiptModal");
      setCurrentSale(finalSale);
      setShowReceiptModal(true);
    } else {
      setErrorMsg("❌ Error al procesar venta");
    }
  }, [cart, selectedBarber, totalPaid, rawTotal, activeClientId, config, currentBranchId, posMode, selectedTicket, activePromotion, usePoints, payments, subtotal, totalDiscount, processSale, currentUser]);

  const handleSendEmail = useCallback(async () => {
    if (!receiptEmail || !currentSale) return;
    setIsSendingEmail(true);
    const clientName = clients.find(c => c.id === currentSale.clientId)?.name || "Cliente";
    const success = await sendInvoiceByEmail(currentSale, clientName, receiptEmail);
    setIsSendingEmail(false);
    if (success) {
      showToast('success', 'Ticket Enviado', `El comprobante ha sido enviado a ${receiptEmail}`);
    } else {
      showToast('error', 'Error de Envío', 'No se pudo enviar el correo. Revisa la configuración del Webhook.');
    }
  }, [receiptEmail, currentSale, clients, sendInvoiceByEmail, showToast]);

  const finalizeReceipt = useCallback(() => {
    setShowReceiptModal(false);
    setCurrentSale(null);
    clearCart();
    setSelectedTicket('');
    setSelectedDirectClient('');
    setClientSearch('');
    setUsePoints(false);
    setSelectedBarber(currentUser?.role === 'estilista' ? currentUser.id : '');
  }, [clearCart, currentUser]);

  const handleAddAndSelectClient = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const newId = crypto.randomUUID();
    const newClient: Client = {
      id: newId, name: newClientName, phone: newClientPhone,
      email: newClientEmail, birthDate: newClientBirth || undefined,
      notes: newClientNotes, referredBy: newClientSelectedReferrerId,
      visits: 0, points: 0,
    };
    addClient(newClient);
    setSelectedDirectClient(newId);
    setClientSearch(newClientName);
    setShowAddClientModal(false);
    setNewClientReferrerSearch('');
    setNewClientSelectedReferrerId(undefined);
  }, [newClientName, newClientPhone, newClientEmail, newClientBirth, newClientNotes, newClientSelectedReferrerId, addClient]);

  const removePayment = useCallback((index: number) => {
    setPayments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return {
    currentBranchId, currentBranch, selectedBranchId, setSelectedBranchId,
    cart, setCart, removePayment, selectedBarber, setSelectedBarber,
    catalogSearch, setCatalogSearch, currentTime,
    posMode, setPosMode,
    selectedDirectClient, setSelectedDirectClient,
    clientSearch, setClientSearch,
    selectedTicket, setSelectedTicket,
    usePoints, setUsePoints,
    payments, setPayments, currentPaymentMethod, setCurrentPaymentMethod,
    amountInput, setAmountInput, errorMsg, setErrorMsg,
    currentSale, openingAmount, setOpeningAmount,
    receiptEmail, setReceiptEmail, isSendingEmail,
    amountInputRef,
    showOpenSessionModal, setShowOpenSessionModal,
    showReceiptModal, setShowReceiptModal,
    showAddClientModal, setShowAddClientModal,
    showComboModal, setShowComboModal,
    newClientName, setNewClientName,
    newClientPhone, setNewClientPhone,
    newClientEmail, setNewClientEmail,
    newClientBirth, setNewClientBirth,
    newClientNotes, setNewClientNotes,
    newClientReferrerSearch, setNewClientReferrerSearch,
    newClientSelectedReferrerId, setNewClientSelectedReferrerId,
    subtotal, discountFromPromo, discountFromPoints,
    totalDiscount, rawTotal, totalPaid, remainingBalance, displayChange,
    activePromotion, activeClient, activeClientId,
    barbers, activeTickets, filteredCatalog, filteredClients,
    filteredReferrersForNewClient, showAddClientButton,
    getStock, addToCart, removeFromCart, clearCart,
    handleTicketSelect, addPayment, handleCheckout,
    handleSendEmail, finalizeReceipt, handleAddAndSelectClient,
    logout, cashSession, openCashSession, config, catalog, branches, sales,
    showToast, currentUser, users, clients,
    selectedCategory, setSelectedCategory, categoryChips,
  };
}
