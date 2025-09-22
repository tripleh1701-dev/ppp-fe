'use client';

import {useState, useEffect} from 'react';
import NavigationSidebar from '@/components/NavigationSidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';

export default function LayoutContent({children}: {children: React.ReactNode}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isTablet, setIsTablet] = useState(false);

    // Responsive breakpoint detection for native 80% zoom simulation
    useEffect(() => {
        const checkScreenSize = () => {
            const width = window.innerWidth;
            // Adjusted breakpoints to simulate 80% zoom effect naturally
            setIsMobile(width < 1024); // Increased from 960 for better mobile experience
            setIsTablet(width >= 1024 && width < 1440); // Adjusted for 80% zoom simulation

            // Auto-collapse sidebar on mobile
            if (width < 1024) {
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
            {/* Navigation Sidebar - Flush with left edge */}
            <NavigationSidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
                isMobile={isMobile}
            />

            {/* Main Content Area - Fixed height layout without vertical scrolling */}
            <div className='flex-1 flex flex-col min-w-0 relative'>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    sidebarCollapsed={sidebarCollapsed}
                    isMobile={isMobile}
                />

                {/* Main Content + Right rail - Compact layout with proper height constraints */}
                <div className='flex-1 flex flex-col lg:flex-row min-h-0'>
                    {/* Main content area - No overflow, content should fit within available space */}
                    <div className='flex-1 min-w-0 order-2 lg:order-1'>
                        <div className='w-full h-full px-4 py-3'>
                            <div className='max-w-full mx-auto h-full'>
                                {children}
                            </div>
                        </div>
                    </div>

                    {/* AI Suggestions Panel - Reduced width and proper anchoring */}
                    <div className='order-1 lg:order-2 flex-shrink-0 border-l border-slate-200'>
                        <AISuggestionsPanel
                            isMobile={isMobile}
                            isTablet={isTablet}
                        />
                    </div>
                </div>
            </div>

            {/* Mobile overlay for sidebar */}
            {isMobile && !sidebarCollapsed && (
                <div
                    className='fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden'
                    onClick={() => setSidebarCollapsed(true)}
                />
            )}
        </div>
    );
}
