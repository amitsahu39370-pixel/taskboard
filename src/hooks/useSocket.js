import { useEffect, useRef } from 'react';
import socket, { setSocketAuth } from '../api/socket';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import { toast } from '../store/toastStore';

export default function useSocket() {
  const { socketCreate, socketUpdate, socketDelete, fetchTasks } = useTaskStore();
  const { token } = useAuthStore();
  const { setConnected } = useSocketStore();

  const lostToastShown = useRef(false);

  useEffect(() => {
    if (!token) return;

    setSocketAuth(token);

    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      setConnected(true);
      lostToastShown.current = false;
      console.log('🟢 Socket connected:', socket.id);
    };

    const onDisconnect = (reason) => {
      setConnected(false);
      console.log('🔴 Socket disconnected:', reason);
    };

    const onConnectError = (err) => {
      setConnected(false);
      console.warn('Socket connect_error:', err.message);
      if (!lostToastShown.current) {
        lostToastShown.current = true;
      }
    };

    const onReconnect = () => {
      console.log('🟡 Socket reconnected');
      toast.info('Real-time sync restored');
      fetchTasks();
    };

    const onTaskCreated = (task) => socketCreate(task);
    const onTaskUpdated = (task) => socketUpdate(task);
    const onTaskDeleted = ({ id }) => socketDelete({ id });

    socket.on('connect',       onConnect);
    socket.on('disconnect',    onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.io.on('reconnect',  onReconnect);

    socket.on('task:created', onTaskCreated);
    socket.on('task:updated', onTaskUpdated);
    socket.on('task:deleted', onTaskDeleted);

    return () => {
      socket.off('connect',       onConnect);
      socket.off('disconnect',    onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.io.off('reconnect',  onReconnect);

      socket.off('task:created', onTaskCreated);
      socket.off('task:updated', onTaskUpdated);
      socket.off('task:deleted', onTaskDeleted);
    };
  }, [token]);

  useEffect(() => {
    if (!token && socket.connected) {
      socket.disconnect();
      setConnected(false);
    }
  }, [token, setConnected]);
}
