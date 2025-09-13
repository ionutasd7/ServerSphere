import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect(): Socket {
    if (!this.socket) {
      this.socket = io(window.location.origin, {
        autoConnect: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to server');
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
      });
    }

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  joinTask(taskId: string) {
    if (this.socket) {
      this.socket.emit('join-task', taskId);
    }
  }

  leaveTask(taskId: string) {
    if (this.socket) {
      this.socket.emit('leave-task', taskId);
    }
  }

  onTaskOutput(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('task-output', callback);
    }
  }

  onTaskStarted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('task-started', callback);
    }
  }

  onTaskCompleted(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('task-completed', callback);
    }
  }

  onTaskFailed(callback: (data: any) => void) {
    if (this.socket) {
      this.socket.on('task-failed', callback);
    }
  }

  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();