"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "@/contexts/LanguageContext";

interface MonthPickerProps {
    label?: string;
    value?: string; // Format: YYYY-MM
    onChange: (value: string) => void;
    disabled?: boolean;
    placeholder?: string;
    className?: string;
}

const MONTH_KEYS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

export function MonthPicker({
    label,
    value,
    onChange,
    disabled = false,
    placeholder = "Select date",
    className = "",
}: MonthPickerProps) {
    const { t } = useTranslation();
    const MONTHS = MONTH_KEYS.map(k => ({
        short: t(`monthPicker.months.${k}`),
        full: t(`monthPicker.monthsFull.${k}`),
    }));
    const [isOpen, setIsOpen] = useState(false);
    const [year, setYear] = useState(() => {
        if (value) {
            return parseInt(value.split("-")[0]);
        }
        return new Date().getFullYear();
    });
    const containerRef = useRef<HTMLDivElement>(null);

    // Sincronizar estado do ano quando o value prop mudar
    useEffect(() => {
        if (value) {
            const [y] = value.split("-");
            setYear(parseInt(y));
        }
    }, [value]);

    // Parse current value
    const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;
    const selectedYear = value ? parseInt(value.split("-")[0]) : null;

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleMonthSelect = (monthIndex: number) => {
        const month = (monthIndex + 1).toString().padStart(2, "0");
        onChange(`${year}-${month}`);
        setIsOpen(false);
    };

    const formatDisplayValue = () => {
        if (!value) return "";
        const [y, m] = value.split("-");
        const monthIndex = parseInt(m) - 1;
        return `${MONTHS[monthIndex]?.full || ""} ${y}`;
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                    {label}
                </label>
            )}

            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`
          w-full flex items-center justify-between px-4 py-3
          bg-transparent
          border-b border-stone-300
          focus:border-orange-600 focus:outline-none
          transition-colors text-left
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-stone-400 cursor-pointer"}
          font-serif text-lg
        `}
            >
                <span className={value ? "text-stone-900" : "text-stone-300"}>
                    {value ? formatDisplayValue() : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {isOpen && !disabled && (
                <div className="absolute z-[100] mt-1 w-full bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden">
                    {/* Year Navigation */}
                    <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-200">
                        <button
                            type="button"
                            onClick={() => setYear((y) => y - 1)}
                            className="p-1 rounded hover:bg-stone-200"
                        >
                            <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="font-semibold text-stone-900 font-display">{year}</span>
                        <button
                            type="button"
                            onClick={() => setYear((y) => y + 1)}
                            className="p-1 rounded hover:bg-stone-200"
                        >
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Month Grid */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-1 p-2">
                        {MONTHS.map((month, index) => {
                            const isSelected = selectedMonth === index && selectedYear === year;
                            const isCurrent = new Date().getMonth() === index && new Date().getFullYear() === year;

                            return (
                                <button
                                    key={month.short}
                                    type="button"
                                    onClick={() => handleMonthSelect(index)}
                                    className={`
                    px-2 py-2 text-sm rounded-sm font-medium transition-colors font-serif
                    ${isSelected
                                            ? "bg-orange-500 text-white"
                                            : isCurrent
                                                ? "bg-orange-100 text-orange-600"
                                                : "hover:bg-stone-100 text-stone-700"
                                        }
                  `}
                                >
                                    {month.short}
                                </button>
                            );
                        })}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between px-3 py-2 border-t border-stone-200 bg-stone-50">
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-sm text-stone-500 hover:text-stone-700 font-serif"
                        >
                            {t('monthPicker.clear')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const now = new Date();
                                setYear(now.getFullYear());
                                handleMonthSelect(now.getMonth());
                            }}
                            className="text-sm text-orange-600 hover:text-orange-700 font-medium font-serif"
                        >
                            {t('monthPicker.thisMonth')}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
