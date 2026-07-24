import React, { useState, useEffect, useRef } from 'react';
import { useBarber } from '../context/BarberContext';
import { Scissors, Timer } from 'lucide-react';

export const Login = () => {
  const { login, config } = useBarber();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [warning, setWarning] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const attemptCountRef = useRef(0);

  const MAX_ATTEMPTS = 3;
  const BLOCK_DURATION = 60;

  useEffect(() => {
    const blockUntil = localStorage.getItem('login_block_until');
    if (blockUntil) {
      const remaining = Math.ceil((parseInt(blockUntil) - Date.now()) / 1000);
      if (remaining > 0) { setIsBlocked(true); setTimeLeft(remaining); }
      else { localStorage.removeItem('login_block_until'); }
    }
  }, []);

  useEffect(() => {
    let interval: any;
    if (isBlocked && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) { setIsBlocked(false); setAttempts(0); attemptCountRef.current = 0; localStorage.removeItem('login_block_until'); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isBlocked, timeLeft]);

  useEffect(() => {
    if (pin.length < 6 || isBlocked) return;
    const currentPin = pin;
    const timer = setTimeout(async () => {
      const success = await login(currentPin);
      if (success) {
        attemptCountRef.current = 0;
        setAttempts(0);
        setError(false);
      } else {
        attemptCountRef.current += 1;
        setAttempts(attemptCountRef.current);
        setPin('');
        if (attemptCountRef.current >= MAX_ATTEMPTS) {
          setIsBlocked(true);
          setTimeLeft(BLOCK_DURATION);
          localStorage.setItem('login_block_until', (Date.now() + (BLOCK_DURATION * 1000)).toString());
          setError(false);
        } else {
          setError(true);
          setTimeout(() => setError(false), 3000);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [pin]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isBlocked) return;
    const val = e.target.value;
    if (/^\d*$/.test(val)) { setPin(val); setError(false); setWarning(''); }
    else { setWarning('⚠️ Solo números'); setTimeout(() => setWarning(''), 2000); }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-rose-bg text-rose-900 relative overflow-hidden font-inter">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-30 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-rose-palo/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-rose-palo-light/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-[min(94vw,440px)] p-[clamp(18px,4.5vmin,55px)] bg-white/90 backdrop-blur-xl rounded-[clamp(20px,4vmin,48px)] shadow-xl border border-rose-border z-10 relative">
        <div className="flex flex-col items-center mb-[clamp(18px,4.5vmin,55px)]">
          <div className="relative flex items-center justify-center mb-[clamp(14px,3.5vmin,46px)]" style={{ width: 'clamp(110px,34vmin,200px)', height: 'clamp(110px,34vmin,200px)' }}>
            <div className="absolute animate-spin" style={{
              top: 'clamp(-4px,-1.2vmin,-10px)', left: 'clamp(-4px,-1.2vmin,-10px)',
              right: 'clamp(-4px,-1.2vmin,-10px)', bottom: 'clamp(-4px,-1.2vmin,-10px)',
              borderRadius: '100%',
              background: 'conic-gradient(from 0deg, #ffffff 0%, #e11d48 25%, #ffffff 50%, #e11d48 75%, #ffffff 100%)',
              animationDuration: '3s',
            }} />
            <div className="absolute inset-0 rounded-full bg-rose-palo/20 animate-pulse opacity-60" />
            <div className="w-full h-full rounded-full bg-white/90 shadow-2xl border-[clamp(3px,0.6vmin,5px)] border-white/80 relative z-10 overflow-hidden">
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-rose-palo to-rose-palo-dark">
                  <Scissors style={{ width: 'clamp(28px,7vmin,56px)', height: 'clamp(28px,7vmin,56px)' }} className="text-white" />
                </div>
              )}
            </div>
          </div>
          <h1 className="text-[clamp(18px,5vmin,30px)] font-black tracking-tighter text-center text-rose-900 uppercase">{config.salonName || 'Mi Salón'}</h1>
          <p className="text-rose-400 mt-[clamp(4px,0.8vmin,10px)] text-[clamp(9px,2.5vmin,11px)] font-black uppercase tracking-[0.3em]">Acceso Restringido</p>
        </div>

        <div className="space-y-[clamp(12px,3vmin,42px)]">
          <div className="relative">
            <input
              type="password"
              inputMode="numeric"
              value={pin}
              onChange={handlePinChange}
              disabled={isBlocked}
              className={`w-full text-center text-[clamp(24px,6vmin,40px)] tracking-[0.4em] py-[clamp(12px,3vmin,32px)] bg-rose-muted border rounded-[clamp(10px,2vmin,18px)] focus:outline-none transition-all shadow-inner font-mono ${isBlocked
                  ? 'border-destructive/50 text-rose-300'
                  : error
                    ? 'border-destructive ring-4 ring-destructive/10'
                    : 'border-rose-border focus:border-rose-palo focus:ring-4 focus:ring-rose-palo/10'
                }`}
              maxLength={6}
              placeholder="••••••"
              autoFocus
            />
            <div className="absolute -bottom-7 left-0 w-full text-center h-6">
              {warning && <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">{warning}</span>}
              {error && !isBlocked && <span className="text-destructive text-[10px] font-black uppercase tracking-widest">PIN Incorrecto</span>}
            </div>
          </div>

          {isBlocked && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-[clamp(10px,2vmin,18px)] p-[clamp(10px,2.5vmin,28px)] text-center">
              <Timer className="text-destructive mx-auto mb-[clamp(6px,1.2vmin,10px)]" style={{ width: 'clamp(18px,5vmin,28px)', height: 'clamp(18px,5vmin,28px)' }} />
              <p className="text-destructive text-[clamp(9px,2.5vmin,11px)] font-black uppercase tracking-widest">Sistema Bloqueado</p>
              <p className="text-rose-900 font-mono text-[clamp(18px,5vmin,28px)] mt-[clamp(3px,0.6vmin,5px)] font-black">{timeLeft}s</p>
            </div>
          )}
        </div>

        <div className="mt-[clamp(24px,6vmin,64px)] pt-[clamp(12px,3vmin,40px)] border-t border-rose-border/50 text-center">
          <p className="text-[clamp(7px,1.8vmin,9px)] font-bold text-rose-400 uppercase tracking-[0.4em]">LuckyApps by Omar Duarte</p>
        </div>
      </div>
    </div>
  );
};
