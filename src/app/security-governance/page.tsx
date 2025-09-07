export default function SecurityGovernance() {
    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-8 h-8 text-red-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z'
                        />
                    </svg>
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    Security & Governance
                </h1>
                <p className='text-gray-600'>
                    Security policies and compliance management
                </p>
            </div>
        </div>
    );
}
