'use client';

import React, { useCallback, useMemo, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  Panel,
  useReactFlow,
  ReactFlowProvider,
  OnSelectionChangeParams,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useMindMapStore } from '../hooks/useMindMapStore';
import CustomNode from './CustomNode';
import { 
  Plus, 
  Trash2, 
  Undo2, 
  Redo2, 
  Maximize2, 
  Copy, 
  MousePointer, 
  Sparkles, 
  HelpCircle,
  Keyboard
} from 'lucide-react';
import { cn } from '../lib/utils';

// Map custom nodes
const nodeTypes = {
  mindmap: CustomNode,
};

function MindMapCanvasInner({ onZoomChange }: { onZoomChange: (z: number) => void }) {
  const nodes = useMindMapStore(state => state.nodes);
  const edges = useMindMapStore(state => state.edges);
  const onNodesChange = useMindMapStore(state => state.onNodesChange);
  const onEdgesChange = useMindMapStore(state => state.onEdgesChange);
  const onConnect = useMindMapStore(state => state.onConnect);
  const settings = useMindMapStore(state => state.settings);

  const selectedNodeId = useMindMapStore(state => state.selectedNodeId);
  const selectedNodeIds = useMindMapStore(state => state.selectedNodeIds);
  const setSelectedNodeId = useMindMapStore(state => state.setSelectedNodeId);
  const setSelectedNodeIds = useMindMapStore(state => state.setSelectedNodeIds);

  const addNodeChild = useMindMapStore(state => state.addNodeChild);
  const addNodeSibling = useMindMapStore(state => state.addNodeSibling);
  const deleteSelectedNodes = useMindMapStore(state => state.deleteSelectedNodes);
  const duplicateBranch = useMindMapStore(state => state.duplicateBranch);
  
  const undo = useMindMapStore(state => state.undo);
  const redo = useMindMapStore(state => state.redo);
  const history = useMindMapStore(state => state.history);
  const future = useMindMapStore(state => state.future);

  const { zoomIn, zoomOut, setViewport, getViewport, fitView } = useReactFlow();
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [showShortcutCheatSheet, setShowShortcutCheatSheet] = useState(false);

  // Monitor the zoom levels dynamically
  const onMove = useCallback(() => {
    const { zoom } = getViewport();
    onZoomChange(zoom);
  }, [getViewport, onZoomChange]);

  // Synchronize initial and ongoing zoom changes
  useEffect(() => {
    const { zoom } = getViewport();
    onZoomChange(zoom);
  }, [getViewport, onZoomChange]);

  // Reset viewport to center root node (0, 0)
  const handleCenter = useCallback(() => {
    fitView({ duration: 800, padding: 0.3 });
  }, [fitView]);

  // Sync selection change to Zustand store
  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: OnSelectionChangeParams) => {
      const ids = selectedNodes.map(n => n.id);
      setSelectedNodeIds(ids);
    },
    [setSelectedNodeIds]
  );

  // Handle all core keyboard shortcuts
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Check if user is typing in an input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    if (e.key === 'Tab') {
      e.preventDefault();
      if (selectedNodeId) {
        addNodeChild(selectedNodeId);
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedNodeId) {
        addNodeSibling(selectedNodeId);
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (selectedNodeIds.length > 0) {
        deleteSelectedNodes();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setSelectedNodeId(null);
    } else if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      undo();
    } else if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      redo();
    } else if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      if (selectedNodeId) {
        duplicateBranch(selectedNodeId);
      }
    } else if (e.key === 'f' || e.key === 'F') {
      // Custom quick centralize
      e.preventDefault();
      handleCenter();
    }
  }, [selectedNodeId, selectedNodeIds, addNodeChild, addNodeSibling, deleteSelectedNodes, setSelectedNodeId, undo, redo, duplicateBranch, handleCenter]);

  // Autofocus the canvas container to capture keyboard shortcuts on mount
  useEffect(() => {
    if (canvasContainerRef.current) {
      canvasContainerRef.current.focus();
    }
  }, []);

  return (
    <div 
      ref={canvasContainerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="flex-1 h-full w-full relative outline-none focus:ring-1 focus:ring-blue-100/50 bg-[#F9FAFB]"
      id="mindmap-canvas-container"
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onMove={onMove}
        onSelectionChange={handleSelectionChange}
        onPaneClick={() => setSelectedNodeId(null)}
        fitView
        snapToGrid={settings.snapToGrid}
        snapGrid={[15, 15]}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#9CA3AF' },
        }}
        proOptions={{ hideAttribution: true }}
      >
        {/* Beautiful Dotted Background */}
        {settings.showGrid && (
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={24} 
            size={1.5} 
            color="#D1D5DB" 
          />
        )}

        {/* Minimalist Floating Controls Toolbar */}
        <Panel position="top-center" className="z-10">
          <div className="bg-white shadow-md border border-gray-200 rounded-full flex items-center px-3 py-1.5 gap-1 select-none">
            {/* Quick node operations */}
            <button
              onClick={() => selectedNodeId && addNodeChild(selectedNodeId)}
              disabled={!selectedNodeId}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 focus:outline-none',
                selectedNodeId 
                  ? 'hover:bg-blue-50 text-blue-600' 
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title="Adicionar sub-tópico filho (Tab)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Filho</span>
            </button>

            <button
              onClick={() => selectedNodeId && addNodeSibling(selectedNodeId)}
              disabled={!selectedNodeId || nodes.find(n => n.id === selectedNodeId)?.data.isRoot}
              className={cn(
                'px-2.5 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer flex items-center gap-1 focus:outline-none',
                selectedNodeId && !nodes.find(n => n.id === selectedNodeId)?.data.isRoot
                  ? 'hover:bg-blue-50 text-blue-600' 
                  : 'text-gray-300 cursor-not-allowed'
              )}
              title="Adicionar tópico irmão (Enter)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Irmão</span>
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            {/* Branch operations */}
            <button
              onClick={() => selectedNodeId && duplicateBranch(selectedNodeId)}
              disabled={!selectedNodeId || nodes.find(n => n.id === selectedNodeId)?.data.isRoot}
              className={cn(
                'p-1.5 hover:bg-gray-100 rounded-full text-gray-500 hover:text-gray-700 transition-colors focus:outline-none disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer',
                selectedNodeId && 'hover:bg-blue-50 hover:text-blue-600'
              )}
              title="Duplicar ramificação (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={deleteSelectedNodes}
              disabled={selectedNodeIds.length === 0 || selectedNodeIds.some(id => nodes.find(n => n.id === id)?.data.isRoot)}
              className={cn(
                'p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors focus:outline-none disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer'
              )}
              title="Excluir selecionados (Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            {/* Undo / Redo */}
            <button
              onClick={undo}
              disabled={history.length === 0}
              className="p-1.5 hover:bg-gray-100 text-gray-500 disabled:text-gray-300 rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed cursor-pointer"
              title="Desfazer (Ctrl+Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={redo}
              disabled={future.length === 0}
              className="p-1.5 hover:bg-gray-100 text-gray-500 disabled:text-gray-300 rounded-full transition-colors focus:outline-none disabled:cursor-not-allowed cursor-pointer"
              title="Refazer (Ctrl+Y)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </button>

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            {/* Centralize layout */}
            <button
              onClick={handleCenter}
              className="p-1.5 hover:bg-gray-100 text-gray-600 hover:text-gray-800 rounded-full transition-colors focus:outline-none cursor-pointer"
              title="Centralizar mapa mental (F)"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => setShowShortcutCheatSheet(true)}
              className="p-1.5 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors focus:outline-none cursor-pointer"
              title="Guia de atalhos rápidos"
            >
              <Keyboard className="w-3.5 h-3.5" />
            </button>
          </div>
        </Panel>

        {/* Minimalist Floated MiniMap */}
        <MiniMap
          zoomable
          pannable
          nodeStrokeWidth={3}
          nodeColor={(n) => {
            if (n.data?.isRoot) return '#2563EB'; // blue root
            const col = n.data?.color;
            if (col === 'green') return '#10B981';
            if (col === 'orange') return '#F59E0B';
            if (col === 'red') return '#EF4444';
            if (col === 'purple') return '#8B5CF6';
            if (col === 'gray') return '#4B5563';
            return '#3B82F6';
          }}
          className="!bg-white/85 !backdrop-blur border !border-gray-200 !rounded-md !shadow-sm !bottom-4 !right-4 !w-44 !h-28"
          maskColor="rgba(243, 244, 246, 0.5)"
          ariaLabel="Mini mapa de navegação"
        />
      </ReactFlow>

      {/* Keyboard Shortcuts Overlay Modal */}
      {showShortcutCheatSheet && (
        <div className="absolute inset-0 bg-gray-900/10 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl border border-gray-200 max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="font-bold text-sm text-gray-800 flex items-center gap-1.5">
                <Keyboard className="w-4 h-4 text-blue-500" />
                Guia de Atalhos Rápidos
              </span>
              <button 
                onClick={() => setShowShortcutCheatSheet(false)}
                className="text-gray-400 hover:text-gray-600 rounded cursor-pointer p-0.5"
              >
                <XIcon className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Adicionar Sub-tópico</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Tab</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Adicionar Irmão</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Enter</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Excluir Ramo</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Delete / Backspace</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Desfazer Ação</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Ctrl + Z</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Refazer Ação</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Ctrl + Y</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Duplicar Ramo</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Ctrl + D</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Centralizar Mapa</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Teclado F</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-gray-50">
                <span className="text-gray-500">Deselecionar</span>
                <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded">Esc</span>
              </div>
            </div>

            <button
              onClick={() => setShowShortcutCheatSheet(false)}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple internal helper component
function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

interface CanvasProps {
  onZoomChange: (z: number) => void;
  zoomInRef: React.MutableRefObject<(() => void) | null>;
  zoomOutRef: React.MutableRefObject<(() => void) | null>;
  zoomResetRef: React.MutableRefObject<(() => void) | null>;
}

export default function Canvas({ onZoomChange, zoomInRef, zoomOutRef, zoomResetRef }: CanvasProps) {
  // We need an outer wrapper with a ReactFlowProvider so that nested hooks like useReactFlow() function properly
  return (
    <ReactFlowProvider>
      <MindMapCanvasWrapper 
        onZoomChange={onZoomChange} 
        zoomInRef={zoomInRef} 
        zoomOutRef={zoomOutRef} 
        zoomResetRef={zoomResetRef} 
      />
    </ReactFlowProvider>
  );
}

function MindMapCanvasWrapper({ onZoomChange, zoomInRef, zoomOutRef, zoomResetRef }: CanvasProps) {
  const { zoomIn, zoomOut, setViewport, fitView } = useReactFlow();

  // Expose controls to parent components using refs
  useEffect(() => {
    zoomInRef.current = () => zoomIn({ duration: 300 });
    zoomOutRef.current = () => zoomOut({ duration: 300 });
    zoomResetRef.current = () => {
      // Set zoom to exactly 1.0 (100%) and maintain current center of root
      setViewport({ x: window.innerWidth / 2 - 300, y: window.innerHeight / 2 - 100, zoom: 1.0 }, { duration: 300 });
    };

    return () => {
      zoomInRef.current = null;
      zoomOutRef.current = null;
      zoomResetRef.current = null;
    };
  }, [zoomIn, zoomOut, setViewport, zoomInRef, zoomOutRef, zoomResetRef]);

  return <MindMapCanvasInner onZoomChange={onZoomChange} />;
}
