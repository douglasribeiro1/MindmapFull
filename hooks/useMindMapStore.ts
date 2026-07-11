import { create } from 'zustand';
import { type CustomNode, type CustomEdge, type MindMap, type EditorSettings, type MindMapNodeData } from '../lib/types';
import { db } from '../lib/db';
import { addEdge, Connection, Edge, applyNodeChanges, applyEdgeChanges, NodeChange, EdgeChange } from '@xyflow/react';

interface MindMapState {
  maps: MindMap[];
  currentMap: MindMap | null;
  nodes: CustomNode[];
  edges: CustomEdge[];
  selectedNodeId: string | null;
  selectedNodeIds: string[]; // multi-selection support
  history: { nodes: CustomNode[]; edges: CustomEdge[] }[];
  future: { nodes: CustomNode[]; edges: CustomEdge[] }[];
  settings: EditorSettings;

  // Map Operations
  loadAllMaps: () => Promise<void>;
  createNewMap: (title: string) => Promise<string>;
  selectMap: (id: string) => Promise<void>;
  saveCurrentMap: () => Promise<void>;
  deleteMap: (id: string) => Promise<void>;
  updateMapTitle: (id: string, title: string) => Promise<void>;
  importMap: (jsonData: string) => Promise<string>;

  // Node Actions
  setNodes: (nodes: CustomNode[]) => void;
  setEdges: (edges: CustomEdge[]) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  setSelectedNodeId: (id: string | null) => void;
  setSelectedNodeIds: (ids: string[]) => void;

  // Mindmap Operations
  addNodeChild: (parentId: string) => void;
  addNodeSibling: (siblingId: string) => void;
  deleteSelectedNodes: () => void;
  deleteNodeRecursive: (nodeId: string) => void;
  updateNodeData: (nodeId: string, data: Partial<MindMapNodeData>) => void;
  toggleCollapseBranch: (nodeId: string) => void;
  duplicateBranch: (nodeId: string) => void;
  wrapSelectedInNewParent: () => void;

  // History / Undo / Redo
  pushToHistory: () => void;
  undo: () => void;
  redo: () => void;

  // Settings
  setTheme: (theme: 'light' | 'dark') => void;
  toggleGrid: () => void;
  toggleSnap: () => void;
}

// Helper to check and apply visibility based on collapse state
const updateVisibilityOfDescendants = (nodes: CustomNode[], edges: CustomEdge[]): { nodes: CustomNode[]; edges: CustomEdge[] } => {
  // Map of parentId -> array of child nodes
  const parentToChildren = new Map<string, CustomNode[]>();
  nodes.forEach(n => {
    const pId = n.data.parentId;
    if (pId) {
      if (!parentToChildren.has(pId)) parentToChildren.set(pId, []);
      parentToChildren.get(pId)!.push(n);
    }
  });

  // Track which nodes are collapsed
  const collapsedNodeIds = new Set<string>(
    nodes.filter(n => n.data.isCollapsed).map(n => n.id)
  );

  // Set of all nodes that must be hidden recursively
  const hiddenNodeIds = new Set<string>();

  const hideDescendants = (parentId: string) => {
    const children = parentToChildren.get(parentId) || [];
    children.forEach(child => {
      hiddenNodeIds.add(child.id);
      hideDescendants(child.id); // hide recursively
    });
  };

  // For every collapsed node, recursively hide its descendants
  collapsedNodeIds.forEach(id => {
    hideDescendants(id);
  });

  // Apply hidden state to nodes
  const updatedNodes = nodes.map(n => {
    const shouldHide = hiddenNodeIds.has(n.id);
    if (n.hidden !== shouldHide) {
      return { ...n, hidden: shouldHide };
    }
    return n;
  });

  // Apply hidden state to edges (if source or target is hidden, hide edge)
  const updatedEdges = edges.map(e => {
    const sourceHidden = hiddenNodeIds.has(e.source) || collapsedNodeIds.has(e.source);
    const targetHidden = hiddenNodeIds.has(e.target);
    const shouldHide = sourceHidden || targetHidden;
    if (e.hidden !== shouldHide) {
      return { ...e, hidden: shouldHide };
    }
    return e;
  });

  return { nodes: updatedNodes, edges: updatedEdges };
};

