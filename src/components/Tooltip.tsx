'use client';

import React, {useState, useRef, useEffect, useCallback} from 'react';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
    delay?: number;
    disabled?: boolean;
    className?: string;
    maxWidth?: string;
}

export const Tooltip = ({
    content,
    children,
    position = 'auto',
    delay = 200,
    disabled = false,
    className = '',
    maxWidth = 'max-w-48',
}: TooltipProps) => {
    const [isVisible, setIsVisible] = useState(false);
    const [actualPosition, setActualPosition] = useState<
        'top' | 'bottom' | 'left' | 'right'
    >('top');
    const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLDivElement>(null);

    // Auto-positioning logic
    const calculatePosition = useCallback(() => {
        if (position !== 'auto') {
            setActualPosition(position);
            return;
        }

        if (!triggerRef.current) return;

        const rect = triggerRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;

        // Determine best position based on available space
        const spaceTop = rect.top;
        const spaceBottom = viewportHeight - rect.bottom;
        const spaceLeft = rect.left;
        const spaceRight = viewportWidth - rect.right;

        if (spaceTop > 120) {
            setActualPosition('top');
        } else if (spaceBottom > 120) {
            setActualPosition('bottom');
        } else if (spaceRight > 200) {
            setActualPosition('right');
        } else {
            setActualPosition('left');
        }
    }, [position]);

    const showTooltip = () => {
        if (disabled || !content.trim()) return;

        calculatePosition();
        const id = setTimeout(() => setIsVisible(true), delay);
        setTimeoutId(id);
    };

    const hideTooltip = () => {
        if (timeoutId) {
            clearTimeout(timeoutId);
            setTimeoutId(null);
        }
        setIsVisible(false);
    };

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            if (isVisible) calculatePosition();
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [isVisible, calculatePosition]);

    const positionClasses = {
        top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
        bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
        left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
        right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };

    const arrowClasses = {
        top: 'top-full left-1/2 transform -translate-x-1/2 -mt-1',
        bottom: 'bottom-full left-1/2 transform -translate-x-1/2 -mb-1',
        left: 'left-full top-1/2 transform -translate-y-1/2 -ml-1',
        right: 'right-full top-1/2 transform -translate-y-1/2 -mr-1',
    };

    if (disabled || !content.trim()) {
        return <>{children}</>;
    }

    return (
        <div
            ref={triggerRef}
            className={`relative inline-block ${className}`}
            onMouseEnter={showTooltip}
            onMouseLeave={hideTooltip}
            onFocus={showTooltip}
            onBlur={hideTooltip}
            tabIndex={0}
        >
            {children}
            {isVisible && (
                <div
                    ref={tooltipRef}
                    className={`absolute z-[9999] pointer-events-none ${positionClasses[actualPosition]}`}
                    role='tooltip'
                    aria-live='polite'
                >
                    <div
                        className={`
                        bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-md px-2 py-1.5
                        shadow-lg border border-gray-700/50 ${maxWidth} break-words whitespace-pre-line
                        animate-in fade-in-0 zoom-in-95 duration-150
                    `}
                    >
                        {content}
                        <div
                            className={`absolute w-2 h-2 bg-gray-900/95 border-l border-t border-gray-700/50 transform rotate-45 ${arrowClasses[actualPosition]}`}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
