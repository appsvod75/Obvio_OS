import React, { useState, useEffect, useRef } from 'react';
import { useBarber } from '../context/BarberContext';
import { useConfigCtx } from '../context/ConfigContext';
import { useBranch } from '../context/BranchContext';
import { ALL_PANELS } from './layout/DashboardHome';
import {
    Settings, Save, CheckCircle2, Tv, ListVideo, Plus,
    Trash2, Youtube, FileVideo, Scissors, Printer, RefreshCcw,
    HardDrive, Zap, Upload, Image,
    EyeOff, Eye, LayoutGrid, Download, AlertTriangle, MapPin, ArrowUp, ArrowDown, GripVertical, ArrowUpDown,
} from 'lucide-react';

type TabKey = 'master' | 'tv' | 'panels' | 'order' | 'danger';

const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'master', label: 'General', icon: <Settings size={14} /> },
    { key: 'tv', label: 'Cartelera TV', icon: <Tv size={14} /> },
    { key: 'panels', label: 'Paneles', icon: <LayoutGrid size={14} /> },
    { key: 'order', label: 'Orden', icon: <ArrowUpDown size={14} /> },
    { key: 'danger', label: 'Zona Danger', icon: <span className="text-destructive">⚠️</span> },
];

const allPanels = ALL_PANELS;

