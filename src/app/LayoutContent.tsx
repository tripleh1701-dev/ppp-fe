'use client';

import {useState} from 'react';
import NavigationSidebar from '@/components/NavigationSidebar';
import Breadcrumbs from '@/components/Breadcrumbs';
import AISuggestionsPanel from '@/components/AISuggestionsPanel';

export default function LayoutContent({children}: {children: React.ReactNode}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <div className='h-screen flex bg-secondary'>
            {/* Navigation Sidebar */}
            <NavigationSidebar
                isCollapsed={sidebarCollapsed}
                onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            />

            {/* Main Content Area */}
            <div className='flex-1 flex flex-col overflow-hidden'>
                {/* Breadcrumbs */}
                <Breadcrumbs
                    username='Tushar'
                    sidebarCollapsed={sidebarCollapsed}
                />

                {/* Main Content + Right rail */}
                <div className='flex-1 overflow-hidden flex'>
                    <div className='flex-1 min-w-0 overflow-hidden'>
                        {children}
                    </div>
                    <AISuggestionsPanel />
                </div>
            </div>
        </div>
    );
}
