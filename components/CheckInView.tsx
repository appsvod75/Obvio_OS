import React, { useState, useEffect, useCallback } from 'react';
import { useBarber } from '../context/BarberContext';
import { Clock, MapPin, CheckCircle, XCircle, History } from 'lucide-react';

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3;
  const toRad = (d: number) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const CheckInView = () => {
  const { currentUser, config, showToast } = useBarber();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastAction, setLastAction] = useState<'CHECK_IN' | 'CHECK_OUT' | null>(null);
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [histDate, setHistDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const stored = localStorage.getItem(`attendance_${currentUser?.id}`);
    if (stored) {
      const today = new Date().toISOString().split('T')[0];
      const [storedDate, storedAction] = stored.split('|');
      if (storedDate === today) setLastAction(storedAction as 'CHECK_IN' | 'CHECK_OUT');
    }
    getGPS();
    return () => clearInterval(timer);
  }, []);

  const getGPS = () => {
    if (!navigator.geolocation) { setGpsError('GPS no disponible'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setGpsPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGpsError(null); },
      (err) => { setGpsError('Permiso de ubicación denegado'); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const verifyGeofence = useCallback(() => {
    if (!gpsPos) return null;
    const lat = Number(config.latitude);
    const lng = Number(config.longitude);
    if (!lat || !lng) return null;
    const dist = calculateDistance(gpsPos.lat, gpsPos.lng, lat, lng);
    const radius = Number(config.geofenceRadius) || 10;
    return { within: dist <= radius, distance: Math.round(dist), radius };
  }, [gpsPos, config]);

  const handleAttendance = async (type: 'CHECK_IN' | 'CHECK_OUT') => {
    if (!currentUser) return;
    // Re-intentar GPS si no tenemos posición
    if (!gpsPos) {
      showToast('warning', 'GPS', 'Obteniendo ubicación... Espera un momento');
      getGPS();
      return;
    }
    const geo = verifyGeofence();
    if (!geo) {
      showToast('error', 'GPS', 'No se pudo verificar. Reintentá.');
      getGPS();
      return;
    }
    if (!geo.within) {
      showToast('error', 'Fuera del negocio', 'TE ENCUENTRAS FUERA DEL NEGOCIO');
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: crypto.randomUUID(), userId: currentUser.id, userName: currentUser.name,
          type, latitude: gpsPos?.lat, longitude: gpsPos?.lng,
          withinGeofence: geo ? geo.within : false
        })
      });
      if (res.ok) {
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_${currentUser.id}`, `${today}|${type}`);
        setLastAction(type);
        showToast('success', type === 'CHECK_IN' ? 'Entrada registrada' : 'Salida registrada', `Bienvenido${type === 'CHECK_IN' ? '' : ', hasta luego'}!`);
      }
    } catch { showToast('error', 'Error', 'No se pudo registrar'); }
    setIsLoading(false);
  };

  const loadHistory = async () => {
    if (!currentUser) return;
    const res = await fetch(`/api/attendance?userId=${currentUser.id}&startDate=${histDate}&endDate=${histDate}`);
    const data = await res.json();
    setHistory(data || []);
  };

  const todayStr = currentTime.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const timeStr = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const geo = verifyGeofence();

  return (
    <div className="h-full flex flex-col items-center justify-center bg-rose-bg p-6 animate-in fade-in">
      <div className="text-center mb-8">
        <div className="text-5xl sm:text-6xl font-black text-rose-900 font-mono tracking-tighter mb-2">{timeStr}</div>
        <p className="text-rose-500 text-sm font-bold uppercase tracking-widest">{todayStr}</p>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-2xl font-black text-rose-900 uppercase">{currentUser?.name}</h2>
        <p className="text-rose-400 text-xs font-bold uppercase mt-1">{currentUser?.role}</p>
      </div>

      <div className="flex items-center gap-2 mb-6 text-[10px] font-black uppercase tracking-widest">
        <MapPin size={14} className={geo ? (geo.within ? 'text-emerald-500' : 'text-destructive') : 'text-rose-400'} />
        {gpsError ? <span className="text-rose-400">{gpsError}</span> :
         gpsPos ? <span className={geo?.within ? 'text-emerald-500' : 'text-destructive'}>
           {geo?.within ? 'Ubicación verificada ✓' : 'TE ENCUENTRAS FUERA DEL NEGOCIO'}
         </span> : <span className="text-rose-400">Obteniendo ubicación...</span>}
        {!gpsPos && (
          <button onClick={getGPS} className="text-blue-500 hover:text-blue-700 font-black text-xs uppercase ml-2">Reintentar</button>
        )}
      </div>

      {!showHistory ? (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          {lastAction !== 'CHECK_IN' && (
            <button onClick={() => handleAttendance('CHECK_IN')} disabled={isLoading}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-2xl font-black uppercase text-lg tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-emerald-800 active:border-b-0 disabled:opacity-50">
              <Clock size={24} /> Entrada
            </button>
          )}
          {lastAction === 'CHECK_IN' && (
            <button onClick={() => handleAttendance('CHECK_OUT')} disabled={isLoading}
              className="flex-1 bg-rose-palo hover:bg-rose-palo-dark text-white py-6 rounded-2xl font-black uppercase text-lg tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-rose-palo-dark active:border-b-0 disabled:opacity-50">
              <Clock size={24} /> Salida
            </button>
          )}
        </div>
      ) : (
        <div className="w-full max-w-md space-y-2">
          <div className="flex items-center gap-2 mb-4">
            <input type="date" value={histDate} onChange={e => setHistDate(e.target.value)} className="bg-white border rounded-xl px-3 py-2 text-sm font-bold outline-none flex-1" />
            <button onClick={loadHistory} className="bg-rose-palo text-white px-4 py-2 rounded-xl font-black text-xs uppercase shadow-lg">Ver</button>
          </div>
          {history.length === 0 ? <p className="text-center text-rose-400 text-sm">Sin registros</p> :
            history.map((r: any) => (
              <div key={r.id} className="bg-white border rounded-xl p-3 flex justify-between items-center">
                <div><span className="font-black text-sm">{r.type === 'CHECK_IN' ? 'Entrada' : 'Salida'}</span>
                  <p className="text-xs text-rose-400 font-bold">{r.timestamp}</p>
                </div>
                {r.within_geofence ? <CheckCircle size={16} className="text-emerald-500" /> : <XCircle size={16} className="text-destructive" />}
              </div>
            ))}
        </div>
      )}

      <div className="mt-8 flex gap-4">
        <button onClick={() => setShowHistory(!showHistory)} className="text-rose-500 hover:text-rose-700 font-black text-xs uppercase tracking-widest flex items-center gap-1">
          <History size={14} /> {showHistory ? 'Cerrar historial' : 'Ver historial'}
        </button>
      </div>
    </div>
  );
};
