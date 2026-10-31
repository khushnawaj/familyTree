import React from 'react';
import Avatar from './Avatar';
import { cn } from '../lib/utils';

export default function FamilyBook({ members }) {
  if (!members || members.length === 0) return null;

  return (
    <div id="family-book" className="hidden print:block bg-white p-0 m-0">
      {/* Title Page */}
      <div className="h-screen flex flex-col items-center justify-center p-20 text-center border-[20px] border-double border-teal-800">
        <h1 className="text-6xl font-black text-teal-900 mb-4 tracking-tighter">Family Heritage</h1>
        <div className="w-24 h-1 bg-teal-600 mb-8" />
        <p className="text-2xl font-serif italic text-slate-600">A Comprehensive Chronicle of Our Lineage</p>
        <div className="mt-20">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-slate-400">Generated on</p>
          <p className="text-lg font-bold text-slate-800">{new Date().toLocaleDateString('en-US', { dateStyle: 'long' })}</p>
        </div>
      </div>

      {/* Table of Contents */}
      <div className="h-screen p-20 page-break-before-always">
        <h2 className="text-3xl font-black text-slate-900 mb-12 border-b-2 border-slate-100 pb-4">Table of Contents</h2>
        <div className="grid grid-cols-2 gap-x-12 gap-y-4">
          {members.sort((a, b) => a.firstName.localeCompare(b.firstName)).map((member, idx) => (
            <div key={member._id} className="flex justify-between items-baseline border-b border-dotted border-slate-200 pb-1">
              <span className="text-sm font-bold text-slate-700">{member.firstName} {member.lastName}</span>
              <span className="text-xs font-serif text-slate-400 italic">Page {idx + 3}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Member Pages */}
      {members.map((member) => (
        <div key={member._id} className="h-screen p-16 page-break-before-always flex flex-col">
          <div className="flex gap-12 items-start mb-12">
            <div className="w-48 h-64 rounded-2xl overflow-hidden border-4 border-slate-50 shadow-xl flex-shrink-0">
              <Avatar 
                src={member.imageUrl} 
                gender={member.gender} 
                firstName={member.firstName}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-4 pt-4">
              <h3 className="text-5xl font-black text-slate-900 leading-tight">{member.firstName} {member.lastName}</h3>
              <div className="flex gap-4">
                <div className="px-3 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-bold uppercase tracking-widest">
                  {member.gender}
                </div>
                {member.occupation && (
                  <div className="px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-bold uppercase tracking-widest">
                    {member.occupation}
                  </div>
                )}
              </div>
              <div className="text-lg font-serif text-slate-500 italic">
                {member.dob ? new Date(member.dob).getFullYear() : 'Unknown'} 
                {' — '} 
                {member.isLiving ? 'Present' : (member.dod ? new Date(member.dod).getFullYear() : 'Unknown')}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-12 flex-1">
            <div className="col-span-2 space-y-8">
              <div className="space-y-3">
                <h4 className="text-xs font-black uppercase tracking-widest text-teal-600 border-b border-teal-100 pb-2">Biography</h4>
                <p className="text-lg text-slate-700 leading-relaxed font-serif first-letter:text-5xl first-letter:font-black first-letter:mr-3 first-letter:float-left">
                  {member.bio || "No biography available for this member. Their story remains to be told."}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-8 pt-4">
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Parents</h4>
                  <div className="space-y-1">
                    {(member.parents || []).length > 0 ? member.parents.map(pId => {
                      const p = members.find(m => m._id === pId);
                      return p ? <p key={pId} className="text-sm font-bold text-slate-800">{p.firstName} {p.lastName}</p> : null;
                    }) : <p className="text-xs text-slate-400 italic">Unknown</p>}
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-2">Spouses</h4>
                  <div className="space-y-1">
                    {(member.spouses || []).length > 0 ? member.spouses.map(sId => {
                      const s = members.find(m => m._id === sId);
                      return s ? <p key={sId} className="text-sm font-bold text-slate-800">{s.firstName} {s.lastName}</p> : null;
                    }) : <p className="text-xs text-slate-400 italic">None recorded</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
              <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Children</h4>
              <div className="space-y-3">
                {(member.children || []).length > 0 ? member.children.map(cId => {
                  const c = members.find(m => m._id === cId);
                  return c ? (
                    <div key={cId} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                        <Avatar src={c.imageUrl} gender={c.gender} firstName={c.firstName} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-xs font-bold text-slate-800">{c.firstName} {c.lastName}</span>
                    </div>
                  ) : null;
                }) : <p className="text-xs text-slate-400 italic">None recorded</p>}
              </div>
            </div>
          </div>

          <div className="mt-auto pt-8 border-t border-slate-100 flex justify-between text-[10px] font-bold text-slate-300 uppercase tracking-widest">
            <span>The KinTree Chronicle</span>
            <span>Family Record: {member._id.toString().slice(-6)}</span>
          </div>
        </div>
      ))}

      <style>{`
        @media print {
          body {
            background: white !important;
          }
          .page-break-before-always {
            page-break-before: always;
          }
          #family-book {
            display: block !important;
          }
          header, .timeline-slider, .toolbar, .react-flow__controls, .react-flow__minimap {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
