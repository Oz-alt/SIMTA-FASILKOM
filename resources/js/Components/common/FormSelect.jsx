import React from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FormSelect - Polished Form Select Input
 * Modern stylized native select with custom SVG chevron and consistent SIMONITA styling.
 */
export default function FormSelect({
  label,
  value,
  onChange,
  options = [], // [{ value, label }] or strings
  placeholder = '',
  required = false,
  disabled = false,
  error = '',
  className = '',
  selectClassName = '',
  id,
  name,
  ...props
}) {
  const selectId = id || (name ? `select-${name}` : undefined);

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-xs font-bold text-slate-700">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          id={selectId}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          required={required}
          className={`w-full appearance-none px-3.5 py-2.5 pr-10 text-xs font-medium rounded-xl border bg-white transition-all cursor-pointer outline-none ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-rose-900'
              : 'border-slate-200 hover:border-slate-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 text-slate-800'
          } ${disabled ? 'bg-slate-50 opacity-60 cursor-not-allowed' : ''} ${selectClassName}`}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => {
            const optVal = typeof opt === 'object' && opt !== null ? opt.value : opt;
            const optLabel = typeof opt === 'object' && opt !== null ? opt.label : opt;
            return (
              <option key={String(optVal)} value={optVal}>
                {optLabel}
              </option>
            );
          })}
        </select>

        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>

      {error && <p className="text-[11px] font-semibold text-rose-600">{error}</p>}
    </div>
  );
}
