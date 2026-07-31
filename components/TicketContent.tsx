import React from 'react';
import { formatDateTimeES } from '../utils/dates';
import { Sale, CatalogItem, AppConfig, PaymentMethod, User } from '../types';

interface TicketContentProps {
    sale: Sale;
    config: AppConfig;
    catalog: CatalogItem[];
    barbers?: User[];
}

const paymentMethods: Partial<Record<PaymentMethod, string>> = {
    cash: 'Efectivo',
    card: 'Tarjeta',
    transfer: 'Transf.',
    bitcoin: 'Bitcoin'
};

export const TicketContent: React.FC<TicketContentProps> = ({ sale, config, catalog, barbers }) => {
    const estilistas = (sale.barberIds && sale.barberIds.length > 0 ? sale.barberIds : (sale.barberId ? [sale.barberId] : []))
        .map(id => barbers?.find(b => b.id === id)?.name || '')
        .filter(Boolean);
    return (
        <div className="bg-white text-black p-[clamp(6px,1.8vmin,24px)] shadow-inner rounded-sm font-mono text-[clamp(7px,1.8vmin,11px)] leading-tight flex flex-col">
            {config.logoUrl && (
                <div className="flex justify-center mb-[clamp(2px,0.5vmin,8px)]">
                    <img src={config.logoUrl} alt="Logo" className="max-h-[clamp(16px,4vmin,64px)] w-auto object-contain" />
                </div>
            )}
            <div className="text-center font-black text-[clamp(9px,2.8vmin,18px)] mb-[clamp(2px,0.6vmin,8px)] uppercase tracking-tighter">{config.salonName}</div>
            <div className="text-center text-[clamp(6px,1.4vmin,8px)] mb-[clamp(2px,0.5vmin,8px)] border-b border-black border-dashed pb-[clamp(2px,0.5vmin,8px)]">
                {formatDateTimeES(sale.timestamp)}
            </div>
            {estilistas.length > 0 && (
                <div className="text-center font-black text-[clamp(7px,1.6vmin,10px)] uppercase mb-[clamp(4px,1.2vmin,16px)] border-b border-black border-dashed pb-[clamp(2px,0.5vmin,8px)]">
                    {estilistas.join(' + ')}
                </div>
            )}

            <div className="space-y-[clamp(2px,0.4vmin,6px)] mb-[clamp(6px,1.8vmin,16px)]">
                {(sale.items || []).map((item, i) => {
                    const catItem = catalog.find(x => x.id === item.itemId);
                    return (
                        <div key={i} className="flex flex-col mb-[clamp(1px,0.3vmin,4px)] uppercase">
                            <div className="flex justify-between font-bold">
                                <span className="truncate">{item.quantity}x {item.name}</span>
                                <span className="shrink-0 ml-1">${(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                            {catItem?.type === 'combo' && catItem.comboDefinition && (
                                <div className="pl-2 border-l border-zinc-200 text-[clamp(5px,1.2vmin,8px)] italic opacity-70">
                                    {catItem.comboDefinition.map(subId => (
                                        <div key={subId}>• {catalog.find(x => x.id === subId)?.name}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="border-t border-black pt-[clamp(2px,0.6vmin,8px)] space-y-[clamp(1px,0.3vmin,4px)]">
                <div className="flex justify-between uppercase text-[clamp(6px,1.4vmin,8px)]">
                    <span>Subtotal</span>
                    <span>${(sale.subtotal || 0).toFixed(2)}</span>
                </div>
                {(sale.discount || 0) > 0 && (
                    <div className="flex justify-between uppercase text-[clamp(6px,1.4vmin,8px)] font-bold italic">
                        <span>{sale.pointsUsed && sale.pointsUsed > 0 ? 'DESC. CANJE PUNTOS' : 'Descuento'}</span>
                        <span>-${(sale.discount || 0).toFixed(2)}</span>
                    </div>
                )}
                <div className="flex justify-between font-black text-[clamp(9px,2.4vmin,13px)] uppercase pb-[clamp(2px,0.5vmin,4px)]">
                    <span>TOTAL</span>
                    <span>${(sale.total || 0).toFixed(2)}</span>
                </div>
            </div>

            <div className="border-t border-black border-dashed pt-[clamp(2px,0.6vmin,8px)] space-y-[clamp(1px,0.3vmin,4px)] mt-[clamp(2px,0.6vmin,8px)]">
                <div className="text-[clamp(7px,1.6vmin,9px)] font-bold uppercase mb-[clamp(1px,0.3vmin,4px)]">Pago:</div>
                {(sale.payments || []).map((p, idx) => (
                    <div key={idx} className="flex justify-between uppercase text-[clamp(7px,1.6vmin,9px)]">
                        <span>{paymentMethods[p.method] || p.method}</span>
                        <span>${p.amount.toFixed(2)}</span>
                    </div>
                ))}
                <div className="flex justify-between uppercase font-black text-[clamp(8px,1.8vmin,10px)] pt-[clamp(1px,0.3vmin,4px)]">
                    <span>RECIBIDO:</span>
                    <span>${sale.payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between uppercase font-black text-[clamp(8px,1.8vmin,10px)]">
                    <span>CAMBIO:</span>
                    <span>${Math.max(0, sale.payments.reduce((sum, p) => sum + p.amount, 0) - sale.total).toFixed(2)}</span>
                </div>
            </div>

            <div className="mt-[clamp(6px,1.8vmin,18px)] text-[clamp(6px,1.4vmin,8px)] text-center italic uppercase font-bold opacity-70">
                {config.ticketFooter || '¡Gracias por tu visita!'}
            </div>
            <div className="mt-[clamp(2px,0.6vmin,8px)] text-center text-[clamp(5px,1.2vmin,7px)] font-mono opacity-40">
                Folio: {(sale.id || '').split('-')[0].toUpperCase()}
            </div>
        </div>
    );
};
