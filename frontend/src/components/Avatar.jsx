import React from 'react';
import { User, Baby } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Avatar({ src, gender, firstName, className, isChild }) {
  const getInitials = () => {
    return firstName ? firstName.charAt(0).toUpperCase() : '?';
  };

  if (src && !src.startsWith('data:image/svg+xml')) {
    return (
      <div className={cn("rounded-2xl overflow-hidden bg-slate-100 border-2 border-white shadow-sm flex-shrink-0", className)}>
        <img src={src} className="h-full w-full object-cover" alt="" />
      </div>
    );
  }

  // Placeholder
  return (
    <div className={cn(
      "rounded-2xl flex-shrink-0 border-2 border-white shadow-sm flex items-center justify-center transition-all",
      gender === 'Female' ? "bg-rose-50 text-rose-500" : gender === 'Male' ? "bg-teal-50 text-teal-500" : "bg-slate-50 text-slate-500",
      className
    )}>
      {isChild ? (
        <Baby className="h-1/2 w-1/2 opacity-70" />
      ) : (
        <User className="h-1/2 w-1/2 opacity-70" />
      )}
    </div>
  );
}
