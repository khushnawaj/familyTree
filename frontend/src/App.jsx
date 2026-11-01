import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { toJpeg, toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import { Share2, Download, Image as ImageIcon, FileText, Plus, Settings, Users } from 'lucide-react';
import api from './api';
import { useAuth } from './contexts/AuthContext';

// Components
import Header from './components/Header';
import LandingPage from './components/LandingPage';
import UserDashboard from './components/UserDashboard';
import FamilyTreeCanvas from './components/FamilyTreeCanvas';
import MemberSidebar from './components/MemberSidebar';
import MemberDetailModal from './components/MemberDetailModal';
import SettingsModal from './components/SettingsModal';
import FamilyUnitModal from './components/FamilyUnitModal';

const initialSettings = {
  showAvatars: true,
  showBio: true,
  showDates: true,
  showGrid: true
};

export default function App() {
  const { user, loading: authLoading } = useAuth();
  
  // State
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFamilyUnitModalOpen, setIsFamilyUnitModalOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [previewMemberId, setPreviewMemberId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditingConnections, setIsEditingConnections] = useState(true);
  const [settings, setSettings] = useState(initialSettings);

  // Derived
  const selectedMember = useMemo(() => 
    members.find(m => m._id === selectedMemberId), [members, selectedMemberId]
  );
  const previewMember = useMemo(() => 
    members.find(m => m._id === previewMemberId), [members, previewMemberId]
  );

  // API Actions
  const fetchMembers = useCallback(async () => {
    if (!user) return;
    setLoadingMembers(true);
    try {
      const res = await api.get('/members');
      setMembers(res.data);
    } catch (err) {
      toast.error('Failed to load family members');
    } finally {
      setLoadingMembers(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchMembers();
      // Initially show dashboard instead of studio
      setIsStudioOpen(false);
    } else {
      setIsStudioOpen(false);
      setMembers([]);
    }
  }, [user, fetchMembers]);

  const handleSaveMember = async (formData) => {
    try {
      // Ensure we preserve the current position when saving details
      const currentMember = members.find(m => m._id === selectedMemberId);
      const payload = {
        ...formData,
        nodePosition: currentMember?.nodePosition || { x: 100, y: 80 }
      };

      if (selectedMemberId) {
        await api.put(`/members/${selectedMemberId}`, payload);
        toast.success('Member updated successfully');
      } else {
        await api.post('/members', payload);
        toast.success('Member created successfully');
      }
      await fetchMembers();
      setIsSidebarOpen(false);
      setSelectedMemberId(null);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save member');
      throw err;
    }
  };

  const handleDeleteMember = async (id) => {
    if (!window.confirm('Are you sure you want to delete this member? This action cannot be undone.')) return;
    try {
      await api.delete(`/members/${id}`);
      toast.success('Member deleted');
      await fetchMembers();
      setIsSidebarOpen(false);
      setSelectedMemberId(null);
      if (previewMemberId === id) setPreviewMemberId(null);
    } catch (err) {
      toast.error('Failed to delete member');
    }
  };

  const handleNodeDragStop = useCallback(async (_, node) => {
    // Update local state immediately so subsequent saves don't use stale positions
    setMembers(prev => prev.map(m => 
      m._id === node.id ? { ...m, nodePosition: { x: node.position.x, y: node.position.y } } : m
    ));

    try {
      await api.patch('/members/positions', {
        positions: [{ id: node.id, x: node.position.x, y: node.position.y }]
      });
    } catch (err) {
      console.error('Failed to sync position', err);
    }
  }, []);

  const handleConnect = useCallback(async (connection) => {
    if (!connection.source || !connection.target) return;
    try {
      const source = members.find(m => m._id === connection.source);
      const target = members.find(m => m._id === connection.target);
      
      // Basic logic to add child (default)
      await api.put(`/members/${source._id}`, {
        ...source,
        children: [...new Set([...(source.children || []), target._id])]
      });
      toast.success('Relationship linked');
      await fetchMembers();
    } catch (err) {
      toast.error('Failed to link members');
    }
  }, [members, fetchMembers]);

  const handleCreateRelated = async (type) => {
    if (!selectedMemberId) return;
    try {
      const base = members.find(m => m._id === selectedMemberId);
      if (!base) return;

      const typeLabel = type.charAt(0).toUpperCase() + type.slice(1);
      let candidateName = `${typeLabel} of ${base.firstName}`;
      let counter = 1;
      while (members.some(m => (m.firstName || '').toLowerCase() === candidateName.toLowerCase())) {
        counter++;
        candidateName = `${typeLabel} ${counter} of ${base.firstName}`;
      }

      const payload = {
        firstName: candidateName,
        lastName: base.lastName || '',
        gender: type === 'spouse' ? (base.gender === 'Male' ? 'Female' : 'Male') : 'Other',
        isLiving: true,
        nodePosition: {
          x: base.nodePosition.x + (type === 'spouse' || type === 'sibling' ? 250 : 0),
          y: base.nodePosition.y + (type === 'child' ? 200 : type === 'parent' ? -200 : 0)
        }
      };

      if (type === 'parent') {
        payload.children = [base._id];
        // If base already has one parent, link new parent as spouse to that parent
        if (base.parents && base.parents.length > 0) {
          payload.spouses = [base.parents[0]];
        }
      }
      if (type === 'child') {
        payload.parents = [base._id, ...(base.spouses || [])];
      }
      if (type === 'spouse') {
        payload.spouses = [base._id];
      }
      if (type === 'sibling') {
        payload.parents = base.parents || [];
        payload.siblings = [base._id];
      }

      const res = await api.post('/members', payload);
      await fetchMembers();
      setSelectedMemberId(res.data._id);
      toast.success(`${candidateName} added`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to add related member');
      throw err;
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
          <p className="text-sm font-bold text-slate-500 animate-pulse">Initializing Studio...</p>
        </div>
      </div>
    );
  }

  const handleExport = async (format) => {
    const element = document.querySelector('.react-flow__viewport');
    if (!element) {
      toast.error("Nothing to export!");
      return;
    }

    const toastId = toast.loading(`Exporting as ${format.toUpperCase()}...`);
    try {
      const options = {
        backgroundColor: '#f8fafc',
        quality: 0.95,
        pixelRatio: 2,
      };

      let dataUrl;
      if (format === 'jpeg') {
        dataUrl = await toJpeg(element, options);
      } else {
        dataUrl = await toPng(element, options);
      }
      
      saveAs(dataUrl, `family-tree-${new Date().getTime()}.${format}`);
      toast.success("Export successful!", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Export failed. Please try again.", { id: toastId });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Family Tree',
          text: 'Check out my family tree on Antigravity Family Tree Builder!',
          url: window.location.href,
        });
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      // Fallback: Copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard! Share it with your family.");
    }
  };

  if (!user) {
    return (
      <>
        <LandingPage />
        <Toaster position="bottom-right" />
      </>
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-50 overflow-hidden flex flex-col">
      <Header 
        isStudioOpen={isStudioOpen} 
        onToggleStudio={() => setIsStudioOpen(!isStudioOpen)}
        onToggleForm={() => setIsSidebarOpen(!isSidebarOpen)}
      />

      <main className="flex-1 mt-16 relative flex overflow-hidden">
        {!isStudioOpen ? (
          <UserDashboard 
            user={user} 
            members={members} 
            onOpenStudio={() => setIsStudioOpen(true)}
            onCreateMember={() => {
              setSelectedMemberId(null);
              setIsStudioOpen(true);
              setIsSidebarOpen(true);
            }}
            onOpenFamilyUnit={() => {
              setIsStudioOpen(true);
              setIsFamilyUnitModalOpen(true);
            }}
          />
        ) : (
          <>
            {/* Main Canvas Area */}
            <div className="flex-1 relative overflow-hidden">
              {/* Toolbar Overlay */}
              <div className="absolute top-6 left-6 z-10 flex flex-wrap gap-3">
                <div className="flex bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-1 gap-1">
                  <button 
                    onClick={() => {
                      setSelectedMemberId(null);
                      setIsSidebarOpen(true);
                    }}
                    className="px-4 py-2 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Person</span>
                  </button>

                  <button 
                    onClick={() => setIsFamilyUnitModalOpen(true)}
                    className="px-3.5 py-2 text-sm font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 rounded-xl transition-all active:scale-95 flex items-center gap-2 border border-teal-200/60"
                    title="Add full family unit: member, spouse, children, and parents together"
                  >
                    <Users className="h-4 w-4 text-teal-600" />
                    <span className="hidden sm:inline">Add Family Unit</span>
                  </button>
                </div>

                <div className="flex bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-1">
                  <input 
                    type="text" 
                    placeholder="Search tree..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="px-4 py-2 text-sm outline-none w-40 sm:w-60"
                  />
                </div>

                <button 
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 hover:bg-slate-50 transition-all text-slate-600 flex items-center justify-center"
                  title="Settings"
                >
                  <Settings className="h-4 w-4 text-slate-600" />
                </button>

                <div className="flex bg-white rounded-2xl shadow-xl shadow-slate-200 border border-slate-100 p-1 gap-1">
                  <button 
                    onClick={() => handleExport('jpeg')}
                    className="p-2 rounded-xl hover:bg-slate-50 transition-all text-slate-600 flex items-center gap-2 px-3"
                    title="Export as JPEG"
                  >
                    <ImageIcon className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold hidden sm:inline">JPEG</span>
                  </button>
                  <div className="w-[1px] bg-slate-100 my-1" />
                  <button 
                    onClick={() => handleExport('png')}
                    className="p-2 rounded-xl hover:bg-slate-50 transition-all text-slate-600 flex items-center gap-2 px-3"
                    title="Export as PNG"
                  >
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold hidden sm:inline">PNG</span>
                  </button>
                </div>

                <button 
                  onClick={handleShare}
                  className="px-5 py-3 bg-slate-900 text-white rounded-2xl shadow-xl shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex items-center gap-2 font-bold text-sm"
                >
                  <Share2 className="h-4 w-4" />
                  Share Tree
                </button>
              </div>

              <FamilyTreeCanvas 
                members={members}
                loading={loadingMembers}
                onMemberSelect={(id) => setPreviewMemberId(id)}
                onConnect={handleConnect}
                onNodeDragStop={handleNodeDragStop}
                isEditingConnections={isEditingConnections}
                searchQuery={searchQuery}
                previewMemberId={previewMemberId}
                settings={settings}
              />
            </div>

            {/* Sidebar */}
            {isSidebarOpen && (
              <MemberSidebar 
                member={selectedMember}
                allMembers={members}
                onSave={handleSaveMember}
                onDelete={handleDeleteMember}
                onClose={() => {
                  setIsSidebarOpen(false);
                  setSelectedMemberId(null);
                }}
                onCreateRelated={handleCreateRelated}
              />
            )}
          </>
        )}
      </main>

      {/* Modals */}
      {previewMember && (
        <MemberDetailModal 
          member={previewMember}
          onClose={() => setPreviewMemberId(null)}
          onEdit={(id) => {
            setPreviewMemberId(null);
            setSelectedMemberId(id);
            setIsSidebarOpen(true);
          }}
        />
      )}

      <SettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdate={(key, val) => setSettings(prev => ({ ...prev, [key]: val }))}
      />

      {isFamilyUnitModalOpen && (
        <FamilyUnitModal 
          isOpen={isFamilyUnitModalOpen}
          onClose={() => setIsFamilyUnitModalOpen(false)}
          members={members}
          selectedMemberId={selectedMemberId || previewMemberId}
          onSuccess={fetchMembers}
        />
      )}

      <Toaster position="bottom-right" toastOptions={{
        className: 'rounded-2xl font-bold text-sm shadow-2xl',
        duration: 3000,
      }} />
    </div>
  );
}
