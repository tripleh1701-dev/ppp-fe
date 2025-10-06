import {useState, useEffect} from 'react';

export interface SelectedAccount {
    id: string | null;
    name: string | null;
    isSystiva: boolean;
}

/**
 * Hook to get the currently selected account from breadcrumb
 * Returns account info and whether it's the Systiva account
 */
export function useSelectedAccount(): SelectedAccount {
    const [account, setAccount] = useState<SelectedAccount>({
        id: null,
        name: null,
        isSystiva: true,
    });

    useEffect(() => {
        const updateAccount = () => {
            if (typeof window === 'undefined') return;

            const id = window.localStorage.getItem('selectedAccountId');
            const name = window.localStorage.getItem('selectedAccountName');

            console.log('🔍 useSelectedAccount - Reading from localStorage:', {
                id,
                name,
                id_type: typeof id,
                name_type: typeof name,
            });

            // Check for null, empty string, or "systiva"
            const isSystiva =
                !id ||
                id === '' ||
                id === 'null' ||
                !name ||
                name === '' ||
                name === 'null' ||
                name.toLowerCase() === 'systiva';

            console.log('✅ useSelectedAccount - Setting state:', {
                id,
                name,
                isSystiva,
            });

            setAccount({id, name, isSystiva});
        };

        // Initial load
        updateAccount();

        // Listen for storage changes (when breadcrumb updates)
        window.addEventListener('storage', updateAccount);

        // Custom event for same-tab updates
        window.addEventListener('accountChanged', updateAccount);

        return () => {
            window.removeEventListener('storage', updateAccount);
            window.removeEventListener('accountChanged', updateAccount);
        };
    }, []);

    return account;
}
