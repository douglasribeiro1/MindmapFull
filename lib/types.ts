import { type Node, type Edge } from '@xyflow/react';

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  isRoot?: boolean;
  color?: string; // Preset color identifier (e.g., 'blue', 'green', 'orange', 'red', 'purple')
  emoji?: string;
  tags?: string[];
  notes?: string;
  link?: string;
  isCollapsed?: boolean;
  borderRadius?: number; // 0 (none) to 24 (full)
  shadowStrength?: number; // 0 (none) to 3 (strong)
  parentId?: string; // Logical reference to the parent node
}

export type CustomNode = Node<MindMapNodeData>;
export type CustomEdge = Edge;

export interface MindMap {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface HistoryState {
  nodes: CustomNode[];
  edges: CustomEdge[];
}

export interface EditorSettings {
  theme: 'light' | 'dark';
  showGrid: boolean;
  snapToGrid: boolean;
  autoSave: boolean;
}
