import { useState, useEffect, useRef } from 'react';
import useTaskStore from '../store/taskStore';
import { toast } from '../store/toastStore';

const STATUS_LABELS = {
  todo:          'Todo',
  'in-progress': 'In Progress',
  done:          'Done',
};

export default function TaskModal({ task = null, defaultStatus = 'todo', onClose }) {
  const { createTask, updateTask } = useTaskStore();

  const [title,       setTitle]       = useState(task?.title       ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [status,      setStatus]      = useState(task?.status      ?? defaultStatus);
  const [saving,      setSaving]      = useState(false);
  const [errors,      setErrors]      = useState({});

  const titleInputRef = useRef(null);
  const isEdit = Boolean(task);
  const titleMax = 200;
  const descMax  = 2000;

  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  const validate = () => {
    const e = {};
    if (!title.trim())           e.title = 'Title is required';
    if (title.length > titleMax) e.title = `Title must be ${titleMax} chars or fewer`;
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    const payload = { title: title.trim(), description: description.trim(), status };

    const result = isEdit
      ? await updateTask(task._id, payload)
      : await createTask(payload);

    setSaving(false);

    if (result.success) {
      toast.success(isEdit ? 'Task updated!' : 'Task created!');
      onClose();
    } else {
      toast.error(result.message || 'Something went wrong');
      if (result.message?.includes('Conflict')) {
        onClose();
      }
    }
  };

  return (
    <div
      className="overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="presentation"
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label={isEdit ? 'Edit Task' : 'New Task'}
      >
        <div className="modal-header">
          <h2 className="modal-title">{isEdit ? '✎ Edit Task' : '+ New Task'}</h2>
          <button className="btn-icon" onClick={onClose} aria-label="Close modal">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label" htmlFor="task-title">
                Title <span style={{ color: 'var(--danger)' }} aria-hidden="true">*</span>
              </label>
              <input
                id="task-title"
                ref={titleInputRef}
                className={`input ${errors.title ? 'input--error' : ''}`}
                placeholder="What needs to be done?"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: '' })); }}
                maxLength={titleMax}
                aria-required="true"
                aria-describedby={errors.title ? 'title-error' : undefined}
              />
              <div className="form-meta">
                {errors.title && (
                  <span id="title-error" className="form-error" role="alert">{errors.title}</span>
                )}
                <span className="form-char-count" style={{ marginLeft: 'auto' }}>
                  {title.length}/{titleMax}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-desc">Description</label>
              <textarea
                id="task-desc"
                className="input"
                placeholder="Add details (optional)…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={descMax}
                rows={3}
              />
              <span className="form-char-count">{description.length}/{descMax}</span>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-status">Status</label>
              <select
                id="task-status"
                className="input"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              id="modal-cancel-btn"
              className="btn btn-ghost"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              id="modal-save-btn"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving
                ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving…</>
                : isEdit ? 'Save Changes' : 'Create Task'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
