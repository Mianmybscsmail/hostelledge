import React from 'react';
import { Loader2 } from 'lucide-react';

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string; action?: React.ReactNode }> = ({ children, className = '', title, action }) => (
  <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm transition-colors duration-300 ${className}`}>
    {(title || action) && (
      <div className="flex justify-between items-center mb-4">
        {title && <h3 className="text-gray-900 dark:text-zinc-100 font-semibold text-lg">{title}</h3>}
        {action && <div>{action}</div>}
      </div>
    )}
    {children}
  </div>
);

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-gray-200 dark:bg-zinc-800 rounded-lg ${className}`} />
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost'; isLoading?: boolean }> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  isLoading = false,
  disabled,
  ...props 
}) => {
  const baseStyles = "w-full py-3 px-4 rounded-xl font-medium transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20",
    secondary: "bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-900 dark:text-zinc-200 border border-gray-200 dark:border-zinc-700",
    danger: "bg-red-500/10 text-red-600 dark:text-red-500 hover:bg-red-500/20 border border-red-500/20",
    ghost: "bg-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-200"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} disabled={isLoading || disabled} {...props}>
      {isLoading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label?: string }> = ({ label, className = '', ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">{label}</label>}
    <input 
      className={`w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all placeholder:text-gray-400 dark:placeholder:text-zinc-600 ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }> = ({ label, children, className = '', ...props }) => (
  <div className="mb-3">
    {label && <label className="block text-xs font-medium text-gray-500 dark:text-zinc-400 mb-1.5 ml-1">{label}</label>}
    <select 
      className={`w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 text-gray-900 dark:text-zinc-100 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-red-500/50 appearance-none ${className}`}
      {...props}
    >
      {children}
    </select>
  </div>
);
