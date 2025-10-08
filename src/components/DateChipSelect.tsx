import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface DateChipSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isError?: boolean;
    compact?: boolean;
    className?: string;
}

const DateChipSelect: React.FC<DateChipSelectProps> = ({
    value,
    onChange,
    placeholder = "Select date",
    isError = false,
    compact = false,
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const calendarRef = useRef<HTMLDivElement>(null);

    // Handle click outside to close calendar
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarRef.current && !calendarRef.current.contains(event.target as Node) &&
                containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    const handleContainerClick = () => {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + window.scrollY + 4,
                left: rect.left + window.scrollX,
                width: rect.width
            });
            setIsOpen(!isOpen);
        }
    };

    const handleDateSelect = (date: string) => {
        onChange(date);
        setIsOpen(false);
    };

    // Generate calendar for current month
    const generateCalendar = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const days = [];
        const current = new Date(startDate);
        
        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return { days, month, year };
    };

    const { days, month, year } = generateCalendar();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    };

    return (
        <>
            <div
                ref={containerRef}
                onClick={handleContainerClick}
                className={`relative flex items-center justify-between w-full px-3 py-2 text-sm bg-white border rounded-md cursor-pointer transition-all duration-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 ${
                    isError 
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                        : isOpen
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-300'
                } ${compact ? 'py-1' : ''} ${className}`}
            >
                <span className={`flex-1 truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
                    {value ? formatDisplayDate(value) : placeholder}
                </span>
                <svg
                    className={`w-4 h-4 ml-2 transition-colors duration-200 ${
                        isError ? 'text-red-500' : isOpen ? 'text-blue-600' : 'text-gray-400'
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                </svg>
            </div>

            {isOpen && position && createPortal(
                <div
                    ref={calendarRef}
                    className="z-[9999] bg-white border border-gray-200 rounded-lg shadow-lg p-4"
                    style={{
                        position: 'fixed',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        minWidth: '280px'
                    }}
                >
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-blue-700">
                            {monthNames[month]} {year}
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                            <div key={day} className="p-2 text-xs font-medium text-gray-500 text-center">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((day, index) => {
                            const isCurrentMonth = day.getMonth() === month;
                            const isToday = day.toDateString() === new Date().toDateString();
                            const isSelected = value === day.toISOString().split('T')[0];
                            const dateString = day.toISOString().split('T')[0];

                            return (
                                <button
                                    key={index}
                                    onClick={() => isCurrentMonth && handleDateSelect(dateString)}
                                    disabled={!isCurrentMonth}
                                    className={`p-2 text-sm rounded transition-all duration-200 ${
                                        !isCurrentMonth
                                            ? 'text-gray-300 cursor-not-allowed'
                                            : isSelected
                                            ? 'bg-blue-600 text-white font-medium'
                                            : isToday
                                            ? 'bg-blue-100 text-blue-700 font-medium hover:bg-blue-200'
                                            : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                                    }`}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default DateChipSelect;