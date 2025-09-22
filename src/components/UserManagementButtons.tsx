'use client';

import React, {useState} from 'react';
import {motion} from 'framer-motion';
import {
    UserGroupIcon,
    ShieldCheckIcon,
    CogIcon,
} from '@heroicons/react/24/outline';
import SimpleSlidingPanels from './SimpleSlidingPanels';

interface UserManagementButtonsProps {
    currentUser?: any;
    onAssignGroups?: (groups: any[]) => void;
}

const UserManagementButtons: React.FC<UserManagementButtonsProps> = ({
    currentUser,
    onAssignGroups,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activePanel, setActivePanel] = useState<
        'userGroups' | 'roles' | 'scope'
    >('userGroups');

    const buttons = [
        {
            id: 'userGroups' as const,
            title: 'User Groups',
            subtitle: 'Assign Groups',
            icon: <UserGroupIcon className='w-6 h-6' />,
            color: 'from-blue-500 to-blue-600',
            hoverColor: 'hover:from-blue-600 hover:to-blue-700',
        },
        {
            id: 'roles' as const,
            title: 'Assign Roles',
            subtitle: 'Role Management',
            icon: <ShieldCheckIcon className='w-6 h-6' />,
            color: 'from-green-500 to-green-600',
            hoverColor: 'hover:from-green-600 hover:to-green-700',
        },
        {
            id: 'scope' as const,
            title: 'Configure Scope',
            subtitle: 'Permissions',
            icon: <CogIcon className='w-6 h-6' />,
            color: 'from-purple-500 to-purple-600',
            hoverColor: 'hover:from-purple-600 hover:to-purple-700',
        },
    ];

    const openPanel = (panelId: 'userGroups' | 'roles' | 'scope') => {
        setActivePanel(panelId);
        setIsOpen(true);
    };

    const closePanel = () => {
        setIsOpen(false);
    };

    return (
        <>
            {/* 3 Panel Buttons - Fixed Position Top Right */}
            <div className='fixed top-4 right-4 z-40 flex space-x-3'>
                {buttons.map((button, index) => (
                    <motion.button
                        key={button.id}
                        onClick={() => openPanel(button.id)}
                        className={`
                            relative group px-4 py-3 rounded-xl shadow-lg text-white
                            bg-gradient-to-r ${button.color} ${button.hoverColor}
                            transition-all duration-300 flex items-center space-x-3
                            hover:shadow-xl hover:scale-105
                        `}
                        initial={{opacity: 0, y: -20, scale: 0.8}}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                            transition: {delay: index * 0.1},
                        }}
                        whileHover={{
                            y: -2,
                            transition: {duration: 0.2},
                        }}
                        whileTap={{scale: 0.95}}
                    >
                        {/* Icon */}
                        <motion.div
                            className='flex-shrink-0'
                            whileHover={{rotate: 5}}
                            transition={{duration: 0.2}}
                        >
                            {button.icon}
                        </motion.div>

                        {/* Text */}
                        <div className='text-left'>
                            <div className='text-sm font-semibold leading-tight'>
                                {button.title}
                            </div>
                            <div className='text-xs opacity-90'>
                                {button.subtitle}
                            </div>
                        </div>

                        {/* Pulse Animation */}
                        <motion.div
                            className='absolute inset-0 rounded-xl bg-white'
                            initial={{opacity: 0, scale: 0.8}}
                            animate={{
                                opacity: [0, 0.1, 0],
                                scale: [0.8, 1.2, 1.4],
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                repeatType: 'loop',
                                ease: 'easeOut',
                            }}
                        />

                        {/* Notification Badge for User Groups */}
                        {button.id === 'userGroups' && currentUser && (
                            <motion.div
                                className='absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center'
                                initial={{scale: 0}}
                                animate={{scale: 1}}
                                transition={{delay: 0.5, type: 'spring'}}
                            >
                                <span className='text-xs font-bold text-white'>
                                    !
                                </span>
                            </motion.div>
                        )}
                    </motion.button>
                ))}
            </div>

            {/* Sliding Panel */}
            {isOpen && (
                <SimpleSlidingPanels
                    isOpen={isOpen}
                    onClose={closePanel}
                    currentUser={currentUser}
                    onAssignGroups={onAssignGroups}
                    initialPanel={activePanel}
                />
            )}
        </>
    );
};

export default UserManagementButtons;
