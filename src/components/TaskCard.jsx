import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { Draggable } from '@hello-pangea/dnd';
import useTaskStore from '../store/taskStore';
import { toast } from '../store/toastStore';
import TaskModal from './TaskModal';

const STATUS_COLOR = {
  todo:          'var(--col-todo)',
  'in-progress': 'var(--col-prog)',
  done:          'var(--col-done)',
};

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return days === 1 ? 'yesterday' : `${days}d ago`;
}

function TaskCardContent({
  task,
  accentColor,
  provided,
  snapshot,
  handleEditClick,
  handleDeleteClick,
  confirming,
  deleting,
}) {
  return (
    <div
      className={`task-card${snapshot?.isDragging ? ' dragging' : ''}`}
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      {...(provided?.dragHandleProps || {})}
      style={{
        '--card-accent': accentColor,
        ...(provided?.draggableProps?.style || {}),
        minHeight: 'fit-content',
      }}
      aria-label={`Task: ${task.title}, status: ${task.status}`}
    >
      <span className="task-card__strip" aria-hidden="true" />

      <div className="task-card__body">
        <p className="task-card__title">{task.title}</p>
        {task.description && (
          <p className="task-card__desc" title={task.description}>
            {task.description}
          </p>
        )}
      </div>

      <div className="task-card__footer">
        <span
          className="task-card__date"
          title={new Date(task.updatedAt).toLocaleString()}
          aria-label={`Updated ${timeAgo(task.updatedAt)}`}
        >
          {timeAgo(task.updatedAt)}
        </span>

        <div className="task-card__actions">
          <button
            className="btn-icon task-card__btn-edit"
            onClick={handleEditClick}
            aria-label={`Edit task: ${task.title}`}
            title="Edit"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>

          <button
            className={`btn-icon task-card__btn-delete${confirming ? ' confirming' : ''}`}
            onClick={handleDeleteClick}
            disabled={deleting}
            aria-label={confirming ? `Confirm delete: ${task.title}` : `Delete task: ${task.title}`}
            title={confirming ? 'Click again to confirm deletion' : 'Delete'}
          >
            {deleting ? (
              <span className="spinner" style={{ width: 12, height: 12, borderWidth: 2 }} />
            ) : confirming ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

const TaskCard = memo(function TaskCard({ task, index, isDraggable = true }) {
  const { deleteTask } = useTaskStore();
  const [showEdit,   setShowEdit]   = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60000);
    return () => clearInterval(interval);
  }, []);

  const confirmTimerRef = useRef(null);

  const handleDeleteClick = useCallback(async (e) => {
    e.stopPropagation();

    if (!confirming) {
      setConfirming(true);
      clearTimeout(confirmTimerRef.current);
      confirmTimerRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }

    clearTimeout(confirmTimerRef.current);
    setDeleting(true);
    setConfirming(false);

    const result = await deleteTask(task._id);
    if (!result.success) {
      toast.error(result.message || 'Failed to delete task');
      setDeleting(false);
    } else {
      toast.success('Task deleted');
    }
  }, [confirming, deleteTask, task._id]);

  const handleEditClick = useCallback((e) => {
    e.stopPropagation();
    setShowEdit(true);
  }, []);

  const handleModalClose = useCallback(() => setShowEdit(false), []);

  const accentColor = STATUS_COLOR[task.status] || 'var(--accent)';

  const contentProps = {
    task,
    accentColor,
    handleEditClick,
    handleDeleteClick,
    confirming,
    deleting,
  };

  return (
    <>
      {isDraggable ? (
        <Draggable
          draggableId={task._id}
          index={index}
          shouldRespectForcePress={false}
        >
          {(provided, snapshot) => (
            <TaskCardContent
              {...contentProps}
              provided={provided}
              snapshot={snapshot}
            />
          )}
        </Draggable>
      ) : (
        <TaskCardContent
          {...contentProps}
          provided={null}
          snapshot={{ isDragging: true }}
        />
      )}

      {showEdit && (
        <TaskModal task={task} onClose={handleModalClose} />
      )}
    </>
  );
});

export default TaskCard;
