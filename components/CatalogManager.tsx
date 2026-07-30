import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useBarber } from '../context/BarberContext';
import { useCatalog } from '../context/CatalogContext';
import { useSales } from '../context/SalesContext';
import { useInventory } from '../context/InventoryContext';
import {
  Search, Plus, Edit, X, Scissors, Package, Layers,
  Info, CheckCircle2, Tag, DollarSign, PlusCircle, List, LayoutGrid, Trash2, ChevronLeft
} from 'lucide-react';
import { CatalogItem, ItemType } from '../types';
import { useDragScroll } from '../hooks/useDragScroll';

export const CatalogManager = () => {
  const { catalog, addItem, updateItem, removeItem, categories, addCategory, updateCategory, removeCategory } = useCatalog();
  const { sales } = useSales();
  const { inventoryMovements, stocks } = useInventory();
  const { showToast } = useBarber();

  const mainScroll = useDragScroll();
  const detailScroll = useDragScroll();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | ItemType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);

  // no auto-select

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [type, setType] = useState<ItemType>('service');
  const [category, setCategory] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return catalog.filter(item => {
      if (!item) return false;
      const name = item.name || '';
      const cat = item.category || '';
      const matchesSearch = name.toLowerCase().includes(lower) || cat.toLowerCase().includes(lower);
      const matchesFilter = activeFilter === 'all' || item.type === activeFilter;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => (a?.name || '').localeCompare(b?.name || ''));
  }, [catalog, search, activeFilter]);

  const selectedItem = useMemo(() => catalog.find(i => i.id === selectedId) || null, [catalog, selectedId]);

  const isItemUsed = (id: string) => {
    const hasSales = sales.some(s => s.items?.some(i => i.itemId === id));
    const hasMovements = inventoryMovements.some(m => m.itemId === id);
    const hasStock = stocks.some(s => s.itemId === id && s.stock !== 0);
    return hasSales || hasMovements || hasStock;
  };

  const handleDeleteItem = (item: CatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isItemUsed(item.id)) {
      showToast('warning', 'No se puede eliminar', `${item.name} tiene historial. Desactívalo en su lugar.`);
      return;
    }
    if (window.confirm(`¿Eliminar "${item.name}" permanentemente?`)) {
      removeItem(item.id);
      if (selectedId === item.id) { setSelectedId(null); setShowDetail(false); }
    }
  };

  const handleOpenModal = (item?: CatalogItem) => {
    setIsCreatingCategory(false); setNewCategoryName('');
    if (item) { setEditingItem(item); setName(item.name); setPrice(item.price.toString()); setType(item.type); setCategory(item.category); }
    else { setEditingItem(null); setName(''); setPrice(''); setType('service'); setCategory(categories[0] ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : 'General'); }
    setIsModalOpen(true);
  };

  const handleToggleActive = (item: CatalogItem, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem({ ...item, active: !item.active });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    let finalCategory = category;
    if (isCreatingCategory && newCategoryName.trim()) { finalCategory = newCategoryName.trim(); addCategory(finalCategory); }
    const payload: CatalogItem = {
      id: editingItem?.id || crypto.randomUUID(), name, price: parseFloat(price), type, category: finalCategory,
      active: editingItem ? editingItem.active : true, comboDefinition: editingItem?.comboDefinition
    };
    if (editingItem) updateItem(payload);
    else addItem(payload);
    setIsModalOpen(false);
    showToast('success', editingItem ? 'Item Actualizado' : 'Item Creado', name);
  };

  const filterCounts = {
    all: catalog.length, service: catalog.filter(i => i.type === 'service').length,
    product: catalog.filter(i => i.type === 'product').length, combo: catalog.filter(i => i.type === 'combo').length,
  };

  const selectItem = (id: string) => {
    setSelectedId(id);
    if (window.innerWidth < 1024) setShowDetail(true);
  };

  return (
    <div className="h-full flex flex-col bg-rose-bg overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="px-[clamp(8px,2vmin,24px)] py-[clamp(8px,2vmin,20px)] border-b border-rose-border bg-rose-bg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-[clamp(4px,1vmin,12px)] shrink-0">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-[clamp(4px,1vmin,12px)] w-full sm:w-auto">
          <div className="relative w-full sm:w-[clamp(160px,30vmin,320px)]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" size={14} />
            <input value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-white border border-rose-border rounded-xl py-[clamp(6px,1.5vmin,12px)] pl-9 pr-3 text-[clamp(10px,2vmin,13px)] text-rose-900 focus:border-rose-palo outline-none transition-all shadow-inner" placeholder="Buscar..." />
          </div>
          <div className="flex bg-white p-1 rounded-xl border border-rose-border overflow-x-auto">
            <FilterBtn active={activeFilter==="all"} onClick={() => setActiveFilter("all")} label="Todos" count={filterCounts.all} />
            <FilterBtn active={activeFilter==="service"} onClick={() => setActiveFilter("service")} label="Servicios" count={filterCounts.service} />
            <FilterBtn active={activeFilter==="product"} onClick={() => setActiveFilter("product")} label="Productos" count={filterCounts.product} />
            <FilterBtn active={activeFilter==="combo"} onClick={() => setActiveFilter("combo")} label="Combos" count={filterCounts.combo} />
          </div>
        </div>
        <button onClick={() => handleOpenModal()} className="w-full sm:w-auto bg-pink-600 hover:bg-pink-500 text-white px-[clamp(12px,3vmin,32px)] py-[clamp(6px,1.5vmin,12px)] rounded-xl font-black text-[clamp(9px,2vmin,10px)] uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all border-b-4 border-pink-800 active:border-b-0">
          <Plus size={14} /> Nuevo Item
        </button>
      </div>
      {/* Table + Detail */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        <div className="flex-[3] flex flex-col min-w-0 border-r border-rose-border bg-rose-muted/10 overflow-hidden">
          <div className="flex-1 px-[clamp(4px,1vmin,24px)] pb-[clamp(4px,1vmin,24px)] min-h-0">
            <div
              ref={mainScroll.ref}
              {...mainScroll.props}
              className="bg-white rounded-xl lg:rounded-[2.5rem] border border-rose-border shadow-2xl overflow-y-auto hide-scrollbar h-full cursor-grab active:cursor-grabbing"
            >
               <table className="w-full text-left border-collapse min-w-full">
                <thead className="bg-white text-rose-400 font-black uppercase text-[10px] sm:text-[11px] border-b border-rose-border tracking-[0.15em] sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="p-2 sm:p-3 lg:p-4 w-12 sm:w-16 text-center">Estado</th>
                    <th className="p-2 sm:p-3 lg:p-4">Nombre / Tipo</th>
                    <th className="p-2 sm:p-3 lg:p-4 hidden sm:table-cell">Categoria</th>
                    <th className="p-2 sm:p-3 lg:p-4 text-right">Precio</th>
                    <th className="p-2 sm:p-3 lg:p-4 w-20 sm:w-24 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-border">
                  {filtered.length === 0 ? (
                    <tr><td colSpan={5} className="p-8 sm:p-12 lg:p-16 text-center text-rose-400 italic font-black uppercase opacity-30">Sin resultados</td></tr>
                  ) : filtered.map(item => (
                    <tr key={item.id} onClick={() => selectItem(item.id)} className={"group cursor-pointer transition-all " + (selectedId === item.id ? "bg-pink-600/10" : "hover:bg-rose-muted")}>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <div className="flex justify-center">
                          <button onClick={(e) => handleToggleActive(item, e)} className={"w-9 h-5 rounded-full relative transition-all duration-300 " + (item.active ? "bg-emerald-600" : "bg-rose-muted")}>
                            <div className={"absolute top-1 w-3 h-3 bg-white rounded-full shadow-md transition-all duration-300 " + (item.active ? "left-[14px]" : "left-1")} />
                          </button>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <div className="flex items-center gap-2">
                          <div className={"w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center shadow-lg shrink-0 " + (item.type === "service" ? "bg-blue-600/10 text-blue-500" : item.type === "combo" ? "bg-indigo-600/10 text-indigo-500" : "bg-amber-600/10 text-amber-500")}>
                            {item.type === "service" ? <Scissors size={12} /> : item.type === "combo" ? <Layers size={12} /> : <Package size={12} />}
                          </div>
                          <div className="min-w-0"><div className="font-black text-rose-900 text-xs sm:text-sm uppercase truncate">{item.name}</div><div className="text-[10px] font-black uppercase text-rose-400">{item.type}</div></div>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 lg:p-4 hidden sm:table-cell"><span className="text-[10px] sm:text-[11px] font-black text-rose-500 uppercase bg-white px-2 py-1 rounded-lg border">{item.category}</span></td>
                      <td className="p-2 sm:p-3 lg:p-4 text-right"><div className="text-sm sm:text-base font-black text-rose-900 tracking-tighter font-mono">${item.price.toFixed(2)}</div></td>
                      <td className="p-2 sm:p-3 lg:p-4">
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <button onClick={(e) => { e.stopPropagation(); handleOpenModal(item); }} className="p-1.5 bg-rose-muted text-rose-500 hover:bg-white hover:text-rose-900 rounded-lg transition-all shadow-lg"><Edit size={11} /></button>
                          <button onClick={(e) => handleDeleteItem(item, e)} className="p-1.5 bg-rose-muted text-rose-700 hover:bg-destructive hover:text-white rounded-lg transition-all shadow-lg"><Trash2 size={11} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        {selectedItem && (<div className="hidden lg:flex flex-1 bg-white flex-col shadow-2xl overflow-y-auto">
          <DetailPanel item={selectedItem} catalog={catalog} onEdit={handleOpenModal} onDelete={handleDeleteItem} />
        </div>)}
        {!selectedItem && (<div className="hidden lg:flex flex-1 bg-white flex-col items-center justify-center text-rose-400 opacity-30"><LayoutGrid size={40} strokeWidth={0.5} /><span className="text-[clamp(9px,2vmin,11px)] font-black uppercase tracking-[0.5em] mt-4">SELECCIONA UN ITEM</span></div>)}
      </div>
      {showDetail && selectedItem && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDetail(false)} />
          <div className="absolute inset-y-0 right-0 w-[85vw] max-w-sm bg-white shadow-2xl overflow-y-auto">
            <div className="sticky top-0 bg-white p-2 border-b"><button onClick={() => setShowDetail(false)} className="flex items-center gap-1 text-rose-500 font-black text-[10px] uppercase"><ChevronLeft size={16} /> Volver</button></div>
            <DetailPanel item={selectedItem} catalog={catalog} onEdit={handleOpenModal} onDelete={handleDeleteItem} />
          </div>
        </div>
      )}
      {isModalOpen && (
        <ItemFormModal
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
          initialData={editingItem} categories={categories}
          isCreatingCategory={isCreatingCategory} setIsCreatingCategory={setIsCreatingCategory}
          newCategoryName={newCategoryName} setNewCategoryName={setNewCategoryName}
          addCategory={addCategory} updateCategory={updateCategory} removeCategory={removeCategory}
          onSave={(item, isEdit) => { if (isEdit) updateItem(item); else addItem(item); setIsModalOpen(false); }}
          fullCatalog={catalog}
        />
      )}
    </div>
  );
};
const DetailPanel = ({ item, catalog, onEdit, onDelete }: { item: CatalogItem; catalog: CatalogItem[]; onEdit: (i: CatalogItem) => void; onDelete: (i: CatalogItem, e: React.MouseEvent) => void }) => (
  <div className="flex-1 flex flex-col p-[clamp(8px,2vmin,20px)]">
    <div className="flex justify-between items-start mb-[clamp(8px,2vmin,20px)]">
      <div className={`p-[clamp(8px,2vmin,16px)] rounded-[clamp(12px,2vmin,20px)] shadow-2xl ${item.type === 'service' ? 'bg-blue-600 text-white' : item.type === 'combo' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'}`}>
        {item.type === 'service' ? <Scissors size={14} /> : item.type === 'combo' ? <Layers size={14} /> : <Package size={14} />}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className={`text-[clamp(7px,1.2vmin,8px)] font-black uppercase px-1.5 py-0.5 rounded-full border shadow-sm ${item.active ? 'bg-emerald-950 text-emerald-400 border-emerald-800' : 'bg-destructive/20 text-destructive border-destructive'}`}>{item.active ? 'ON' : 'OFF'}</span>
        <div className="flex gap-1">
          <button onClick={() => onEdit(item)} className="flex items-center gap-1 text-rose-500 hover:text-rose-900 font-black text-[clamp(8px,1.5vmin,9px)] uppercase bg-rose-muted px-2 py-1 rounded-lg"><Edit size={8} /> Editar</button>
          <button onClick={(e) => onDelete(item, e)} className="flex items-center gap-1 text-rose-700 hover:text-destructive font-black text-[clamp(8px,1.5vmin,9px)] uppercase bg-rose-muted px-2 py-1 rounded-lg"><Trash2 size={8} /> Borrar</button>
        </div>
      </div>
    </div>
    <div className="mb-[clamp(8px,2vmin,20px)]">
      <div className="flex items-center gap-1 text-rose-500 mb-1"><Tag size={10} /><span className="text-[clamp(8px,1.5vmin,9px)] font-black uppercase">{item.category}</span></div>
      <h2 className="text-[clamp(14px,3.5vmin,22px)] font-black text-rose-900 uppercase tracking-tight leading-[0.9]">{item.name}</h2>
      {item.sku && <div className="mt-1 text-[clamp(8px,1.5vmin,9px)] font-bold text-rose-400 uppercase font-mono">SKU: {item.sku}</div>}
    </div>
    {item.imageUrl && (
      <div className="mb-[clamp(8px,2vmin,20px)] rounded-[clamp(12px,2vmin,20px)] overflow-hidden border bg-rose-muted/30">
        <img src={item.imageUrl} alt={item.name} className="w-full h-auto max-h-48 object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
      </div>
    )}
    {item.type === 'product' ? (
      <div className="grid grid-cols-2 gap-2 mb-[clamp(8px,2vmin,20px)]">
        <div className="bg-rose-muted rounded-[clamp(12px,2vmin,20px)] p-[clamp(6px,1.5vmin,12px)] border shadow-inner">
          <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase">Costo</span>
          <div className="flex items-baseline gap-1"><span className="text-[clamp(10px,2vmin,12px)] font-black text-rose-400/50 font-mono">$</span><span className="text-[clamp(14px,3vmin,22px)] font-black text-rose-400 font-mono tracking-tighter leading-none">{item.cost?.toFixed(2) || '0.00'}</span></div>
        </div>
        <div className="bg-rose-muted rounded-[clamp(12px,2vmin,20px)] p-[clamp(6px,1.5vmin,12px)] border shadow-inner">
          <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase">Etiqueta</span>
          <div className="flex items-baseline gap-1"><span className="text-[clamp(10px,2vmin,12px)] font-black text-rose-400/50 font-mono">$</span><span className="text-[clamp(14px,3vmin,22px)] font-black text-rose-400 font-mono tracking-tighter leading-none">{item.etiqueta?.toFixed(2) || '0.00'}</span></div>
        </div>
        <div className="bg-rose-muted rounded-[clamp(12px,2vmin,20px)] p-[clamp(6px,1.5vmin,12px)] border shadow-inner">
          <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase">Sugerido</span>
          <div className="flex items-baseline gap-1"><span className="text-[clamp(10px,2vmin,12px)] font-black text-rose-400/50 font-mono">$</span><span className="text-[clamp(14px,3vmin,22px)] font-black text-rose-400 font-mono tracking-tighter leading-none">{item.sugerido?.toFixed(2) || '0.00'}</span></div>
        </div>
        <div className="bg-rose-muted rounded-[clamp(12px,2vmin,20px)] p-[clamp(6px,1.5vmin,12px)] border shadow-inner">
          <span className="text-[clamp(7px,1.2vmin,8px)] font-black text-rose-400 uppercase">Precio Venta</span>
          <div className="flex items-baseline gap-1"><span className="text-[clamp(10px,2vmin,12px)] font-black text-emerald-500/50 font-mono">$</span><span className="text-[clamp(14px,3vmin,22px)] font-black text-emerald-500 font-mono tracking-tighter leading-none">{item.price.toFixed(2)}</span></div>
        </div>
      </div>
    ) : (
      <div className="bg-rose-muted rounded-[clamp(12px,2vmin,20px)] p-[clamp(8px,2vmin,16px)] border mb-[clamp(8px,2vmin,20px)] flex flex-col gap-1 shadow-inner">
        <span className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-400 uppercase">PVP</span>
        <div className="flex items-baseline gap-1"><span className="text-[clamp(12px,2.5vmin,16px)] font-black text-emerald-500/50 font-mono">$</span><div className="text-[clamp(20px,5vmin,36px)] font-black text-emerald-500 font-mono tracking-tighter leading-none">{item.price.toFixed(2)}</div></div>
      </div>
    )}
    {item.type === 'combo' && <ComboSection item={item} catalog={catalog} />}
    {item.type !== 'combo' && (
      <div className="mt-auto pt-[clamp(8px,2vmin,16px)] border-t border-rose-border">
        <div className="flex items-center gap-2 p-2 bg-rose-muted/30 rounded-xl border border-rose-border/50">
          <div className="p-2 bg-blue-600/10 text-blue-500 rounded-lg shrink-0"><Info size={12} /></div>
          <div><div className="text-[clamp(8px,1.5vmin,9px)] font-black text-rose-900 uppercase mb-0.5">Stock</div><div className="text-[clamp(7px,1.2vmin,8px)] text-rose-500 font-bold">Afecta inventario.</div></div>
        </div>
      </div>
    )}
  </div>
);

const ComboSection = ({ item, catalog }: { item: CatalogItem; catalog: CatalogItem[] }) => {
  const realTotal = (item.comboDefinition || []).reduce((acc, curr) => { const i = catalog.find(x => x.id === curr); return acc + (i ? i.price : 0); }, 0);
  const savings = realTotal - item.price;
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1 text-rose-500 mb-1"><LayoutGrid size={10} /><span className="text-[clamp(8px,1.5vmin,9px)] font-black uppercase">Contenido</span></div>
      <div className="space-y-1">
        {(item.comboDefinition || []).map((subId, idx) => {
          const subItem = catalog.find(x => x.id === subId);
          if (!subItem) return null;
          return (
            <div key={idx} className="flex items-center gap-2 bg-rose-muted/40 p-2 rounded-xl border group hover:bg-rose-muted transition-all">
              <div className="w-6 h-6 rounded-lg bg-rose-bg flex items-center justify-center text-rose-400 shrink-0">{subItem.type === 'service' ? <Scissors size={8} /> : <Package size={8} />}</div>
              <div className="flex-1 min-w-0"><div className="text-[clamp(8px,1.5vmin,10px)] font-black text-rose-900 uppercase truncate">{subItem.name}</div><div className="text-[clamp(6px,1.2vmin,7px)] font-bold text-rose-400 uppercase mt-0.5">${subItem.price.toFixed(2)}</div></div>
              <CheckCircle2 size={10} className="text-emerald-500 opacity-40 group-hover:opacity-100 transition-opacity shrink-0" />
            </div>
          );
        })}
        {(item.comboDefinition || []).length === 0 && <div className="p-2 rounded-xl bg-rose-muted/20 border border-dashed text-center text-rose-400 text-[clamp(7px,1.2vmin,8px)] uppercase font-bold">Vacio</div>}
        {savings > 0 && <div className="p-2 rounded-xl bg-emerald-900/10 border border-emerald-900/20 flex justify-between items-center"><span className="text-[clamp(7px,1.2vmin,8px)] font-black text-emerald-600 uppercase">Ahorro</span><span className="text-emerald-400 font-mono font-black text-[clamp(8px,1.5vmin,10px)]">${savings.toFixed(2)} ({((savings / realTotal) * 100).toFixed(0)}%)</span></div>}
      </div>
    </div>
  );
};

