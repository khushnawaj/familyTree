import React, { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  addEdge,
  useNodesState,
  useEdgesState,
  Position,
  Handle
} from 'reactflow';
import 'reactflow/dist/style.css';
import { cn } from '../lib/utils';
import Avatar from './Avatar';
import { Users, Download, Share2, Minus, Plus } from 'lucide-react';
import { toJpeg, toPng } from 'html-to-image';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';

const FamilyNode = ({ data }) => {
  const { settings, hasChildren, isCollapsed, onToggleCollapse } = data;
  
  return (
    <div
      className={cn(
        "relative min-w-[180px] bg-white rounded-3xl border-2 p-3 shadow-xl transition-all duration-300",
        data.selected ? "border-teal-500 scale-105 shadow-teal-100" : "border-slate-100 hover:border-slate-200",
        data.hasActiveSearch && !data.matched && "opacity-30 grayscale"
      )}
      onClick={data.onPreview}
    >
      {data.canEditConnections && <Handle type="target" position={Position.Top} className="!bg-teal-500 !w-2.5 !h-2.5" />}
      
      <div className="flex items-center gap-2.5">
        {settings?.showAvatars !== false && (
          <Avatar 
            src={data.imageUrl} 
            gender={data.gender} 
            firstName={data.label} 
            isChild={data.isChild}
            className="h-10 w-10" 
          />
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-bold text-slate-800 truncate">{data.label}</h4>
          {settings?.showDates !== false && data.dob && (
            <p className="text-[9px] text-slate-400 font-medium">
              *{new Date(data.dob).getFullYear()}
            </p>
          )}
          <p className="text-[9px] text-slate-400 uppercase tracking-tighter truncate opacity-70">{data.occupation || 'Member'}</p>
        </div>
      </div>

      {settings?.showBio !== false && data.bio && (
        <p className="mt-2 text-[9px] text-slate-500 line-clamp-1 italic leading-tight border-t border-slate-50 pt-1.5">
          {data.bio}
        </p>
      )}

      {/* Expand/Collapse Button */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCollapse();
          }}
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full border-2 border-white shadow-md flex items-center justify-center transition-all z-50",
            isCollapsed ? "bg-teal-600 text-white" : "bg-white text-teal-600 hover:bg-teal-50"
          )}
        >
          {isCollapsed ? <Plus className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
        </button>
      )}

      {data.canEditConnections && <Handle type="source" position={Position.Bottom} className="!bg-teal-500 !w-2.5 !h-2.5" />}
    </div>
  );
};

const NODE_TYPES = { person: FamilyNode };

