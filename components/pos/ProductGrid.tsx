import React, { useState, useCallback } from 'react';
import { Search, Eye, Scissors, Package, X, Maximize2 } from 'lucide-react';
import type { CatalogItem } from '../../types';
import { useDragScroll } from '../../hooks/useDragScroll';

interface ProductGridProps {
  catalog: CatalogItem[];
  catalogSearch: string;
  onSearchChange: (value: string) => void;
  onAddToCart: (item: CatalogItem) => void;
  onShowCombo: (item: CatalogItem) => void;
  getStock: (itemId: string) => number;
}

interface FlyingItem {
  id: number;
  x: number;
  y: number;
  imageUrl: string;
}

export function ProductGrid({
  catalog,
  catalogSearch,
  onSearchChange,
  onAddToCart,
  onShowCombo,
  getStock,
}: ProductGridProps) {
  const scrollRef = useDragScroll();
  const [viewerImage, setViewerImage] = useState<string | null>(null);
  const [flyingItems, setFlyingItems] = useState<FlyingItem[]>([]);
  const [imgError, setImgError] = useState<Set<string>>(new Set());
  let flyId = 0;

  const handleAddToCart = useCallback((e: React.MouseEvent, item: CatalogItem) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const newItem = {
      id: ++flyId,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      imageUrl: item.imageUrl || ''
    };
    setFlyingItems(prev => [...prev, newItem]);
    onAddToCart(item);
    setTimeout(() => {
      setFlyingItems(prev => prev.filter(f => f.id !== newItem.id));
    }, 850);
  }, [onAddToCart]);

  return (
    <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <div className="p-3 lg:p-4 shrink-0 bg-rose-muted/30">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 text-rose-400" size={16} />
          <input
            value={catalogSearch}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full bg-white border border-rose-border rounded-2xl py-2.5 pl-10 pr-4 text-rose-900 outline-none focus:border-rose-palo transition-all text-sm shadow-sm"
            placeholder="BUSCAR EN CATÁLOGO..."
          />
        </div>
      </div>

      <div ref={scrollRef.ref} {...scrollRef.props} className="flex-1 overflow-y-auto hide-scrollbar bg-rose-muted/10 p-3 lg:p-4">
        <div className="space-y-6 pb-8">
          {['service', 'product', 'combo'].map((type) => {
            const items = catalog
              .filter(item => item.type === type && (type !== 'product' || item.sellable !== false))
              .sort((a, b) => a.name.localeCompare(b.name));
            if (items.length === 0) return null;
            const title = type === 'service' ? 'Servicios' : type === 'product' ? 'Productos' : 'Combos';
            return (
              <div key={type}>
                <h3 className="text-xs sm:text-sm font-black uppercase tracking-[0.2em] text-rose-400 mb-2 sm:mb-3 flex items-center gap-2">
                  {type === 'service' ? <Scissors size={14} /> : type === 'product' ? <Package size={14} /> : <Package size={14} />}
                  {title} <span className="text-rose-300">({items.length})</span>
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 lg:gap-3">
                  {items.map(item => {
                    const imgUrl = (item as any).imageUrl || (item as any).image_url || '';
                    const showImage = item.type === 'product' && !!imgUrl && !imgError.has(item.id);
                    return (
                      <div
                        key={item.id}
                        onClick={(e) => handleAddToCart(e, item)}
                        className={`border rounded-xl sm:rounded-2xl overflow-hidden transition-all shadow-sm group relative bg-white cursor-pointer active:scale-[0.97] hover:-translate-y-0.5 hover:shadow-md ${
                          item.type === 'combo' ? 'border-rose-palo/30' : 'border-rose-border hover:border-rose-palo/40'
                        }`}
                      >
                        {showImage ? (
                          <div className="relative bg-rose-muted/20" style={{ aspectRatio: '16/10' }}>
                            <img
                              src={imgUrl}
                              alt={item.name}
                              className="w-full h-full object-contain p-2"
                              loading="lazy"
                              onError={() => setImgError(prev => new Set(prev).add(item.id))}
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); setViewerImage(imgUrl); }}
                              className="absolute top-1.5 right-1.5 p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white hover:scale-110 z-10"
                            >
                              <Maximize2 size={12} className="text-rose-700" />
                            </button>
                          </div>
                        ) : item.type === 'combo' ? (
                          <div className="flex items-center justify-center h-16 sm:h-20 bg-rose-muted/10">
                            <div className="p-2.5 rounded-xl text-indigo-400">
                              <Package size={22} />
                            </div>
                          </div>
                        ) : null}
                        <div className={`${showImage || item.type === 'combo' ? 'p-2 sm:p-3 pt-2.5 sm:pt-3.5' : 'p-3 sm:p-4 pt-3.5 sm:pt-4.5'}`}>
                          <div className="font-black text-rose-700 text-[10px] sm:text-[11px] lg:text-[12px] uppercase truncate mb-0.5 leading-tight">
                            {item.name}
                          </div>
                          <div className="flex items-baseline justify-center gap-1 mb-1.5">
                            <span className="text-xs sm:text-sm lg:text-base font-black text-rose-palo-dark tracking-tighter font-mono">
                              ${item.price.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1">
                            <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 py-0.5 rounded-full leading-none ${
                              item.type === 'service' ? 'bg-rose-palo/15 text-rose-palo-dark'
                              : item.type === 'combo' ? 'bg-pink-600/15 text-pink-700'
                              : 'bg-rose-muted text-rose-500'
                            }`}>
                              {item.type === 'service' ? 'SERVICIO' : item.type === 'combo' ? 'COMBO' : 'PRODUCTO'}
                            </span>
                            {item.type === 'combo' ? (
                              <button
                                onClick={(e) => { e.stopPropagation(); onShowCombo(item); }}
                                className="p-1 bg-indigo-100 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-all"
                              >
                                <Eye size={11} />
                              </button>
                            ) : item.type === 'product' && (
                              <span className="text-[8px] sm:text-[9px] bg-rose-muted text-rose-500 font-black px-1.5 py-0.5 rounded border border-rose-border">
                                {getStock(item.id)} UN
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {viewerImage && (
        <div className="fixed inset-0 z-[999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setViewerImage(null)}>
          <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
            <button onClick={() => setViewerImage(null)} className="absolute -top-3 -right-3 z-10 p-2 bg-white rounded-full shadow-xl text-rose-900 hover:text-rose-500 transition-all">
              <X size={18} />
            </button>
            <img src={viewerImage} alt="preview" className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain" />
          </div>
        </div>
      )}

      {flyingItems.map(item => (
        <div
          key={item.id}
          className="fixed pointer-events-none z-[9999] w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white shadow-2xl border-2 border-white overflow-hidden flex items-center justify-center animate-fly-item"
          style={{
            left: item.x - 24,
            top: item.y - 24,
          }}
        >
          {item.imageUrl ? (
            <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <Package size={16} className="text-rose-400" />
          )}
        </div>
      ))}
    </div>
  );
}