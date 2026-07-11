'use client';

import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { Plus, Search, Folder, Trash2, Edit2, Check, X, FileUp, FileDown, CloudOff, Info } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const maps = useMindMapStore(state => state.maps);
  const currentMap = useMindMapStore(state => state.currentMap);
  const createNewMap = useMindMapStore(state => state.createNewMap);
  const selectMap = useMindMapStore(state => state.selectMap);
  const deleteMap = useMindMapStore(state => state.deleteMap);
  const updateMapTitle = useMindMapStore(state => state.updateMapTitle);
  const importMap = useMindMapStore(state => state.importMap);

  const [searchQuery, setSearchQuery] = useState('');
  const [editingMapId, setEditingMapId] = useState<string | null>(null);
  const [editTitleValue, setEditTitleValue] = useState('');

  // Automatically load all maps on sidebar mount
  const loadAllMaps = useMindMapStore(state => state.loadAllMaps);
  useEffect(() => {
    loadAllMaps();
  }, [loadAllMaps]);

  const handleCreateNew = async () => {
    const title = `Novo Mapa ${maps.length + 1}`;
    await createNewMap(title);
  };

  const startEditingTitle = (e: React.MouseEvent, mapId: string, currentTitle: string) => {
    e.stopPropagation();
    setEditingMapId(mapId);
    setEditTitleValue(currentTitle);
  };

  const saveMapTitle = async (e: React.MouseEvent, mapId: string) => {
    e.stopPropagation();
    if (editTitleValue.trim() !== '') {
      await updateMapTitle(mapId, editTitleValue.trim());
    }
    setEditingMapId(null);
  };

  const cancelEditingTitle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMapId(null);
  };

  const handleDelete = async (e: React.MouseEvent, mapId: string, mapTitle: string) => {
    e.stopPropagation();
    if (confirm(`Deseja realmente excluir o mapa mental "${mapTitle}"? Todos os nós e ramificações serão apagados permanentemente.`)) {
      await deleteMap(mapId);
    }
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        await importMap(text);
        alert('Mapa importado com sucesso!');
      } catch (err) {
        alert(err instanceof Error ? err.message : 'Falha ao ler o arquivo JSON');
      }
    };
    reader.readAsText(file);
    // Reset file input value
    e.target.value = '';
  };

  const filteredMaps = maps.filter(m => 
    m.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-64 border-r border-gray-200 bg-white flex flex-col h-full select-none" id="sidebar-left">
      {/* Search Bar */}
      <div className="p-4 border-b border-gray-100 flex flex-col gap-3">
        <button 
          onClick={handleCreateNew}
          className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex items-center justify-center gap-2 font-medium text-sm shadow-sm transition-colors cursor-pointer"
          title="Criar um novo mapa mental"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Mapa</span>
        </button>

        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
          <input 
            type="text" 
            placeholder="Buscar mapas..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder-gray-400"
          />
        </div>
      </div>

      {/* Library Scroll Container */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-gray-400 font-bold px-2 py-2 flex items-center justify-between">
          <span>Mapas Recentes ({filteredMaps.length})</span>
        </div>

        {filteredMaps.length === 0 ? (
          <div className="text-center py-6 px-4">
            <p className="text-xs text-gray-400">Nenhum mapa encontrado</p>
          </div>
        ) : (
          filteredMaps.map(m => {
            const isActive = currentMap?.id === m.id;
            const isEditing = editingMapId === m.id;

            return (
              <div
                key={m.id}
                onClick={() => !isEditing && selectMap(m.id)}
                className={cn(
                  'group flex items-center justify-between gap-2 px-2.5 py-2 rounded-md cursor-pointer transition-colors text-sm',
                  isActive 
                    ? 'bg-blue-50 text-blue-700 font-medium' 
                    : 'text-gray-600 hover:bg-gray-50'
                )}
                title={m.title}
              >
                <div className="flex items-center gap-2 overflow-hidden flex-1">
                  <Folder className={cn('w-4 h-4 shrink-0', isActive ? 'text-blue-500' : 'text-gray-400')} />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editTitleValue}
                      onChange={e => setEditTitleValue(e.target.value)}
                      onClick={e => e.stopPropagation()}
                      className="w-full bg-white text-gray-900 border border-blue-400 rounded px-1 py-0.5 text-xs focus:outline-none"
                    />
                  ) : (
                    <span className="truncate">{m.title}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button 
                        onClick={(e) => saveMapTitle(e, m.id)}
                        className="p-1 text-green-600 hover:bg-green-50 rounded"
                        title="Salvar título"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={cancelEditingTitle}
                        className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                        title="Cancelar"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => startEditingTitle(e, m.id, m.title)}
                        className="p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Renomear mapa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDelete(e, m.id, m.title)}
                        className="p-1 text-gray-400 hover:bg-red-50 hover:text-red-600 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Excluir mapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Import / Export Drawer at Bottom */}
      <div className="p-3 border-t border-gray-100 bg-gray-50 flex flex-col gap-2 shrink-0">
        <label className="w-full py-1.5 px-3 bg-white border border-gray-200 text-gray-700 text-xs font-medium rounded shadow-sm hover:bg-gray-100 flex items-center justify-center gap-2 cursor-pointer">
          <FileUp className="w-3.5 h-3.5" />
          <span>Importar JSON (.mind)</span>
          <input 
            type="file" 
            accept=".json,.mind" 
            onChange={handleImportJson} 
            className="hidden" 
          />
        </label>
        
        <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded-md border border-blue-100 text-[10px] text-blue-700">
          <CloudOff className="w-3.5 h-3.5 shrink-0 text-blue-500" />
          <span>Armazenado localmente (Offline-First)</span>
        </div>
      </div>
    </aside>
  );
}
