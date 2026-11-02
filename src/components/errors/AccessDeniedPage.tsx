import React, { useState } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Building2,
  LogOut,
  Key,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import { Link, useRouter, useNavigate } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';

interface AccessDeniedPageProps {
  message?: string;
  reason?: string;
  orgSlug?: string;
  orgName?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  message = "You don't have permission to access this resource.",
  reason = 'Your current account does not have the required role or membership in this organisation.',
  orgSlug,
  orgName,
}) => {
  const { logout, userProfile, activeOrg, joinWithCode } = useAuth();
  const { refreshTenantState } = useTenant();
  const { searchParams } = useRouter();
  const navigate = useNavigate();

  const initialCode = searchParams.get('code') || '';
  const [joinCodeInput, setJoinCodeInput] = useState(initialCode);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const handleJoinWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setIsJoining(true);
    setJoinError(null);
    try {
      const res = await joinWithCode(joinCodeInput.trim());
      if (res.success && res.organisation) {
        refreshTenantState();
        const destSlug = res.organisation.slug || orgSlug || 'primary';
        navigate(`/org/${destSlug}/dashboard`, { replace: true });
      } else {
        setJoinError(res.error || 'Invalid joining code. Please verify with your organisation owner.');
      }
    } catch (err: any) {
      setJoinError(err?.message || 'Failed to join organisation with code.');
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-ambient-glow" />
      <div className="auth-card-container">
        <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <div
            style={{
              width: '72px',
              height: '72px',
              borderRadius: '20px',
              background: 'rgba(245, 158, 11, 0.15)',
              color: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
            }}
          >
            <ShieldAlert size={36} />
          </div>

          <div className="badge-pill badge-warning" style={{ display: 'inline-flex', marginBottom: '1rem' }}>
            HTTP 403 • ACCESS RESTRICTED
          </div>

          <h1 className="auth-card-title" style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>
            Access Denied
          </h1>
          <p className="auth-card-subtitle" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
            {message}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '1.5rem' }}>
            {reason}
          </p>

          {/* Join with Code Card */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(37, 99, 235, 0.04))',
              border: '1px solid rgba(59, 130, 246, 0.28)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '1.5rem',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <Key size={18} style={{ color: '#3b82f6' }} />
              <strong style={{ fontSize: '0.92rem', color: 'var(--text-primary)' }}>
                Have an Organisation Joining Code?
              </strong>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px', lineHeight: 1.4 }}>
              Enter the worker joining code (e.g. <code>GGHJ-9771</code>) to immediately join {orgName ? <strong>{orgName}</strong> : 'this organisation'} and unlock access.
            </p>

            <form onSubmit={handleJoinWithCode} style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="e.g. GGHJ-9771"
                value={joinCodeInput}
                onChange={(e) => {
                  setJoinCodeInput(e.target.value.toUpperCase());
                  setJoinError(null);
                }}
                className="form-input"
                style={{
                  flex: '1 1 180px',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isJoining || !joinCodeInput.trim()}
                style={{
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                }}
              >
                {isJoining ? (
                  <>
                    <RefreshCw size={14} className="spin-animation" />
                    <span>Joining...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Join Organisation</span>
                  </>
                )}
              </button>
            </form>

            {joinError && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#ef4444',
                  fontSize: '0.8rem',
                  marginTop: '10px',
                }}
              >
                <AlertCircle size={14} />
                <span>{joinError}</span>
              </div>
            )}
          </div>

          {userProfile && (
            <div
              style={{
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                background: 'var(--card-bg, #1e293b)',
                border: '1px solid var(--border-color)',
                marginBottom: '1.5rem',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)',
                textAlign: 'left',
              }}
            >
              <div>Logged in as: <strong style={{ color: 'var(--text-primary)' }}>{userProfile.email}</strong></div>
              {activeOrg && <div>Active Org: <strong style={{ color: 'var(--text-primary)' }}>{activeOrg.name}</strong></div>}
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link
              to="/organizations/select"
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <Building2 size={16} />
              <span>Switch Organisation</span>
            </Link>

            <button
              onClick={() => window.history.back()}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <ArrowLeft size={16} />
              <span>Go Back</span>
            </button>

            <button
              onClick={logout}
              className="btn btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}
            >
              <LogOut size={16} />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
