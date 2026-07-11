'use client';

import React from 'react';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { Grid, Zap, MousePointer, Keyboard, Eye } from 'lucide-react';
import { cn } from '../lib/utils';

interface FooterProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export default function Footer({ zoom, onZoomIn, onZoomOut, onZoomReset }: FooterProps) {
  const selectedNodeIds = useMindMapStore(state => state.selectedNodeIds);
  const settings = useMindMapStore(state => state.settings);
  const toggleGrid = useMindMapStore(state => state.toggleGrid);
  const toggleSnap = useMindMapStore(state => state.toggleSnap);
  const currentMap = useMindMapStore(state => state.currentMap);

  // Parse relative time for last saved
  const formattedSavedTime = currentMap 
    ? new Date(currentMap.updatedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '';

  return (
    <footer 
      className="h-8 border-t border-gray-200 bg-white flex items-center justify-between px-3 text-[11px] text-gray-500 shrink-0 select-none"
      id="status-footer"
    >
      {/* Left section: selection count & autosave status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 font-medium text-gray-700">
          <MousePointer className="w-3.5 h-3.5 opacity-70 text-blue-500" />
          <span>
            {selectedNodeIds.length === 0 
              ? 'Nenhum item selecionado' 
              : selectedNodeIds.length === 1 
                ? '1 item selecionado' 
                : `${selectedNodeIds.length} itens selecionados`
            }
          </span>
        </div>
        
        {currentMap && (
          <>
            <div className="w-px h-3 bg-gray-200"></div>
            <div className="flex items-center gap-1 text-gray-400">
              <Zap className="w-3 h-3 text-green-500 animate-pulse" />
              <span>Salvo automaticamente: {formattedSavedTime}</span>
            </div>
          </>
        )}
      </div>

      {/* Right section: zoom and interactive toggles */}
      <div className="flex items-center gap-4">
        {/* Zoom display & reset */}
        <div className="flex items-center gap-2">
          <button 
            onClick={onZoomOut} 
            className="hover:text-gray-900 px-1 font-bold rounded hover:bg-gray-100 transition-colors cursor-pointer"
            title="Reduzir zoom"
          >
            -
          </button>
          <span 
            onClick={onZoomReset}
            className="font-semibold text-gray-700 font-mono hover:text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors cursor-pointer"
            title="Resetar para 100%"
          >
            {Math.round(zoom * 100)}%
          </span>
          <button 
            onClick={onZoomIn} 
            className="hover:text-gray-900 px-1 font-bold rounded hover:bg-gray-100 transition-colors cursor-pointer"
            title="Aumentar zoom"
          >
            +
          </button>
        </div>

        <div className="w-px h-3 bg-gray-200"></div>

        {/* Grid Toggle */}
        <button
          onClick={toggleGrid}
          className={cn(
            'flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded font-medium',
            settings.showGrid ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          )}
          title="Alternar visibilidade da grade"
        >
          <Grid className="w-3 h-3" />
          <span>Grade: {settings.showGrid ? 'Sim' : 'Não'}</span>
        </button>

        {/* Snap Toggle */}
        <button
          onClick={toggleSnap}
          className={cn(
            'flex items-center gap-1 cursor-pointer transition-colors px-1.5 py-0.5 rounded font-medium',
            settings.snapToGrid ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-50'
          )}
          title="Alternar alinhamento automático à grade"
        >
          <Eye className="w-3 h-3" />
          <span>Ajuste: {settings.snapToGrid ? 'Sim' : 'Não'}</span>
        </button>

        <div className="w-px h-3 bg-gray-200"></div>

        {/* Keyboard shortcut info */}
        <div className="flex items-center gap-1 text-gray-400" title="Ver Guia de Atalhos">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Atalhos Ativos</span>
        </div>
      </div>
    </footer>
  );
}