const ItemFormModal = ({ isOpen, onClose, initialData, categories, isCreatingCategory, setIsCreatingCategory, newCategoryName, setNewCategoryName, addCategory, updateCategory, removeCategory, onSave, fullCatalog }: any) => {
  const [name, setName] = useState(initialData?.name || '');
  const [price, setPrice] = useState(initialData?.price.toString() || '');
  const [type, setType] = useState<ItemType>(initialData?.type || 'service');
  const [category, setCategory] = useState(initialData?.category || (categories[0] ? (typeof categories[0] === 'string' ? categories[0] : categories[0].name) : '') || 'General');
  const [etiqueta, setEtiqueta] = useState(initialData?.etiqueta?.toString() || '');
  const [sugerido, setSugerido] = useState(initialData?.sugerido?.toString() || '');
  const [imageUrl, setImageUrl] = useState(initialData?.imageUrl || (initialData as any)?.image_url || '');
  const [sku, setSku] = useState(initialData?.sku || (initialData as any)?.sku || '');
  const [comboItems, setComboItems] = useState<string[]>(initialData?.comboDefinition || []);
  const [comboSearch, setComboSearch] = useState('');
  const [showManageCategories, setShowManageCategories] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !price) return;
    let finalCategory = category;
    let finalCategoryId = initialData?.categoryId || '';
    if (isCreatingCategory && newCategoryName.trim()) { finalCategory = newCategoryName.trim(); addCategory(finalCategory); }
    const catObj = categories.find((c: any) => c.name === finalCategory);
    if (catObj) finalCategoryId = catObj.id;
    onSave({ id: initialData?.id || crypto.randomUUID(), name, price: parseFloat(price), type, category: finalCategory, categoryId: finalCategoryId, active: initialData ? initialData.active : true, cost: initialData?.cost || 0, etiqueta: parseFloat(etiqueta) || 0, sugerido: parseFloat(sugerido) || 0, imageUrl: imageUrl || undefined, sku: sku || undefined, comboDefinition: type === 'combo' ? comboItems : undefined }, !!initialData);
  };
  const comboRealTotal = useMemo(() => comboItems.reduce((acc, curr) => { const item = fullCatalog.find((i: any) => i.id === curr); return acc + (item ? item.price : 0); }, 0), [comboItems, fullCatalog]);
  const savings = comboRealTotal - (parseFloat(price) || 0);
  const availableItems = useMemo(() => {
    if (!comboSearch) return [];
    return fullCatalog.filter((i: any) => i.type !== 'combo' && (i.name.toLowerCase().includes(comboSearch.toLowerCase()) || (i.category || '').toLowerCase().includes(comboSearch.toLowerCase()))).slice(0, 5);
  }, [fullCatalog, comboSearch]);
  if (!isOpen) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[500] bg-rose-bg/95 backdrop-blur-xl flex items-center justify-center p-[clamp(8px,2vmin,16px)]">
      <div className="bg-white border border-rose-border w-full max-w-[min(90vw,500px)] rounded-[clamp(16px,3vmin,40px)] shadow-2xl overflow-hidden animate-in zoom-in duration-200 max-h-[90vh] flex flex-col">
        <div className="p-[clamp(12px,3vmin,20px)] border-b bg-rose-bg flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4"><div className="bg-pink-600/20 p-2.5 rounded-xl text-pink-500 shadow-lg shrink-0">{initialData ? <Edit size={16} /> : <Plus size={16} />}</div><h2 className="text-[clamp(14px,3.5vmin,18px)] font-black text-rose-900 uppercase">{initialData ? 'Editar' : 'Nuevo'}</h2></div>
          <button onClick={onClose} className="p-2 bg-rose-muted text-rose-500 hover:text-rose-900 rounded-full"><X size={14} /></button>
        </div>
        <form onSubmit={handleSave} className="p-[clamp(12px,3vmin,24px)] space-y-[clamp(8px,2vmin,16px)] overflow-y-auto">
          <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Nombre</label><input required value={name} onChange={e => setName(e.target.value)} className="w-full bg-white border rounded-xl p-3 text-rose-900 font-black text-sm outline-none focus:border-rose-palo shadow-inner" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Tipo</label>
              <select value={type} onChange={e => setType(e.target.value as ItemType)} className="w-full h-[48px] bg-white border rounded-xl px-4 text-rose-900 font-black uppercase text-[10px] outline-none appearance-none cursor-pointer shadow-inner">
                <option value="service">Servicio</option><option value="product">Producto</option><option value="combo">Combo</option>
              </select></div>
            <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Categoria</label><div className="relative">
              {isCreatingCategory ? (
                <div className="flex gap-2"><input autoFocus value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} className="w-full h-[48px] bg-rose-bg border border-rose-palo/50 rounded-xl px-4 text-rose-900 font-black text-[10px] outline-none uppercase" placeholder="NUEVA..." /><button type="button" onClick={() => setIsCreatingCategory(false)} className="absolute right-2 top-1 bottom-1 aspect-square bg-rose-muted rounded-lg text-rose-500"><X size={12} /></button></div>
              ) : (
                <><select value={category} onChange={e => setCategory(e.target.value)} className="w-full h-[48px] bg-white border rounded-xl px-4 text-rose-900 font-black uppercase text-[10px] outline-none appearance-none cursor-pointer shadow-inner">{categories.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}</select>
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1"><button type="button" onClick={() => setIsCreatingCategory(true)} className="p-1.5 bg-white rounded-lg text-rose-500 border"><Plus size={12} /></button><button type="button" onClick={() => setShowManageCategories(true)} className="p-1.5 bg-white rounded-lg text-rose-500 border"><Edit size={12} /></button></div>
                </>
              )}
            </div></div>
          </div>
          {type === 'combo' && (
            <div className="bg-rose-bg/50 border rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-400 mb-1"><Layers size={12} /><span className="text-[9px] font-black uppercase">Combo</span></div>
              <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-400" size={10} />
                <input value={comboSearch} onChange={e => setComboSearch(e.target.value)} placeholder="Buscar items..." className="w-full bg-white border rounded-xl py-2.5 pl-9 pr-3 text-[10px] text-rose-900 font-bold outline-none focus:border-rose-palo" />
                {comboSearch && availableItems.length > 0 && (<div className="absolute top-full left-0 w-full mt-2 bg-white border rounded-xl shadow-2xl z-50">{availableItems.map((i: any) => (<button key={i.id} type="button" onClick={() => { setComboItems([...comboItems, i.id]); setComboSearch(''); }} className="w-full p-2.5 text-left hover:bg-rose-palo/20 border-b last:border-0 flex justify-between group"><span className="text-[9px] font-bold text-rose-900 uppercase">{i.name}</span><span className="text-[9px] font-mono text-rose-500">${i.price.toFixed(2)}</span></button>))}</div>)}
              </div>
              <div className="space-y-1 max-h-32 overflow-y-auto">{comboItems.length === 0 && <div className="text-center p-2 text-[9px] text-rose-400 italic">Agrega items...</div>}
                {comboItems.map((id, idx) => { const it = fullCatalog.find((i: any) => i.id === id); if (!it) return null; return (<div key={idx} className="bg-white border p-1.5 rounded-lg flex justify-between items-center"><div className="flex items-center gap-2"><div className="w-5 h-5 rounded bg-rose-bg flex items-center justify-center text-rose-400">{it.type === 'service' ? <Scissors size={8} /> : <Package size={8} />}</div><span className="text-[9px] font-bold text-rose-900 uppercase">{it.name}</span></div><div className="flex items-center gap-2"><span className="text-[9px] font-mono text-rose-500">${it.price.toFixed(2)}</span><button type="button" onClick={() => setComboItems(prev => prev.filter((_, i) => i !== idx))} className="text-rose-400 hover:text-destructive"><X size={10} /></button></div></div>); })}
              </div>
              {comboItems.length > 0 && <div className="pt-2 border-t flex justify-between items-center px-1"><span className="text-[9px] font-black text-rose-500 uppercase">Valor Real:</span><span className="text-[10px] font-mono font-black text-rose-500 line-through">${comboRealTotal.toFixed(2)}</span></div>}
            </div>
          )}
          {type === 'product' ? (
            <><div className="grid grid-cols-2 gap-3">
              <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Costo</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-400 font-black text-lg font-mono">$</span>
                  <input disabled value={initialData?.cost?.toFixed(2) || '0.00'} className="w-full bg-rose-muted/50 border rounded-xl py-3 pl-10 pr-4 text-rose-400 font-mono font-black text-xl shadow-inner text-right cursor-not-allowed" />
                </div>
              </div>
              <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Etiqueta</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-700 font-black text-lg font-mono">$</span>
                  <input type="number" step="0.01" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} className="w-full bg-white border rounded-xl py-3 pl-10 pr-4 text-rose-900 outline-none focus:border-rose-palo font-mono font-black text-xl shadow-inner text-right" placeholder="0.00" />
                </div>
              </div>
              <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Sugerido</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-700 font-black text-lg font-mono">$</span>
                  <input type="number" step="0.01" value={sugerido} onChange={e => setSugerido(e.target.value)} className="w-full bg-white border rounded-xl py-3 pl-10 pr-4 text-rose-900 outline-none focus:border-rose-palo font-mono font-black text-xl shadow-inner text-right" placeholder="0.00" />
                </div>
              </div>
              <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Precio Venta</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-700 font-black text-lg font-mono">$</span>
                  <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white border rounded-xl py-3 pl-10 pr-4 text-rose-900 outline-none focus:border-rose-palo font-mono font-black text-xl shadow-inner text-right" placeholder="0.00" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">Imagen (URL)</label>
                <input type="url" value={imageUrl} onChange={e => setImageUrl(e.target.value)} className="w-full bg-white border rounded-xl py-3 px-4 text-rose-900 outline-none focus:border-rose-palo font-bold text-xs shadow-inner" placeholder="https://ejemplo.com/imagen.jpg" />
              </div>
              <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">SKU / Código</label>
                <input value={sku} onChange={e => setSku(e.target.value)} className="w-full bg-white border rounded-xl py-3 px-4 text-rose-900 outline-none focus:border-rose-palo font-bold text-xs shadow-inner uppercase" placeholder="PROD-001" />
              </div>
              <div className="flex items-end">
                {imageUrl && (
                  <div className="w-full h-32 rounded-xl overflow-hidden border bg-rose-muted/30 flex items-center justify-center">
                    <img src={imageUrl} alt="preview" className="h-full object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                  </div>
                )}
              </div>
            </div>
          </>
          ) : (
            <div><label className="text-[9px] font-black text-rose-500 uppercase block mb-1">{type === 'combo' ? 'Precio Oferta' : 'Precio PVP'}</label>
              <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-700 font-black text-lg font-mono">$</span>
                <input required type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full bg-white border rounded-xl py-3 pl-10 pr-4 text-rose-900 outline-none focus:border-rose-palo font-mono font-black text-xl shadow-inner text-right" placeholder="0.00" />
              </div>
              {type === 'combo' && savings > 0 && <div className="mt-2 text-right"><span className="text-xs font-black text-emerald-400 uppercase bg-emerald-950/50 border border-emerald-900/50 px-3 py-1.5 rounded-lg inline-flex items-center gap-2 shadow-lg">Ahorro: ${savings.toFixed(2)} ({((savings / comboRealTotal) * 100).toFixed(0)}%)</span></div>}
            </div>
          )}
          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 bg-rose-muted text-rose-500 hover:text-rose-900 py-4 rounded-xl font-black uppercase text-[10px] transition-all">Cerrar</button>
            <button type="submit" className="flex-[1.5] bg-pink-600 hover:bg-pink-500 text-white py-4 rounded-xl font-black uppercase text-[10px] shadow-xl active:scale-95 transition-all border-b-4 border-pink-800">{initialData ? 'Guardar' : 'Registrar'}</button>
          </div>
        </form>
      </div>
      {showManageCategories && (
        <div className="fixed inset-0 z-[600] bg-rose-bg/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border rounded-[2rem] shadow-xl w-full max-w-sm overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center bg-rose-muted/30"><h3 className="text-sm font-black text-rose-900 uppercase">Categorias</h3><button onClick={() => { setShowManageCategories(false); setEditingCategory(null); }} className="p-1.5 bg-white rounded-lg text-rose-500 border"><X size={14} /></button></div>
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {categories.length === 0 && <div className="text-center p-6 text-rose-400 text-[10px] font-black uppercase">Sin categorias</div>}
              {categories.map((cat: any) => (<div key={cat.id} className="flex items-center gap-2 bg-rose-muted/50 p-2 rounded-xl border group">
                {editingCategory?.oldName === cat.name ? (
                  <input autoFocus value={editingCategory.newName} onChange={e => setEditingCategory({ ...editingCategory, newName: e.target.value })} onKeyDown={e => { if (e.key === 'Enter' && editingCategory.newName.trim()) { updateCategory(cat.name, editingCategory.newName.trim()).then(ok => { if (ok) setEditingCategory(null); }); } if (e.key === 'Escape') setEditingCategory(null); }} className="flex-1 bg-white border border-rose-palo rounded-lg px-3 py-1.5 text-xs font-bold text-rose-900 outline-none uppercase" />
                ) : (<span className="flex-1 text-xs font-bold text-rose-900 uppercase px-2">{cat.name}</span>)}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {editingCategory?.oldName === cat.name ? (
                    <button type="button" onClick={() => { if (editingCategory.newName.trim()) { updateCategory(cat.name, editingCategory.newName.trim()).then(ok => { if (ok) setEditingCategory(null); }); } }} className="p-1.5 bg-emerald-500 text-white rounded-lg"><CheckCircle2 size={12} /></button>
                  ) : (<button type="button" onClick={() => setEditingCategory({ oldName: cat.name, newName: cat.name })} className="p-1.5 bg-white rounded-lg text-rose-500 border"><Edit size={12} /></button>)}
                  <button type="button" onClick={() => { const used = fullCatalog.filter((i: any) => i.category === cat.name); if (used.length > 0 && !confirm('Eliminar?')) return; removeCategory(cat.name); }} className="p-1.5 bg-white rounded-lg text-rose-400 hover:text-destructive border"><Trash2 size={12} /></button>
                </div>
              </div>))}
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};

const FilterBtn = ({ active, onClick, label, count }: { active: boolean; onClick: () => void; label: string; count: number }) => (
  <button onClick={onClick} className={`px-[clamp(6px,1.5vmin,16px)] py-[clamp(4px,1vmin,8px)] rounded-lg sm:rounded-xl text-[clamp(8px,1.5vmin,9px)] font-black uppercase tracking-widest transition-all flex items-center gap-1 sm:gap-2 whitespace-nowrap ${active ? 'bg-rose-muted text-rose-900 shadow-lg border border-rose-border' : 'text-rose-500 hover:text-rose-900'}`}>{label}<span className={`px-1 sm:px-1.5 py-0.5 rounded-md text-[clamp(7px,1.5vmin,8px)] ${active ? 'bg-pink-600 text-white' : 'bg-rose-bg text-rose-500'}`}>{count}</span></button>
);
