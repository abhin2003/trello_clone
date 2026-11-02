import React, { useState } from 'react';
import { KeyRound, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, LogIn } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from '../../router/Router';
import { AuthLayout } from '../auth/AuthLayout';

interface InviteClaimPageProps {
  token: string;
}

export const InviteClaimPage: React.FC<InviteClaimPageProps> = ({ token }) => {
  const navigate = useNavigate();
  const { session, userProfile, claimInvitation, refreshMemberships } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClaim = async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await claimInvitation(token);
      if (res.success) {
        setSuccess(true);
        await refreshMemberships();
        setTimeout(() => {
          navigate('/organizations/select');
        }, 1500);
      } else {
        setError(res.error || 'Failed to claim invitation. The token may be expired or invalid.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Company Workspace Invitation"
      subtitle="You have been invited to collaborate on Drello"
    >
      <div className="invite-claim-card" style={{ textAlign: 'center', padding: '1rem 0' }}>
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(59, 130, 246, 0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.25rem auto',
            color: 'var(--accent-blue)',
          }}
        >
          <KeyRound size={28} />
        </div>

        <div style={{ marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Invitation Token</span>
          <div style={{ fontFamily: 'monospace', fontSize: '1rem', fontWeight: 700, marginTop: '2px', color: 'var(--text-primary)' }}>
            {token}
          </div>
        </div>

        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '1.25rem', textAlign: 'left' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {success ? (
          <div className="callout-card" style={{ background: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.3)', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#10b981' }}>
              <CheckCircle2 size={18} />
              <strong>Invitation Accepted!</strong>
            </div>
            <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Redirecting you to your organisation workspaces...
            </p>
          </div>
        ) : !session ? (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              To accept this invitation and access the organisation boards, please sign in or register with your account.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Link to="/login" className="primary-cta-btn" style={{ width: '100%', justifyContent: 'center' }}>
                <LogIn size={16} />
                <span>Sign In to Accept</span>
              </Link>

              <Link to="/login" className="secondary-btn" style={{ width: '100%', justifyContent: 'center' }}>
                <span>Create an Account</span>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Signed in as <strong>{userProfile?.name}</strong> ({userProfile?.email}).
              Click below to accept this invitation and link your account.
            </p>

            <button
              type="button"
              className="primary-cta-btn"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleClaim}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Accepting Invitation...</span>
                </>
              ) : (
                <>
                  <span>Accept & Enter Workspace</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
