import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Login({ onSwitchToRegister }) {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(form.email, form.password);
    setLoading(false);
  };

  return (
    <div className="w-full">
      <div className="space-y-1 mb-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h2>
        <p className="text-slate-500 text-sm">Enter your credentials to access your family tree.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
            <Mail className="h-3 w-3" />
            Email Address
          </label>
          <input
            type="email"
            placeholder="name@company.com"
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
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
            className="w-full rounded-2xl border border-slate-200 p-4 text-sm bg-slate-50 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={loading} 
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all active:scale-[0.98] shadow-xl shadow-teal-100 disabled:opacity-50"
        >
          {loading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              Sign In to Account
            </>
          )}
        </button>
      </form>
      
      <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
        <span className="text-sm text-slate-500">New to Family Tree?</span>
        <button 
          onClick={onSwitchToRegister} 
          className="text-sm font-bold text-teal-600 hover:text-teal-700 flex items-center gap-1 group"
        >
          Create account
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}