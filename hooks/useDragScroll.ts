import React, { useRef, useState, useCallback } from 'react';

export const useDragScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const dragStartRef = useRef({ x: 0, y: 0, scrollTop: 0, scrollLeft: 0, active: false, hasMoved: false });

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'BUTTON' || 
            target.closest('button') ||
            target.closest('input, textarea, select, a')
        ) return;

        if (!ref.current) return;
        dragStartRef.current = {
            x: e.pageX,
            y: e.pageY,
            scrollTop: ref.current.scrollTop,
            scrollLeft: ref.current.scrollLeft,
            active: true,
            hasMoved: false
        };
        ref.current.style.setProperty('cursor', 'grabbing', 'important');
        ref.current.style.userSelect = 'none';
    }, []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        const drag = dragStartRef.current;
        if (!drag.active || !ref.current) return;

        const dx = e.pageX - drag.x;
        const dy = e.pageY - drag.y;

        // Umbral de 6px para diferenciar click de arrastre
        if (!drag.hasMoved && Math.abs(dx) < 6 && Math.abs(dy) < 6) {
            return;
        }

        if (!drag.hasMoved) {
            drag.hasMoved = true;
            setIsDragging(true);
        }

        e.preventDefault();
        ref.current.scrollTop = drag.scrollTop - dy * 1.5;
        ref.current.scrollLeft = drag.scrollLeft - dx * 1.5;
    }, []);

    const stopDrag = useCallback(() => {
        const drag = dragStartRef.current;
        if (!drag.active) return;

        drag.active = false;
        setIsDragging(false);

        if (ref.current) {
            ref.current.style.setProperty('cursor', 'grab', 'important');
            ref.current.style.removeProperty('user-select');
        }
    }, []);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (
            target.tagName === 'INPUT' || 
            target.tagName === 'TEXTAREA' || 
            target.tagName === 'BUTTON' || 
            target.closest('button') ||
            target.closest('input, textarea, select, a')
        ) return;

        if (!ref.current) return;
        dragStartRef.current = {
            x: e.touches[0].pageX,
            y: e.touches[0].pageY,
            scrollTop: ref.current.scrollTop,
            scrollLeft: ref.current.scrollLeft,
            active: true,
            hasMoved: false
        };
    }, []);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        const drag = dragStartRef.current;
        if (!drag.active || !ref.current) return;

        const dx = e.touches[0].pageX - drag.x;
        const dy = e.touches[0].pageY - drag.y;

        if (!drag.hasMoved && Math.abs(dx) < 6 && Math.abs(dy) < 6) {
            return;
        }

        if (!drag.hasMoved) {
            drag.hasMoved = true;
            setIsDragging(true);
        }

        e.preventDefault();
        ref.current.scrollTop = drag.scrollTop - dy * 1.5;
        ref.current.scrollLeft = drag.scrollLeft - dx * 1.5;
    }, []);

    const onMouseLeave = useCallback(() => stopDrag(), [stopDrag]);
    const onMouseUp = useCallback(() => stopDrag(), [stopDrag]);
    const onTouchEnd = useCallback(() => stopDrag(), [stopDrag]);

    return {
        ref,
        props: {
            onMouseDown,
            onMouseLeave,
            onMouseUp,
            onMouseMove,
            onTouchStart,
            onTouchEnd,
            onTouchMove,
            style: { cursor: 'grab' } as React.CSSProperties
        }
    };
};
