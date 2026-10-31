import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { LogOut, User, Settings, Layout, Menu, X, TreePine, Zap } from 'lucide-react';

export default function Header({ isStudioOpen, onToggleStudio, onToggleForm }) {
  const { user, logout } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef(null);

  const displayName = user 
    ? [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.username || user.email 
    : '';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white font-bold shadow-lg shadow-teal-200">
          FT
        </div>
        <div className="hidden sm:block">
          <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Family Tree Builder
            <TreePine className="h-4 w-4 text-emerald-600" />
          </h1>
          <p className="text-[10px] uppercase tracking-wider text-teal-600 font-bold flex items-center gap-1">
            Workspace
            <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 p-1 pr-3 transition-all hover:bg-slate-100 active:scale-95"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-100 text-teal-700 font-bold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <span className="hidden text-sm font-medium text-slate-700 md:block">{displayName}</span>
            <Menu className="h-4 w-4 text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl border border-slate-100 bg-white p-2 shadow-2xl ring-1 ring-black/5 animate-in fade-in zoom-in duration-100">
              <div className="px-3 py-2 border-b border-slate-50 mb-1">
                <p className="text-xs text-slate-400">Signed in as</p>
                <p className="truncate text-sm font-semibold text-slate-700">{user.email}</p>
              </div>
              
              <button
                onClick={() => {
                  onToggleStudio();
                  setIsProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                {isStudioOpen ? <Layout className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
                {isStudioOpen ? 'Home Dashboard' : 'Open Studio'}
              </button>

              <button
                onClick={() => {
                  onToggleForm();
                  setIsProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50"
              >
                <Layout className="h-4 w-4" />
                Toggle Form Panel
              </button>

              <div className="h-px bg-slate-50 my-1" />
              
              <button
                onClick={() => {
                  logout();
                  setIsProfileOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-rose-600 transition-colors hover:bg-rose-50"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
