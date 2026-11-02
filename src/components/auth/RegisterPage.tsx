import React, { useState } from 'react';
import { User, Mail, Lock, Eye, EyeOff, UserPlus, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const RegisterPage: React.FC = () => {
  const { register, setAuthScreen, authError, setAuthError } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = (): boolean => {
    const errors: typeof formErrors = {};

    if (!fullName.trim()) {
      errors.fullName = 'Full name is required.';
    } else if (fullName.trim().length < 2) {
      errors.fullName = 'Name must be at least 2 characters.';
    }

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

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
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
      const res = await register(fullName, email, password);
      if (res.success && res.requiresVerification) {
        setVerificationPending(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If email confirmation is required by Supabase
  if (verificationPending) {
    return (
      <AuthLayout
        title="Verify Your Email"
        subtitle="A verification link has been dispatched to your email address"
      >
        <div className="verification-success-box">
          <div className="verification-icon-wrapper">
            <CheckCircle2 size={42} className="verification-check-icon" />
          </div>
          <h3 className="verification-heading">Check your inbox</h3>
          <p className="verification-desc">
            We sent an activation email to <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Click the link in the message to activate your account and access your organisation workspaces.
          </p>

          <button
            type="button"
            className="primary-cta-btn"
            style={{ width: '100%', marginTop: '1.5rem' }}
            onClick={() => setAuthScreen('login')}
          >
            Return to Login
          </button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Register to join or create an organisation on Stratcrest Flow"
      footerContent={
        <div className="auth-footer-links">
          <span>Already have an account?</span>
          <button
            type="button"
            className="auth-link-btn"
            onClick={() => {
              setAuthError(null);
              setAuthScreen('login');
            }}
          >
            Sign in instead
          </button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        {authError && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={16} className="error-icon" />
            <span>{authError}</span>
          </div>
        )}

        {/* Full Name */}
        <div className="form-group auth-field-group">
          <label className="form-label" htmlFor="register-name">
            Full Name
          </label>
          <div className="input-with-icon">
            <User size={17} className="input-icon" />
            <input
              id="register-name"
              type="text"
              className={`form-input ${formErrors.fullName ? 'input-error' : ''}`}
              placeholder="Elena Rostova"
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (formErrors.fullName) setFormErrors((prev) => ({ ...prev, fullName: undefined }));
              }}
              autoComplete="name"
              required
            />
          </div>
          {formErrors.fullName && <span className="field-error-text">{formErrors.fullName}</span>}
        </div>

        {/* Email */}
        <div className="form-group auth-field-group">
          <label className="form-label" htmlFor="register-email">
            Work Email Address
          </label>
          <div className="input-with-icon">
            <Mail size={17} className="input-icon" />
            <input
              id="register-email"
              type="email"
              className={`form-input ${formErrors.email ? 'input-error' : ''}`}
              placeholder="elena@company.com"
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

        {/* Password */}
        <div className="form-group auth-field-group">
          <label className="form-label" htmlFor="register-password">
            Password
          </label>
          <div className="input-with-icon">
            <Lock size={17} className="input-icon" />
            <input
              id="register-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${formErrors.password ? 'input-error' : ''}`}
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (formErrors.password) setFormErrors((prev) => ({ ...prev, password: undefined }));
              }}
              autoComplete="new-password"
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

        {/* Confirm Password */}
        <div className="form-group auth-field-group">
          <label className="form-label" htmlFor="register-confirm-password">
            Confirm Password
          </label>
          <div className="input-with-icon">
            <Lock size={17} className="input-icon" />
            <input
              id="register-confirm-password"
              type={showPassword ? 'text' : 'password'}
              className={`form-input ${formErrors.confirmPassword ? 'input-error' : ''}`}
              placeholder="Repeat password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (formErrors.confirmPassword)
                  setFormErrors((prev) => ({ ...prev, confirmPassword: undefined }));
              }}
              autoComplete="new-password"
              required
            />
          </div>
          {formErrors.confirmPassword && (
            <span className="field-error-text">{formErrors.confirmPassword}</span>
          )}
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
              <span>Creating Account...</span>
            </>
          ) : (
            <>
              <UserPlus size={16} />
              <span>Create Account</span>
            </>
          )}
        </button>
      </form>
    </AuthLayout>
  );
};