export default function FamilyTreeCanvas({ 
  members, 
  onMemberSelect, 
  onConnect, 
  onNodeDragStop,
  isEditingConnections,
  searchQuery,
  previewMemberId,
  loading,
  settings
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const hasFittedView = useRef(false);

  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    if (reactFlowInstance && !hasFittedView.current && nodes.length > 0) {
      reactFlowInstance.fitView({ padding: 0.2 });
      hasFittedView.current = true;
    }
  }, [reactFlowInstance, nodes]);

  const toggleCollapse = useCallback((id) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      const idStr = String(id);
      if (next.has(idStr)) next.delete(idStr);
      else next.add(idStr);
      return next;
    });
  }, []);

  const getDescendants = useCallback((id, membersList, visited = new Set()) => {
    const idStr = String(id);
    if (visited.has(idStr)) return [];
    visited.add(idStr);

    const member = membersList.find(m => String(m._id) === idStr);
    if (!member) return [];

    let descendants = (member.children || []).map(String);
    descendants.forEach(childId => {
      descendants = [...descendants, ...getDescendants(childId, membersList, visited)];
    });
    return descendants;
  }, []);

  useEffect(() => {
    // 1. Identify hidden nodes
    const hiddenNodes = new Set();
    collapsedNodes.forEach(id => {
      const descendants = getDescendants(id, members);
      descendants.forEach(dId => hiddenNodes.add(String(dId)));
    });

    const visibleMembers = members.filter(m => !hiddenNodes.has(String(m._id)));

    const treeNodes = visibleMembers.map((member) => ({
      id: String(member._id),
      type: 'person',
      position: {
        x: Number(member?.nodePosition?.x || 100),
        y: Number(member?.nodePosition?.y || 80)
      },
      data: {
        matched: searchQuery.trim()
          ? `${member.firstName} ${member.lastName || ''}`.trim().toLowerCase().includes(searchQuery.toLowerCase())
          : true,
        hasActiveSearch: Boolean(searchQuery.trim()),
        isChild: (member.parents || []).length > 0 && (member.children || []).length === 0,
        label: `${member.firstName} ${member.lastName || ''}`.trim(),
        imageUrl: member.imageUrl,
        bio: member.bio,
        dob: member.dob,
        gender: member.gender,
        occupation: member.occupation,
        selected: previewMemberId === member._id,
        canEditConnections: isEditingConnections,
        onPreview: () => onMemberSelect(member._id),
        settings: settings,
        hasChildren: (member.children || []).length > 0,
        isCollapsed: collapsedNodes.has(String(member._id)),
        onToggleCollapse: () => toggleCollapse(member._id)
      }
    }));

    const relationEdges = [];
    visibleMembers.forEach((member) => {
      const memberIdStr = String(member._id);

      // Children
      (member.children || []).forEach((childId) => {
        const childIdStr = String(childId);
        if (!hiddenNodes.has(childIdStr)) {
          relationEdges.push({
            id: `p-${memberIdStr}-${childIdStr}`,
            source: memberIdStr,
            target: childIdStr,
            type: 'smoothstep',
            style: { stroke: '#cbd5e1', strokeWidth: 2 },
            markerEnd: { type: MarkerType.ArrowClosed, color: '#cbd5e1' }
          });
        }
      });

      // Spouses
      (member.spouses || []).forEach((spouseId) => {
        const spouseIdStr = String(spouseId);
        if (!hiddenNodes.has(spouseIdStr)) {
          const edgeId = [memberIdStr, spouseIdStr].sort().join('-s-');
          if (!relationEdges.find((item) => item.id === edgeId)) {
            relationEdges.push({
              id: edgeId,
              source: memberIdStr,
              target: spouseIdStr,
              type: 'straight',
              style: { stroke: '#94a3b8', strokeWidth: 2, strokeDasharray: '6 4' }
            });
          }
        }
      });

      // Siblings (Chain linking)
      const visibleSiblings = (member.siblings || [])
        .map(String)
        .filter(sId => !hiddenNodes.has(sId));
      
      if (visibleSiblings.length > 0) {
        const sortedSibs = [memberIdStr, ...visibleSiblings].sort();
        const myIndex = sortedSibs.indexOf(memberIdStr);
        if (myIndex < sortedSibs.length - 1) {
          const nextSibId = sortedSibs[myIndex + 1];
          relationEdges.push({
            id: `sib-${memberIdStr}-${nextSibId}`,
            source: memberIdStr,
            target: nextSibId,
            type: 'straight',
            style: { stroke: '#bae6fd', strokeWidth: 2, strokeDasharray: '4 4' },
          });
        }
      }
    });

    setNodes(treeNodes);
    setEdges(relationEdges);
  }, [members, previewMemberId, searchQuery, isEditingConnections, onMemberSelect, setEdges, setNodes, settings, collapsedNodes, toggleCollapse, getDescendants]);

  return (
    <div className="h-full w-full bg-slate-50 relative">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/50 backdrop-blur-sm">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-600 border-t-transparent" />
        </div>
      ) : members.length === 0 ? (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center">
          <div className="h-20 w-20 rounded-3xl bg-teal-50 flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-teal-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Your family tree is empty</h3>
          <p className="mt-2 text-slate-500 max-w-sm">Add your first family member to start building your lineage and relationships.</p>
        </div>
      ) : null}

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={NODE_TYPES}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onInit={setReactFlowInstance}
        minZoom={0.1}
        maxZoom={2}
        className="bg-slate-50"
      >
        {settings?.showGrid !== false && <Background variant="lines" gap={40} size={1} color="#e2e8f0" />}
        <Controls position="bottom-right" className="!bg-white !border-slate-200 !shadow-lg rounded-xl overflow-hidden" />
        <MiniMap zoomable pannable className="!bg-white !border-slate-200 !shadow-lg !rounded-xl !right-4 !bottom-24" />
      </ReactFlow>
    </div>
  );
}
