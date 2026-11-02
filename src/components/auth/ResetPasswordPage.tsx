import React, { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';

export const ResetPasswordPage: React.FC = () => {
  const { resetPassword, authError, setAuthError } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formErrors, setFormErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  const validate = (): boolean => {
    const errors: typeof formErrors = {};
    if (!password) {
      errors.password = 'New password is required.';
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
      const res = await resetPassword(password);
      if (res.success) {
        setIsSuccess(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Set a New Password"
      subtitle="Enter a new secure password for your Drello account"
    >
      {isSuccess ? (
        <div className="verification-success-box">
          <div className="verification-icon-wrapper">
            <CheckCircle2 size={40} className="verification-check-icon" />
          </div>
          <h3 className="verification-heading">Password Updated!</h3>
          <p className="verification-desc">
            Your password has been securely updated. You can now access your organisation workspaces.
          </p>
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
            <label className="form-label" htmlFor="reset-new-password">
              New Password
            </label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="reset-new-password"
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

          <div className="form-group auth-field-group">
            <label className="form-label" htmlFor="reset-confirm-password">
              Confirm New Password
            </label>
            <div className="input-with-icon">
              <Lock size={17} className="input-icon" />
              <input
                id="reset-confirm-password"
                type={showPassword ? 'text' : 'password'}
                className={`form-input ${formErrors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat new password"
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

          <button
            type="submit"
            className="primary-cta-btn auth-submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <RefreshCw size={16} className="spin-animation" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <KeyRound size={16} />
                <span>Update Password & Sign In</span>
              </>
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
};
