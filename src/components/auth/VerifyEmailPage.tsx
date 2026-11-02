import React, { useState } from 'react';
import { AuthLayout } from './AuthLayout';
import { Mail, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Link, useRouter } from '../../router/Router';
import { getSupabaseClient, isSupabaseConfigured } from '../../lib/supabase';

export const VerifyEmailPage: React.FC = () => {
  const { searchParams } = useRouter();
  const emailParam = searchParams.get('email') || '';

  const [resending, setResending] = useState(false);
  const [resendStatus, setResendStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleResend = async () => {
    if (!emailParam) {
      setResendStatus({ ok: false, msg: 'No email address specified to resend to.' });
      return;
    }
    if (!isSupabaseConfigured()) {
      setResendStatus({ ok: false, msg: 'Supabase client is not configured.' });
      return;
    }

    setResending(true);
    setResendStatus(null);
    try {
      const client = getSupabaseClient();
      const { error } = await client.auth.resend({
        type: 'signup',
        email: emailParam,
      });

      if (error) {
        setResendStatus({ ok: false, msg: error.message });
      } else {
        setResendStatus({ ok: true, msg: `Verification email resent to ${emailParam}.` });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to resend email';
      setResendStatus({ ok: false, msg: message });
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthLayout
      title="Check Your Inbox"
      subtitle="We sent a verification link to confirm your account"
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
          <Link to="/login" className="auth-link" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
        </div>
      }
    >
      <div style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'var(--accent-glow, rgba(99, 102, 241, 0.15))',
            color: 'var(--accent-color, #6366f1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.5rem',
          }}
        >
          <Mail size={32} />
        </div>

        {emailParam ? (
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            Verification link sent to <strong style={{ color: 'var(--accent-color, #6366f1)' }}>{emailParam}</strong>
          </p>
        ) : (
          <p style={{ color: 'var(--text-primary)', fontSize: '1rem', fontWeight: 500, marginBottom: '0.75rem' }}>
            Please check your email
          </p>
        )}

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
          Click the link in the message to activate your account and access your organisation workspaces. If you don't see the email within a minute or two, check your spam folder.
        </p>

        {resendStatus && (
          <div
            className={`auth-alert ${resendStatus.ok ? 'auth-alert-success' : 'auth-alert-error'}`}
            style={{ marginBottom: '1.25rem', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {resendStatus.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span>{resendStatus.msg}</span>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {emailParam && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleResend}
              disabled={resending}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              {resending ? (
                <>
                  <RefreshCw size={15} className="spin-animation" />
                  <span>Resending...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={15} />
                  <span>Resend Verification Email</span>
                </>
              )}
            </button>
          )}

          <Link to="/login" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            Proceed to Login
          </Link>
        </div>
      </div>
    </AuthLayout>
  );
};
