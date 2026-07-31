import React, { useState, useRef, useEffect } from 'react';
import { Search, Package, Scissors, Layers, DollarSign, Store, ImageIcon, AlertCircle, X, Tag } from 'lucide-react';
import { useBarber } from '../context/BarberContext';

export const ConsultarProducto = () => {
  const { catalog, stocks, branches } = useBarber();
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const lower = searchQuery.toLowerCase().trim();
  const results = lower
    ? catalog.filter(p =>
        (p.name || '').toLowerCase().includes(lower) ||
        (p.sku || '').toLowerCase().includes(lower) ||
        (p.category || '').toLowerCase().includes(lower)
      ).slice(0, 12)
    : [];

  const selectItem = (p: any) => {
    setSelected(p);
    setSearchQuery(p.name);
    setShowDropdown(false);
  };

  const PriceCard = ({ label, value, sub, color, border }: any) => (
    <div className={`bg-white rounded-[clamp(10px,2vmin,18px)] p-[clamp(10px,2vmin,20px)] border shadow-md text-center ${border || 'border-rose-border'}`}>
      <div className="text-[clamp(7px,1.2vmin,9px)] font-black uppercase tracking-widest text-rose-400 mb-[clamp(2px,0.5vmin,4px)]">{label}</div>
      <div className={`text-[clamp(16px,3.5vmin,26px)] font-black font-mono tracking-tighter leading-none ${color || 'text-rose-900'}`}>{value}</div>
      {sub && <div className="text-[clamp(6px,1vmin,8px)] font-bold text-rose-400 uppercase tracking-widest mt-[clamp(2px,0.5vmin,4px)]">{sub}</div>}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-rose-bg overflow-hidden animate-in fade-in duration-500">
      <div className="px-[clamp(12px,3vmin,32px)] py-[clamp(12px,3vmin,24px)] border-b border-rose-border bg-rose-bg shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-[clamp(8px,2vmin,12px)] bg-rose-palo/15 rounded-xl text-rose-palo-dark shadow-lg shrink-0">
            <Search size={16} />
          </div>
          <div>
            <h1 className="text-[clamp(16px,3.5vmin,24px)] font-black text-rose-900 uppercase tracking-tight leading-none">Consultar</h1>
            <p className="text-[clamp(8px,1.5vmin,10px)] font-bold text-rose-400 uppercase tracking-widest mt-1">Busca por nombre, código (SKU) o categoría</p>
          </div>
        </div>

        <div ref={searchRef} className="relative max-w-[clamp(280px,70vmin,600px)] mt-[clamp(10px,2vmin,16px)]">
          <Search className="absolute left-[clamp(12px,2.5vmin,16px)] top-1/2 -translate-y-1/2 text-rose-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowDropdown(true); setSelected(null); }}
            onFocus={() => setShowDropdown(true)}
            onKeyDown={e => {
              if (e.key === 'Enter' && results.length > 0) selectItem(results[0]);
            }}
            placeholder="Nombre, SKU o categoría..."
            autoFocus
            className="w-full bg-white border border-rose-border rounded-[clamp(10px,2vmin,16px)] py-[clamp(8px,2vmin,14px)] pl-[clamp(36px,8vmin,48px)] pr-[clamp(36px,8vmin,48px)] text-[clamp(10px,2vmin,13px)] font-bold text-rose-900 outline-none focus:border-rose-palo transition-all shadow-sm"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => { setSearchQuery(''); setSelected(null); setShowDropdown(true); }}
              className="absolute right-[clamp(8px,2vmin,12px)] top-1/2 -translate-y-1/2 p-[clamp(5px,1.2vmin,8px)] bg-rose-muted hover:bg-destructive hover:text-white text-rose-400 rounded-full transition-all"
            >
              <X size={12} />
            </button>
          )}
          {showDropdown && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-rose-border rounded-[clamp(10px,2vmin,16px)] overflow-hidden shadow-2xl">
              {results.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => selectItem(p)}
                  className="w-full p-3 text-left hover:bg-rose-palo/10 border-b last:border-0 border-rose-border/50 transition-all flex justify-between items-center gap-2"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${p.type === 'service' ? 'bg-blue-600/10 text-blue-500' : p.type === 'combo' ? 'bg-indigo-600/10 text-indigo-500' : 'bg-amber-600/10 text-amber-500'}`}>
                      {p.type === 'service' ? <Scissors size={12} /> : p.type === 'combo' ? <Layers size={12} /> : <Package size={12} />}
                    </div>
                    <span className="text-[clamp(9px,2vmin,11px)] font-black text-rose-900 uppercase truncate">{p.name}</span>
                    {p.sku && <span className="text-[clamp(7px,1.5vmin,9px)] font-bold text-rose-400 uppercase font-mono shrink-0">SKU: {p.sku}</span>}
                  </div>
                  <span className="text-[clamp(9px,2vmin,12px)] font-mono font-black text-emerald-500 shrink-0">${(p.price || 0).toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto hide-scrollbar p-[clamp(12px,3vmin,32px)]">
        {selected ? (
          <div className="max-w-[clamp(320px,80vmin,760px)] bg-white rounded-[clamp(16px,3vmin,28px)] border border-rose-border shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            {selected.imageUrl && (
              <div className="h-[clamp(120px,30vmin,220px)] bg-rose-muted/20 flex items-center justify-center overflow-hidden border-b border-rose-border/50">
                <img src={selected.imageUrl} alt={selected.name} className="max-w-full max-h-full object-contain p-3" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              </div>
            )}
            <div className="p-[clamp(10px,2.5vmin,18px)]">
              <div className="flex justify-between items-start mb-[clamp(8px,2vmin,12px)] gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-1 text-rose-500 mb-1">
                    <Tag size={10} />
                    <span className="text-[clamp(7px,1.5vmin,9px)] font-black uppercase">{selected.category}</span>
                  </div>
                  <h2 className="text-[clamp(16px,4vmin,28px)] font-black text-rose-900 uppercase tracking-tight leading-[0.95]">{selected.name}</h2>
                  {selected.sku && <p className="text-[clamp(8px,1.5vmin,10px)] font-bold text-rose-400 uppercase font-mono mt-1">SKU: {selected.sku}</p>}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className={`text-[clamp(7px,1.5vmin,9px)] font-black uppercase px-2 py-1 rounded-full border shadow-sm ${selected.type === 'service' ? 'bg-blue-600/10 text-blue-500 border-blue-500/20' : selected.type === 'combo' ? 'bg-indigo-600/10 text-indigo-500 border-indigo-500/20' : 'bg-amber-600/10 text-amber-500 border-amber-500/20'}`}>
                    {selected.type === 'service' ? 'Servicio' : selected.type === 'combo' ? 'Combo' : 'Producto'}
                  </span>
                  {selected.isInsumo && <span className="text-[clamp(7px,1.5vmin,9px)] font-black uppercase px-2 py-1 rounded-full border bg-rose-palo/10 text-rose-palo-dark border-rose-palo/30">Insumo</span>}
                </div>
              </div>

              <div className="mb-[clamp(8px,2vmin,14px)]">
                <div className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(4px,1vmin,8px)] flex items-center gap-1.5">
                  <DollarSign size={13} /> Precios
                </div>
                {selected.type === 'product' ? (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(6px,1.5vmin,12px)]">
                    <PriceCard label="Costo" value={`$${(selected.cost || 0).toFixed(2)}`} color="text-rose-400" sub="Lo que cuesta" />
                    <PriceCard label="Etiqueta" value={`$${(selected.etiqueta || 0).toFixed(2)}`} color="text-amber-500" sub="Precio de etiqueta" />
                    <PriceCard label="Sugerido" value={`$${(selected.sugerido || 0).toFixed(2)}`} color="text-blue-500" sub="Precio sugerido" />
                    <PriceCard label="Precio Venta" value={`$${(selected.price || 0).toFixed(2)}`} color="text-emerald-500" border="border-emerald-500/40" sub="Precio actual" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-[clamp(6px,1.5vmin,12px)]">
                    <PriceCard label="Precio Venta" value={`$${(selected.price || 0).toFixed(2)}`} color="text-emerald-500" border="border-emerald-500/40" sub={selected.type === 'combo' ? 'Precio oferta' : 'PVP'} />
                  </div>
                )}
              </div>

              <div>
                <div className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-400 uppercase tracking-widest mb-[clamp(4px,1vmin,8px)] flex items-center gap-1.5">
                  <Store size={13} /> Stock & Margen
                </div>
                {branches.length > 0 || selected.type === 'product' ? (
                  <div className="flex gap-[clamp(4px,1vmin,8px)]">
                    {branches.map(b => {
                      const s = stocks.find(st => st.branchId === b.id && st.itemId === selected.id);
                      const qty = s?.stock || 0;
                      return (
                        <div key={b.id} className="flex-1 min-w-0 bg-rose-muted/40 rounded-xl p-[clamp(6px,1.5vmin,10px)] border border-rose-border/60 text-center flex flex-col items-center justify-center">
                          <div className="text-[clamp(5px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest w-full truncate px-1">{b.name}</div>
                          <div className={`text-[clamp(12px,3vmin,16px)] font-black font-mono leading-none mt-[clamp(2px,0.5vmin,4px)] ${qty > 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            {qty} <span className="text-[clamp(5px,1vmin,7px)]">UN</span>
                          </div>
                        </div>
                      );
                    })}
                    {selected.type === 'product' && (
                      <>
                        <div className={`flex-1 min-w-0 bg-rose-muted/40 rounded-xl p-[clamp(6px,1.5vmin,10px)] border text-center flex flex-col items-center justify-center ${(selected.price - (selected.cost || 0)) >= 0 ? 'border-emerald-500/40' : 'border-destructive/40'}`}>
                          <div className="text-[clamp(5px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Margen</div>
                          <div className={`text-[clamp(12px,3vmin,16px)] font-black font-mono leading-none mt-[clamp(2px,0.5vmin,4px)] ${(selected.price - (selected.cost || 0)) >= 0 ? 'text-emerald-500' : 'text-destructive'}`}>
                            ${((selected.price || 0) - (selected.cost || 0)).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 bg-rose-muted/40 rounded-xl p-[clamp(6px,1.5vmin,10px)] border border-rose-border/60 text-center flex flex-col items-center justify-center">
                          <div className="text-[clamp(5px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">% Costo</div>
                          <div className="text-[clamp(12px,3vmin,16px)] font-black font-mono leading-none mt-[clamp(2px,0.5vmin,4px)] text-rose-palo-dark">
                            {selected.cost ? `${Math.round((((selected.price || 0) - selected.cost) / selected.price) * 100)}%` : '—'}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 bg-rose-muted/40 rounded-xl p-[clamp(6px,1.5vmin,10px)] border border-rose-border/60 text-center flex flex-col items-center justify-center">
                          <div className="text-[clamp(5px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Costo</div>
                          <div className="text-[clamp(12px,3vmin,16px)] font-black font-mono leading-none mt-[clamp(2px,0.5vmin,4px)] text-rose-500">
                            ${(selected.cost || 0).toFixed(2)}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0 bg-rose-muted/40 rounded-xl p-[clamp(6px,1.5vmin,10px)] border border-rose-border/60 text-center flex flex-col items-center justify-center">
                          <div className="text-[clamp(5px,1vmin,7px)] font-black text-rose-400 uppercase tracking-widest">Venta</div>
                          <div className="text-[clamp(12px,3vmin,16px)] font-black font-mono leading-none mt-[clamp(2px,0.5vmin,4px)] text-emerald-500">
                            ${selected.price.toFixed(2)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="p-4 text-center text-rose-400 text-[clamp(8px,1.5vmin,10px)] font-black uppercase bg-rose-muted/30 rounded-xl border border-dashed">
                    <Package size={20} className="opacity-30 mx-auto mb-1" />
                    Sin stock registrado
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-[clamp(320px,80vmin,760px)] border-2 border-dashed border-rose-border/50 rounded-[clamp(16px,3vmin,28px)] p-[clamp(24px,6vmin,64px)] text-center">
            <ImageIcon size={40} strokeWidth={1} className="text-rose-300/40 mx-auto mb-3" />
            <p className="text-[clamp(9px,2vmin,12px)] font-black text-rose-400 uppercase tracking-[0.4em]">Busca un item para consultar</p>
            <p className="text-[clamp(7px,1.5vmin,9px)] text-rose-300 font-bold uppercase mt-2 tracking-widest">Podrás ver precios y stock por sucursal</p>
          </div>
        )}
      </div>
    </div>
  );
};