export const SettingsManager = ({ initialTab = 'master' }: { initialTab?: TabKey }) => {
    const { config, updateConfig } = useConfigCtx();
    const { branches, updateBranch } = useBranch();
    const { factoryReset, currentUser, showToast } = useBarber();

    const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

    // Master settings
    const [salonName, setSalonName] = useState(config.salonName || '');
    const [logoUrl, setLogoUrl] = useState(config.logoUrl || '');
    const [ticketFooter, setTicketFooter] = useState(config.ticketFooter || '');
    const [ticketSize, setTicketSize] = useState(config.ticketSize || '58mm');
    const [webhookUrl, setWebhookUrl] = useState(config.webhookUrl || '');
    const [gpsLat, setGpsLat] = useState(config.latitude?.toString() || '13.706396');
    const [gpsLng, setGpsLng] = useState(config.longitude?.toString() || '-89.146180');
    const [gpsRadius, setGpsRadius] = useState(config.geofenceRadius?.toString() || '10');
    const [telegramToken, setTelegramToken] = useState(config.telegramBotToken || '');

    // TV Settings
    const [videoPlaylist, setVideoPlaylist] = useState<any[]>(config.videoPlaylist || []);
    const [tickerSpeed, setTickerSpeed] = useState(config.tickerSpeed || 20);
    const [tickerMessage, setTickerMessage] = useState(config.tickerMessage || '');

    // Panel visibility
    const [hiddenPanels, setHiddenPanels] = useState<string[]>(config.hiddenPanels || []);

    // Menu order
    const [menuOrder, setMenuOrder] = useState<string[]>(config.menuOrder || []);

    // UI State
    const [newItemName, setNewItemName] = useState('');
    const [newItemUrl, setNewItemUrl] = useState('');
    const [previewVideo, setPreviewVideo] = useState<any>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string>(config.logoUrl || '');
    // Danger Zone
    const [cleanupFrom, setCleanupFrom] = useState('');
    const [cleanupTo, setCleanupTo] = useState('');
    const [cleanupTable, setCleanupTable] = useState('sales');
    const [isBackingUp, setIsBackingUp] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [cleanupResult, setCleanupResult] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);

    const isProtegido = currentUser?.id === 'u_admin' || currentUser?.id === '1' || currentUser?.username === 'admin';
    const isSuperAdmin = isProtegido;

    useEffect(() => {
        setSalonName(config.salonName || '');
        setLogoUrl(config.logoUrl || '');
        setLogoPreview(config.logoUrl || '');
        setTicketFooter(config.ticketFooter || '');
        setTicketSize(config.ticketSize || '58mm');
        setWebhookUrl(config.webhookUrl || '');
        setHiddenPanels(config.hiddenPanels || []);
        setMenuOrder(config.menuOrder || []);
        setGpsLat(config.latitude ? String(config.latitude) : '13.706396');
        setGpsLng(config.longitude ? String(config.longitude) : '-89.146180');
        setGpsRadius(config.geofenceRadius ? String(config.geofenceRadius) : '10');
        setTelegramToken(config.telegramBotToken || '');
    }, [config.salonName, config.logoUrl, config.ticketFooter, config.ticketSize, config.webhookUrl, config.hiddenPanels, config.latitude, config.longitude, config.geofenceRadius, config.telegramBotToken]);

    useEffect(() => {
        if (videoPlaylist.length > 0 && !previewVideo) {
            setPreviewVideo(videoPlaylist[0]);
        }
    }, [videoPlaylist]);

    const showNotify = (type: 'success' | 'error', msg: string) => {
        showToast(type, type === 'success' ? 'Operación Exitosa' : 'Error', msg);
    };

    const updateFavicon = (url: string) => {
        let link = document.querySelector<HTMLLinkElement>("link[rel~='icon']");
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = url;
        let appleLink = document.querySelector<HTMLLinkElement>("link[rel~='apple-touch-icon']");
        if (!appleLink) {
            appleLink = document.createElement('link');
            appleLink.rel = 'apple-touch-icon';
            document.head.appendChild(appleLink);
        }
        appleLink.href = url;
    };

    const handleLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setLogoFile(file);
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUrl = event.target?.result as string;
                setLogoPreview(dataUrl);
                setLogoUrl(dataUrl);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = async () => {
    const success = await updateConfig({
        salonName,
        logoUrl,
        ticketFooter,
        ticketSize,
        webhookUrl,
        videoPlaylist,
        tickerSpeed,
        tickerMessage,
        hiddenPanels,
        menuOrder,
        latitude: parseFloat(gpsLat),
        longitude: parseFloat(gpsLng),
        geofenceRadius: parseInt(gpsRadius),
        telegramBotToken: telegramToken,
    });
        if (success) {
            if (logoUrl) updateFavicon(logoUrl);
        }
    };

    const handleFileBrowse = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setNewItemUrl(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const addToPlaylist = () => {
        if (!newItemUrl) return;
        const isYoutube = newItemUrl.includes('youtube.com') || newItemUrl.includes('youtu.be');
        const newItem = {
            id: crypto.randomUUID(),
            name: newItemName || (isYoutube ? 'VIDEO YOUTUBE' : 'VIDEO CARGADO'),
            url: newItemUrl,
            type: isYoutube ? 'youtube' : 'mp4'
        };
        setVideoPlaylist([...videoPlaylist, newItem]);
        setNewItemName('');
        setNewItemUrl('');
        showNotify('success', 'Video agregado a la cartelera');
    };

    const removeFromPlaylist = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const newPlaylist = videoPlaylist.filter(v => v.id !== id);
        setVideoPlaylist(newPlaylist);
        if (previewVideo?.id === id) {
            setPreviewVideo(newPlaylist[0] || null);
        }
    };

    const togglePanel = (panelId: string) => {
        setHiddenPanels(prev =>
            prev.includes(panelId)
                ? prev.filter(id => id !== panelId)
                : [...prev, panelId]
        );
    };

    const handleBackup = async () => {
        setIsBackingUp(true);
        try {
            const res = await fetch('/api/backup');
            if (!res.ok) throw new Error('Error al generar backup');
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-obvio-${new Date().toISOString().split('T')[0]}.db`;
            a.click();
            URL.revokeObjectURL(url);
            showNotify('success', 'Backup descargado correctamente');
        } catch (e) {
            showNotify('error', 'Error al generar backup');
        }
        setIsBackingUp(false);
    };

    const handleCleanup = async () => {
        if (!cleanupFrom || !cleanupTo) {
            showNotify('error', 'Selecciona fecha desde y hasta');
            return;
        }
        setIsCleaning(true);
        setCleanupResult(null);
        try {
            const res = await fetch('/api/cleanup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ table: cleanupTable, from: cleanupFrom, to: cleanupTo }),
            });
            const data = await res.json();
            if (data.success) {
                setCleanupResult(`Eliminados ${data.deleted} registros de ${cleanupTable}`);
                showNotify('success', `Limpieza completada: ${data.deleted} registros`);
            } else {
                showNotify('error', data.error || 'Error en limpieza');
            }
        } catch (e) {
            showNotify('error', 'Error de conexión');
        }
        setIsCleaning(false);
    };

    const tabChips = () => (
        <div className="flex gap-1.5 sm:gap-2 p-1 bg-rose-muted rounded-xl border border-rose-border shrink-0 overflow-x-auto hide-scrollbar">
            {tabs.map(t => (
                <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-lg text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                        activeTab === t.key
                            ? 'bg-rose-palo text-white shadow-lg'
                            : 'text-rose-400 hover:text-rose-700'
                    }`}
                >
                    {t.icon}
                    <span className="hidden xs:inline sm:inline">{t.label}</span>
                </button>
            ))}
        </div>
    );

    return (
        <div className="h-full flex flex-col bg-rose-bg font-inter animate-in fade-in duration-300 overflow-hidden">

            <div className="px-3 sm:px-6 lg:px-8 py-2 sm:py-3 border-b border-rose-border flex flex-col sm:flex-row gap-3 sm:items-center justify-between bg-rose-bg/50 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3 sm:gap-4">
                    <div className="p-1.5 sm:p-2 bg-white rounded-lg text-rose-500 border border-rose-border shrink-0">
                        {activeTab === 'tv' ? <Tv size={16} className="sm:size-[18px]" /> : activeTab === 'panels' ? <LayoutGrid size={16} className="sm:size-[18px]" /> : <Settings size={16} className="sm:size-[18px]" />}
                    </div>
                    <div className="min-w-0">
                        <h2 className="text-xs sm:text-sm font-black text-rose-900 uppercase tracking-tight leading-none truncate">
                            {tabs.find(t => t.key === activeTab)?.label || 'Configuración'}
                        </h2>
                        <p className="text-[7px] font-black text-rose-500 uppercase tracking-[0.3em] mt-0.5">Nivel: Administrador Global</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 sm:gap-3">
                    {tabChips()}
                    <button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 sm:px-5 lg:px-6 py-1.5 sm:py-2 rounded-lg sm:rounded-xl font-black flex items-center gap-1.5 sm:gap-2 shadow-lg transition-all active:scale-95 uppercase tracking-widest text-[8px] sm:text-[9px] border-b-2 border-emerald-800 active:border-b-0 shrink-0">
                        <Save size={12} className="sm:size-[14px]" /> <span className="hidden xs:inline">Guardar</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 lg:p-6 xl:p-8">
                {activeTab === 'master' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 lg:gap-x-20 gap-y-6 lg:gap-y-12 max-w-6xl mx-auto">
                        <div className="space-y-6 lg:space-y-8">
                            <div className="flex items-center gap-3 border-b border-rose-border pb-2">
                                <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">01. Identidad Visual</span>
                            </div>
                            <div className="space-y-4 lg:space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Nombre Comercial</label>
                                    <input value={salonName} onChange={e => setSalonName(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-rose-900 font-bold text-xs sm:text-sm outline-none focus:border-blue-600 transition-all shadow-inner" placeholder="EJ: BARBEROS PRO" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Logo del Negocio</label>
                                    <p className="text-[7px] text-rose-400 font-bold uppercase tracking-wider ml-1 mb-1 sm:mb-2">
                                        Aparecerá en Login, Sidebar, Tickets, Favicon e Icono
                                    </p>
                                    <div className="flex gap-3 sm:gap-4 items-start">
                                        <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-xl lg:rounded-2xl bg-white border-2 border-dashed border-rose-border flex items-center justify-center overflow-hidden shrink-0 shadow-xl hover:border-blue-500 transition-colors relative group cursor-pointer"
                                            onClick={() => logoInputRef.current?.click()}>
                                            {logoPreview ? (
                                                <img src={logoPreview} alt="Logo Preview" className="max-w-full max-h-full object-contain p-1 sm:p-2" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-0.5 sm:gap-1 text-rose-400">
                                                    <Image size={16} className="sm:size-[20px] lg:size-[24px]" />
                                                    <span className="text-[5px] sm:text-[6px] font-black uppercase tracking-widest">Sin Logo</span>
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-rose-palo-dark/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl lg:rounded-2xl">
                                                <Upload size={16} className="sm:size-[20px] text-white" />
                                            </div>
                                        </div>
                                        <div className="flex-1 space-y-1.5 sm:space-y-2 min-w-0">
                                            <input type="file" ref={logoInputRef} onChange={handleLogoFile} className="hidden" accept="image/png,image/jpeg,image/webp,image/svg+xml" />
                                            <div className="flex gap-1.5 sm:gap-2">
                                                <input value={logoUrl} onChange={e => { setLogoUrl(e.target.value); setLogoPreview(e.target.value); }}
                                                    className="flex-1 min-w-0 bg-white border border-rose-border rounded-xl py-2 sm:py-2.5 px-2 sm:px-4 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-blue-600 transition-all shadow-inner"
                                                    placeholder="O pega URL..." />
                                                <button type="button" onClick={() => logoInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-500 text-white px-2 sm:px-3 py-2 rounded-xl transition-all active:scale-95 shrink-0">
                                                    <Upload size={14} className="sm:size-[16px]" />
                                                </button>
                                            </div>
                                            <p className="text-[6px] sm:text-[7px] text-rose-400 font-bold uppercase tracking-wider">PNG, JPG, WebP o SVG. 512x512px+</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Mensaje Pie de Ticket</label>
                                    <textarea value={ticketFooter} onChange={e => setTicketFooter(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-3 sm:p-4 text-rose-900 font-bold text-xs outline-none h-24 sm:h-32 resize-none focus:border-blue-600 transition-all shadow-inner" placeholder="Escribe aquí el mensaje de agradecimiento..." />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 lg:space-y-8">
                            <div className="flex items-center gap-3 border-b border-rose-border pb-2">
                                <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">02. Hardware & Automatización</span>
                            </div>
                            <div className="space-y-4 lg:space-y-6">
                                <div className="space-y-2 sm:space-y-3">
                                    <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Ancho de papel térmico</label>
                                    <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                        <button onClick={() => setTicketSize('58mm')} className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl border transition-all ${ticketSize === '58mm' ? 'bg-white text-black border-white shadow-xl' : 'bg-white/50 text-rose-500 border-rose-border hover:border-rose-palo-dark'}`}>
                                            <Printer size={12} className="sm:size-[14px]" />
                                            <span className="text-[8px] sm:text-[9px] font-black uppercase">58mm</span>
                                        </button>
                                        <button onClick={() => setTicketSize('80mm')} className={`flex items-center justify-center gap-2 p-2 sm:p-3 rounded-xl border transition-all ${ticketSize === '80mm' ? 'bg-white text-black border-white shadow-xl' : 'bg-white/50 text-rose-500 border-rose-border hover:border-rose-palo-dark'}`}>
                                            <Printer size={12} className="sm:size-[14px]" />
                                            <span className="text-[8px] sm:text-[9px] font-black uppercase">80mm</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[7px] sm:text-[8px] font-black text-emerald-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Zap size={8} className="sm:size-[10px]" /> Webhook GAS Global</label>
                                    <input value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full bg-rose-bg border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-emerald-500 transition-all shadow-inner" placeholder="https://script.google.com/..." />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[7px] sm:text-[8px] font-black text-sky-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">🤖 Telegram Bot Token</label>
                                    <input value={telegramToken} onChange={e => setTelegramToken(e.target.value)} className="w-full bg-rose-bg border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 sm:px-4 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-sky-500 transition-all shadow-inner" placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz" type="password" />
                                </div>

                                <div className="space-y-2 sm:space-y-3">
                                    <label className="text-[7px] sm:text-[8px] font-black text-blue-500 uppercase tracking-widest ml-1 flex items-center gap-1.5"><MapPin size={8} className="sm:size-[10px]" /> Geolocalización (Marcación)</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[6px] sm:text-[7px] font-black text-rose-400 uppercase tracking-widest ml-1">Latitud</label>
                                            <input type="number" step="0.000001" value={gpsLat} onChange={e => setGpsLat(e.target.value)} className="w-full bg-rose-bg border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-blue-500 transition-all shadow-inner" />
                                        </div>
                                        <div>
                                            <label className="text-[6px] sm:text-[7px] font-black text-rose-400 uppercase tracking-widest ml-1">Longitud</label>
                                            <input type="number" step="0.000001" value={gpsLng} onChange={e => setGpsLng(e.target.value)} className="w-full bg-rose-bg border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-blue-500 transition-all shadow-inner" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[6px] sm:text-[7px] font-black text-rose-400 uppercase tracking-widest ml-1">Radio de geocerca (metros)</label>
                                        <input type="number" min="5" max="100" value={gpsRadius} onChange={e => setGpsRadius(e.target.value)} className="w-full bg-rose-bg border border-rose-border rounded-xl py-2 sm:py-2.5 px-3 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-blue-500 transition-all shadow-inner" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'tv' && (
                    <div className="max-w-7xl mx-auto flex flex-col gap-4 sm:gap-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
                            <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                                <div className="flex items-center justify-between border-b border-rose-border pb-1.5">
                                    <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">01. Gestor de Multimedia TV</span>
                                    <div className="flex items-center gap-2 bg-white px-2 sm:px-3 py-1 rounded-full border border-rose-border">
                                        <ListVideo size={8} className="sm:size-[10px] text-orange-500" />
                                        <span className="text-[7px] sm:text-[8px] font-black text-rose-400 uppercase">{videoPlaylist.length} Videos</span>
                                    </div>
                                </div>
                                <div className="bg-white/60 p-2 sm:p-3 rounded-xl sm:rounded-2xl border border-rose-border shadow-xl space-y-2 sm:space-y-3">
                                    <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3">
                                        <div className="w-full sm:w-48 space-y-1">
                                            <label className="text-[7px] font-black text-rose-500 uppercase tracking-widest ml-1">Etiqueta</label>
                                            <input value={newItemName} onChange={e => setNewItemName(e.target.value.toUpperCase())} className="w-full bg-rose-muted border border-rose-border rounded-xl p-2 text-rose-900 font-black text-[9px] sm:text-[10px] outline-none focus:border-orange-600 shadow-inner transition-all" placeholder="EJ: COMERCIAL" />
                                        </div>
                                        <div className="flex-1 w-full space-y-1">
                                            <label className="text-[7px] font-black text-rose-500 uppercase tracking-widest ml-1">URL</label>
                                            <input value={newItemUrl} onChange={e => setNewItemUrl(e.target.value)} className="w-full bg-rose-muted border border-rose-border rounded-xl p-2 text-rose-900 font-mono text-[8px] sm:text-[9px] outline-none focus:border-orange-600 shadow-inner transition-all" placeholder="https://..." />
                                        </div>
                                        <div className="flex gap-1.5 sm:gap-2">
                                            <input type="file" ref={fileInputRef} onChange={handleFileBrowse} className="hidden" accept="video/*" />
                                            <button onClick={() => fileInputRef.current?.click()} className="p-2 bg-rose-muted text-rose-400 hover:text-rose-900 rounded-xl border border-rose-border hover:border-rose-palo-dark transition-all shadow-lg active:scale-95">
                                                <HardDrive size={14} className="sm:size-[16px]" />
                                            </button>
                                            <button onClick={addToPlaylist} disabled={!newItemUrl} className="bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:hover:bg-orange-600 text-white px-3 sm:px-5 py-2 rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest transition-all shadow-xl active:scale-95 border-b-2 border-orange-800 active:border-b-0">
                                                <Plus size={12} className="sm:size-[14px] inline mr-1" /> Agregar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-[300px] sm:max-h-[400px] lg:max-h-[500px] overflow-y-auto custom-scrollbar pr-1 sm:pr-2">
                                    {videoPlaylist.map((video: any) => (
                                        <div key={video.id} onClick={() => setPreviewVideo(video)}
                                            className={`group relative bg-white border rounded-xl sm:rounded-2xl p-2 sm:p-3 flex items-center gap-3 sm:gap-4 cursor-pointer transition-all hover:border-orange-600/50 ${previewVideo?.id === video.id ? 'border-orange-600 bg-orange-600/5 shadow-[0_0_20px_rgba(234,88,12,0.1)]' : 'border-rose-border'}`}>
                                            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-rose-muted border border-rose-border flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                                                {video.type === 'youtube' ? <Youtube className="text-destructive sm:size-[18px]" size={14} /> : <FileVideo className="text-blue-500 sm:size-[18px]" size={14} />}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="text-[9px] sm:text-[10px] font-black text-rose-900 uppercase truncate">{video.name}</h5>
                                                <p className="text-[7px] sm:text-[8px] font-bold text-rose-500 truncate font-mono uppercase">{video.type}</p>
                                            </div>
                                            <button onClick={(e) => removeFromPlaylist(video.id, e)} className="p-1.5 sm:p-2 text-rose-400 hover:text-destructive transition-all opacity-0 group-hover:opacity-100">
                                                <Trash2 size={12} className="sm:size-[14px]" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="lg:col-span-5 xl:col-span-4 space-y-4 sm:space-y-6">
                                <div className="border-b border-rose-border pb-1.5 flex items-center gap-2">
                                    <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">02. Vista Previa</span>
                                </div>
                                <div className="aspect-video bg-rose-muted rounded-xl sm:rounded-2xl border border-rose-border flex items-center justify-center overflow-hidden shadow-2xl relative group">
                                    {previewVideo ? (
                                        <div className="w-full h-full">
                                            {previewVideo.type === 'youtube' ? (
                                                <iframe className="w-full h-full pointer-events-none" src={`https://www.youtube.com/embed/${previewVideo.url.split('v=')[1] || previewVideo.url.split('/').pop()}?autoplay=0&controls=0&mute=1`} title="YouTube video player" />
                                            ) : (
                                                <video src={previewVideo.url} className="w-full h-full object-cover" muted />
                                            )}
                                            <div className="absolute inset-0 bg-rose-palo-dark/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                                                <span className="text-white font-black text-[8px] sm:text-[10px] uppercase tracking-widest bg-orange-600 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-2xl">Visualizando</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-2 opacity-20">
                                            <Tv size={24} className="sm:size-[32px] mx-auto text-rose-400" />
                                            <p className="text-[7px] sm:text-[8px] font-black text-rose-400 uppercase tracking-widest">Sin señal activa</p>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-3 sm:space-y-4 pt-3 sm:pt-4 border-t border-rose-border/50">
                                    <div className="flex justify-between items-center mb-1">
                                        <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
                                            <RefreshCcw size={8} className="sm:size-[10px] text-rose-400" /> Velocidad Ticker
                                        </label>
                                        <span className="text-[9px] sm:text-[10px] font-black text-orange-500 font-mono">{tickerSpeed} PX/S</span>
                                    </div>
                                    <input type="range" min="10" max="60" value={tickerSpeed} onChange={e => setTickerSpeed(parseInt(e.target.value))} className="w-full h-1.5 bg-rose-muted rounded-lg appearance-none cursor-pointer accent-orange-600" />
                                    <div className="space-y-1.5 sm:space-y-2">
                                        <label className="text-[7px] sm:text-[8px] font-black text-rose-500 uppercase tracking-widest ml-1">Mensaje Global</label>
                                        <textarea value={tickerMessage} onChange={e => setTickerMessage(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl p-3 sm:p-4 text-rose-900 font-bold text-xs outline-none h-20 sm:h-24 resize-none focus:border-orange-600 transition-all shadow-inner" placeholder="Escribe el anuncio..." />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'danger' && (
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-rose-border pb-2">
                                    <Download size={14} className="text-destructive shrink-0" />
                                    <span className="text-[8px] sm:text-[9px] font-black text-destructive uppercase tracking-[0.3em]">Backup DB</span>
                                </div>
                                <p className="text-[7px] sm:text-[8px] text-rose-400 font-bold uppercase tracking-wider ml-1">
                                    Snapshot completo con checkpoint previo.
                                </p>
                                <button onClick={handleBackup} disabled={isBackingUp}
                                    className="w-full flex items-center justify-center gap-3 px-5 py-4 sm:py-5 bg-rose-palo hover:bg-rose-palo-dark disabled:opacity-50 text-white rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95">
                                    <Download size={16} className={isBackingUp ? 'animate-bounce' : ''} />
                                    {isBackingUp ? 'Generando...' : 'Descargar Backup'}
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 border-b border-rose-border pb-2">
                                    <Trash2 size={14} className="text-destructive shrink-0" />
                                    <span className="text-[8px] sm:text-[9px] font-black text-destructive uppercase tracking-[0.3em]">Limpieza por Período</span>
                                </div>
                                <div className="bg-white/60 border border-rose-border rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-5 space-y-3">
                                    <select value={cleanupTable} onChange={e => setCleanupTable(e.target.value)}
                                        className="w-full bg-white border border-rose-border rounded-xl py-2.5 px-3 text-rose-900 font-black text-[9px] sm:text-[10px] outline-none focus:border-destructive transition-all">
                                        <option value="sales">Ventas</option>
                                        <option value="tickets">Tickets</option>
                                        <option value="appointments">Citas</option>
                                        <option value="inventory_movements">Mov. Inventario</option>
                                        <option value="cash_sessions">Sesiones de Caja</option>
                                        <option value="clients">Clientes (todo)</option>
                                        <option value="catalog">Catálogo (todo)</option>
                                        <option value="promotions">Promociones (todo)</option>
                                    </select>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-[7px] font-black text-rose-500 uppercase tracking-widest ml-1 mb-1 block">Desde</label>
                                            <input type="date" value={cleanupFrom} onChange={e => setCleanupFrom(e.target.value)}
                                                className="w-full bg-white border border-rose-border rounded-xl py-2 px-3 text-rose-900 font-black text-[9px] sm:text-[10px] outline-none focus:border-destructive transition-all" />
                                        </div>
                                        <div>
                                            <label className="text-[7px] font-black text-rose-500 uppercase tracking-widest ml-1 mb-1 block">Hasta</label>
                                            <input type="date" value={cleanupTo} onChange={e => setCleanupTo(e.target.value)}
                                                className="w-full bg-white border border-rose-border rounded-xl py-2 px-3 text-rose-900 font-black text-[9px] sm:text-[10px] outline-none focus:border-destructive transition-all" />
                                        </div>
                                    </div>
                                    <button onClick={handleCleanup} disabled={isCleaning || !cleanupFrom || !cleanupTo}
                                        className="w-full bg-destructive hover:bg-destructive/80 disabled:opacity-50 text-white py-2.5 sm:py-3 rounded-xl font-black text-[8px] sm:text-[9px] uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2">
                                        <Trash2 size={12} />
                                        {isCleaning ? 'Eliminando...' : 'Eliminar'}
                                    </button>
                                    {cleanupResult && (
                                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-[8px] sm:text-[9px] font-black text-emerald-700 uppercase tracking-widest text-center">
                                            {cleanupResult}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 sm:mt-6 p-3 sm:p-4 lg:p-5 bg-destructive/5 border border-destructive/20 rounded-xl sm:rounded-2xl">
                            <p className="text-[7px] sm:text-[8px] font-black text-destructive uppercase tracking-widest leading-relaxed">
                                ⚠️ Siempre realiza un backup antes de limpiar datos.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'panels' && (
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center gap-3 border-b border-rose-border pb-2 mb-4 sm:mb-6">
                            <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">01. Visibilidad de Paneles</span>
                            <span className="text-[7px] sm:text-[8px] font-black text-rose-400 uppercase ml-auto">{hiddenPanels.length} ocultos</span>
                        </div>
                        <p className="text-[7px] sm:text-[8px] text-rose-400 font-bold uppercase tracking-wider mb-4 sm:mb-6 ml-1">
                            Los paneles ocultos no aparecerán en el menú del panel de administración ni en la barra lateral.
                        </p>
                        <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                            {allPanels.map(panel => {
                                const isHidden = hiddenPanels.includes(panel.id);
                                return (
                                    <button
                                        key={panel.id}
                                        onClick={() => togglePanel(panel.id)}
                                        className={`flex items-center gap-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl border-2 transition-all ${
                                            isHidden
                                                ? 'bg-rose-muted/50 border-rose-border/50 text-rose-400'
                                                : 'bg-white border-emerald-500/30 text-rose-900 shadow-sm'
                                        }`}
                                    >
                                        <span className="text-base sm:text-lg">{panel.icon}</span>
                                        <span className={`flex-1 text-left text-[9px] sm:text-[10px] font-black uppercase tracking-tight ${isHidden ? 'line-through' : ''}`}>
                                            {panel.label}
                                        </span>
                                        {isHidden ? (
                                            <EyeOff size={14} className="sm:size-[16px] text-rose-400 shrink-0" />
                                        ) : (
                                            <Eye size={14} className="sm:size-[16px] text-emerald-500 shrink-0" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-amber-50 border border-amber-200 rounded-xl sm:rounded-2xl">
                            <p className="text-[8px] sm:text-[9px] font-black text-amber-700 uppercase tracking-widest leading-relaxed">
                                ⚠️ Estos cambios aplican globalmente para todos los usuarios. En una futura versión podrás configurar visibilidad por rol.
                            </p>
                        </div>
                    </div>
                )}

                {activeTab === 'order' && (() => {
                    const visiblePanels = allPanels.filter(p => !hiddenPanels.includes(p.id));
                    const orderedPanels: any[] = [];
                    const remainingPanels: any[] = [];
                    if (menuOrder.length > 0) {
                        visiblePanels.forEach(p => {
                            const idx = menuOrder.indexOf(p.id);
                            if (idx >= 0) orderedPanels[idx] = p;
                            else remainingPanels.push(p);
                        });
                    }
                    const displayList = (menuOrder.length > 0 ? orderedPanels.filter(Boolean).concat(remainingPanels) : visiblePanels);
                    const move = (from: number, dir: number) => {
                        const to = from + dir;
                        if (to < 0 || to >= displayList.length) return;
                        const ids = displayList.map(p => p.id);
                        [ids[from], ids[to]] = [ids[to], ids[from]];
                        setMenuOrder(ids);
                    };
                    return (
                        <div className="max-w-3xl mx-auto">
                            <div className="flex items-center gap-3 border-b border-rose-border pb-2 mb-4 sm:mb-6">
                                <span className="text-[8px] sm:text-[9px] font-black text-rose-500 uppercase tracking-[0.3em]">Orden del Menú Principal</span>
                                <span className="text-[7px] sm:text-[8px] font-black text-rose-400 uppercase ml-auto">{displayList.length} paneles</span>
                            </div>
                            <p className="text-[7px] sm:text-[8px] text-rose-400 font-bold uppercase tracking-wider mb-4 sm:mb-6 ml-1">
                                Usa las flechas para subir o bajar la posición de cada módulo en el menú. Los paneles ocultos no se muestran.
                            </p>

                            <div className="bg-white rounded-xl sm:rounded-2xl border border-rose-border shadow-sm overflow-hidden">
                                {displayList.map((panel, idx) => (
                                    <div
                                        key={panel.id}
                                        className="flex items-center gap-3 p-3 sm:p-4 border-b border-rose-border/50 last:border-0"
                                    >
                                        <span className="w-6 h-6 rounded-lg bg-rose-muted flex items-center justify-center text-[9px] font-black text-rose-500 font-mono shrink-0">
                                            {idx + 1}
                                        </span>
                                        <span className="text-base sm:text-lg shrink-0">{panel.icon}</span>
                                        <span className="flex-1 text-[9px] sm:text-[10px] font-black uppercase tracking-tight text-rose-900">
                                            {panel.label}
                                        </span>
                                        <div className="flex gap-1 shrink-0">
                                            <button
                                                type="button"
                                                disabled={idx === 0}
                                                onClick={() => move(idx, -1)}
                                                className={`p-2 rounded-lg transition-all ${idx === 0 ? 'text-rose-200 cursor-not-allowed' : 'bg-rose-muted text-rose-500 hover:bg-rose-palo hover:text-white'}`}
                                            >
                                                <ArrowUp size={14} />
                                            </button>
                                            <button
                                                type="button"
                                                disabled={idx === displayList.length - 1}
                                                onClick={() => move(idx, 1)}
                                                className={`p-2 rounded-lg transition-all ${idx === displayList.length - 1 ? 'text-rose-200 cursor-not-allowed' : 'bg-rose-muted text-rose-500 hover:bg-rose-palo hover:text-white'}`}
                                            >
                                                <ArrowDown size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-rose-palo/10 border border-rose-palo/20 rounded-xl sm:rounded-2xl">
                                <p className="text-[8px] sm:text-[9px] font-black text-rose-palo-dark uppercase tracking-widest leading-relaxed">
                                    💡 El orden se guarda al presionar el botón Guardar. Si agregas un módulo nuevo, aparecerá al final automáticamente.
                                </p>
                            </div>
                        </div>
                    );
                })()}
            </div>

        </div>
    );
};
