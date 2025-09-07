'use client';

import {useState} from 'react';

interface ArcToggleComponentProps {
    isActive: boolean;
    onToggle: () => void;
    size?: number;
}

export default function ArcToggleComponent({
    isActive,
    onToggle,
    size = 150,
}: ArcToggleComponentProps) {
    const [isHovered, setIsHovered] = useState(false);

    const centerX = size / 2;
    const centerY = size / 2;
    const toggleWidth = size * 0.45;
    const toggleHeight = size * 0.22;

    // Create a continuous flowing arc around the toggle
    const arcRadius = size * 0.35;
    const strokeWidth = size * 0.1;

    // Create the arc path - going 3/4 around the circle
    const startAngle = -60; // Start at top-left
    const endAngle = 210; // End at bottom-left (270 degrees total)

    const startX = centerX + arcRadius * Math.cos((startAngle * Math.PI) / 180);
    const startY = centerY + arcRadius * Math.sin((startAngle * Math.PI) / 180);
    const endX = centerX + arcRadius * Math.cos((endAngle * Math.PI) / 180);
    const endY = centerY + arcRadius * Math.sin((endAngle * Math.PI) / 180);

    // Create the continuous arc path
    const arcPath = `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 1 1 ${endX} ${endY}`;

    return (
        <div
            className='relative inline-block cursor-pointer'
            style={{width: size, height: size}}
            onClick={onToggle}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* SIMPLE ARC - NO CIRCULAR BUTTONS */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className='absolute inset-0'
                style={{zIndex: 1}}
            >
                {/* GREEN ARC SEGMENT */}
                <path
                    d={`M ${
                        centerX + arcRadius * Math.cos((-60 * Math.PI) / 180)
                    } ${
                        centerY + arcRadius * Math.sin((-60 * Math.PI) / 180)
                    } A ${arcRadius} ${arcRadius} 0 0 1 ${
                        centerX + arcRadius * Math.cos((30 * Math.PI) / 180)
                    } ${centerY + arcRadius * Math.sin((30 * Math.PI) / 180)}`}
                    fill='none'
                    stroke='#10B981'
                    strokeWidth={strokeWidth}
                    strokeLinecap='round'
                />

                {/* RED ARC SEGMENT */}
                <path
                    d={`M ${
                        centerX + arcRadius * Math.cos((40 * Math.PI) / 180)
                    } ${
                        centerY + arcRadius * Math.sin((40 * Math.PI) / 180)
                    } A ${arcRadius} ${arcRadius} 0 0 1 ${
                        centerX + arcRadius * Math.cos((130 * Math.PI) / 180)
                    } ${centerY + arcRadius * Math.sin((130 * Math.PI) / 180)}`}
                    fill='none'
                    stroke='#EF4444'
                    strokeWidth={strokeWidth}
                    strokeLinecap='round'
                />

                {/* ORANGE ARC SEGMENT */}
                <path
                    d={`M ${
                        centerX + arcRadius * Math.cos((140 * Math.PI) / 180)
                    } ${
                        centerY + arcRadius * Math.sin((140 * Math.PI) / 180)
                    } A ${arcRadius} ${arcRadius} 0 0 1 ${
                        centerX + arcRadius * Math.cos((220 * Math.PI) / 180)
                    } ${centerY + arcRadius * Math.sin((220 * Math.PI) / 180)}`}
                    fill='none'
                    stroke='#F59E0B'
                    strokeWidth={strokeWidth}
                    strokeLinecap='round'
                />

                {/* DEBUG TEXT */}
                <text
                    x={centerX}
                    y={centerY - 40}
                    textAnchor='middle'
                    fill='red'
                    fontSize='16'
                    fontWeight='bold'
                >
                    ARC ONLY
                </text>
            </svg>

            {/* COMMENTED OUT - ALL CIRCULAR ELEMENTS REMOVED */}
            {/*
            <div
                className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                style={{
                    width: toggleWidth,
                    height: toggleHeight,
                    backgroundColor: '#10B981',
                    borderRadius: `${toggleHeight / 2}px`,
                    border: '2px solid #059669',
                    zIndex: 10,
                }}
            >
                <div
                    className='absolute top-1/2 transform -translate-y-1/2 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300'
                    style={{
                        width: toggleHeight - 6,
                        height: toggleHeight - 6,
                        left: isActive
                            ? `calc(100% - ${toggleHeight - 2}px)`
                            : '2px',
                    }}
                >
                    <svg
                        width={toggleHeight * 0.4}
                        height={toggleHeight * 0.4}
                        viewBox='0 0 24 24'
                        fill='none'
                        className='text-gray-600'
                    >
                        <path
                            d='M9 18l6-6-6-6'
                            stroke='currentColor'
                            strokeWidth='2.5'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                        />
                    </svg>
                </div>
            </div>
            */}

            {/* SIMPLE TOGGLE SWITCH - RECTANGULAR */}
            <div
                className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
                style={{
                    width: toggleWidth,
                    height: toggleHeight,
                    backgroundColor: '#10B981',
                    borderRadius: '8px',
                    border: '2px solid #059669',
                    zIndex: 10,
                }}
            >
                {/* Simple rectangular button */}
                <div
                    className='absolute top-1/2 transform -translate-y-1/2 bg-white shadow-lg flex items-center justify-center transition-all duration-300'
                    style={{
                        width: toggleHeight - 6,
                        height: toggleHeight - 6,
                        borderRadius: '4px',
                        left: isActive
                            ? `calc(100% - ${toggleHeight - 2}px)`
                            : '2px',
                    }}
                >
                    →
                </div>
            </div>
        </div>
    );
}
