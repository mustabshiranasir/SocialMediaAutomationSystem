// Input Component
import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  hint?: string;
}

export function Input({ label, error, icon, hint, className = "", ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-slate-700">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-800 text-sm
            placeholder:text-slate-400
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all
            ${error ? "border-red-400 focus:ring-red-400" : "border-slate-200"}
            ${icon ? "pl-10" : ""}
            ${className}
          `}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
  showCount?: boolean;
  maxCount?: number;
}

export function Textarea({ label, error, hint, showCount, maxCount, className = "", ...props }: TextareaProps) {
  const valueLength = typeof props.value === "string" ? props.value.length : 0;

  return (
    <div className="space-y-1.5">
      {label && (
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-slate-700">{label}</label>
          {showCount && (
            <span className={`text-xs font-medium ${maxCount && valueLength > maxCount ? "text-red-500" : "text-slate-400"}`}>
              {valueLength}{maxCount ? `/${maxCount}` : ""} chars
            </span>
          )}
        </div>
      )}
      <textarea
        className={`
          w-full bg-slate-50 border rounded-xl px-4 py-3 text-slate-800 text-sm
          placeholder:text-slate-400
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all resize-none
          ${error ? "border-red-400 focus:ring-red-400" : "border-slate-200"}
          ${className}
        `}
        {...props}
      />
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
      {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = "", ...props }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-slate-700">{label}</label>}
      <select
        className={`
          w-full bg-slate-50 border rounded-xl px-4 py-2.5 text-slate-800 text-sm
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          transition-all
          ${error ? "border-red-400" : "border-slate-200"}
          ${className}
        `}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
}
