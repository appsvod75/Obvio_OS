import React from 'react';
import { formatDateES, formatTimeES } from '../utils/dates';
import { Ticket, AppConfig } from '../types';

interface TurnTicketContentProps {
    ticket: Ticket;
    config: AppConfig;
}

export const TurnTicketContent: React.FC<TurnTicketContentProps> = ({ ticket, config }) => {
    return (
        <div className="bg-white text-black p-[clamp(8px,2vmin,32px)] flex flex-col items-center text-center pt-[clamp(12px,3vmin,40px)] pb-[clamp(6px,1.5vmin,24px)] font-mono">
            <h3 className="font-black text-[clamp(12px,3vmin,24px)] uppercase tracking-widest mb-[clamp(4px,1vmin,8px)]">{config.salonName}</h3>
            <p className="text-[clamp(8px,1.8vmin,12px)] font-mono text-zinc-500 mb-[clamp(8px,2vmin,24px)] border-b border-black pb-[clamp(4px,1vmin,8px)] w-full text-center">
                {formatDateES(ticket.createdAt)} - {formatTimeES(ticket.createdAt)}
            </p>
            <div className="text-[clamp(8px,1.8vmin,12px)] font-bold uppercase text-zinc-400 mb-[clamp(2px,0.5vmin,4px)]">Tu Turno</div>
            <div className="text-[clamp(24px,8vmin,72px)] font-black tracking-tighter leading-none mb-[clamp(6px,2vmin,16px)]">{ticket.fullCode}</div>
            <div className="border-t-2 border-black border-dashed w-full my-[clamp(4px,1vmin,16px)]"></div>
            <p className="font-bold text-[clamp(12px,3vmin,20px)] mb-[clamp(2px,0.5vmin,4px)]">{ticket.clientName}</p>
            <p className="text-zinc-600 text-[clamp(9px,2vmin,14px)]">Por favor espera tu llamado.</p>
        </div>
    );
};
