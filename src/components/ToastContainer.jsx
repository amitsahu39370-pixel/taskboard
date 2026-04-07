import useToastStore from '../store/toastStore';

const ICONS = {
  success: '✓',
  error:   '✕',
  info:    'ℹ',
  warning: '⚠',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="toast-container" role="alert" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`toast toast-${t.type}`}
          onClick={() => removeToast(t.id)}
          title="Click to dismiss"
        >
          <span className="toast__icon">{ICONS[t.type] || 'ℹ'}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}
