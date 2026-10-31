import React, { useState, useEffect } from 'react';
import { 
  X, User, Info, Link as LinkIcon, Save, Trash2, ChevronLeft, ChevronRight, 
  Upload, UserPlus, UserMinus, Heart, Baby, Users
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';

export default function MemberSidebar({ 
  member, 
  allMembers, 
  onSave, 
  onDelete, 
  onClose,
  onCreateRelated
}) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Other',
    isLiving: true,
    dob: '',
    dod: '',
    occupation: '',
    placeOfBirth: '',
    placeOfDeath: '',
    bio: '',
    imageUrl: '',
    parents: [],
    children: [],
    spouses: [],
    siblings: []
  });

  useEffect(() => {
    if (member) {
      setFormData({
        firstName: member.firstName || '',
        lastName: member.lastName || '',
        gender: member.gender || 'Other',
        isLiving: member.isLiving !== false,
        dob: member.dob ? new Date(member.dob).toISOString().split('T')[0] : '',
        dod: member.dod ? new Date(member.dod).toISOString().split('T')[0] : '',
        occupation: member.occupation || '',
        placeOfBirth: member.placeOfBirth || '',
        placeOfDeath: member.placeOfDeath || '',
        bio: member.bio || '',
        imageUrl: member.imageUrl || '',
        parents: (member.parents || []).map(p => typeof p === 'string' ? p : p._id),
        children: (member.children || []).map(c => typeof c === 'string' ? c : c._id),
        spouses: (member.spouses || []).map(s => typeof s === 'string' ? s : s._id),
        siblings: (member.siblings || []).map(sib => typeof sib === 'string' ? sib : sib._id)
      });
      setStep(1);
    }
  }, [member]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleRelation = (type, id) => {
    setFormData(prev => {
      const current = prev[type] || [];
      const exists = current.includes(id);
      return {
        ...prev,
        [type]: exists ? current.filter(item => item !== id) : [...current, id]
      };
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setFormData(prev => ({ ...prev, imageUrl: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.firstName.trim()) {
      toast.error("First name is required");
      return;
    }
    onSave(formData);
  };

  const relationCandidates = allMembers.filter(m => m._id !== member?._id);

  return (
    <div className="flex flex-col h-full bg-white border-l border-slate-200 w-80 lg:w-96 shadow-2xl animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
        <div>
          <h2 className="text-lg font-bold text-slate-900">{member?._id ? 'Edit Member' : 'New Person'}</h2>
          <p className="text-xs text-slate-500">Step {step} of 3</p>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200 text-slate-400 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100/50 m-4 rounded-xl">
        <TabButton active={step === 1} onClick={() => setStep(1)} icon={<User className="h-4 w-4" />} label="Basic" />
        <TabButton active={step === 2} onClick={() => setStep(2)} icon={<Info className="h-4 w-4" />} label="Details" />
        <TabButton active={step === 3} onClick={() => setStep(3)} icon={<LinkIcon className="h-4 w-4" />} label="Relations" />
      </div>

      {/* Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="flex justify-center">
              <div className="relative group">
                <div className="h-24 w-24 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden">
                  {formData.imageUrl ? (
                    <img src={formData.imageUrl} className="h-full w-full object-cover" alt="Profile" />
                  ) : (
                    <Upload className="h-8 w-8 text-slate-300" />
                  )}
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer" 
                  onChange={handleImageUpload}
                />
                <div className="absolute -bottom-2 -right-2 p-1.5 bg-teal-600 text-white rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Upload className="h-3 w-3" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <InputGroup label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <InputGroup label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} />
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                <select 
                  name="gender" 
                  value={formData.gender} 
                  onChange={handleChange}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                <input 
                  type="checkbox" 
                  name="isLiving" 
                  id="isLiving"
                  checked={formData.isLiving} 
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <label htmlFor="isLiving" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                  This person is currently living
                </label>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="grid grid-cols-2 gap-4">
              <InputGroup label="Birth Date" name="dob" type="date" value={formData.dob} onChange={handleChange} />
              <InputGroup 
                label="Death Date" 
                name="dod" 
                type="date" 
                value={formData.dod} 
                onChange={handleChange} 
                disabled={formData.isLiving} 
              />
            </div>
            <InputGroup label="Occupation" name="occupation" value={formData.occupation} onChange={handleChange} placeholder="e.g. Architect" />
            <InputGroup label="Place of Birth" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} />
            {!formData.isLiving && <InputGroup label="Place of Death" name="placeOfDeath" value={formData.placeOfDeath} onChange={handleChange} />}
            
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Biography</label>
              <textarea 
                name="bio" 
                rows={4} 
                value={formData.bio} 
                onChange={handleChange}
                placeholder="Share some interesting facts..."
                className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none resize-none"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-200">
            <div className="grid grid-cols-2 gap-2">
              <QuickRelBtn icon={<Heart className="h-4 w-4" />} label="+ Spouse" onClick={() => onCreateRelated('spouse')} />
              <QuickRelBtn icon={<Baby className="h-4 w-4" />} label="+ Child" onClick={() => onCreateRelated('child')} />
              <QuickRelBtn icon={<Users className="h-4 w-4" />} label="+ Parent" onClick={() => onCreateRelated('parent')} />
              <QuickRelBtn icon={<UserPlus className="h-4 w-4" />} label="+ Sibling" onClick={() => onCreateRelated('sibling')} />
            </div>

            <div className="space-y-4">
              <RelationSection 
                title="Parents" 
                type="parents" 
                selected={formData.parents} 
                candidates={relationCandidates} 
                onToggle={handleToggleRelation} 
              />
              <RelationSection 
                title="Siblings" 
                type="siblings" 
                selected={formData.siblings} 
                candidates={relationCandidates} 
                onToggle={handleToggleRelation} 
              />
              <RelationSection 
                title="Spouses" 
                type="spouses" 
                selected={formData.spouses} 
                candidates={relationCandidates} 
                onToggle={handleToggleRelation} 
              />
              <RelationSection 
                title="Children" 
                type="children" 
                selected={formData.children} 
                candidates={relationCandidates} 
                onToggle={handleToggleRelation} 
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
        <div className="flex gap-2">
          {step > 1 && (
            <button 
              type="button" 
              onClick={() => setStep(step - 1)}
              className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button 
              type="button" 
              onClick={() => setStep(step + 1)}
              className="flex-[2] py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-[0.98]"
            >
              Next Step
            </button>
          ) : (
            <button 
              type="button" 
              onClick={handleSubmit}
              className="flex-[2] py-2.5 rounded-xl bg-teal-600 text-sm font-bold text-white hover:bg-teal-700 shadow-lg shadow-teal-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="h-4 w-4" />
              Save Changes
            </button>
          )}
        </div>
        
        {member?._id && (
          <button 
            type="button" 
            onClick={() => onDelete(member._id)}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Delete Person
          </button>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all",
        active ? "bg-white text-teal-700 shadow-sm" : "text-slate-400 hover:text-slate-600"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

function InputGroup({ label, ...props }) {
  return (
    <div className="space-y-1.5 text-left">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
        {label}
        {props.required && <span className="text-rose-500">*</span>}
      </label>
      <input 
        className={cn(
          "w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all outline-none",
          props.disabled && "bg-slate-50 text-slate-400 cursor-not-allowed"
        )}
        {...props}
      />
    </div>
  );
}

function QuickRelBtn({ icon, label, onClick }) {
  return (
    <button 
      onClick={onClick}
      className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-teal-200 hover:shadow-lg hover:shadow-teal-50 transition-all group"
    >
      <div className="p-2 rounded-lg bg-white text-slate-400 group-hover:text-teal-600 transition-colors">
        {icon}
      </div>
      <span className="text-[10px] font-bold text-slate-500 group-hover:text-teal-700">{label}</span>
    </button>
  );
}

function RelationSection({ title, type, selected, candidates, onToggle }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="space-y-2 text-left">
      <div className="flex items-center justify-between">
        <h5 className="text-xs font-bold text-slate-700 uppercase tracking-widest">{title} <span className="text-teal-600">({selected.length})</span></h5>
        <button onClick={() => setIsOpen(!isOpen)} className="text-[10px] font-bold text-teal-600 hover:underline">
          {isOpen ? 'Close' : 'Add/Edit'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-1.5">
        {selected.length === 0 ? (
          <span className="text-[10px] text-slate-400 italic">No {title.toLowerCase()} linked</span>
        ) : (
          selected.map(id => {
            const m = candidates.find(c => c._id === id);
            if (!m) return null;
            return (
              <div key={id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-teal-50 text-teal-700 text-[10px] font-bold border border-teal-100">
                {m.firstName} {m.lastName}
                <button onClick={() => onToggle(type, id)}><X className="h-3 w-3" /></button>
              </div>
            );
          })
        )}
      </div>

      {isOpen && (
        <div className="mt-2 max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-white p-2 animate-in fade-in duration-200">
          {candidates.length === 0 && <p className="text-[10px] text-slate-400 p-2">No other members found</p>}
          {candidates.map(m => (
            <button 
              key={m._id}
              onClick={() => onToggle(type, m._id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between",
                selected.includes(m._id) ? "bg-teal-50 text-teal-700 font-bold" : "text-slate-600 hover:bg-slate-50"
              )}
            >
              {m.firstName} {m.lastName}
              {selected.includes(m._id) ? <UserMinus className="h-3 w-3" /> : <UserPlus className="h-3 w-3 text-slate-300" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
