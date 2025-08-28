'use client';

import {useState, useEffect} from 'react';
import NavigationSidebar from '@/components/NavigationSidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';

export default function LayoutContent({children}: {children: React.ReactNode}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Responsive breakpoint detection
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            setIsMobile(width < 768);
            setIsTablet(width >= 768 && width < 1024);
            
            // Auto-collapse sidebar on mobile
            if (width < 768) {
                setSidebarCollapsed(true);
            }
        };

        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    // Handle escape key to close sidebar on mobile
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && isMobile && !sidebarCollapsed) {
                setSidebarCollapsed(true);
            }
        };

        if (isMobile) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isMobile, sidebarCollapsed]);

    return (
        <div className='h-screen flex bg-secondary relative'>
            {/* Navigation Sidebar */}
            <NavigationSidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={isMobile}
            />

            {/* Main Content Area with Curved Contours */}
            <div className='flex-1 flex flex-col overflow-hidden min-w-0 relative'>
                {/* Curved Contour Overlay */}
                <div className={`absolute left-0 top-0 w-8 h-full pointer-events-none transition-all duration-300 ease-in-out ${
                    sidebarCollapsed ? 'translate-x-0' : '-translate-x-4'
                }`}>
                    <div className='w-full h-full bg-gradient-to-r from-transparent via-white/5 to-white/10 rounded-r-3xl'></div>
                </div>
                
                {/* Breadcrumbs */}
                <Breadcrumbs
                    username='Tushar'
                    sidebarCollapsed={sidebarCollapsed}
                    isMobile={isMobile}
                />

                {/* Main Content + Right rail */}
                <div className='flex-1 overflow-hidden flex flex-col lg:flex-row'>
                    <div className='flex-1 min-w-0 overflow-auto order-2 lg:order-1'>
                        {children}
                    </div>
                    
                    {/* AI Suggestions Panel - Responsive */}
                    <div className={`order-1 lg:order-2 flex-shrink-0`}> 
                        <AISuggestionsPanel isMobile={isMobile} isTablet={isTablet} />
                    </div>
                </div>
            </div>

            {/* Mobile overlay for sidebar */}
            {isMobile && !sidebarCollapsed && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}
        </div>
    );
}
