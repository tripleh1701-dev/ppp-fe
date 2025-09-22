'use client';

import React, {useState, useEffect} from 'react';

interface ModernDatePickerProps {
    value?: string;
    includeTime?: boolean;
    onDateChange: (date: string, time?: string) => void;
    onClose: () => void;
    position: {left: number; top: number};
    onTimeToggle?: () => void;
}

export function ModernDatePicker({
    value,
    includeTime = false,
    onDateChange,
    onClose,
    position,
    onTimeToggle,
}: ModernDatePickerProps) {
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('09:00');
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
    const [showTimeToggle, setShowTimeToggle] = useState(includeTime);

    useEffect(() => {
        if (value) {
            if (value.includes(' ')) {
                const [date, time] = value.split(' ');
                setSelectedDate(date);
                setSelectedTime(time || '09:00');
            } else {
                setSelectedDate(value);
            }
        }
    }, [value]);

    const today = new Date();
    // Use local date formatting to avoid timezone issues
    const todayStr = `${today.getFullYear()}-${String(
        today.getMonth() + 1,
    ).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    const getDaysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDateSelect = (day: number) => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        // Use local date formatting to avoid timezone issues
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            day,
        ).padStart(2, '0')}`;
        setSelectedDate(dateStr);

        if (showTimeToggle) {
            onDateChange(dateStr, selectedTime);
        } else {
            onDateChange(dateStr);
        }
    };

    const handleTimeChange = (newTime: string) => {
        setSelectedTime(newTime);
        if (selectedDate) {
            onDateChange(selectedDate, newTime);
        }
    };

    const handleTodayClick = () => {
        setSelectedDate(todayStr);
        if (showTimeToggle) {
            onDateChange(todayStr, selectedTime);
        } else {
            onDateChange(todayStr);
        }
    };

    const handleTimeToggleClick = () => {
        const newShowTime = !showTimeToggle;
        setShowTimeToggle(newShowTime);
        onTimeToggle?.();

        if (selectedDate) {
            if (newShowTime) {
                onDateChange(selectedDate, selectedTime);
            } else {
                onDateChange(selectedDate);
            }
        }
    };

    const monthNames = [
        'January',
        'February',
        'March',
        'April',
        'May',
        'June',
        'July',
        'August',
        'September',
        'October',
        'November',
        'December',
    ];

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className='w-8 h-8'></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        // Use local date formatting to avoid timezone issues
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(
            day,
        ).padStart(2, '0')}`;
        const isSelected = selectedDate === dateStr;
        const isToday = dateStr === todayStr;

        days.push(
            <button
                key={day}
                onClick={() => handleDateSelect(day)}
                className={`w-8 h-8 rounded-lg text-sm font-medium transition-all duration-200 hover:scale-110 ${
                    isSelected
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : isToday
                        ? 'bg-gradient-to-r from-orange-400 to-pink-500 text-white shadow-md'
                        : 'hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:text-blue-700'
                }`}
            >
                {day}
            </button>,
        );
    }

    return (
        <div className='fixed inset-0 z-50' onClick={onClose}>
            <div
                className='absolute bg-white rounded-xl shadow-2xl border border-gray-200 p-4 min-w-[320px]'
                style={{left: position.left, top: position.top}}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className='flex items-center justify-between mb-4'>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={() =>
                                setCurrentMonth(
                                    new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth() - 1,
                                    ),
                                )
                            }
                            className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                        >
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M15 19l-7-7 7-7'
                                />
                            </svg>
                        </button>
                        <h3 className='font-semibold text-gray-800 min-w-[140px] text-center'>
                            {monthNames[currentMonth.getMonth()]}{' '}
                            {currentMonth.getFullYear()}
                        </h3>
                        <button
                            onClick={() =>
                                setCurrentMonth(
                                    new Date(
                                        currentMonth.getFullYear(),
                                        currentMonth.getMonth() + 1,
                                    ),
                                )
                            }
                            className='p-2 rounded-lg hover:bg-gray-100 transition-colors'
                        >
                            <svg
                                className='w-4 h-4'
                                fill='none'
                                stroke='currentColor'
                                viewBox='0 0 24 24'
                            >
                                <path
                                    strokeLinecap='round'
                                    strokeLinejoin='round'
                                    strokeWidth={2}
                                    d='M9 5l7 7-7 7'
                                />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Weekday headers */}
                <div className='grid grid-cols-7 gap-1 mb-2'>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                        <div
                            key={day}
                            className='w-8 h-8 flex items-center justify-center text-xs font-medium text-gray-500'
                        >
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar grid */}
                <div className='grid grid-cols-7 gap-1 mb-4'>{days}</div>

                {/* Time picker (if enabled) */}
                {showTimeToggle && (
                    <div className='mb-4 p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg'>
                        <div className='flex items-center gap-3'>
                            <span className='text-sm font-medium text-gray-700'>
                                Time:
                            </span>
                            <input
                                type='time'
                                value={selectedTime}
                                onChange={(e) =>
                                    handleTimeChange(e.target.value)
                                }
                                className='px-3 py-1.5 border border-gray-300 rounded-lg bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                            />
                        </div>
                    </div>
                )}

                {/* Action buttons */}
                <div className='flex items-center justify-between'>
                    <div className='flex gap-2'>
                        <button
                            onClick={handleTodayClick}
                            className='px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105'
                        >
                            Today
                        </button>
                        <button
                            onClick={handleTimeToggleClick}
                            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 hover:scale-105 ${
                                showTimeToggle
                                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                                    : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-700 hover:shadow-md'
                            }`}
                        >
                            🕒 Time
                        </button>
                    </div>
                    <button
                        onClick={onClose}
                        className='px-3 py-1.5 bg-gradient-to-r from-gray-500 to-gray-600 text-white text-sm font-medium rounded-lg hover:shadow-lg transition-all duration-200 hover:scale-105'
                    >
                        Done
                    </button>
                </div>
            </div>
        </div>
    );
}
