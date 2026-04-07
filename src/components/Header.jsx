import { useCallback, useEffect, useRef, useState } from 'react';
import useTaskStore from '../store/taskStore';
import useAuthStore from '../store/authStore';
import useSocketStore from '../store/socketStore';
import TaskModal from './TaskModal';

export default function Header({ totalTasks = 0 }) {
  const { user, logout } = useAuthStore();
  const { search, filterStatus, setSearch, setFilterStatus, fetchTasks } = useTaskStore();
  const { connected } = useSocketStore();
  const [showNewTask,   setShowNewTask]   = useState(false);
  const [dropdownOpen,  setDropdownOpen]  = useState(false);
  const debounceRef  = useRef(null);
  const dropdownRef  = useRef(null);

  const handleSearch = useCallback(
    (e) => {
      const val = e.target.value;
      setSearch(val);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => fetchTasks(), 350);
    },
    [setSearch, fetchTasks]
  );

  const clearSearch = useCallback(() => {
    setSearch('');
    clearTimeout(debounceRef.current);
    fetchTasks();
  }, [setSearch, fetchTasks]);

  const handleFilter = useCallback(
    (e) => {
      setFilterStatus(e.target.value);
      setTimeout(() => fetchTasks(), 0);
    },
    [setFilterStatus, fetchTasks]
  );

  useEffect(() => {
    if (!dropdownOpen) return;
    const onOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [dropdownOpen]);

  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'n' || e.key === 'N') { e.preventDefault(); setShowNewTask(true); }
      if (e.key === 'Escape') { setShowNewTask(false); setDropdownOpen(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    window.location.href = '/login';
  };

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <>
      <header className="header">
        <div className="header__brand">
          <div className="header__logo" aria-hidden="true">⚡</div>
          <span className="header__title">TaskBoard</span>
          <span
            className={`header__live-dot ${connected ? 'header__live-dot--on' : 'header__live-dot--off'}`}
            title={connected ? 'Real-time sync active' : 'Connecting…'}
            aria-label={connected ? 'Connected' : 'Connecting'}
          />
        </div>

        <div className="header__controls">
          <div className="header__search-wrap">
            <span className="header__search-icon" aria-hidden="true">🔍</span>
            <input
              id="task-search"
              className="input header__search"
              placeholder="Search tasks…"
              value={search}
              onChange={handleSearch}
              aria-label="Search tasks by title"
            />
            {search && (
              <button
                className="header__search-clear"
                onClick={clearSearch}
                aria-label="Clear search"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <select
            id="status-filter"
            className="input header__filter"
            value={filterStatus}
            onChange={handleFilter}
            aria-label="Filter tasks by status"
          >
            <option value="">All Statuses</option>
            <option value="todo">Todo</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>

          <button
            id="new-task-btn"
            className="btn btn-primary"
            onClick={() => setShowNewTask(true)}
            title="New task (press N)"
            aria-label="Create a new task"
          >
            <span className="header__btn-plus" aria-hidden="true">+</span>
            New Task
          </button>

          <div className="header__avatar-wrap" ref={dropdownRef}>
            <button
              className="header__avatar"
              onClick={() => setDropdownOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropdownOpen}
              title={user?.name}
              aria-label={`User menu: ${user?.name}`}
            >
              {initials}
            </button>

            {dropdownOpen && (
              <div className="header__dropdown header__dropdown--open" role="menu">
                <div className="header__dropdown-name">{user?.name}</div>
                <div className="header__dropdown-email">{user?.email}</div>
                <div className="header__dropdown-stats">
                  {totalTasks} task{totalTasks !== 1 ? 's' : ''} total
                </div>
                <hr className="header__dropdown-sep" />
                <button
                  id="logout-btn"
                  className="header__dropdown-logout"
                  onClick={handleLogout}
                  role="menuitem"
                  aria-label="Sign out"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showNewTask && <TaskModal onClose={() => setShowNewTask(false)} />}
    </>
  );
}
