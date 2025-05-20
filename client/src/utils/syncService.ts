import { localStorageService } from './localStorage';

class SyncService {
  private isOnline: boolean = navigator.onLine;
  private syncInProgress: boolean = false;

  constructor() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = async () => {
    this.isOnline = true;
    await this.sync();
  };

  private handleOffline = () => {
    this.isOnline = false;
  };

  async sync() {
    if (!this.isOnline || this.syncInProgress) return;

    try {
      this.syncInProgress = true;
      const queue = await localStorageService.getSyncQueue();
      const token = await localStorageService.getAuthToken();

      if (!token) return;

      for (const item of queue) {
        try {
          switch (item.action) {
            case 'create':
              await this.syncCreate(item.data);
              break;
            case 'update':
              await this.syncUpdate(item.data);
              break;
            case 'delete':
              await this.syncDelete(item.data.id);
              break;
          }
        } catch (error) {
          console.error(`Failed to sync ${item.action} operation:`, error);
          // Continue with next item even if one fails
        }
      }

      await localStorageService.clearSyncQueue();
    } finally {
      this.syncInProgress = false;
    }
  }

  private async syncCreate(data: any) {
    const response = await fetch('http://localhost:5000/api/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await localStorageService.getAuthToken()}`
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description
      })
    });

    if (!response.ok) throw new Error('Failed to sync create operation');
    
    const result = await response.json();
    // Update local ID with server ID
    await localStorageService.updateTask({
      ...data,
      id: result.data.id,
      synced: true
    });
  }

  private async syncUpdate(data: any) {
    const response = await fetch(`http://localhost:5000/api/tasks/${data.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await localStorageService.getAuthToken()}`
      },
      body: JSON.stringify({
        title: data.title,
        description: data.description,
        completed: data.completed
      })
    });

    if (!response.ok) throw new Error('Failed to sync update operation');
    
    await localStorageService.updateTask({
      ...data,
      synced: true
    });
  }

  private async syncDelete(id: number) {
    const response = await fetch(`http://localhost:5000/api/tasks/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await localStorageService.getAuthToken()}`
      }
    });

    if (!response.ok) throw new Error('Failed to sync delete operation');
  }

  isConnected() {
    return this.isOnline;
  }
}

export const syncService = new SyncService(); 