import React, { useRef, useState, useCallback } from 'react';

export const useDragScroll = () => {
    const ref = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [startY, setStartY] = useState(0);
    const [startX, setStartX] = useState(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [scrollLeft, setScrollLeft] = useState(0);

    const getPos = (e: React.MouseEvent | React.TouchEvent | MouseEvent | TouchEvent) => {
        if ('touches' in e) {
            return { x: e.touches[0].pageX, y: e.touches[0].pageY };
        }
        return { x: (e as MouseEvent).pageX, y: (e as MouseEvent).pageY };
    };

    const startDrag = (pos: { x: number; y: number }) => {
        if (!ref.current) return;
        setIsDragging(true);
        setStartY(pos.y - ref.current.offsetTop);
        setStartX(pos.x - ref.current.offsetLeft);
        setScrollTop(ref.current.scrollTop);
        setScrollLeft(ref.current.scrollLeft);
        ref.current.style.setProperty('cursor', 'grabbing', 'important');
        ref.current.style.userSelect = 'none';
    };

    const stopDrag = () => {
        if (!ref.current) return;
        setIsDragging(false);
        ref.current.style.setProperty('cursor', 'grab', 'important');
        ref.current.style.removeProperty('user-select');
    };

    const moveDrag = (pos: { x: number; y: number }) => {
        if (!isDragging || !ref.current) return;
        const y = pos.y - ref.current.offsetTop;
        const x = pos.x - ref.current.offsetLeft;
        ref.current.scrollTop = scrollTop - (y - startY) * 1.5;
        ref.current.scrollLeft = scrollLeft - (x - startX) * 1.5;
    };

    const onMouseDown = useCallback((e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('button')) return;
        startDrag({ x: e.pageX, y: e.pageY });
    }, []);

    const onTouchStart = useCallback((e: React.TouchEvent) => {
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'BUTTON' || target.closest('button')) return;
        startDrag({ x: e.touches[0].pageX, y: e.touches[0].pageY });
    }, []);

    const onMouseLeave = useCallback(() => stopDrag(), []);
    const onMouseUp = useCallback(() => stopDrag(), []);
    const onTouchEnd = useCallback(() => stopDrag(), []);

    const onMouseMove = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        moveDrag({ x: e.pageX, y: e.pageY });
    }, [isDragging, startY, startX, scrollTop, scrollLeft]);

    const onTouchMove = useCallback((e: React.TouchEvent) => {
        moveDrag({ x: e.touches[0].pageX, y: e.touches[0].pageY });
    }, [isDragging, startY, startX, scrollTop, scrollLeft]);

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
