'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { 
  Play, 
  FileDown, 
  FileUp, 
  Settings, 
  Grid, 
  Sparkles, 
  Check, 
  ChevronDown, 
  FolderPlus,
  Undo2,
  Redo2,
  Maximize2
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Header() {
  const currentMap = useMindMapStore(state => state.currentMap);
  const maps = useMindMapStore(state => state.maps);
  const createNewMap = useMindMapStore(state => state.createNewMap);
  const settings = useMindMapStore(state => state.settings);
  const toggleGrid = useMindMapStore(state => state.toggleGrid);
  const undo = useMindMapStore(state => state.undo);
  const redo = useMindMapStore(state => state.redo);
  const history = useMindMapStore(state => state.history);
  const future = useMindMapStore(state => state.future);

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleCreateNew = async () => {
    const title = `Novo Mapa ${maps.length + 1}`;
    await createNewMap(title);
    setActiveMenu(null);
  };

  const handleExportJson = () => {
    if (!currentMap) return;
    const jsonString = JSON.stringify(currentMap, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentMap.title.toLowerCase().replace(/\s+/g, '_')}.mind`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setActiveMenu(null);
  };

  // Mock triggers for other exports (fully implemented in Stage 4)
  const handleMockExport = (format: 'PNG' | 'PDF' | 'SVG') => {
    alert(`A exportação em formato ${format} de alta fidelidade está pronta para a próxima etapa do desenvolvimento! Ela usará renderização interna em vetor.`);
    setActiveMenu(null);
  };

  return (
    <header 
      ref={menuRef}
      className="h-12 border-b border-gray-200 bg-white flex items-center justify-between px-4 z-50 shrink-0 select-none"
      id="app-header"
    >
      {/* Left side: Logo and drop-downs */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            M
          </div>
          <span className="font-semibold text-gray-900 tracking-tight text-sm md:text-base">MindFlow Pro</span>
        </div>

        {/* Menu bar drop-downs */}
        <nav className="flex items-center gap-1.5 text-sm font-medium text-gray-500 relative">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
              className={cn(
                'px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors focus:outline-none',
                activeMenu === 'file' && 'bg-gray-100 text-gray-900'
              )}
            >
              Arquivo
            </button>
            {activeMenu === 'file' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-gray-700">
                <button
                  onClick={handleCreateNew}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2"
                >
                  <FolderPlus className="w-4 h-4 text-gray-400" />
                  <span>Novo Mapa Mental</span>
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <label className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 cursor-pointer">
                  <FileUp className="w-4 h-4 text-gray-400" />
                  <span>Importar JSON (.mind)</span>
                  <input
                    type="file"
                    accept=".json,.mind"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = async (ev) => {
                          try {
                            const text = ev.target?.result as string;
                            await useMindMapStore.getState().importMap(text);
                            alert('Mapa importado com sucesso!');
                          } catch (err) {
                            alert(err instanceof Error ? err.message : 'Falha ao ler o arquivo');
                          }
                        };
                        reader.readAsText(file);
                      }
                      setActiveMenu(null);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          {/* Edit Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
              className={cn(
                'px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors focus:outline-none',
                activeMenu === 'edit' && 'bg-gray-100 text-gray-900'
              )}
            >
              Editar
            </button>
            {activeMenu === 'edit' && (
              <div className="absolute left-0 mt-1.5 w-52 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-gray-700">
                <button
                  onClick={() => { undo(); setActiveMenu(null); }}
                  disabled={history.length === 0}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <Undo2 className="w-4 h-4 text-gray-400" />
                    <span>Desfazer</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Ctrl+Z</span>
                </button>
                <button
                  onClick={() => { redo(); setActiveMenu(null); }}
                  disabled={future.length === 0}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between disabled:opacity-40"
                >
                  <span className="flex items-center gap-2">
                    <Redo2 className="w-4 h-4 text-gray-400" />
                    <span>Refazer</span>
                  </span>
                  <span className="text-[10px] text-gray-400 font-mono">Ctrl+Y</span>
                </button>
              </div>
            )}
          </div>

          {/* View Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
              className={cn(
                'px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors focus:outline-none',
                activeMenu === 'view' && 'bg-gray-100 text-gray-900'
              )}
            >
              Visualizar
            </button>
            {activeMenu === 'view' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-gray-700">
                <button
                  onClick={() => { toggleGrid(); setActiveMenu(null); }}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <Grid className="w-4 h-4 text-gray-400" />
                    <span>Alternar Grade</span>
                  </span>
                  {settings.showGrid && <Check className="w-3.5 h-3.5 text-blue-500" />}
                </button>
              </div>
            )}
          </div>

          {/* Export Menu */}
          <div className="relative">
            <button
              onClick={() => setActiveMenu(activeMenu === 'export' ? null : 'export')}
              className={cn(
                'px-2 py-1 rounded-md hover:bg-gray-100 hover:text-gray-900 cursor-pointer transition-colors focus:outline-none',
                activeMenu === 'export' && 'bg-gray-100 text-gray-900'
              )}
            >
              Exportar
            </button>
            {activeMenu === 'export' && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-gray-700">
                <button
                  onClick={handleExportJson}
                  disabled={!currentMap}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40"
                >
                  <FileDown className="w-4 h-4 text-gray-400" />
                  <span>Exportar Formato .mind (JSON)</span>
                </button>
                <div className="h-px bg-gray-100 my-1"></div>
                <button
                  onClick={() => handleMockExport('PNG')}
                  disabled={!currentMap}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40"
                >
                  <FileDown className="w-4 h-4 text-gray-400" />
                  <span>Exportar PNG (2x/3x/4x)</span>
                </button>
                <button
                  onClick={() => handleMockExport('PDF')}
                  disabled={!currentMap}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40"
                >
                  <FileDown className="w-4 h-4 text-gray-400" />
                  <span>Exportar PDF (A4/A3/A2)</span>
                </button>
                <button
                  onClick={() => handleMockExport('SVG')}
                  disabled={!currentMap}
                  className="w-full text-left px-4 py-2 text-xs hover:bg-gray-50 flex items-center gap-2 disabled:opacity-40"
                >
                  <FileDown className="w-4 h-4 text-gray-400" />
                  <span>Exportar SVG Vetorial</span>
                </button>
              </div>
            )}
          </div>
        </nav>
      </div>

      {/* Right side: Offline Badge & Presentation */}
      <div className="flex items-center gap-3">
        {/* Offline Status Badge */}
        <div className="flex items-center gap-1.5 bg-gray-100 rounded-md px-2.5 py-1 text-xs text-gray-500 border border-gray-200">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span className="font-medium hidden sm:inline">Pronto Offline</span>
        </div>

        {/* Present mode button */}
        <button 
          onClick={() => alert('Modo apresentação completo será implementado na Etapa 5!')}
          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-md transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Play className="w-3.5 h-3.5 fill-white stroke-none" />
          <span>Apresentar</span>
        </button>
      </div>
    </header>
  );
}
