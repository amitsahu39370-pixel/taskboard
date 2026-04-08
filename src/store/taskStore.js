import { create } from 'zustand';
import { fetchTasksSocket, createTaskSocket, updateTaskSocket, deleteTaskSocket } from '../api/socket';

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
      const response = await fetchTasksSocket(search, filterStatus);
      set({ tasks: response.tasks, loading: false });
    } catch (err) {
      set({ error: err.message || 'Failed to load tasks', loading: false });
    }
  },

  createTask: async (payload) => {
    try {
      const { title, description = '', status = 'todo' } = payload;
      const response = await createTaskSocket(title, description, status);
      set((s) => {
        const exists = s.tasks.some((t) => t._id === response.task._id);
        if (exists) return s;
        return { tasks: [response.task, ...s.tasks] };
      });
      return { success: true, task: response.task };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to create task' };
    }
  },

  updateTask: async (id, payload) => {
    try {
      const current = get().tasks.find((t) => t._id === id);
      const response = await updateTaskSocket(id, {
        ...payload,
        clientUpdatedAt: current?.updatedAt,
      });

      const updatedTask = response.task;

      set((s) => ({
        tasks: [updatedTask, ...s.tasks.filter((t) => t._id !== id)],
      }));

      return { success: true, task: updatedTask };
    } catch (err) {
      const msg = err.message || 'Failed to update task';

      if (err.conflict && err.task) {
        const latest = err.task;
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
      await deleteTaskSocket(id);
      return { success: true };
    } catch (err) {
      set({ tasks: prev });
      return { success: false, message: err.message || 'Failed to delete task' };
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
