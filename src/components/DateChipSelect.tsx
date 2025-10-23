import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronLeft, ChevronRight, X, Calendar } from 'lucide-react';

interface DateChipSelectProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    isError?: boolean;
    compact?: boolean;
    className?: string;
    minDate?: string; // Minimum selectable date (YYYY-MM-DD format)
    maxDate?: string; // Maximum selectable date (YYYY-MM-DD format)
}

const DateChipSelect: React.FC<DateChipSelectProps> = ({
    value,
    onChange,
    placeholder = "Select date",
    isError = false,
    compact = false,
    className = "",
    minDate,
    maxDate
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number; width: number } | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
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
                top: rect.bottom + window.scrollY + 8,
                left: rect.right + window.scrollX - 320, // Position calendar to align with right side
                width: 320
            });
            setIsOpen(!isOpen);
        }
    };

    const handleDateSelect = (date: string) => {
        onChange(date);
        setIsOpen(false);
    };

    const handleClearDate = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange('');
    };

    const navigateMonth = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            if (currentMonth === 0) {
                setCurrentMonth(11);
                setCurrentYear(currentYear - 1);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
        } else {
            if (currentMonth === 11) {
                setCurrentMonth(0);
                setCurrentYear(currentYear + 1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
        }
    };

    // Generate calendar for current month/year
    const generateCalendar = () => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        const days = [];
        const current = new Date(startDate);
        
        for (let i = 0; i < 42; i++) {
            days.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }
        
        return { days, month: currentMonth, year: currentYear };
    };

    const { days } = generateCalendar();
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        try {
            // Parse the date string as a local date to avoid timezone issues
            const [year, month, day] = dateString.split('-').map(Number);
            const date = new Date(year, month - 1, day); // month is 0-indexed
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
                className={`relative flex items-center justify-between w-full px-2 py-1 text-sm bg-white border rounded-md cursor-pointer transition-all duration-200 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-500 min-h-[24px] ${
                    isError 
                        ? 'border-red-500 bg-red-50 ring-2 ring-red-200' 
                        : isOpen
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-blue-300'
                } ${compact ? 'py-1' : ''} ${className}`}
            >
                {/* Content area with text and clear button */}
                <div className="flex items-center flex-1 min-w-0">
                    <span className={`flex-1 truncate ${!value ? 'text-gray-500' : 'text-gray-900'}`}>
                        {value ? formatDisplayDate(value) : placeholder}
                    </span>
                    {value && (
                        <button
                            onClick={handleClearDate}
                            className="ml-2 p-0.5 text-gray-400 hover:text-red-500 rounded transition-colors duration-200 flex-shrink-0"
                            title="Clear date"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                </div>
                
                {/* Calendar icon - positioned based on whether field is focused/clicked */}
                <div className={`flex items-center transition-all duration-300 ease-in-out ${
                    isOpen || value ? 'ml-2' : 'absolute left-1/2 transform -translate-x-1/2'
                }`}>
                    <Calendar className={`w-4 h-4 transition-all duration-300 ${
                        isError 
                            ? 'text-red-500' 
                            : isOpen 
                            ? 'text-blue-600 scale-110' 
                            : value 
                            ? 'text-gray-400' 
                            : 'text-blue-400'
                    }`} />
                </div>
            </div>

            {isOpen && position && createPortal(
                <div
                    ref={calendarRef}
                    className="z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
                    style={{
                        position: 'fixed',
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${position.width}px`,
                        animation: 'slideInFromTop 0.3s ease-out forwards'
                    }}
                >
                    <style jsx>{`
                        @keyframes slideInFromTop {
                            from {
                                opacity: 0;
                                transform: translateY(-10px) scale(0.95);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0) scale(1);
                            }
                        }
                    `}</style>
                    
                    {/* Calendar Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3">
                        <div className="flex items-center justify-between">
                            <button
                                onClick={() => navigateMonth('prev')}
                                className="p-1 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Previous month"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            
                            <h3 className="text-lg font-semibold text-white">
                                {monthNames[currentMonth]} {currentYear}
                            </h3>
                            
                            <button
                                onClick={() => navigateMonth('next')}
                                className="p-1 text-white hover:bg-white/20 rounded-lg transition-all duration-200 hover:scale-110"
                                title="Next month"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Calendar Body */}
                    <div className="p-4 bg-white">
                        {/* Calendar Grid Header */}
                        <div className="grid grid-cols-7 gap-1 mb-3">
                            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                                <div key={day} className="p-2 text-xs font-semibold text-gray-500 text-center">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {days.map((day, index) => {
                                const isCurrentMonth = day.getMonth() === currentMonth;
                                const isToday = day.toDateString() === new Date().toDateString();
                                // Format date as YYYY-MM-DD using local date components to avoid timezone issues
                                const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
                                const isSelected = value === dateString;
                                
                                // Check if date is within allowed range
                                const isDisabledByRange = (minDate && dateString < minDate) || (maxDate && dateString > maxDate);
                                // Allow selection of dates from adjacent months if they're within the valid range
                                const isDisabled = Boolean(isDisabledByRange);

                                return (
                                    <button
                                        key={index}
                                        onClick={() => !isDisabled && handleDateSelect(dateString)}
                                        disabled={isDisabled}
                                        className={`p-2 text-sm rounded-lg transition-all duration-200 ${
                                            isDisabled
                                                ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                                                : isSelected
                                                ? 'bg-blue-600 text-white font-semibold shadow-lg scale-105'
                                                : isToday
                                                ? 'bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 border-2 border-blue-300 hover:scale-105'
                                                : !isCurrentMonth
                                                ? 'text-gray-400 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:scale-105' // Adjacent month dates (lighter but clickable)
                                                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600 hover:shadow-md hover:scale-105'
                                        }`}
                                    >
                                        {day.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Calendar Footer */}
                    <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                            <button
                                onClick={() => {
                                    const today = new Date();
                                    const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                                    handleDateSelect(todayString);
                                }}
                                className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium"
                            >
                                Today
                            </button>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default DateChipSelect;