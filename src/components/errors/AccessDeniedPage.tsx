import React from 'react';
import { ShieldAlert, ArrowLeft, Building2, LogOut } from 'lucide-react';
import { Link } from '../../router/Router';
import { useAuth } from '../../context/AuthContext';

interface AccessDeniedPageProps {
  message?: string;
  reason?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  message = "You don't have permission to access this resource.",
  reason = 'Your current account does not have the required role or membership in this organisation.',
}) => {
  const { logout, userProfile, activeOrg } = useAuth();

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
          <p className="auth-card-subtitle" style={{ fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            {message}
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.5, marginBottom: '2rem' }}>
            {reason}
          </p>

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
