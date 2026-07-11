'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { cn } from '../lib/utils';
import { FolderPlus, HelpCircle, Link as LinkIcon, Plus, Minus, MessageSquare } from 'lucide-react';
import { type CustomNode } from '../lib/types';

export default function CustomNode({ id, data, selected }: NodeProps<CustomNode>) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  const updateNodeData = useMindMapStore(state => state.updateNodeData);
  const addNodeChild = useMindMapStore(state => state.addNodeChild);
  const toggleCollapseBranch = useMindMapStore(state => state.toggleCollapseBranch);
  
  // Find if this node has children
  const hasChildren = useMindMapStore(state => 
    state.nodes.some(n => n.data.parentId === id)
  );

  // Dynamic Handle positioning
  const parentId = data.parentId;
  const isRoot = data.isRoot;

  const nodes = useMindMapStore(state => state.nodes);

  // Track parent's position relative to this node - Derived during render to avoid cascading state effects
  const growDirection = useMemo(() => {
    if (isRoot) return 'right';
    const parentNode = nodes.find(n => n.id === parentId);
    const selfNode = nodes.find(n => n.id === id);
    if (parentNode && selfNode && selfNode.position.x < parentNode.position.x) {
      return 'left';
    }
    return 'right';
  }, [nodes, id, parentId, isRoot]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEditValue(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue.trim() !== '') {
      updateNodeData(id, { label: editValue });
    } else {
      setEditValue(data.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      setIsEditing(false);
      if (editValue.trim() !== '') {
        updateNodeData(id, { label: editValue });
      } else {
        setEditValue(data.label);
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(data.label);
    }
    // Prevent event propagation so React Flow handles don't catch keys
    e.stopPropagation();
  };

  // Color preset mapping
  const colorMap: Record<string, { bg: string, border: string, text: string, accent: string, badge: string }> = {
    blue: {
      bg: isRoot ? 'bg-blue-600' : 'bg-blue-50/90',
      border: isRoot ? 'border-blue-700' : 'border-blue-300',
      text: isRoot ? 'text-white' : 'text-blue-900',
      accent: 'bg-blue-500',
      badge: 'bg-blue-100 text-blue-800',
    },
    green: {
      bg: isRoot ? 'bg-emerald-600' : 'bg-emerald-50/90',
      border: isRoot ? 'border-emerald-700' : 'border-emerald-300',
      text: isRoot ? 'text-white' : 'text-emerald-900',
      accent: 'bg-emerald-500',
      badge: 'bg-emerald-100 text-emerald-800',
    },
    orange: {
      bg: isRoot ? 'bg-orange-600' : 'bg-orange-50/90',
      border: isRoot ? 'border-orange-700' : 'border-orange-300',
      text: isRoot ? 'text-white' : 'text-orange-900',
      accent: 'bg-orange-500',
      badge: 'bg-orange-100 text-orange-800',
    },
    red: {
      bg: isRoot ? 'bg-rose-600' : 'bg-rose-50/90',
      border: isRoot ? 'border-rose-700' : 'border-rose-300',
      text: isRoot ? 'text-white' : 'text-rose-900',
      accent: 'bg-rose-500',
      badge: 'bg-rose-100 text-rose-800',
    },
    purple: {
      bg: isRoot ? 'bg-violet-600' : 'bg-violet-50/90',
      border: isRoot ? 'border-violet-700' : 'border-violet-300',
      text: isRoot ? 'text-white' : 'text-violet-900',
      accent: 'bg-violet-500',
      badge: 'bg-violet-100 text-violet-800',
    },
    gray: {
      bg: isRoot ? 'bg-gray-700' : 'bg-gray-50/95',
      border: isRoot ? 'border-gray-800' : 'border-gray-300',
      text: isRoot ? 'text-white' : 'text-gray-900',
      accent: 'bg-gray-600',
      badge: 'bg-gray-200 text-gray-800',
    },
  };

  const currentStyle = colorMap[data.color || 'blue'] || colorMap.blue;

  // Dynamic classes for border radius and shadows
  const radiusClass = data.borderRadius !== undefined
    ? data.borderRadius === 0 ? 'rounded-none' : data.borderRadius <= 6 ? 'rounded-sm' : data.borderRadius <= 10 ? 'rounded-md' : data.borderRadius <= 14 ? 'rounded-lg' : 'rounded-xl'
    : isRoot ? 'rounded-xl' : 'rounded-md';

  const shadowClass = data.shadowStrength !== undefined
    ? data.shadowStrength === 0 ? 'shadow-none' : data.shadowStrength === 1 ? 'shadow-sm' : data.shadowStrength === 2 ? 'shadow-md' : 'shadow-lg'
    : isRoot ? 'shadow-lg' : 'shadow-sm';

  return (
    <div
      className={cn(
        'px-4 py-2.5 border-2 min-w-[140px] max-w-[280px] transition-all cursor-pointer relative group',
        currentStyle.bg,
        currentStyle.border,
        currentStyle.text,
        radiusClass,
        shadowClass,
        selected ? 'ring-2 ring-blue-500 ring-offset-2 scale-102 border-blue-500' : 'hover:border-gray-400'
      )}
      onDoubleClick={handleDoubleClick}
      id={`node-${id}`}
    >
      {/* Target/Source Handles based on growing direction */}
      {!isRoot && (
        <Handle
          type="target"
          position={growDirection === 'right' ? Position.Left : Position.Right}
          className="w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full !z-20 hover:bg-blue-500 transition-colors"
        />
      )}

      {isRoot ? (
        <>
          {/* Root node can grow both left and right */}
          <Handle
            type="source"
            position={Position.Left}
            id="left"
            className="w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full !z-20 hover:bg-blue-500 transition-colors"
          />
          <Handle
            type="source"
            position={Position.Right}
            id="right"
            className="w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full !z-20 hover:bg-blue-500 transition-colors"
          />
        </>
      ) : (
        <Handle
          type="source"
          position={growDirection === 'right' ? Position.Right : Position.Left}
          className="w-2.5 h-2.5 bg-gray-400 border-2 border-white rounded-full !z-20 hover:bg-blue-500 transition-colors"
        />
      )}

      {/* Node Content */}
      <div className="flex flex-col gap-1.5 select-none">
        {/* Header containing Emoji if present */}
        <div className="flex items-center gap-1.5">
          {data.emoji && <span className="text-base select-none">{data.emoji}</span>}
          
          <div className="flex-1 overflow-hidden min-h-[20px] flex items-center">
            {isEditing ? (
              <input
                ref={inputRef}
                type="text"
                value={editValue}
                onChange={e => setEditValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                className={cn(
                  'w-full bg-white text-gray-900 border border-gray-300 rounded px-1.5 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans'
                )}
                onDoubleClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="font-medium text-sm leading-relaxed break-words whitespace-pre-wrap block w-full">
                {data.label || 'Tópico vazio'}
              </span>
            )}
          </div>
        </div>

        {/* Dynamic metadata badges (Tags, Note icon, Link icon) */}
        {((data.tags && data.tags.length > 0) || data.notes || data.link) && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            {data.link && (
              <a 
                href={data.link.startsWith('http') ? data.link : `https://${data.link}`} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-blue-600 inline-flex items-center"
                title={data.link}
                onClick={e => e.stopPropagation()}
              >
                <LinkIcon className="w-3.5 h-3.5 opacity-70" />
              </a>
            )}
            {data.notes && (
              <span title="Possui notas anotadas" className="inline-flex items-center">
                <MessageSquare className="w-3.5 h-3.5 opacity-70" />
              </span>
            )}
            {data.tags && data.tags.map(tag => (
              <span 
                key={tag} 
                className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide',
                  isRoot ? 'bg-white/20 text-white' : currentStyle.badge
                )}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Collapse/Expand Indicator and Quick Add Child buttons visible on hover */}
      {hasChildren && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleCollapseBranch(id);
          }}
          className={cn(
            'absolute w-5 h-5 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-500 hover:text-blue-600 shadow-sm transition-all focus:outline-none hover:scale-110 z-30',
            // position relative to growing direction
            isRoot 
              ? '-right-2.5 top-1/2 -translate-y-1/2'
              : growDirection === 'right' 
                ? '-right-2.5 top-1/2 -translate-y-1/2' 
                : '-left-2.5 top-1/2 -translate-y-1/2'
          )}
          title={data.isCollapsed ? 'Expandir ramo' : 'Colapsar ramo'}
        >
          {data.isCollapsed ? (
            <Plus className="w-3 h-3 stroke-[3]" />
          ) : (
            <Minus className="w-3 h-3 stroke-[3]" />
          )}
        </button>
      )}

      {/* Floating Quick Node Add button shown on hover */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          addNodeChild(id);
        }}
        className={cn(
          'absolute w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-sm transition-all focus:outline-none hover:scale-110 z-30',
          isRoot
            ? '-bottom-2.5 left-1/2 -translate-x-1/2'
            : growDirection === 'right'
              ? 'top-1/2 -translate-y-1/2 -right-6'
              : 'top-1/2 -translate-y-1/2 -left-6'
        )}
        title="Adicionar sub-tópico"
      >
        <Plus className="w-3.5 h-3.5 stroke-[3]" />
      </button>
    </div>
  );
}
