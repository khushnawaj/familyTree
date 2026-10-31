import React from 'react';
import { X, Edit3, Calendar, MapPin, Briefcase, Info } from 'lucide-react';
import { cn } from '../lib/utils';
import Avatar from './Avatar';

export default function MemberDetailModal({ member, onClose, onEdit }) {
  if (!member) return null;

  const fullName = `${member.firstName || ''} ${member.lastName || ''}`.trim() || 'Unnamed Member';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-white rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Top Header with Image */}
        <div className="relative h-48 bg-slate-50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
          <div className="absolute inset-0 opacity-30 blur-xl scale-110">
            <Avatar 
              src={member.imageUrl} 
              gender={member.gender} 
              firstName={member.firstName} 
              className="w-full h-full" 
            />
          </div>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/20 backdrop-blur-md text-white hover:bg-white/40 transition-all"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Profile Info Overlay */}
        <div className="absolute top-32 left-8 z-20 flex items-end gap-6">
          <Avatar 
            src={member.imageUrl} 
            gender={member.gender} 
            firstName={member.firstName} 
            isChild={(member.parents || []).length > 0 && (member.children || []).length === 0}
            className="h-32 w-32 border-4" 
          />
          <div className="mb-2 space-y-1">
            <h2 className="text-2xl font-black text-white drop-shadow-md">{fullName}</h2>
            <div className={cn(
              "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white shadow-sm",
              member.gender === 'Male' ? "bg-blue-600" : member.gender === 'Female' ? "bg-rose-600" : "bg-slate-700"
            )}>
              {member.gender || 'Other'}
              <div className="h-1 w-1 rounded-full bg-white/50" />
              {member.isLiving ? 'Living' : 'Deceased'}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="pt-20 px-8 pb-8 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            <InfoItem 
              icon={<Calendar className="h-4 w-4 text-teal-600" />} 
              label="Birth Date" 
              value={member.dob ? new Date(member.dob).toLocaleDateString('en-GB') : 'Unknown'} 
            />
            {!member.isLiving && (
              <InfoItem 
                icon={<Calendar className="h-4 w-4 text-rose-600" />} 
                label="Death Date" 
                value={member.dod ? new Date(member.dod).toLocaleDateString('en-GB') : 'Unknown'} 
              />
            )}
            <InfoItem 
              icon={<MapPin className="h-4 w-4 text-teal-600" />} 
              label="Birthplace" 
              value={member.placeOfBirth || 'Not specified'} 
            />
            <InfoItem 
              icon={<Briefcase className="h-4 w-4 text-teal-600" />} 
              label="Occupation" 
              value={member.occupation || 'Not specified'} 
            />
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
              <Info className="h-3 w-3" />
              Biography & Notes
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic border border-slate-100">
              {member.bio || 'No biography has been added for this family member yet.'}
            </p>
          </div>

          <button 
            onClick={() => onEdit(member._id)}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all active:scale-[0.98] shadow-xl shadow-slate-200"
          >
            <Edit3 className="h-4 w-4" />
            Edit Full Details
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ icon, label, value }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
      <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
        {icon}
        {value}
      </div>
    </div>
  );
}
