import React from 'react';

export default function ProfileCard({ member, onClick, onEdit, onDelete }) {
  const avatar = member.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.firstName + ' ' + (member.lastName || ''))}&background=8B5CF6&color=fff`;

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 bg-slate-50 p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-md" role="button" tabIndex={0}>
      <div
        className="flex cursor-pointer items-center gap-3 max-[480px]:flex-col max-[480px]:text-center"
        onClick={onClick}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
      >
        <img src={avatar} alt={`${member.firstName} avatar`} className="h-14 w-14 rounded-full object-cover max-[768px]:h-12 max-[768px]:w-12 max-[480px]:h-10 max-[480px]:w-10" />
        <div>
          <div className="text-[15px] font-bold text-slate-900 max-[768px]:text-sm max-[480px]:text-[13px]">{member.firstName} {member.lastName}</div>
          <div className="text-xs text-slate-500 max-[480px]:text-[10px]">{member.relation || 'Relative'}</div>
        </div>
      </div>

      <div className="mt-2 line-clamp-3 text-[13px] text-slate-700 max-[768px]:text-xs max-[480px]:mt-2 max-[480px]:text-[11px]">{member.about || 'No bio provided.'}</div>

      <div className="mt-3 flex justify-end gap-2 max-[480px]:justify-center">
        <button className="rounded-md bg-slate-200 px-3 py-1.5 text-xs text-slate-800 max-[480px]:flex-1" onClick={onEdit}>Edit</button>
        <button className="rounded-md bg-rose-100 px-3 py-1.5 text-xs text-rose-700 max-[480px]:flex-1" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
