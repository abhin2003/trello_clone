import React, { useState } from 'react';
import { Mail, ArrowLeft, Send, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const ForgotPasswordPage: React.FC = () => {
  const { sendPasswordReset, setAuthScreen, authError, setAuthError } = useAuth();

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setEmailError(null);

    if (!email.trim()) {
      setEmailError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await sendPasswordReset(email);
      if (res.success) {
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Reset Your Password"
      subtitle="Enter your work email address and we will send you secure recovery instructions"
      footerContent={
        <button
          type="button"
          className="auth-link-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          onClick={() => {
            setAuthError(null);
            setAuthScreen('login');
          }}
        >
          <ArrowLeft size={16} />
          <span>Back to Sign In</span>
        </button>
      }
    >
      {isSuccess ? (
        <div className="verification-success-box">
          <div className="verification-icon-wrapper">
            <CheckCircle2 size={40} className="verification-check-icon" />
          </div>
          <h3 className="verification-heading">Recovery Email Sent</h3>
          <p className="verification-desc">
            We have sent password recovery instructions to{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{email}</strong>.
            Please check your inbox (and spam folder) and click the link to set a new password.
          </p>
          <button
            type="button"
            className="secondary-btn"
            style={{ width: '100%', marginTop: '1.25rem' }}
            onClick={() => {
              setIsSuccess(false);
              setAuthScreen('login');
            }}
          >
            Return to Sign In
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {authError && (
            <div className="auth-error-banner" role="alert">
              <AlertCircle size={16} className="error-icon" />
              <span>{authError}</span>
            </div>
          )}

          <div className="form-group auth-field-group">
            <label className="form-label" htmlFor="forgot-email">
              Work Email Address
            </label>
            <div className="input-with-icon">
              <Mail size={17} className="input-icon" />
              <input
                id="forgot-email"
                type="email"
                className={`form-input ${emailError ? 'input-error' : ''}`}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(null);
                }}
                autoComplete="email"
                required
              />
            </div>
            {emailError && <span className="field-error-text">{emailError}</span>}
          </div>

          <button
            type="submit"
            className="primary-cta-btn auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Sending Instructions...</span>
              </>
            ) : (
              <>
                <Send size={16} />
                <span>Send Password Reset Link</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
