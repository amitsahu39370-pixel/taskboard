import { io } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL;
const SERVER_URL = API_URL ? API_URL.replace(/\/api\/?$/, '') : 'http://localhost:5000';

const socket = io(SERVER_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 10000,
});


export function setSocketAuth(token) {
  socket.auth = { token: token || '' };
}

export function ensureConnected() {
  return new Promise((resolve) => {
    if (socket.connected) {
      resolve();
    } else {
      socket.connect();
      socket.once('connect', () => resolve());
    }
  });
}

export function socketRequest(eventName, data = {}) {
  return new Promise(async (resolve, reject) => {
    try {
      await ensureConnected();
      socket.emit(eventName, data, (response) => {
        if (response?.success) {
          resolve(response);
        } else {
          reject(response || { success: false, message: 'Unknown error' });
        }
      });
    } catch (err) {
      reject({ success: false, message: 'Socket connection failed' });
    }
  });
}

export async function fetchTasksSocket(search = '', status = '') {
  return socketRequest('task:fetch', { search, status });
}

export async function createTaskSocket(title, description = '', status = 'todo') {
  return socketRequest('task:create', { title, description, status });
}

export async function updateTaskSocket(id, updates) {
  return socketRequest('task:update', { id, ...updates });
}

export async function deleteTaskSocket(id) {
  return socketRequest('task:delete', { id });
}

export default socket;
