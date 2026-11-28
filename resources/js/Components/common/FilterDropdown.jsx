import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

/**
 * FilterDropdown - Modern, polished filter dropdown for SIMONITA
 * Replaces clunky browser-native <select> boxes with sleek, rounded floating popovers.
 */
export default function FilterDropdown({
  value,
  onChange,
  options = [], // Array of string ['ALL', 'aktif'] OR array of object [{ value: 'ALL', label: 'Semua Status' }]
  label = '', // e.g. "Status" or "Angkatan"
  icon: Icon = null,
  placeholder = 'Pilih...',
  align = 'left', // 'left' | 'right'
  className = '',
  buttonClassName = '',
  menuClassName = '',
  accentColor = 'indigo' // 'indigo' | 'blue' | 'emerald'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Normalize options into array of { value, label }
  const normalizedOptions = options.map((opt) => {
    if (typeof opt === 'object' && opt !== null) {
      return {
        value: opt.value,
        label: opt.label ?? String(opt.value),
        icon: opt.icon || null,
        badge: opt.badge || null
      };
    }
    return {
      value: opt,
      label: String(opt)
    };
  });

  const selectedOption = normalizedOptions.find((opt) => String(opt.value) === String(value)) || normalizedOptions[0];

  const isFiltered = value !== undefined && value !== null && value !== 'ALL' && value !== '';

  const getAccentStyles = () => {
    switch (accentColor) {
      case 'blue':
        return {
          activeBtn: 'border-blue-300 ring-2 ring-blue-100 bg-blue-50/30 text-blue-900',
          activeItem: 'bg-blue-50 text-blue-700 font-bold',
          checkIcon: 'text-blue-600',
          filterBadge: 'text-blue-600 font-bold'
        };
      case 'emerald':
        return {
          activeBtn: 'border-emerald-300 ring-2 ring-emerald-100 bg-emerald-50/30 text-emerald-900',
          activeItem: 'bg-emerald-50 text-emerald-700 font-bold',
          checkIcon: 'text-emerald-600',
          filterBadge: 'text-emerald-600 font-bold'
        };
      case 'indigo':
      default:
        return {
          activeBtn: 'border-indigo-300 ring-2 ring-indigo-100 bg-indigo-50/30 text-indigo-900',
          activeItem: 'bg-indigo-50 text-indigo-700 font-bold',
          checkIcon: 'text-indigo-600',
          filterBadge: 'text-indigo-600 font-bold'
        };
    }
  };

  const accent = getAccentStyles();

  return (
    <div className={`relative inline-block text-left ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border transition-all duration-150 cursor-pointer shadow-xs select-none ${
          isOpen
            ? accent.activeBtn
            : isFiltered
            ? 'border-slate-300 bg-slate-50/60 text-slate-800'
            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 text-slate-700'
        } ${buttonClassName}`}
      >
        {Icon && (
          <Icon className={`w-3.5 h-3.5 shrink-0 transition-colors ${
            isOpen || isFiltered ? accent.checkIcon : 'text-slate-400 group-hover:text-slate-500'
          }`} />
        )}
        
        {label && (
          <span className="text-slate-500 font-medium whitespace-nowrap">
            {label}:
          </span>
        )}

        <span className={`truncate max-w-[170px] ${isFiltered ? accent.filterBadge : 'text-slate-700 font-bold'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>

        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-slate-600' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Floating Menu Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1.5 min-w-[170px] w-max max-w-[280px] bg-white rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-100 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150 ${
            align === 'right' ? 'right-0' : 'left-0'
          } ${menuClassName}`}
          style={{ maxHeight: '280px', overflowY: 'auto' }}
        >
          {normalizedOptions.map((opt) => {
            const isSelected = String(opt.value) === String(value);
            return (
              <button
                key={String(opt.value)}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left font-medium transition-all duration-100 cursor-pointer ${
                  isSelected
                    ? accent.activeItem
                    : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2 truncate mr-2">
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && <Check className={`w-3.5 h-3.5 shrink-0 ${accent.checkIcon}`} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
