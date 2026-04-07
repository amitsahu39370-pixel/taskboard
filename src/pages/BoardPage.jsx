import { useEffect, useMemo, useCallback, useRef } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import useTaskStore from '../store/taskStore';
import useSocket from '../hooks/useSocket';
import { toast } from '../store/toastStore';
import Header from '../components/Header';
import Column from '../components/Column';

const STATUSES = ['todo', 'in-progress', 'done'];

export default function BoardPage() {
  const { search, setSearch, tasks, loading, error, fetchTasks, updateTask, optimisticMove } = useTaskStore();

  const fetchedRef = useRef(false);

  useSocket();

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    fetchTasks();
  }, [fetchTasks]);


  const onDragStart = useCallback(() => {
    document.body.classList.add('is-dragging');
  }, []);

  const onDragEnd = useCallback(
    async (result) => {
      document.body.classList.remove('is-dragging');
      const { source, destination, draggableId } = result;

      if (!destination) return;

      if (
        source.droppableId === destination.droppableId &&
        source.index === destination.index
      ) return;

      const newStatus  = destination.droppableId;
      const prevStatus = source.droppableId;

      optimisticMove(draggableId, newStatus);

      const res = await updateTask(draggableId, { status: newStatus });

      if (!res.success) {
        optimisticMove(draggableId, prevStatus);
        
        if (res.conflict) {
          toast.warning(res.message);
        } else {
          toast.error(res.message || 'Could not move task');
        }
      }
    },
    [optimisticMove, updateTask]
  );

  return (
    <div className="board-layout">
      <Header totalTasks={tasks.length} />

      <main className="board-main">
        {error && (
          <div className="board-error">
            <span>⚠️ {error}</span>
            <button
              className="btn btn-ghost"
              onClick={() => { fetchedRef.current = false; fetchTasks(); }}
              style={{ marginLeft: 12 }}
            >
              Retry
            </button>
          </div>
        )}

        {loading && tasks.length === 0 ? (
          <div className="board-loading">
            <div className="board-loading__spinner">
              <span className="spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
            </div>
            <p className="board-loading__text">Loading your tasks…</p>
          </div>
        ) : tasks.length === 0 && search ? (
          <div className="board-empty-search">
            <div className="board-empty-search__icon" aria-hidden="true">🔎</div>
            <h2 className="board-empty-search__title">No tasks matching "{search}"</h2>
            <p className="board-empty-search__hint">Try a different search term or clear the filter.</p>
            <button className="btn btn-ghost" onClick={() => { setSearch(''); fetchTasks(); }} style={{ marginTop: 16 }}>
              Clear Search
            </button>
          </div>
        ) : (
          <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
            <div className="board-columns" style={{ flex: '1 1 0', minHeight: 0 }}>
              {STATUSES.map((s) => (
                <Column
                  key={s}
                  status={s}
                  totalTasks={tasks.length}
                />
              ))}
            </div>
          </DragDropContext>
        )}
      </main>
    </div>
  );
}
