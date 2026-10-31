import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, AtSign, ArrowRight, UserPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Register({ onSwitchToLogin }) {
  const [form, setForm] = useState({ 
    username: '', 
    email: '', 
    password: '', 
    firstName: '', 
    lastName: '' 
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await register(form);
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="space-y-1 mb-6">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Create workspace</h2>
        <p className="text-slate-500 text-sm">Start your genealogy journey today.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              First Name
            </label>
            <input
              type="text"
              placeholder="e.g. John"
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              Last Name
            </label>
            <input
              type="text"
              placeholder="e.g. Doe"
              className="w-full rounded-2xl border border-slate-200 p-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <AtSign className="h-3 w-3" />
            Username
          </label>
          <input
            type="text"
            placeholder="john_doe"
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Mail className="h-3 w-3" />
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>
        
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Lock className="h-3 w-3" />
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-2xl border border-slate-200 p-3 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all active:scale-[0.98] shadow-xl shadow-teal-100 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <UserPlus className="h-5 w-5" />
              Start Free Trial
            </>
          )}
        </button>
      </form>
      
      <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-500">Have an account?</span>
        <button 
          onClick={onSwitchToLogin} 
          className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
        >
          Sign In
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}