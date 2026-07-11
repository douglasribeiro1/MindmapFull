'use client';

import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import Footer from '../components/Footer';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { FolderPlus, HelpCircle, Sparkles } from 'lucide-react';

export default function Home() {
  const currentMap = useMindMapStore(state => state.currentMap);
  const maps = useMindMapStore(state => state.maps);
  const loadAllMaps = useMindMapStore(state => state.loadAllMaps);
  const createNewMap = useMindMapStore(state => state.createNewMap);
  const selectMap = useMindMapStore(state => state.selectMap);

  const [isLoading, setIsLoading] = useState(true);
  const [zoom, setZoom] = useState(1.0);

  // Zoom control refs to link Footer to Canvas
  const zoomInRef = useRef<(() => void) | null>(null);
  const zoomOutRef = useRef<(() => void) | null>(null);
  const zoomResetRef = useRef<(() => void) | null>(null);

  // Initial load
  useEffect(() => {
    async function bootstrap() {
      try {
        await loadAllMaps();
      } catch (err) {
        console.error('Failed to load maps from IndexedDB:', err);
      } finally {
        setIsLoading(false);
      }
    }
    bootstrap();
  }, [loadAllMaps]);

  // Handle auto-creation of a default map if library is empty
  useEffect(() => {
    if (isLoading) return;

    async function autoCreate() {
      if (maps.length === 0) {
        // Create default template map on first mount
        const mapId = await createNewMap('Estatística Concursos');
        
        // Add some pre-populated template nodes to demonstrate the editor capabilities!
        const store = useMindMapStore.getState();
        const rootNode = store.nodes.find(n => n.data.isRoot);
        if (rootNode) {
          // Temporarily bypass save to queue batch modifications
          store.addNodeChild(rootNode.id);
          const firstChild = useMindMapStore.getState().nodes.find(n => n.data.parentId === rootNode.id);
          if (firstChild) {
            store.updateNodeData(firstChild.id, { 
              label: 'Probabilidade', 
              color: 'blue',
              emoji: '🎲',
              tags: ['importante']
            });
            // Add grandchild
            store.addNodeChild(firstChild.id);
            const grandchild = useMindMapStore.getState().nodes.find(n => n.data.parentId === firstChild.id);
            if (grandchild) {
              store.updateNodeData(grandchild.id, { 
                label: 'Teorema de Bayes',
                color: 'blue',
                notes: 'P(A|B) = [P(B|A) * P(A)] / P(B)'
              });
            }
          }

          store.addNodeChild(rootNode.id);
          const secondChild = useMindMapStore.getState().nodes.filter(n => n.data.parentId === rootNode.id)[1];
          if (secondChild) {
            store.updateNodeData(secondChild.id, { 
              label: 'Amostragem', 
              color: 'green',
              emoji: '📊'
            });
          }
        }
      } else if (!currentMap && maps.length > 0) {
        // Auto-select the last opened map
        await selectMap(maps[0].id);
      }
    }
    autoCreate();
  }, [isLoading, maps, currentMap, createNewMap, selectMap]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#F9FAFB] text-gray-900 flex flex-col items-center justify-center font-sans">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl animate-bounce shadow-md">
            M
          </div>
          <p className="text-sm font-medium text-gray-600 animate-pulse">
            Inicializando banco de dados local...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-screen bg-[#F9FAFB] text-gray-900 font-sans select-none overflow-hidden">
      {/* Top Application Header */}
      <Header />

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Drawer / Sidebar */}
        <Sidebar />

        {/* Central Map Workspace */}
        <main className="flex-1 relative flex flex-col overflow-hidden">
          {currentMap ? (
            <Canvas 
              onZoomChange={setZoom} 
              zoomInRef={zoomInRef} 
              zoomOutRef={zoomOutRef} 
              zoomResetRef={zoomResetRef} 
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 bg-[#F3F4F6] space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center shadow-sm border border-gray-200 text-3xl">
                📂
              </div>
              <h2 className="text-lg font-bold text-gray-800">Nenhum mapa mental ativo</h2>
              <p className="text-sm text-gray-500 max-w-sm">
                Crie um novo mapa mental ou selecione um existente na barra lateral esquerda para começar seus estudos.
              </p>
              <button 
                onClick={() => createNewMap(`Novo Mapa ${maps.length + 1}`)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Criar Novo Mapa
              </button>
            </div>
          )}
        </main>

        {/* Right Drawer / Sidebar */}
        <PropertiesPanel />
      </div>

      {/* Bottom Status Bar */}
      <Footer 
        zoom={zoom}
        onZoomIn={() => zoomInRef.current?.()}
        onZoomOut={() => zoomOutRef.current?.()}
        onZoomReset={() => zoomResetRef.current?.()}
      />
    </div>
  );
}
