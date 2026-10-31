import React from 'react';
import { 
  Layout, 
  Users, 
  Heart, 
  Calendar, 
  ArrowRight, 
  Star, 
  PlusCircle, 
  TreePine, 
  Sparkles, 
  History, 
  Layers, 
  Camera, 
  Link2, 
  Smartphone, 
  Rocket 
} from 'lucide-react';
import { cn } from '../lib/utils';
import Avatar from './Avatar';

export default function UserDashboard({ user, members, onOpenStudio, onCreateMember }) {
  const livingCount = members.filter(m => m.isLiving !== false).length;
  const deceasedCount = members.length - livingCount;
  
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username;

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-xs font-black uppercase tracking-widest">
              <Star className="h-3 w-3 fill-teal-600" />
              Family Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight flex items-center flex-wrap gap-2">
              <span>Welcome back, <span className="text-teal-600">{displayName}!</span></span>
              <Sparkles className="h-8 w-8 text-amber-500 fill-amber-400/30 inline-block animate-pulse" />
            </h1>
            <p className="text-slate-500 font-medium">Your family tree is growing. Here is what's new.</p>
          </div>
          
          <div className="flex gap-3">
            <button 
              onClick={onCreateMember}
              className="px-6 py-3 rounded-2xl bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95 flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="h-5 w-5 text-teal-600" />
              Quick Add
            </button>
            <button 
              onClick={onOpenStudio}
              className="px-8 py-3 rounded-2xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-2 shadow-xl shadow-teal-100"
            >
              Open Studio
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            icon={TreePine} 
            label="Total Members" 
            value={members.length} 
            color="bg-emerald-50 text-emerald-700 border-emerald-100" 
            iconBg="bg-emerald-500/15 text-emerald-600"
          />
          <StatCard 
            icon={Sparkles} 
            label="Living Members" 
            value={livingCount} 
            color="bg-blue-50 text-blue-700 border-blue-100" 
            iconBg="bg-blue-500/15 text-blue-600"
          />
          <StatCard 
            icon={History} 
            label="Ancestors" 
            value={deceasedCount} 
            color="bg-slate-100 text-slate-700 border-slate-200" 
            iconBg="bg-slate-500/15 text-slate-600"
          />
          <StatCard 
            icon={Layers} 
            label="Generations" 
            value={Math.ceil(members.length / 3) || 0} 
            color="bg-purple-50 text-purple-700 border-purple-100" 
            iconBg="bg-purple-500/15 text-purple-600"
          />
        </div>

        {/* Quick Actions / Recent Members */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Users className="h-6 w-6 text-teal-600" />
              Recent Family Additions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {members.slice(0, 4).map(member => (
                <div key={member._id} className="group p-4 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-teal-100 transition-all duration-300 flex items-center gap-4">
                  <Avatar 
                    src={member.imageUrl} 
                    gender={member.gender} 
                    firstName={member.firstName} 
                    isChild={(member.parents || []).length > 0 && (member.children || []).length === 0}
                    className="h-14 w-14" 
                  />
                  <div>
                    <h4 className="font-bold text-slate-900 group-hover:text-teal-700 transition-colors">{member.firstName} {member.lastName}</h4>
                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{member.occupation || 'Family Member'}</p>
                  </div>
                </div>
              ))}
              {members.length === 0 && (
                <div className="col-span-2 p-12 bg-white rounded-[40px] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center">
                  <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                    <Rocket className="h-6 w-6" />
                  </div>
                  <p className="text-slate-500 font-semibold">No family members added yet. Start your journey today!</p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Star className="h-6 w-6 text-amber-500" />
              Tree Tips
            </h3>
            <div className="space-y-4">
              <TipCard 
                icon={Camera} 
                iconColor="text-teal-600 bg-teal-50 border-teal-100"
                title="Add Photos" 
                desc="Profiles with photos are 5x more engaging for your family." 
              />
              <TipCard 
                icon={Link2} 
                iconColor="text-blue-600 bg-blue-50 border-blue-100"
                title="Link Spouses" 
                desc="Don't forget to link spouses to see marriage lines clearly." 
              />
              <TipCard 
                icon={Smartphone} 
                iconColor="text-purple-600 bg-purple-50 border-purple-100"
                title="Mobile View" 
                desc="You can edit your tree on the go from your smartphone." 
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, iconBg }) {
  return (
    <div className={cn("p-6 rounded-[32px] border transition-all hover:scale-[1.02] duration-300 shadow-sm", color)}>
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow-sm", iconBg)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="text-sm font-black uppercase tracking-widest opacity-70 mb-1">{label}</div>
      <div className="text-4xl font-black">{value}</div>
    </div>
  );
}

function TipCard({ icon: Icon, iconColor, title, desc }) {
  return (
    <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex gap-4 items-start hover:border-slate-200 transition-all">
      <div className={cn("p-3 rounded-2xl border flex items-center justify-center flex-shrink-0 mt-0.5", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="space-y-1">
        <h4 className="font-black text-slate-800 text-sm">{title}</h4>
        <p className="text-xs text-slate-500 leading-relaxed font-medium">{desc}</p>
      </div>
    </div>
  );
}
