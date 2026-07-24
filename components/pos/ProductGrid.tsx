import React from 'react';
import { Search, Eye, Layers, Scissors, Package } from 'lucide-react';
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

export function ProductGrid({
  catalog,
  catalogSearch,
  onSearchChange,
  onAddToCart,
  onShowCombo,
  getStock,
}: ProductGridProps) {
  const scrollRef = useDragScroll();

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

      <div
        ref={scrollRef.ref}
        {...scrollRef.props}
        className="flex-1 p-3 lg:p-4 overflow-y-auto hide-scrollbar bg-rose-muted/10"
      >
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6 gap-2 lg:gap-3 pb-8">
          {catalog.map(item => (
              <div
                key={item.id}
                className={`border rounded-2xl p-2 sm:p-3 transition-all flex flex-col justify-between h-20 sm:h-24 shadow-sm group relative ${
                  item.type === 'combo' ? 'bg-rose-palo/5 border-rose-palo/30' : 'bg-white border-rose-border hover:border-rose-palo-light'
                }`}
              >
                <button onClick={() => onAddToCart(item)} className="absolute inset-0 z-0" />
                <div className="flex justify-between items-start relative z-10 pointer-events-none">
                  <div className="w-full font-black text-rose-700 text-[10px] sm:text-[12px] uppercase truncate mb-0.5 group-hover:text-rose-900 transition-colors text-left leading-tight">
                    {item.name}
                  </div>
                </div>
                <div className="flex-1 flex items-center justify-center w-full relative z-10 pointer-events-none">
                  <div className="text-lg sm:text-xl lg:text-2xl font-black text-rose-palo-dark tracking-tighter font-mono leading-none">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
                <div className="w-full flex justify-between items-center mt-auto relative z-20 pointer-events-none gap-1">
                  <span className={`text-[7px] sm:text-[8px] font-black uppercase px-1.5 sm:px-2 h-4 sm:h-[18px] inline-flex items-center justify-center rounded-full leading-none pt-0.5 ${
                    item.type === 'service' ? 'bg-rose-palo/10 text-rose-palo-dark'
                    : item.type === 'combo' ? 'bg-rose-palo-dark text-white'
                    : 'bg-rose-muted text-rose-500'
                  }`}>
                    {item.type}
                  </span>
                  {item.type === 'combo' ? (
                    <button
                      onClick={(e) => { e.stopPropagation(); onShowCombo(item); }}
                      className="pointer-events-auto cursor-pointer bg-rose-palo p-1 sm:p-1.5 rounded-lg text-white shadow-lg shadow-rose-palo/20 hover:bg-rose-palo-dark transition-all z-50 hover:scale-110 active:scale-90"
                    >
                      <Eye size={12} className="sm:size-[14px]" />
                    </button>
                  ) : item.type === 'product' && (
                    <span className="text-[8px] sm:text-[10px] bg-rose-muted text-rose-500 font-black px-1 sm:px-1.5 h-4 sm:h-[18px] inline-flex items-center justify-center rounded border border-rose-border leading-none pt-0.5">
                      {getStock(item.id)} UN
                    </span>
                  )}
                </div>
              </div>
          ))}
        </div>
      </div>
    </div>
  );
}