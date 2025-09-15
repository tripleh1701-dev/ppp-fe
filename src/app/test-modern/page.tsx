'use client';

import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import {UserGroupIcon, XMarkIcon} from '@heroicons/react/24/outline';
import {UserGroupIcon as UserGroupSolidIcon} from '@heroicons/react/24/solid';

export default function TestModernPage() {
    const [showPanel, setShowPanel] = useState(false);

    return (
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-8'>
            <div className='max-w-4xl mx-auto'>
                <h1 className='text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-8'>
                    🎉 Modern Design Test Page
                </h1>

                <div className='bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-white/20 p-8 mb-8'>
                    <h2 className='text-2xl font-bold text-slate-900 mb-4'>
                        ✨ Ultra-Modern Features
                    </h2>
                    <ul className='space-y-2 text-slate-700'>
                        <li>• 🌈 Beautiful gradient backgrounds</li>
                        <li>• 🔮 Glass morphism effects with backdrop blur</li>
                        <li>• 🎬 Smooth spring animations</li>
                        <li>• 💎 Professional card layouts</li>
                        <li>• 🎯 InterActive sliding panels</li>
                    </ul>
                </div>

                <motion.button
                    whileHover={{scale: 1.05, y: -2}}
                    whileTap={{scale: 0.95}}
                    onClick={() => setShowPanel(true)}
                    className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center gap-3'
                >
                    <UserGroupSolidIcon className='h-6 w-6' />
                    🚀 Test Sliding Panel
                </motion.button>

                {/* Sample Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8'>
                    {[1, 2, 3].map((i) => (
                        <motion.div
                            key={i}
                            initial={{opacity: 0, y: 20}}
                            animate={{opacity: 1, y: 0}}
                            transition={{delay: i * 0.1}}
                            whileHover={{y: -8, scale: 1.02}}
                            className='bg-white/80 backdrop-blur-xl rounded-3xl border-2 border-slate-200/60 hover:border-blue-300/60 transition-all duration-300 p-6 shadow-lg hover:shadow-xl'
                        >
                            <div className='p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl w-fit mb-4'>
                                <UserGroupIcon className='h-6 w-6 text-white' />
                            </div>
                            <h3 className='text-xl font-bold text-slate-900 mb-2'>
                                Modern Card {i}
                            </h3>
                            <p className='text-slate-600'>
                                Beautiful card with glass effects and smooth
                                animations
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Modern Sliding Panel */}
            <AnimatePresence>
                {showPanel && (
                    <>
                        <motion.div
                            initial={{opacity: 0}}
                            animate={{opacity: 1}}
                            exit={{opacity: 0}}
                            className='fixed inset-0 bg-black/40 backdrop-blur-md z-40'
                            onClick={() => setShowPanel(false)}
                        />

                        <motion.div
                            initial={{x: '100%'}}
                            animate={{x: 0}}
                            exit={{x: '100%'}}
                            transition={{
                                type: 'spring',
                                stiffness: 300,
                                damping: 30,
                            }}
                            className='fixed right-0 top-0 h-full w-96 bg-white/95 backdrop-blur-2xl shadow-2xl z-50 flex flex-col'
                        >
                            <div className='bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-6'>
                                <div className='flex items-center justify-between'>
                                    <h3 className='text-xl font-bold'>
                                        🎉 Beautiful Panel!
                                    </h3>
                                    <button
                                        onClick={() => setShowPanel(false)}
                                        className='p-2 hover:bg-white/20 rounded-xl'
                                    >
                                        <XMarkIcon className='h-6 w-6' />
                                    </button>
                                </div>
                                <p className='text-blue-100 mt-2'>
                                    This is how the modern design looks!
                                </p>
                            </div>

                            <div className='flex-1 p-6 flex items-center justify-center'>
                                <div className='text-center'>
                                    <div className='text-6xl mb-4'>✨</div>
                                    <h4 className='text-2xl font-bold text-slate-900 mb-2'>
                                        Success!
                                    </h4>
                                    <p className='text-slate-600'>
                                        The modern design is working perfectly!
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
