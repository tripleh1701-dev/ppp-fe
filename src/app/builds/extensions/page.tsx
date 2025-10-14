export default function Extensions() {
    return (
        <div className='h-full bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center'>
            <div className='text-center'>
                <div className='w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
                    <svg
                        className='w-10 h-10 text-green-600'
                        fill='currentColor'
                        viewBox='0 0 24 24'
                    >
                        <path d='M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z' />
                    </svg>
                </div>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>
                    Extensions
                </h1>
                <p className='text-gray-600 max-w-md mx-auto'>
                    Manage extensions and plugins. Customize your platform with
                    additional features and tools.
                </p>
            </div>
        </div>
    );
}
