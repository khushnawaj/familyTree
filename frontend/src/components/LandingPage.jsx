import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import { useAuth } from '../contexts/AuthContext';
import { TreePine, Users, Share2, MousePointer2 } from 'lucide-react';

export default function LandingPage() {
  const [authMode, setAuthMode] = useState('login');

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 md:p-12">
      <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        {/* Hero Section */}
        <div className="space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-semibold">
            <TreePine className="h-4 w-4" />
            Family Tree Builder
          </div>
          
          <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight">
            Design your family tree in a <span className="text-teal-600">clean workspace.</span>
          </h1>
          
          <p className="text-lg text-slate-600 max-w-xl leading-relaxed">
            Add members, connect parents, children, and spouses, and manage generations from one easy dashboard. 
            Works smoothly on desktop, tablet, and mobile.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
            <FeatureItem 
              icon={<Users className="h-5 w-5 text-teal-600" />}
              title="Quick Member Editor"
              desc="Easily add and edit family members with photos."
            />
            <FeatureItem 
              icon={<Share2 className="h-5 w-5 text-teal-600" />}
              title="Auto-Placement"
              desc="Intelligent layout for complex relationships."
            />
            <FeatureItem 
              icon={<MousePointer2 className="h-5 w-5 text-teal-600" />}
              title="Deep Zoom Support"
              desc="Navigate large trees with smooth interactions."
            />
            <FeatureItem 
              icon={<TreePine className="h-5 w-5 text-teal-600" />}
              title="Export Anywhere"
              desc="Save your tree as high-quality images."
            />
          </div>
        </div>

        {/* Auth Section */}
        <div className="flex flex-col items-center">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-slate-200 border border-slate-100 p-2">
            <div className="flex p-1 bg-slate-50 rounded-2xl mb-4">
              <button 
                onClick={() => setAuthMode('login')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${authMode === 'login' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Sign In
              </button>
              <button 
                onClick={() => setAuthMode('register')}
                className={`flex-1 py-2 text-sm font-semibold rounded-xl transition-all ${authMode === 'register' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Create Account
              </button>
            </div>
            
            <div className="p-6">
              {authMode === 'login' ? (
                <Login onSwitchToRegister={() => setAuthMode('register')} />
              ) : (
                <Register onSwitchToLogin={() => setAuthMode('login')} />
              )}
            </div>
          </div>
        </div>
      </div>
      
      <footer className="mt-24 pt-8 border-t border-slate-200 w-full flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm text-slate-400">
        <span>© 2026 Family Tree Builder</span>
        <a href="#" className="hover:text-slate-600">Privacy</a>
        <a href="#" className="hover:text-slate-600">Terms</a>
        <a href="#" className="hover:text-slate-600">Contact</a>
      </footer>
    </div>
  );
}

function FeatureItem({ icon, title, desc }) {
  return (
    <div className="flex gap-3 items-start">
      <div className="mt-1 flex-shrink-0">{icon}</div>
      <div>
        <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500">{desc}</p>
      </div>
    </div>
  );
}
