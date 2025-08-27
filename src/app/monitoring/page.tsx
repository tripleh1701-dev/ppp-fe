export default function Monitoring() {
    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-8 h-8 text-indigo-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z'
                        />
                    </svg>
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    Monitoring
                </h1>
                <p className='text-gray-600'>
                    System monitoring and alerts dashboard
                </p>
            </div>
        </div>
    );
}
