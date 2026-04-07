import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { toast } from '../store/toastStore';

export default function LoginPage() {
  const { login, loading } = useAuthStore();
  const navigate = useNavigate();
  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPwd,     setShowPwd]     = useState(false);
  const [errors,      setErrors]      = useState({});
  const [shake,       setShake]       = useState(false);

  const validate = () => {
    const e = {};
    if (!email.trim()) e.email    = 'Email is required';
    if (!password)     e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/board');
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      setErrors({ password: result.message || 'Invalid email or password' });
      toast.error(result.message || 'Invalid email or password');
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card${shake ? ' auth-card--shake' : ''}`}>
        <div className="auth-brand">
          <div className="auth-logo">⚡</div>
          <h1 className="auth-app-name">TaskBoard</h1>
          <p className="auth-tagline">Real-time collaboration, simplified</p>
        </div>

        <h2 className="auth-title">Sign In</h2>

        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              className={`input${errors.email ? ' input--error' : ''}`}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({...p, email: ''})); }}
              autoComplete="email"
              autoFocus
            />
            {errors.email && <span className="form-error" role="alert">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="input-pwd-wrap">
              <input
                id="login-password"
                type={showPwd ? 'text' : 'password'}
                className={`input input-pwd${errors.password ? ' input--error' : ''}`}
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({...p, password: ''})); }}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="input-pwd-toggle"
                onClick={() => setShowPwd((v) => !v)}
                aria-label={showPwd ? 'Hide password' : 'Show password'}
                tabIndex={-1}
              >
                {showPwd ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
            {errors.password && <span className="form-error" role="alert">{errors.password}</span>}
          </div>

          <button
            type="submit"
            id="login-btn"
            className="btn btn-primary auth-submit"
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{width:16,height:16}} /> Signing in…</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
}
