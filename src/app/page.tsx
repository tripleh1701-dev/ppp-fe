'use client';

import {useEffect, useState} from 'react';
import {useRouter} from 'next/navigation';
import {isAuthenticated} from '@/utils/auth';
import DashboardHome from '@/components/DashboardHome';

export default function Home() {
    const router = useRouter();
    const [isChecking, setIsChecking] = useState(true);
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        // Check authentication only on client side
        const checkAuth = () => {
            const authenticated = isAuthenticated();
            setIsAuth(authenticated);
            setIsChecking(false);

            if (!authenticated) {
                router.push('/login');
            }
        };

        checkAuth();
    }, [router]);

    // Show loading state while checking authentication
    // This ensures consistent rendering between server and client
    if (isChecking) {
        return null;
    }

    if (!isAuth) {
        return null;
    }

    return <DashboardHome />;
}
