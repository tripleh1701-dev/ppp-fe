/**
 * Responsive Design Utilities
 * Cross-browser compatible responsive helpers for the Systiva platform
 */

// Device detection utilities
export const isMobile = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
};

export const isTablet = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 768 && window.innerWidth < 1024;
};

export const isDesktop = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1024;
};

export const isLargeScreen = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1280;
};

export const isExtraLargeScreen = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth >= 1920;
};

// Browser detection utilities
export const isChrome = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Chrome/.test(navigator.userAgent) && !/Edge/.test(navigator.userAgent);
};

export const isFirefox = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Firefox/.test(navigator.userAgent);
};

export const isSafari = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
};

export const isEdge = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Edge/.test(navigator.userAgent);
};

export const isIE = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /MSIE|Trident/.test(navigator.userAgent);
};

// OS detection utilities
export const isWindows = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Windows/.test(navigator.platform);
};

export const isMac = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Mac/.test(navigator.platform);
};

export const isLinux = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Linux/.test(navigator.platform);
};

export const isIOS = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android/.test(navigator.userAgent);
};

// Feature detection utilities
export const supportsCSSGrid = (): boolean => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('display', 'grid');
};

export const supportsFlexbox = (): boolean => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('display', 'flex');
};

export const supportsCSSVariables = (): boolean => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('--custom', 'property');
};

export const supportsBackdropFilter = (): boolean => {
    if (typeof window === 'undefined') return false;
    return CSS.supports('backdrop-filter', 'blur(10px)');
};

export const supportsIntersectionObserver = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'IntersectionObserver' in window;
};

export const supportsResizeObserver = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ResizeObserver' in window;
};

// Responsive breakpoint utilities
export const getBreakpoint = (): 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' => {
    if (typeof window === 'undefined') return 'lg';
    
    const width = window.innerWidth;
    
    if (width < 475) return 'xs';
    if (width < 640) return 'sm';
    if (width < 768) return 'md';
    if (width < 1024) return 'lg';
    if (width < 1280) return 'xl';
    if (width < 1536) return '2xl';
    if (width < 1920) return '3xl';
    return '4xl';
};

// Responsive class utilities
export const getResponsiveClasses = (baseClass: string, mobileClass?: string, tabletClass?: string, desktopClass?: string): string => {
    const classes = [baseClass];
    
    if (mobileClass) classes.push(mobileClass);
    if (tabletClass) classes.push(tabletClass);
    if (desktopClass) classes.push(desktopClass);
    
    return classes.join(' ');
};

// Touch device detection
export const isTouchDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
};

// High DPI/Retina detection
export const isHighDPI = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.devicePixelRatio > 1;
};

export const isRetina = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.devicePixelRatio >= 2;
};

// Viewport utilities
export const getViewportDimensions = () => {
    if (typeof window === 'undefined') return { width: 0, height: 0 };
    
    return {
        width: window.innerWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
    };
};

// Responsive event listener
export const addResponsiveListener = (
    callback: (breakpoint: string, width: number) => void,
    options?: { throttle?: number }
): (() => void) => {
    if (typeof window === 'undefined') return () => {};
    
    let timeoutId: NodeJS.Timeout;
    let lastBreakpoint = getBreakpoint();
    
    const handleResize = () => {
        const currentBreakpoint = getBreakpoint();
        const width = window.innerWidth;
        
        if (currentBreakpoint !== lastBreakpoint) {
            lastBreakpoint = currentBreakpoint;
            callback(currentBreakpoint, width);
        }
    };
    
    const throttledHandleResize = () => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(handleResize, options?.throttle || 100);
    };
    
    window.addEventListener('resize', throttledHandleResize);
    
    return () => {
        window.removeEventListener('resize', throttledHandleResize);
        if (timeoutId) clearTimeout(timeoutId);
    };
};

// CSS-in-JS responsive helpers
export const responsiveStyles = {
    mobile: '@media (max-width: 767px)',
    tablet: '@media (min-width: 768px) and (max-width: 1023px)',
    desktop: '@media (min-width: 1024px)',
    large: '@media (min-width: 1280px)',
    xlarge: '@media (min-width: 1920px)',
};

// Utility for conditional rendering based on device
export const deviceRender = {
    mobile: <T>(component: T, fallback?: T): T | undefined => isMobile() ? component : fallback,
    tablet: <T>(component: T, fallback?: T): T | undefined => isTablet() ? component : fallback,
    desktop: <T>(component: T, fallback?: T): T | undefined => isDesktop() ? component : fallback,
    touch: <T>(component: T, fallback?: T): T | undefined => isTouchDevice() ? component : fallback,
    nonTouch: <T>(component: T, fallback?: T): T | undefined => !isTouchDevice() ? component : fallback,
};

// Export all utilities as a single object for easy importing
export default {
    // Device detection
    isMobile,
    isTablet,
    isDesktop,
    isLargeScreen,
    isExtraLargeScreen,
    
    // Browser detection
    isChrome,
    isFirefox,
    isSafari,
    isEdge,
    isIE,
    
    // OS detection
    isWindows,
    isMac,
    isLinux,
    isIOS,
    isAndroid,
    
    // Feature detection
    supportsCSSGrid,
    supportsFlexbox,
    supportsCSSVariables,
    supportsBackdropFilter,
    supportsIntersectionObserver,
    supportsResizeObserver,
    
    // Responsive utilities
    getBreakpoint,
    getResponsiveClasses,
    getViewportDimensions,
    addResponsiveListener,
    
    // Device utilities
    isTouchDevice,
    isHighDPI,
    isRetina,
    
    // Conditional rendering
    deviceRender,
    
    // CSS helpers
    responsiveStyles,
};
