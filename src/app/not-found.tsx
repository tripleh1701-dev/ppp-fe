'use client';

export default function NotFound() {
    return (
        <div className='min-h-[50vh] flex items-center justify-center bg-slate-50'>
            <div className='text-center'>
                <h2 className='text-2xl font-semibold text-slate-800'>
                    Page not found
                </h2>
                <p className='mt-2 text-slate-500'>
                    The page you’re looking for does not exist.
                </p>
            </div>
        </div>
    );
}
