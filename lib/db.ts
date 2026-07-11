import Dexie, { type Table } from 'dexie';
import { type MindMap } from './types';

class MindFlowDatabase extends Dexie {
  maps!: Table<MindMap, string>;

  constructor() {
    super('MindFlowDatabase');
    this.version(1).stores({
      maps: 'id, title, createdAt, updatedAt, lastOpenedAt'
    });
  }
}

// Ensure database is only initialized once, even with Hot Module Replacement / Next.js SSR
const g = globalThis as unknown as { dbInstance?: MindFlowDatabase };
if (!g.dbInstance) {
  g.dbInstance = new MindFlowDatabase();
}

export const db = g.dbInstance;
