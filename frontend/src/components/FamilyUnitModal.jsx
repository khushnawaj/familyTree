import React, { useState, useMemo } from 'react';
import { 
  X, Users, User, Heart, Baby, Plus, Trash2, Sparkles, Loader2, 
  Calendar, Briefcase, Check, AlertCircle, ArrowRight
} from 'lucide-react';
import { cn } from '../lib/utils';
import toast from 'react-hot-toast';
import api from '../api';

export default function FamilyUnitModal({ 
  isOpen, 
  onClose, 
  members, 
  selectedMemberId, 
  onSuccess 
}) {
  const [mode, setMode] = useState(selectedMemberId ? 'existing' : 'new');
  const [targetMemberId, setTargetMemberId] = useState(selectedMemberId || (members[0]?._id || ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [primary, setPrimary] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male',
    dob: '',
    isLiving: true,
    occupation: ''
  });

  const [includeParents, setIncludeParents] = useState(false);
  const [parents, setParents] = useState({
    father: { firstName: '', lastName: '', isLiving: true, dob: '' },
    mother: { firstName: '', lastName: '', isLiving: true, dob: '' }
  });

  const [includeSpouse, setIncludeSpouse] = useState(true);
  const [spouse, setSpouse] = useState({
    firstName: '',
    lastName: '',
    gender: 'Female',
    dob: '',
    isLiving: true
  });

  const [children, setChildren] = useState([
    { firstName: '', lastName: '', gender: 'Male', dob: '', isLiving: true }
  ]);

  const targetMember = useMemo(() => {
    return members.find(m => m._id === targetMemberId);
  }, [members, targetMemberId]);

  if (!isOpen) return null;

  const handleAddChild = () => {
    const defaultGender = children.length % 2 === 0 ? 'Male' : 'Female';
    setChildren(prev => [
      ...prev, 
      { firstName: '', lastName: '', gender: defaultGender, dob: '', isLiving: true }
    ]);
  };

  const handleRemoveChild = (index) => {
    setChildren(prev => prev.filter((_, i) => i !== index));
  };

  const handleChildChange = (index, field, value) => {
    setChildren(prev => prev.map((child, i) => {
      if (i === index) return { ...child, [field]: value };
      return child;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validation
    if (mode === 'new') {
      if (!primary.firstName.trim()) {
        toast.error('Primary member first name is required');
        return;
      }
    } else {
      if (!targetMemberId) {
        toast.error('Please select an existing family member');
        return;
      }
    }

    // Clean payload
    const payload = {
      existingMemberId: mode === 'existing' ? targetMemberId : null,
      primary: mode === 'new' ? primary : null,
      parents: includeParents ? {
        father: parents.father.firstName.trim() ? parents.father : null,
        mother: parents.mother.firstName.trim() ? parents.mother : null
      } : null,
      spouse: includeSpouse && spouse.firstName.trim() ? spouse : null,
      children: children.filter(c => c.firstName.trim()).map(c => ({
        ...c,
        lastName: c.lastName.trim() || (mode === 'existing' ? targetMember?.lastName : primary.lastName) || ''
      }))
    };

    // Make sure at least something is being added
    const hasAnyAdditions = 
      (mode === 'new' && primary.firstName.trim()) ||
      (includeParents && (parents.father.firstName.trim() || parents.mother.firstName.trim())) ||
      (includeSpouse && spouse.firstName.trim()) ||
      payload.children.length > 0;

    if (!hasAnyAdditions) {
      toast.error('Please enter at least one member to add');
      return;
    }

    // Uniqueness validation client-side
    const namesToValidate = [];
    if (mode === 'new' && primary.firstName.trim()) {
      namesToValidate.push({ first: primary.firstName.trim(), last: primary.lastName.trim() });
    }
    if (includeParents && parents.father.firstName.trim()) {
      namesToValidate.push({ first: parents.father.firstName.trim(), last: parents.father.lastName.trim() });
    }
    if (includeParents && parents.mother.firstName.trim()) {
      namesToValidate.push({ first: parents.mother.firstName.trim(), last: parents.mother.lastName.trim() });
    }
    if (includeSpouse && spouse.firstName.trim()) {
      namesToValidate.push({ first: spouse.firstName.trim(), last: spouse.lastName.trim() });
    }
    payload.children.forEach(c => {
      namesToValidate.push({ first: c.firstName.trim(), last: c.lastName.trim() });
    });

    // Check duplicate in form
    const seen = new Set();
    for (const item of namesToValidate) {
      const key = `${item.first.toLowerCase()} ${item.last.toLowerCase()}`;
      if (seen.has(key)) {
        toast.error(`Duplicate person "${item.first} ${item.last}".trim() in this form!`);
        return;
      }
      seen.add(key);
    }

    // Check duplicate against existing tree members
    for (const item of namesToValidate) {
      const match = members.find(m => 
        (m.firstName || '').trim().toLowerCase() === item.first.toLowerCase() &&
        (m.lastName || '').trim().toLowerCase() === item.last.toLowerCase()
      );
      if (match && (mode !== 'existing' || match._id !== targetMemberId)) {
        toast.error(`A member named "${item.first} ${item.last}".trim() already exists in your family tree!`);
        return;
      }
    }

    try {
      setIsSubmitting(true);
      const res = await api.post('/members/batch-family', payload);
      toast.success(`Successfully added family unit (${res.data.createdCount} new members)!`);
      if (onSuccess) await onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create family unit');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-teal-50/70 via-slate-50 to-emerald-50/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-teal-600 text-white flex items-center justify-center shadow-lg shadow-teal-200">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Add Family Unit
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-bold uppercase tracking-wider">
                  Multi-Member Form
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Add a member, their spouse, parents, and multiple children all in one go.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-2">Target:</span>
          {members.length > 0 && (
            <button
              type="button"
              onClick={() => setMode('existing')}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
                mode === 'existing' 
                  ? "bg-teal-600 text-white shadow-sm" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
              )}
            >
              <User className="h-3.5 w-3.5" />
              Add to Existing Member
            </button>
          )}
          <button
            type="button"
            onClick={() => setMode('new')}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5",
              mode === 'new' 
                ? "bg-teal-600 text-white shadow-sm" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
            )}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Create Brand New Family Unit
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* SECTION 1: PRIMARY MEMBER */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-teal-700 font-black text-sm">
              <User className="h-4 w-4" />
              <span>1. Primary Person</span>
            </div>

            {mode === 'existing' ? (
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Select Existing Member in Tree
                </label>
                <select
                  value={targetMemberId}
                  onChange={(e) => setTargetMemberId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-2.5 text-sm bg-slate-50/50 font-semibold text-slate-800 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                >
                  {members.map(m => (
                    <option key={m._id} value={m._id}>
                      {m.firstName} {m.lastName} ({m.gender || 'Person'})
                    </option>
                  ))}
                </select>
                {targetMember && (
                  <p className="text-xs text-teal-600 font-medium">
                    Adding family connections to <strong className="font-bold">{targetMember.firstName} {targetMember.lastName}</strong>
                  </p>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John"
                    value={primary.firstName}
                    onChange={(e) => setPrimary(p => ({ ...p, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Doe"
                    value={primary.lastName}
                    onChange={(e) => setPrimary(p => ({ ...p, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={primary.gender}
                    onChange={(e) => setPrimary(p => ({ ...p, gender: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none bg-white focus:border-teal-500"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: SPOUSE */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-rose-600 font-black text-sm">
                <Heart className="h-4 w-4" />
                <span>2. Spouse / Partner</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeSpouse}
                  onChange={(e) => setIncludeSpouse(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Include Spouse
              </label>
            </div>

            {includeSpouse && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">First Name</label>
                  <input
                    type="text"
                    placeholder="Spouse First Name"
                    value={spouse.firstName}
                    onChange={(e) => setSpouse(s => ({ ...s, firstName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Name</label>
                  <input
                    type="text"
                    placeholder="Spouse Last Name"
                    value={spouse.lastName}
                    onChange={(e) => setSpouse(s => ({ ...s, lastName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gender</label>
                  <select
                    value={spouse.gender}
                    onChange={(e) => setSpouse(s => ({ ...s, gender: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 p-2.5 text-sm outline-none bg-white focus:border-teal-500"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PARENTS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-600 font-black text-sm">
                <Users className="h-4 w-4" />
                <span>3. Parents</span>
              </div>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeParents}
                  onChange={(e) => setIncludeParents(e.target.checked)}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500 h-4 w-4"
                />
                Include Parents
              </label>
            </div>

            {includeParents && (
              <div className="space-y-3 pt-2 border-t border-slate-100 animate-in fade-in duration-150">
                {/* Father */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Father First Name</label>
                    <input
                      type="text"
                      placeholder="Father's First Name"
                      value={parents.father.firstName}
                      onChange={(e) => setParents(p => ({ ...p, father: { ...p.father, firstName: e.target.value } }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none bg-white focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Father Last Name</label>
                    <input
                      type="text"
                      placeholder="Father's Last Name"
                      value={parents.father.lastName}
                      onChange={(e) => setParents(p => ({ ...p, father: { ...p.father, lastName: e.target.value } }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none bg-white focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Mother */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mother First Name</label>
                    <input
                      type="text"
                      placeholder="Mother's First Name"
                      value={parents.mother.firstName}
                      onChange={(e) => setParents(p => ({ ...p, mother: { ...p.mother, firstName: e.target.value } }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none bg-white focus:border-teal-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mother Last Name</label>
                    <input
                      type="text"
                      placeholder="Mother's Last Name"
                      value={parents.mother.lastName}
                      onChange={(e) => setParents(p => ({ ...p, mother: { ...p.mother, lastName: e.target.value } }))}
                      className="w-full rounded-lg border border-slate-200 p-2 text-xs outline-none bg-white focus:border-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 4: CHILDREN (DYNAMIC LIST - E.G. 5 CHILDREN) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-black text-sm">
                <Baby className="h-4 w-4" />
                <span>4. Children ({children.length})</span>
              </div>
              <button
                type="button"
                onClick={handleAddChild}
                className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors flex items-center gap-1.5 border border-emerald-200/60"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Child
              </button>
            </div>

            {children.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                <p className="text-xs text-slate-400">No children added yet. Click &quot;Add Child&quot; to add children.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {children.map((child, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 animate-in fade-in duration-150"
                  >
                    <span className="text-[11px] font-black text-slate-400 w-16">
                      #{index + 1} Child
                    </span>
                    
                    <input
                      type="text"
                      placeholder="Child First Name *"
                      value={child.firstName}
                      onChange={(e) => handleChildChange(index, 'firstName', e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs outline-none bg-white focus:border-teal-500"
                    />

                    <select
                      value={child.gender}
                      onChange={(e) => handleChildChange(index, 'gender', e.target.value)}
                      className="w-28 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none bg-white focus:border-teal-500 font-medium"
                    >
                      <option value="Male">👦 Male</option>
                      <option value="Female">👧 Female</option>
                      <option value="Other">🧒 Other</option>
                    </select>

                    <input
                      type="date"
                      value={child.dob}
                      title="Date of Birth (Optional)"
                      onChange={(e) => handleChildChange(index, 'dob', e.target.value)}
                      className="w-32 rounded-lg border border-slate-200 px-2 py-1.5 text-xs outline-none bg-white focus:border-teal-500 text-slate-600"
                    />

                    <button
                      type="button"
                      onClick={() => handleRemoveChild(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Remove child"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-white transition-colors disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmit}
            className={cn(
              "px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-[0.98] flex items-center gap-2",
              isSubmitting 
                ? "bg-teal-500/80 cursor-wait shadow-none" 
                : "bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-100"
            )}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Family Unit...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Create Family Unit</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
