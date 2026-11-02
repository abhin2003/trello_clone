import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, LogIn, AlertCircle, RefreshCw, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { useRouter, useNavigate, Link } from '../../router/Router';
import { isSupabaseAuthEnabled } from '../../lib/supabase';

export const LoginPage: React.FC = () => {
  const { login, setAuthScreen, authError, setAuthError } = useAuth();
  const { searchParams } = useRouter();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const res = await login(email, password);
      if (res.success) {
        const redirectParam = searchParams.get('redirect');
        if (redirectParam) {
          navigate(redirectParam);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome Back"
      subtitle="Sign in to your organisation account and workspaces"
      footerContent={
        <div className="auth-footer-links">
          <span>Don't have an account?</span>
          <Link
            to="/register"
            className="auth-link-btn"
            onClick={() => {
              setAuthError(null);
              setAuthScreen('register');
            }}
          >
            Create an account
          </Link>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {/* Fast Testing Mode Notice & 1-Click Presets */}
        {!isSupabaseAuthEnabled() && (
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '16px',
            fontSize: '0.82rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: '#60a5fa', marginBottom: '6px' }}>
              <Sparkles size={15} />
              <span>Fast Testing Mode (Supabase Auth Paused)</span>
            </div>
            <p style={{ margin: '0 0 10px 0', color: 'var(--text-secondary)', lineHeight: 1.4, fontSize: '0.78rem' }}>
              Enter any credentials to sign in instantly, or click a 1-click test preset below:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', cursor: 'pointer' }}
                onClick={() => {
                  setEmail('abhinskrishna3@gmail.com');
                  setPassword('Password@123');
                }}
              >
                👑 <strong>Owner:</strong> abhinskrishna3@gmail.com
              </button>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', cursor: 'pointer' }}
                onClick={() => {
                  setEmail('colleague.alex@gmail.com');
                  setPassword('Password@123');
                }}
              >
                👥 <strong>Colleague:</strong> colleague.alex@gmail.com
              </button>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', cursor: 'pointer' }}
                onClick={() => {
                  setEmail('newuser.test@gmail.com');
                  setPassword('Password@123');
                }}
              >
                ✨ <strong>New User (0 Orgs &rarr; Test Onboarding):</strong> newuser.test@gmail.com
              </button>
              <button
                type="button"
                className="secondary-btn"
                style={{ padding: '6px 10px', fontSize: '0.78rem', justifyContent: 'flex-start', cursor: 'pointer' }}
                onClick={() => {
                  setEmail('admin@stratcrest.com');
                  setPassword('Password@123');
                }}
              >
                🛡️ <strong>Platform Super-Admin:</strong> admin@stratcrest.com
              </button>
            </div>
          </div>
        )}

        {/* Global Error Banner */}
        {authError && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="error-icon" />
            <span>{authError}</span>
          </div>
        )}

        {/* Email Field */}
        <div className="form-group auth-field-group">
          <label className="form-label" htmlFor="login-email">
            Email Address
          </label>
          <div className="input-with-icon">
            <Mail size={17} className="input-icon" />
            <input
              id="login-email"
              type="email"
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              placeholder="name@company.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: undefined }));
              }}
              autoComplete="email"
              required
            />
          </div>
          {formErrors.email && <span className="field-error-text">{formErrors.email}</span>}
        </div>

        {/* Password Field */}
        <div className="form-group auth-field-group">
          <div className="label-with-action">
            <label className="form-label" htmlFor="login-password">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="forgot-link-btn"
              onClick={() => {
                setAuthError(null);
                setAuthScreen('forgot_password');
              }}
            >
              Forgot password?
            </Link>
          </div>
          <div className="input-with-icon">
            <Lock size={17} className="input-icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${formErrors.password ? 'input-error' : ''}`}
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              className="toggle-password-btn"
              onClick={() => setShowPassword((prev) => !prev)}
              title={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {formErrors.password && <span className="field-error-text">{formErrors.password}</span>}
        </div>

        {/* Remember Session Checkbox */}
        <div className="auth-checkbox-row">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkbox-label">Keep me signed in on this device</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="primary-cta-btn auth-submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <RefreshCw size={16} className="spin-animation" />
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn size={16} />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
