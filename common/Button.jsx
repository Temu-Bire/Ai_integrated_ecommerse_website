import React from 'react';

export default function Button({ children, variant = 'primary', className = '', ...props }) {
  const baseStyles = "px-5 py-2.5 rounded font-medium text-sm transition-all focus:outline-none";
  const variants = {
    primary: "bg-cyan-500 hover:bg-cyan-400 text-slate-950",
    secondary: "bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-slate-700"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}