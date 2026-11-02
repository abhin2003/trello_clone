import React from 'react';
import { AlertTriangle, Layers, LogOut } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from '../../router/Router';

export const OrgSuspendedPage: React.FC = () => {
  const navigate = useNavigate();
  const { activeOrg } = useTenant();
  const { logout } = useAuth();

  return (
    <div className="auth-page-wrapper">
      <div className="auth-ambient-glow" style={{ background: 'radial-gradient(circle, rgba(239, 68, 68, 0.15) 0%, transparent 70%)' }} />

      <main className="auth-card-container">
        <div className="auth-card" style={{ maxWidth: '520px', textAlign: 'center' }}>
          <div className="auth-card-header">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem auto',
                color: '#ef4444',
              }}
            >
              <AlertTriangle size={32} />
            </div>

            <h1 className="auth-card-title" style={{ color: '#ef4444' }}>Organisation Suspended</h1>
            <p className="auth-card-subtitle" style={{ marginTop: '8px' }}>
              Access to organisation <strong>{activeOrg.name}</strong> has been suspended by the platform administrator.
            </p>
          </div>

          <div className="auth-card-body">
            {activeOrg.statusReason && (
              <div
                className="callout-card"
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  borderColor: 'rgba(239, 68, 68, 0.25)',
                  textAlign: 'left',
                  fontSize: '0.86rem',
                  marginBottom: '1.5rem',
                }}
              >
                <strong>Reason provided:</strong>
                <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)' }}>
                  {activeOrg.statusReason}
                </p>
              </div>
            )}

            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              All boards, workspaces, tasks, and API accesses for this tenant have been locked by Row-Level Security. Please contact billing support or switch to another organisation.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="primary-cta-btn"
                style={{ width: '100%' }}
                onClick={() => navigate('/organizations/select')}
              >
                <Layers size={16} />
                <span>Switch Organisation</span>
              </button>

              <button
                type="button"
                className="secondary-btn"
                style={{ width: '100%' }}
                onClick={logout}
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
