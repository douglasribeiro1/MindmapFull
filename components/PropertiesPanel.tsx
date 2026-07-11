'use client';

import React, { useState, useEffect } from 'react';
import { useMindMapStore } from '../hooks/useMindMapStore';
import { Trash2, Copy, Link as LinkIcon, Plus, X, MessageSquare, Info, FolderPlus } from 'lucide-react';
import { cn } from '../lib/utils';

export default function PropertiesPanel() {
  const selectedNodeId = useMindMapStore(state => state.selectedNodeId);
  const selectedNodeIds = useMindMapStore(state => state.selectedNodeIds);
  const nodes = useMindMapStore(state => state.nodes);
  const updateNodeData = useMindMapStore(state => state.updateNodeData);
  const deleteNodeRecursive = useMindMapStore(state => state.deleteNodeRecursive);
  const deleteSelectedNodes = useMindMapStore(state => state.deleteSelectedNodes);
  const duplicateBranch = useMindMapStore(state => state.duplicateBranch);
  const wrapSelectedInNewParent = useMindMapStore(state => state.wrapSelectedInNewParent);

  const [tagInput, setTagInput] = useState('');

  // Find the selected node
  const activeNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) : null;

  // Sync inputs
  const [label, setLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    if (activeNode) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLabel(activeNode.data.label || '');
      setNotes(activeNode.data.notes || '');
      setLink(activeNode.data.link || '');
    }
  }, [activeNode]);

  if (selectedNodeIds.length > 1) {
    // Multi-selection Properties Panel
    return (
      <aside className="w-72 border-l border-gray-200 bg-white flex flex-col h-full select-none" id="properties-panel">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <span className="font-semibold text-sm">Seleção Múltipla</span>
          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
            {selectedNodeIds.length} Itens
          </span>
        </div>

        <div className="p-4 flex-1 space-y-6">
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-xs text-gray-500 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 text-gray-400 shrink-0" />
            <span>Você selecionou múltiplos tópicos. Você pode aplicar ações em lote neles abaixo.</span>
          </div>

          {/* Preset Styles for multi-selection */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Alterar Cor do Grupo</label>
            <div className="grid grid-cols-6 gap-2">
              {['blue', 'green', 'orange', 'red', 'purple', 'gray'].map(c => (
                <button
                  key={c}
                  onClick={() => {
                    selectedNodeIds.forEach(id => updateNodeData(id, { color: c }));
                  }}
                  className={cn(
                    'w-8 h-8 rounded-full border border-gray-200 cursor-pointer transition-transform hover:scale-110 active:scale-95',
                    c === 'blue' && 'bg-blue-500',
                    c === 'green' && 'bg-emerald-500',
                    c === 'orange' && 'bg-orange-500',
                    c === 'red' && 'bg-rose-500',
                    c === 'purple' && 'bg-violet-500',
                    c === 'gray' && 'bg-gray-600'
                  )}
                  title={`Definir cor ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 space-y-3">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ações em Grupo</label>
            
            {/* Wrap in new parent */}
            <button
              onClick={wrapSelectedInNewParent}
              className="w-full py-2 px-3 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold rounded shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
              title="Agrupar todos os tópicos selecionados sob um novo tópico pai"
            >
              <FolderPlus className="w-4 h-4 text-blue-500" />
              <span>Criar Tópico Pai Compartilhado</span>
            </button>

            {/* Delete group */}
            <button
              onClick={deleteSelectedNodes}
              className="w-full py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded border border-red-200 flex items-center justify-center gap-2 cursor-pointer transition-colors"
              title="Excluir todos os tópicos selecionados e suas ramificações"
            >
              <Trash2 className="w-4 h-4" />
              <span>Excluir Seleção</span>
            </button>
          </div>
        </div>
      </aside>
    );
  }

  if (!activeNode) {
    // Empty state Panel
    return (
      <aside className="w-72 border-l border-gray-200 bg-white flex flex-col h-full select-none" id="properties-panel">
        <div className="p-4 border-b border-gray-200">
          <span className="font-semibold text-sm">Propriedades</span>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400 space-y-3 select-none">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 border border-gray-100">
            💡
          </div>
          <div className="text-sm font-medium text-gray-700">Nenhum Tópico Selecionado</div>
          <p className="text-xs text-gray-400 max-w-[200px] leading-relaxed">
            Selecione qualquer tópico no mapa mental para visualizar e editar suas notas, cores, tags e links.
          </p>
          <div className="pt-4 border-t border-gray-100 w-full text-left space-y-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Atalhos Úteis</div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-gray-500">
              <span className="font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded text-center">Enter</span>
              <span>Novo Irmão</span>
              <span className="font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded text-center">Tab</span>
              <span>Novo Filho</span>
              <span className="font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded text-center">F2</span>
              <span>Editar Texto</span>
              <span className="font-bold text-gray-700 bg-gray-100 px-1 py-0.5 rounded text-center">Del</span>
              <span>Excluir Item</span>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  // Handle label change in real-time
  const handleLabelChange = (val: string) => {
    setLabel(val);
    updateNodeData(activeNode.id, { label: val });
  };

  // Handle notes change
  const handleNotesChange = (val: string) => {
    setNotes(val);
    updateNodeData(activeNode.id, { notes: val });
  };

  // Handle link change
  const handleLinkChange = (val: string) => {
    setLink(val);
    updateNodeData(activeNode.id, { link: val });
  };

  // Handle adding custom tags
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (tagInput.trim() !== '') {
      const currentTags = activeNode.data.tags || [];
      const tag = tagInput.trim().toLowerCase();
      if (!currentTags.includes(tag)) {
        updateNodeData(activeNode.id, { tags: [...currentTags, tag] });
      }
      setTagInput('');
    }
  };

  // Handle removing tag
  const handleRemoveTag = (tagToRemove: string) => {
    const currentTags = activeNode.data.tags || [];
    updateNodeData(activeNode.id, { tags: currentTags.filter(t => t !== tagToRemove) });
  };

  // Preset Emojis
  const emojiPresets = ['💡', '📌', '⚠️', '✅', '🚀', '⭐', '📈', '🎨', '📝', '❓', '🎯', '🔥', '💻', '🎓'];

  return (
    <aside className="w-72 border-l border-gray-200 bg-white flex flex-col h-full overflow-y-auto select-none" id="properties-panel">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10 shrink-0">
        <span className="font-semibold text-sm">Propriedades do Tópico</span>
        {activeNode.data.isRoot && (
          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded uppercase">Raiz</span>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Label Text Input */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Conteúdo do Tópico</label>
          <textarea
            value={label}
            onChange={e => handleLabelChange(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans"
            rows={2}
            placeholder="Digite o texto do tópico..."
          />
        </div>

        {/* Emojis Selector */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Ícone / Emoji</label>
          <div className="flex flex-wrap gap-1 mb-2">
            {emojiPresets.map(emoji => (
              <button
                key={emoji}
                onClick={() => updateNodeData(activeNode.id, { emoji })}
                className={cn(
                  'w-7 h-7 rounded hover:bg-gray-100 flex items-center justify-center text-sm transition-colors cursor-pointer',
                  activeNode.data.emoji === emoji && 'bg-blue-50 hover:bg-blue-50 ring-1 ring-blue-400'
                )}
              >
                {emoji}
              </button>
            ))}
            {activeNode.data.emoji && (
              <button
                onClick={() => updateNodeData(activeNode.id, { emoji: '' })}
                className="px-1.5 text-[10px] text-red-500 hover:bg-red-50 rounded border border-dashed border-red-200 cursor-pointer"
                title="Limpar ícone"
              >
                Remover
              </button>
            )}
          </div>
        </div>

        {/* Color Presets */}
        <div>
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Aparência (Cor)</label>
          <div className="grid grid-cols-6 gap-2">
            {['blue', 'green', 'orange', 'red', 'purple', 'gray'].map(c => {
              const isActive = (activeNode.data.color || 'blue') === c;
              return (
                <button
                  key={c}
                  onClick={() => updateNodeData(activeNode.id, { color: c })}
                  className={cn(
                    'w-8 h-8 rounded-full border cursor-pointer relative transition-transform hover:scale-110 flex items-center justify-center',
                    c === 'blue' && 'bg-blue-500 border-blue-600',
                    c === 'green' && 'bg-emerald-500 border-emerald-600',
                    c === 'orange' && 'bg-orange-500 border-orange-600',
                    c === 'red' && 'bg-rose-500 border-rose-600',
                    c === 'purple' && 'bg-violet-500 border-violet-600',
                    c === 'gray' && 'bg-gray-600 border-gray-700',
                    isActive && 'ring-2 ring-offset-2 ring-blue-500'
                  )}
                  title={`Estilo ${c}`}
                >
                  {isActive && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance sliders */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Arredondar Cantos</span>
            <input
              type="range"
              min="0"
              max="24"
              step="4"
              value={activeNode.data.borderRadius !== undefined ? activeNode.data.borderRadius : 8}
              onChange={e => updateNodeData(activeNode.id, { borderRadius: parseInt(e.target.value) })}
              className="w-28 accent-blue-600 cursor-pointer"
            />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-600">Sombra do Bloco</span>
            <input
              type="range"
              min="0"
              max="3"
              step="1"
              value={activeNode.data.shadowStrength !== undefined ? activeNode.data.shadowStrength : 1}
              onChange={e => updateNodeData(activeNode.id, { shadowStrength: parseInt(e.target.value) })}
              className="w-28 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        {/* Tags Section */}
        <div className="pt-3 border-t border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">Etiquetas (Tags)</label>
          
          {/* Tag List */}
          <div className="flex flex-wrap gap-1 mb-2">
            {activeNode.data.tags && activeNode.data.tags.map(tag => (
              <span
                key={tag}
                className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-bold rounded flex items-center gap-1 uppercase"
              >
                <span>{tag}</span>
                <button
                  onClick={() => handleRemoveTag(tag)}
                  className="text-gray-400 hover:text-red-500 rounded-full"
                  title="Excluir etiqueta"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>

          {/* Form to add Tag */}
          <form onSubmit={handleAddTag} className="flex gap-1.5">
            <input
              type="text"
              placeholder="Nova tag..."
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              className="flex-1 px-2.5 py-1 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="px-2 py-1 bg-gray-100 border border-gray-200 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Link field */}
        <div className="pt-3 border-t border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <LinkIcon className="w-3.5 h-3.5 text-gray-400" />
            <span>Link Externo</span>
          </label>
          <input
            type="text"
            value={link}
            onChange={e => handleLinkChange(e.target.value)}
            placeholder="Ex: www.google.com"
            className="w-full px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>

        {/* Notes area */}
        <div className="pt-3 border-t border-gray-100">
          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-gray-400" />
            <span>Anotações / Notas</span>
          </label>
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Insira anotações detalhadas de estudo para este tópico..."
            className="w-full px-3 py-2 text-xs border border-gray-200 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans"
            rows={4}
          />
        </div>

        {/* Branch Operations */}
        {!activeNode.data.isRoot && (
          <div className="pt-4 border-t border-gray-100 space-y-2 shrink-0">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Ações do Ramo</label>
            
            {/* Duplicate branch */}
            <button
              onClick={() => duplicateBranch(activeNode.id)}
              className="w-full py-1.5 px-3 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-medium rounded flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-colors"
              title="Clona esta ramificação inteira"
            >
              <Copy className="w-3.5 h-3.5 text-blue-500" />
              <span>Duplicar Ramificação</span>
            </button>

            {/* Delete branch recursively */}
            <button
              onClick={() => {
                if (confirm('Deseja excluir este tópico e TODOS os seus filhos recursivamente?')) {
                  deleteNodeRecursive(activeNode.id);
                }
              }}
              className="w-full py-1.5 px-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-medium rounded flex items-center justify-center gap-2 cursor-pointer transition-colors"
              title="Exclui este nó e seus filhos"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Ramo</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
