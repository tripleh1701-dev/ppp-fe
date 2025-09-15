export default function Inbox() {
    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-8 h-8 text-blue-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4'
                        />
                    </svg>
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    My Inbox
                </h1>
                <p className='text-gray-600'>
                    Notifications and pending actions will appear here
                </p>
            </div>
        </div>
    );
}
