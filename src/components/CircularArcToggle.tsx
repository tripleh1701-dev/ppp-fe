'use client';

import {useState} from 'react';

interface CircularArcToggleProps {
    isActive: boolean;
    onToggle: () => void;
    size?: number;
}

export default function CircularArcToggle({
    isActive,
    onToggle,
    size = 120,
}: CircularArcToggleProps) {
    const [isHovered, setIsHovered] = useState(false);

    const centerX = size / 2;
    const centerY = size / 2;
    const toggleWidth = size * 0.3;
    const toggleHeight = size * 0.15;

    // Create ONE continuous flowing arc with gradient colors
    const arcRadius = size * 0.4;
    const strokeWidth = size * 0.12;

    // Arc shaped like "Ɔ" rotated 90 degrees clockwise
    const arcStartAngle = 0; // Original -90 + 90 = 0 (Right side, 3 o'clock)
    const arcEndAngle = 180; // Original 90 + 90 = 180 (Left side, 9 o'clock)
    const toggleAngle = 270; // Original 180 + 90 = 270 (Bottom, 6 o'clock opening)

    // Calculate toggle button position at the arc opening
    const toggleButtonRadius = arcRadius + strokeWidth / 2 + 8; // Slightly outside the arc
    const toggleButtonX =
        centerX + toggleButtonRadius * Math.cos((toggleAngle * Math.PI) / 180);
    const toggleButtonY =
        centerY + toggleButtonRadius * Math.sin((toggleAngle * Math.PI) / 180);

    // Create "Ɔ" shaped arc path - like backwards C with opening on left
    const createBackwardsCShapeArc = () => {
        const startX =
            centerX + arcRadius * Math.cos((arcStartAngle * Math.PI) / 180);
        const startY =
            centerY + arcRadius * Math.sin((arcStartAngle * Math.PI) / 180);
        const endX =
            centerX + arcRadius * Math.cos((arcEndAngle * Math.PI) / 180);
        const endY =
            centerY + arcRadius * Math.sin((arcEndAngle * Math.PI) / 180);

        // Create "Ɔ" rotated 90° clockwise: arc goes from right, around top, to left (opening at bottom)
        return `M ${startX} ${startY} A ${arcRadius} ${arcRadius} 0 1 1 ${endX} ${endY}`;
    };

    const continuousArcPath = createBackwardsCShapeArc();

    return (
        <div
            className='relative inline-block'
            style={{width: size, height: size}}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* ONE CONTINUOUS FLOWING ARC - No circular buttons! */}
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                className='absolute inset-0 pointer-events-none'
                style={{zIndex: 1}}
            >
                <defs>
                    {/* Gradient that flows along the arc path */}
                    <linearGradient
                        id='flowingArcGradient'
                        x1='0%'
                        y1='0%'
                        x2='100%'
                        y2='100%'
                    >
                        <stop offset='0%' stopColor='#10B981' />{' '}
                        {/* Green at start */}
                        <stop offset='50%' stopColor='#EF4444' />{' '}
                        {/* Red in middle */}
                        <stop offset='100%' stopColor='#F59E0B' />{' '}
                        {/* Orange at end */}
                    </linearGradient>
                </defs>

                {/* SINGLE continuous arc with flowing gradient colors - NO CIRCULAR BUTTONS */}
                <path
                    d={continuousArcPath}
                    fill='none'
                    stroke='url(#flowingArcGradient)'
                    strokeWidth={strokeWidth}
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    style={{
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))',
                    }}
                />
            </svg>

            {/* Toggle button positioned at the arc opening */}
            <div
                className='absolute transition-all duration-300'
                style={{
                    left: toggleButtonX - toggleWidth / 2,
                    top: toggleButtonY - toggleHeight / 2,
                    width: toggleWidth,
                    height: toggleHeight,
                    backgroundColor: isActive ? '#10B981' : '#6B7280', // Green when active, gray when inactive
                    borderRadius: `${toggleHeight / 2}px`,
                    border: `2px solid ${isActive ? '#059669' : '#4B5563'}`,
                    boxShadow: isActive
                        ? '0 2px 6px rgba(16, 185, 129, 0.3)'
                        : '0 2px 6px rgba(107, 114, 128, 0.2)',
                    zIndex: 10,
                    cursor: 'pointer',
                }}
                onClick={onToggle}
            >
                {/* Toggle slider - white circle with arrow */}
                <div
                    className='absolute top-1/2 transform -translate-y-1/2 rounded-full shadow-lg transition-all duration-300 flex items-center justify-center'
                    style={{
                        width: toggleHeight - 6,
                        height: toggleHeight - 6,
                        backgroundColor: '#FFFFFF',
                        left: isActive
                            ? `calc(100% - ${toggleHeight - 2}px)`
                            : '2px',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                    }}
                >
                    {/* Arrow icon */}
                    <svg
                        width={toggleHeight * 0.4}
                        height={toggleHeight * 0.4}
                        viewBox='0 0 24 24'
                        fill='none'
                        className={`transition-colors duration-300 ${
                            isActive ? 'text-green-600' : 'text-gray-600'
                        }`}
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
        </div>
    );
}
