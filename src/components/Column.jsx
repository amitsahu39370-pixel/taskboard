import { useState, useRef, useCallback, memo } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useShallow } from 'zustand/react/shallow';
import useTaskStore from '../store/taskStore';
import TaskCard from './TaskCard';
import TaskModal from './TaskModal';

const COLUMN_CONFIG = {
  todo: {
    label: 'Todo',
    color: 'var(--col-todo)',
    dimColor: 'var(--col-todo-dim)',
    hint: 'Press N or click + to add one',
  },
  'in-progress': {
    label: 'In Progress',
    color: 'var(--col-prog)',
    dimColor: 'var(--col-prog-dim)',
    hint: 'Drag a task here to start it',
  },
  done: {
    label: 'Done',
    color: 'var(--col-done)',
    dimColor: 'var(--col-done-dim)',
    hint: 'Completed tasks will appear here',
  },
};

const CARD_ESTIMATE_PX = 100;

const VIRTUAL_THRESHOLD = 30;

function EmptyIcon({ status, color }) {
  const props = {
    width: 40, height: 40,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: '1.3',
    'aria-hidden': 'true',
  };
  if (status === 'todo') return (
    <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 3" /></svg>
  );
  if (status === 'in-progress') return (
    <svg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18" fill="currentColor" opacity="0.2" />
      <path d="M12 8l4 4-4 4" />
    </svg>
  );
  return (
    <svg {...props}><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-5" /></svg>
  );
}

const VirtualList = memo(function VirtualList({ tasks, provided, snapshot }) {
  const parentRef = useRef(null);

  const rowVirtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => CARD_ESTIMATE_PX, []),
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className={`column__list column__list--virtual${snapshot.isDraggingOver ? ' drag-over' : ''}`}
      style={{ overflowY: 'auto', overflowX: 'hidden' }}
    >
      <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
        {virtualItems.map((vItem) => {
          const task = tasks[vItem.index];
          return (
            <div
              key={task._id}
              data-index={vItem.index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: 'absolute',
                top: vItem.start,
                left: 0,
                width: '100%',
                paddingBottom: 9,
              }}
            >
              <TaskCard task={task} index={vItem.index} />
            </div>
          );
        })}
      </div>
      {provided.placeholder}
    </div>
  );
});

const StandardList = memo(function StandardList({ tasks, provided, snapshot }) {
  return (
    <div
      className={`column__list${snapshot.isDraggingOver ? ' drag-over' : ''}`}
    >
      {tasks.map((task, index) => (
        <TaskCard key={task._id} task={task} index={index} />
      ))}
      {provided.placeholder}
    </div>
  );
});

export default function Column({ status, totalTasks }) {
  const [showAdd, setShowAdd] = useState(false);
  const tasks = useTaskStore(useShallow((s) => s.tasks.filter((t) => t.status === status)));
  const config = COLUMN_CONFIG[status];
  const pct = totalTasks > 0 ? Math.round((tasks.length / totalTasks) * 100) : 0;
  const useVirtual = tasks.length > VIRTUAL_THRESHOLD;

  const renderClone = useCallback((provided2, snapshot2, rubric) => (
    <div
      ref={provided2.innerRef}
      {...provided2.draggableProps}
      {...provided2.dragHandleProps}
    >
      <TaskCard task={tasks[rubric.source.index]} index={rubric.source.index} />
    </div>
  ), [tasks]);

  return (
    <>
      <div
        className="column"
        style={{ '--col-accent': config.color, '--col-dim': config.dimColor }}
        aria-label={`${config.label} column, ${tasks.length} task${tasks.length !== 1 ? 's' : ''}`}
      >
        <div className="column__header">
          <div className="column__title-group">
            <span className="column__dot" aria-hidden="true" />
            <h2 className="column__title">{config.label}</h2>
            <span className="column__count" aria-label={`${tasks.length} tasks`}>
              {tasks.length}
            </span>
          </div>
          <button
            className="column__add-btn"
            onClick={() => setShowAdd(true)}
            aria-label={`Add task to ${config.label}`}
            title={`Add task to ${config.label}`}
          >
            +
          </button>
        </div>

        <Droppable
          droppableId={status}
          renderClone={renderClone}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`column__content${snapshot.isDraggingOver ? ' drag-over' : ''}`}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}
            >
              <div
                className="column__progress-track"
                role="progressbar"
                aria-valuenow={pct}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={`${pct}% of all tasks`}
              >
                <div className="column__progress-fill" style={{ width: `${pct}%` }} />
              </div>

              {tasks.length === 0 && !snapshot.isDraggingOver && (
                <div className="empty-state" aria-label="No tasks">
                  <div className="empty-state__icon">
                    <EmptyIcon status={status} color={config.color} />
                  </div>
                  <p className="empty-state__title">No tasks here</p>
                  <p className="empty-state__hint">{config.hint}</p>
                </div>
              )}

              {tasks.length > 0 && (
                useVirtual
                  ? <VirtualList tasks={tasks} provided={provided} snapshot={snapshot} />
                  : <StandardList tasks={tasks} provided={provided} snapshot={snapshot} />
              )}

              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {showAdd && (
        <TaskModal
          defaultStatus={status}
          onClose={() => setShowAdd(false)}
        />
      )}
    </>
  );
}
