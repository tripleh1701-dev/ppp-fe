export default function Deployments() {
    return (
        <div className='h-full bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-10 h-10 text-orange-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z' />
                    </svg>
                </div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                    Deployments
                </h1>
                <p className='text-gray-600 max-w-md mx-auto'>
                    Manage cloud deployments. Monitor and control application
                    deployments across environments.
                </p>
            </div>
        </div>
    );
}
