import { create } from 'zustand';
import api from '../api/axios';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  search: '',
  filterStatus: '',

  setSearch: (search) => set({ search }),
  setFilterStatus: (filterStatus) => set({ filterStatus }),

  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { search, filterStatus } = get();
      const params = {};
      if (search)       params.search = search;
      if (filterStatus) params.status = filterStatus;
      const { data } = await api.get('/tasks', { params });
      set({ tasks: data.tasks, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.message || 'Failed to load tasks', loading: false });
    }
  },

  createTask: async (payload) => {
    try {
      const { data } = await api.post('/tasks', payload);
      set((s) => {
        const exists = s.tasks.some((t) => t._id === data.task._id);
        if (exists) return s;
        return { tasks: [data.task, ...s.tasks] };
      });
      return { success: true, task: data.task };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Failed to create task' };
    }
  },

  updateTask: async (id, payload) => {
    try {
      const current = get().tasks.find((t) => t._id === id);
      const res = await api.put(`/tasks/${id}`, {
        ...payload,
        clientUpdatedAt: current?.updatedAt,
      });

      const updatedTask = res.data.task;

      set((s) => ({
        tasks: [updatedTask, ...s.tasks.filter((t) => t._id !== id)],
      }));

      return { success: true, task: updatedTask };
    } catch (err) {
      const status  = err.response?.status;
      const msg     = err.response?.data?.message || 'Failed to update task';

      if (status === 409 && err.response?.data?.task) {
        const latest = err.response.data.task;
        set((s) => ({
          tasks: s.tasks.map((t) => (t._id === latest._id ? latest : t)),
        }));
        return {
          success: false,
          conflict: true,
          message: 'This task was recently updated by another device. We have synced the latest version for you.',
          task: latest
        };
      }
      return { success: false, message: msg };
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks;
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
    try {
      await api.delete(`/tasks/${id}`);
      return { success: true };
    } catch (err) {
      set({ tasks: prev });
      return { success: false, message: err.response?.data?.message || 'Failed to delete task' };
    }
  },

  optimisticMove: (id, status) => {
    set((s) => {
      const task = s.tasks.find((t) => t._id === id);
      if (!task) return s;
      const updated = { ...task, status, updatedAt: new Date().toISOString() };
      return {
        tasks: [updated, ...s.tasks.filter((t) => t._id !== id)],
      };
    });
  },

  socketCreate: (task) => {
    set((s) => {
      if (s.tasks.some((t) => t._id === task._id)) return s;
      if (s.filterStatus && task.status !== s.filterStatus) return s;
      if (s.search && !task.title.toLowerCase().includes(s.search.toLowerCase())) return s;
      return { tasks: [task, ...s.tasks] };
    });
  },

  socketUpdate: (task) => {
    set((s) => {
      const taskToMove = s.tasks.find((t) => t._id === task._id);

      if (taskToMove) {
        return {
          tasks: [task, ...s.tasks.filter((t) => t._id !== task._id)],
        };
      }

      if (s.filterStatus && task.status !== s.filterStatus) return s;
      if (s.search && !task.title.toLowerCase().includes(s.search.toLowerCase())) return s;

      return { tasks: [task, ...s.tasks] };
    });
  },

  socketDelete: ({ id }) => {
    set((s) => ({ tasks: s.tasks.filter((t) => t._id !== id) }));
  },
}));

export default useTaskStore;
