export default function AccessControl() {
    return (
        <div className='h-full bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-8 h-8 text-yellow-600'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                        />
                    </svg>
                </div>
                <h1 className='text-2xl font-bold text-gray-900 mb-2'>
                    Access Control
                </h1>
                <p className='text-gray-600'>
                    User permissions and roles management
                </p>
            </div>
        </div>
    );
}
