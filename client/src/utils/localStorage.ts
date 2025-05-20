import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface TaskDB extends DBSchema {
  tasks: {
    key: number;
    value: {
      id: number;
      user_id: number;
      title: string;
      description: string | null;
      completed: number;
      created_at: string;
      synced: boolean;
      last_modified: number;
    };
    indexes: { 'by-user': number };
  };
  syncQueue: {
    key: string;
    value: {
      action: 'create' | 'update' | 'delete';
      data: any;
      timestamp: number;
    };
  };
}

class LocalStorageService {
  private db: IDBPDatabase<TaskDB> | null = null;
  private readonly DB_NAME = 'taskHandlerDB';
  private readonly VERSION = 1;

  async init() {
    if (!this.db) {
      this.db = await openDB<TaskDB>(this.DB_NAME, this.VERSION, {
        upgrade(db) {
          // Create tasks store
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id', autoIncrement: true });
          taskStore.createIndex('by-user', 'user_id');

          // Create sync queue store
          db.createObjectStore('syncQueue', { keyPath: 'timestamp' });
        },
      });
    }
    return this.db;
  }

  // Task operations
  async addTask(task: Omit<TaskDB['tasks']['value'], 'id' | 'synced' | 'last_modified'>) {
    const db = await this.init();
    const timestamp = Date.now();
    
    const taskWithMeta = {
      ...task,
      id: Date.now(), // Temporary ID until synced with server
      synced: false,
      last_modified: timestamp,
    };

    await db.add('tasks', taskWithMeta);
    
    // Add to sync queue
    await db.add('syncQueue', {
      action: 'create',
      data: taskWithMeta,
      timestamp,
    });

    return taskWithMeta.id;
  }

  async updateTask(task: TaskDB['tasks']['value']) {
    const db = await this.init();
    const timestamp = Date.now();
    
    const taskWithMeta = {
      ...task,
      synced: false,
      last_modified: timestamp,
    };

    await db.put('tasks', taskWithMeta);
    
    // Add to sync queue
    await db.add('syncQueue', {
      action: 'update',
      data: taskWithMeta,
      timestamp,
    });
  }

  async deleteTask(id: number) {
    const db = await this.init();
    const task = await db.get('tasks', id);
    
    if (task) {
      await db.delete('tasks', id);
      
      // Add to sync queue
      await db.add('syncQueue', {
        action: 'delete',
        data: { id },
        timestamp: Date.now(),
      });
    }
  }

  async getTasks(userId: number) {
    const db = await this.init();
    const index = db.transaction('tasks').store.index('by-user');
    return index.getAll(userId);
  }

  // Sync queue operations
  async getSyncQueue() {
    const db = await this.init();
    return db.getAll('syncQueue');
  }

  async clearSyncQueue() {
    const db = await this.init();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.store.clear();
    await tx.done;
  }

  // Auth operations
  async setAuthToken(token: string) {
    localStorage.setItem('token', token);
  }

  async getAuthToken() {
    return localStorage.getItem('token');
  }

  async clearAuthToken() {
    localStorage.removeItem('token');
  }
}

export const localStorageService = new LocalStorageService(); 