export const useMindMapStore = create<MindMapState>((set, get) => ({
  maps: [],
  currentMap: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedNodeIds: [],
  history: [],
  future: [],
  settings: {
    theme: 'light',
    showGrid: true,
    snapToGrid: true,
    autoSave: true,
  },

  loadAllMaps: async () => {
    const allMaps = await db.maps.toArray();
    // Sort by last opened or updated
    allMaps.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    set({ maps: allMaps });
  },

  createNewMap: async (title: string) => {
    const id = crypto.randomUUID();
    const rootNodeId = crypto.randomUUID();

    const rootNode: CustomNode = {
      id: rootNodeId,
      type: 'mindmap',
      position: { x: 0, y: 0 },
      data: {
        label: title,
        isRoot: true,
        color: 'blue',
        borderRadius: 12,
        shadowStrength: 2,
        tags: [],
        emoji: '💡',
      },
    };

    const newMap: MindMap = {
      id,
      title,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
      nodes: [rootNode],
      edges: [],
    };

    await db.maps.add(newMap);
    await get().loadAllMaps();
    await get().selectMap(id);
    return id;
  },

  selectMap: async (id: string) => {
    const map = await db.maps.get(id);
    if (map) {
      // Update lastOpenedAt
      map.lastOpenedAt = Date.now();
      await db.maps.put(map);

      const { nodes, edges } = updateVisibilityOfDescendants(map.nodes, map.edges);

      set({
        currentMap: map,
        nodes,
        edges,
        selectedNodeId: null,
        selectedNodeIds: [],
        history: [],
        future: [],
      });
      await get().loadAllMaps();
    }
  },

  saveCurrentMap: async () => {
    const { currentMap, nodes, edges } = get();
    if (!currentMap) return;

    const updatedMap: MindMap = {
      ...currentMap,
      nodes,
      edges,
      updatedAt: Date.now(),
    };

    await db.maps.put(updatedMap);
    set({ currentMap: updatedMap });

    // Refresh list silently
    const allMaps = await db.maps.toArray();
    allMaps.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
    set({ maps: allMaps });
  },

  deleteMap: async (id: string) => {
    await db.maps.delete(id);
    const { currentMap } = get();
    if (currentMap?.id === id) {
      set({ currentMap: null, nodes: [], edges: [], selectedNodeId: null, selectedNodeIds: [] });
    }
    await get().loadAllMaps();
  },

  updateMapTitle: async (id: string, title: string) => {
    const map = await db.maps.get(id);
    if (map) {
      map.title = title;
      map.updatedAt = Date.now();
      // If the root node label is still matching the old title, update it too
      const updatedNodes = map.nodes.map(n => {
        if (n.data.isRoot && n.data.label === map.title) {
          return { ...n, data: { ...n.data, label: title } };
        }
        return n;
      });
      map.nodes = updatedNodes;

      await db.maps.put(map);
      if (get().currentMap?.id === id) {
        const { nodes, edges } = updateVisibilityOfDescendants(updatedNodes, map.edges);
        set({
          currentMap: { ...get().currentMap!, title, nodes: updatedNodes },
          nodes,
          edges,
        });
      }
      await get().loadAllMaps();
    }
  },

  importMap: async (jsonData: string) => {
    try {
      const parsed = JSON.parse(jsonData) as Partial<MindMap>;
      if (!parsed.title || !Array.isArray(parsed.nodes)) {
        throw new Error('Formato de arquivo inválido');
      }

      const id = parsed.id || crypto.randomUUID();
      const newMap: MindMap = {
        id,
        title: parsed.title,
        createdAt: parsed.createdAt || Date.now(),
        updatedAt: Date.now(),
        lastOpenedAt: Date.now(),
        nodes: parsed.nodes.map(n => ({
          ...n,
          type: n.type || 'mindmap',
        })),
        edges: parsed.edges || [],
      };

      await db.maps.put(newMap);
      await get().loadAllMaps();
      await get().selectMap(id);
      return id;
    } catch (e) {
      console.error(e);
      throw new Error('Falha ao importar mapa mental');
    }
  },

  setNodes: (nodes: CustomNode[]) => {
    set({ nodes });
    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  setEdges: (edges: CustomEdge[]) => {
    set({ edges });
    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  onNodesChange: (changes: NodeChange[]) => {
    const updatedNodes = applyNodeChanges(changes, get().nodes) as CustomNode[];
    set({ nodes: updatedNodes });

    // AutoSave when nodes are moved/dragged
    const isDragOrDimensionChange = changes.some(
      c => c.type === 'position' || c.type === 'dimensions'
    );
    if (isDragOrDimensionChange && get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const updatedEdges = applyEdgeChanges(changes, get().edges) as CustomEdge[];
    set({ edges: updatedEdges });
    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  onConnect: (connection: Connection) => {
    get().pushToHistory();
    const newEdges = addEdge(connection, get().edges) as CustomEdge[];
    set({ edges: newEdges });
    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  setSelectedNodeId: (id: string | null) => {
    set({
      selectedNodeId: id,
      selectedNodeIds: id ? [id] : [],
    });
  },

  setSelectedNodeIds: (ids: string[]) => {
    set({
      selectedNodeIds: ids,
      selectedNodeId: ids.length === 1 ? ids[0] : null,
    });
  },

  addNodeChild: (parentId: string) => {
    const parentNode = get().nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    get().pushToHistory();

    const newId = crypto.randomUUID();
    const edgeId = crypto.randomUUID();

    // Geometric positioning
    const parentX = parentNode.position.x;
    const parentY = parentNode.position.y;

    // Is the parent node on the left or right relative to root?
    // This allows mind maps to grow in both directions gracefully.
    let direction = 1; // Default to right
    if (!parentNode.data.isRoot && parentNode.data.parentId) {
      // Find parent's parent to trace orientation
      const grandparent = get().nodes.find(n => n.id === parentNode.data.parentId);
      if (grandparent) {
        direction = parentNode.position.x >= grandparent.position.x ? 1 : -1;
      }
    } else if (parentNode.data.isRoot) {
      // Alternate left and right for first level children
      const rootChildren = get().nodes.filter(n => n.data.parentId === parentId);
      direction = rootChildren.length % 2 === 0 ? 1 : -1;
    }

    const offsetX = 240 * direction;
    let offsetY = 0;

    // Let's check existing children of this parent to avoid overlaps
    const existingChildren = get().nodes.filter(n => n.data.parentId === parentId);
    if (existingChildren.length > 0) {
      // Find maximum Y and minimum Y of siblings, stack below them
      const siblingYs = existingChildren.map(c => c.position.y);
      const maxY = Math.max(...siblingYs);
      offsetY = maxY - parentY + 80; // place 80px below the bottom-most sibling
    } else {
      offsetY = 0; // perfectly aligned horizontally
    }

    const newNode: CustomNode = {
      id: newId,
      type: 'mindmap',
      position: {
        x: parentX + offsetX,
        y: parentY + offsetY,
      },
      data: {
        label: 'Novo Tópico',
        color: parentNode.data.color || 'blue',
        borderRadius: 8,
        shadowStrength: 1,
        tags: [],
        emoji: '',
        parentId,
      },
    };

    const newEdge: CustomEdge = {
      id: edgeId,
      source: parentId,
      target: newId,
      type: 'smoothstep', // Custom rounded step
      animated: false,
      style: { strokeWidth: 2, stroke: '#9CA3AF' },
    };

    const updatedNodes = [...get().nodes, newNode];
    const updatedEdges = [...get().edges, newEdge];

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: newId,
      selectedNodeIds: [newId],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  addNodeSibling: (siblingId: string) => {
    const siblingNode = get().nodes.find(n => n.id === siblingId);
    // Cannot add sibling to root node
    if (!siblingNode || siblingNode.data.isRoot || !siblingNode.data.parentId) return;

    get().pushToHistory();

    const parentId = siblingNode.data.parentId;
    const parentNode = get().nodes.find(n => n.id === parentId);
    if (!parentNode) return;

    const newId = crypto.randomUUID();
    const edgeId = crypto.randomUUID();

    const newNode: CustomNode = {
      id: newId,
      type: 'mindmap',
      position: {
        x: siblingNode.position.x,
        y: siblingNode.position.y + 80, // Stack below
      },
      data: {
        label: 'Novo Tópico',
        color: siblingNode.data.color || 'blue',
        borderRadius: 8,
        shadowStrength: 1,
        tags: [],
        emoji: '',
        parentId,
      },
    };

    const newEdge: CustomEdge = {
      id: edgeId,
      source: parentId,
      target: newId,
      type: 'smoothstep',
      animated: false,
      style: { strokeWidth: 2, stroke: '#9CA3AF' },
    };

    const updatedNodes = [...get().nodes, newNode];
    const updatedEdges = [...get().edges, newEdge];

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: newId,
      selectedNodeIds: [newId],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  deleteSelectedNodes: () => {
    const { selectedNodeIds, nodes } = get();
    if (selectedNodeIds.length === 0) return;

    // Do not delete root node
    const filteredIds = selectedNodeIds.filter(id => {
      const node = nodes.find(n => n.id === id);
      return node && !node.data.isRoot;
    });

    if (filteredIds.length === 0) return;

    get().pushToHistory();

    // We need to recursively collect all children of all filtered nodes
    const allNodeIdsToDelete = new Set<string>();

    const collectDescendants = (nodeId: string) => {
      allNodeIdsToDelete.add(nodeId);
      const children = get().nodes.filter(n => n.data.parentId === nodeId);
      children.forEach(c => collectDescendants(c.id));
    };

    filteredIds.forEach(id => collectDescendants(id));

    const updatedNodes = get().nodes.filter(n => !allNodeIdsToDelete.has(n.id));
    const updatedEdges = get().edges.filter(
      e => !allNodeIdsToDelete.has(e.source) && !allNodeIdsToDelete.has(e.target)
    );

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: null,
      selectedNodeIds: [],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  deleteNodeRecursive: (nodeId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node || node.data.isRoot) return;

    get().pushToHistory();

    const allNodeIdsToDelete = new Set<string>();

    const collectDescendants = (id: string) => {
      allNodeIdsToDelete.add(id);
      const children = get().nodes.filter(n => n.data.parentId === id);
      children.forEach(c => collectDescendants(c.id));
    };

    collectDescendants(nodeId);

    const updatedNodes = get().nodes.filter(n => !allNodeIdsToDelete.has(n.id));
    const updatedEdges = get().edges.filter(
      e => !allNodeIdsToDelete.has(e.source) && !allNodeIdsToDelete.has(e.target)
    );

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
      selectedNodeIds: get().selectedNodeIds.filter(id => !allNodeIdsToDelete.has(id)),
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  updateNodeData: (nodeId: string, data: Partial<MindMapNodeData>) => {
    const nodeExists = get().nodes.some(n => n.id === nodeId);
    if (!nodeExists) return;

    get().pushToHistory();

    const updatedNodes = get().nodes.map(node => {
      if (node.id === nodeId) {
        return {
          ...node,
          data: {
            ...node.data,
            ...data,
          },
        };
      }
      return node;
    });

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, get().edges);

    set({ nodes: visNodes, edges: visEdges });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  toggleCollapseBranch: (nodeId: string) => {
    const updatedNodes = get().nodes.map(n => {
      if (n.id === nodeId) {
        return {
          ...n,
          data: { ...n.data, isCollapsed: !n.data.isCollapsed },
        };
      }
      return n;
    });

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, get().edges);

    set({ nodes: visNodes, edges: visEdges });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  duplicateBranch: (nodeId: string) => {
    const node = get().nodes.find(n => n.id === nodeId);
    if (!node || node.data.isRoot) return;

    get().pushToHistory();

    const idMapping = new Map<string, string>();
    const newNodes: CustomNode[] = [];
    const newEdges: CustomEdge[] = [];

    // Recursively collect and clone branch
    const cloneNodeAndDescendants = (currentId: string, clonedParentId: string | undefined) => {
      const origNode = get().nodes.find(n => n.id === currentId);
      if (!origNode) return;

      const clonedId = crypto.randomUUID();
      idMapping.set(currentId, clonedId);

      // Sibling clone offset
      const posX = origNode.position.x;
      const posY = origNode.position.y + (clonedParentId ? 0 : 150); // Offset root of duplicated branch downward

      const clonedNode: CustomNode = {
        ...origNode,
        id: clonedId,
        position: { x: posX, y: posY },
        data: {
          ...origNode.data,
          isRoot: false,
          parentId: clonedParentId,
        },
      };

      newNodes.push(clonedNode);

      // Find children
      const children = get().nodes.filter(n => n.data.parentId === currentId);
      children.forEach(child => {
        cloneNodeAndDescendants(child.id, clonedId);
      });
    };

    cloneNodeAndDescendants(nodeId, node.data.parentId);

    // Recreate internal edges for the duplicated branch
    newNodes.forEach(n => {
      if (n.data.parentId) {
        const sourceId = n.data.parentId; // already mapped/cloned ID
        const targetId = n.id;
        const edgeId = crypto.randomUUID();

        newEdges.push({
          id: edgeId,
          source: sourceId,
          target: targetId,
          type: 'smoothstep',
          style: { strokeWidth: 2, stroke: '#9CA3AF' },
        });
      }
    });

    // If it's a direct child of some parent, connect cloned parent root to actual parent
    if (node.data.parentId) {
      const newEdgeId = crypto.randomUUID();
      newEdges.push({
        id: newEdgeId,
        source: node.data.parentId,
        target: idMapping.get(nodeId)!,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#9CA3AF' },
      });
    }

    const updatedNodes = [...get().nodes, ...newNodes];
    const updatedEdges = [...get().edges, ...newEdges];

    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(updatedNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: idMapping.get(nodeId) || null,
      selectedNodeIds: [idMapping.get(nodeId)!],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  wrapSelectedInNewParent: () => {
    const { selectedNodeIds, nodes, edges } = get();
    if (selectedNodeIds.length <= 1) return; // Need multiple nodes to wrap

    // Find if all selected nodes share the same parent
    const firstNode = nodes.find(n => n.id === selectedNodeIds[0]);
    if (!firstNode || firstNode.data.isRoot) return;

    const parentId = firstNode.data.parentId;
    const allHaveSameParent = selectedNodeIds.every(id => {
      const n = nodes.find(n => n.id === id);
      return n && n.data.parentId === parentId;
    });

    if (!allHaveSameParent || !parentId) return;

    get().pushToHistory();

    // Create new parent node
    const newParentId = crypto.randomUUID();

    // Position new parent as the bounding box average of selected nodes
    const selectedNodesObj = nodes.filter(n => selectedNodeIds.includes(n.id));
    const avgX = selectedNodesObj.reduce((sum, n) => sum + n.position.x, 0) / selectedNodesObj.length;
    const avgY = selectedNodesObj.reduce((sum, n) => sum + n.position.y, 0) / selectedNodesObj.length;

    // Place new parent in between current parent and children
    const actualParent = nodes.find(n => n.id === parentId);
    const parentX = actualParent ? actualParent.position.x : avgX - 150;

    const newParentNode: CustomNode = {
      id: newParentId,
      type: 'mindmap',
      position: {
        x: (parentX + avgX) / 2,
        y: avgY,
      },
      data: {
        label: 'Grupo',
        color: firstNode.data.color || 'blue',
        borderRadius: 10,
        shadowStrength: 2,
        tags: [],
        emoji: '📦',
        parentId,
      },
    };

    // Update child nodes to refer to new parent
    const updatedNodes = nodes.map(n => {
      if (selectedNodeIds.includes(n.id)) {
        return {
          ...n,
          data: {
            ...n.data,
            parentId: newParentId,
          },
        };
      }
      return n;
    });

    // Remove old edges from parent to children, and create new edges
    // 1. Edge from original parent to new parent
    const newParentEdge: CustomEdge = {
      id: crypto.randomUUID(),
      source: parentId,
      target: newParentId,
      type: 'smoothstep',
      style: { strokeWidth: 2, stroke: '#9CA3AF' },
    };

    // Remove existing edges from original parent to these selected nodes
    let updatedEdges = edges.filter(
      e => !(e.source === parentId && selectedNodeIds.includes(e.target))
    );

    // 2. Add edge from new parent to children
    selectedNodeIds.forEach(childId => {
      updatedEdges.push({
        id: crypto.randomUUID(),
        source: newParentId,
        target: childId,
        type: 'smoothstep',
        style: { strokeWidth: 2, stroke: '#9CA3AF' },
      });
    });

    updatedEdges.push(newParentEdge);

    const finalNodes = [...updatedNodes, newParentNode];
    const { nodes: visNodes, edges: visEdges } = updateVisibilityOfDescendants(finalNodes, updatedEdges);

    set({
      nodes: visNodes,
      edges: visEdges,
      selectedNodeId: newParentId,
      selectedNodeIds: [newParentId],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  pushToHistory: () => {
    const { nodes, edges, history } = get();
    // Keep up to 50 entries in history
    const cloneNodes = JSON.parse(JSON.stringify(nodes)) as CustomNode[];
    const cloneEdges = JSON.parse(JSON.stringify(edges)) as CustomEdge[];

    set({
      history: [...history.slice(-49), { nodes: cloneNodes, edges: cloneEdges }],
      future: [], // clear redo list on new action
    });
  },

  undo: () => {
    const { history, future, nodes, edges } = get();
    if (history.length === 0) return;

    const previous = history[history.length - 1];
    const currentClone = JSON.parse(JSON.stringify({ nodes, edges })) as { nodes: CustomNode[]; edges: CustomEdge[] };

    set({
      nodes: previous.nodes,
      edges: previous.edges,
      history: history.slice(0, -1),
      future: [...future, currentClone],
      selectedNodeId: null,
      selectedNodeIds: [],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  redo: () => {
    const { history, future, nodes, edges } = get();
    if (future.length === 0) return;

    const next = future[future.length - 1];
    const currentClone = JSON.parse(JSON.stringify({ nodes, edges })) as { nodes: CustomNode[]; edges: CustomEdge[] };

    set({
      nodes: next.nodes,
      edges: next.edges,
      future: future.slice(0, -1),
      history: [...history, currentClone],
      selectedNodeId: null,
      selectedNodeIds: [],
    });

    if (get().settings.autoSave) {
      get().saveCurrentMap();
    }
  },

  setTheme: (theme: 'light' | 'dark') => {
    set({ settings: { ...get().settings, theme } });
  },

  toggleGrid: () => {
    set({ settings: { ...get().settings, showGrid: !get().settings.showGrid } });
  },

  toggleSnap: () => {
    set({ settings: { ...get().settings, snapToGrid: !get().settings.snapToGrid } });
  },
}));
