import React, { useState } from 'react';
import {
  Building2,
  KeyRound,
  Plus,
  LogOut,
  AlertCircle,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { useNavigate } from '../../router/Router';

export const NoOrganisationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    user,
    createOrganisation,
    claimInvitation,
    joinOrganisation,
    joinWithCode,
    selectOrganisation,
    logout,
    refreshMemberships,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'create' | 'invite'>('create');
  const [orgName, setOrgName] = useState('');
  const [inviteToken, setInviteToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const res = await createOrganisation(orgName.trim());
      if (!res.success) {
        setError(res.error || 'Failed to create organisation');
      } else {
        const createdSlug = res.organisation?.slug || orgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const orgId = res.organisation?.id || res.organisationId;
        if (orgId) {
          selectOrganisation(orgId);
        }
        navigate(`/org/${createdSlug}/dashboard`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    setLoading(true);
    setError(null);
    try {
      const cleanInput = inviteToken.trim();
      // Try joinWithCode first (handles org join codes like GGHJ-9771 and tokens)
      const res = await joinWithCode(cleanInput);
      if (res.success && res.organisation) {
        navigate(`/org/${res.organisation.slug}/dashboard`);
        return;
      }

      // Fallback to claimInvitation
      const invRes = await claimInvitation(cleanInput);
      if (!invRes.success) {
        setError(res.error || invRes.error || 'Invalid or expired joining code or invitation token');
      } else {
        const slug = invRes.organisation?.slug || 'acme-corp';
        navigate(`/org/${slug}/dashboard`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickJoinDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await joinOrganisation('org-acme', 'owner');
      if (res.success && res.organisation) {
        selectOrganisation(res.organisation.id);
        navigate(`/org/${res.organisation.slug}/dashboard`);
      } else {
        setError(res.error || 'Failed to join demo organisation');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="No Organisation Found"
      subtitle={`Welcome, ${userProfile?.name || 'User'} (${user?.email}). You do not currently belong to any organisation.`}
      footerContent={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
          <button
            type="button"
            className="auth-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}
            onClick={logout}
          >
            <LogOut size={15} />
            <span>Sign Out</span>
          </button>

          <button
            type="button"
            className="auth-link-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            onClick={() => refreshMemberships()}
          >
            <RefreshCw size={13} />
            <span>Check for new invites</span>
          </button>
        </div>
      }
    >
      <div className="no-org-wrapper">
        {error && (
          <div className="auth-error-banner" style={{ marginBottom: '1.25rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Informational Callout */}
        <div className="callout-card" style={{ marginBottom: '1.5rem', background: 'rgba(59, 130, 246, 0.08)', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Clock size={18} style={{ color: 'var(--accent-blue)', flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              To access Drello, you must either create an organisation workspace or be invited by an existing organisation administrator.
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="no-org-tabs" style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('create');
              setError(null);
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <Plus size={16} />
            <span>Create Organisation</span>
          </button>
          <button
            type="button"
            className={`admin-tab-btn ${activeTab === 'invite' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('invite');
              setError(null);
            }}
            style={{ flex: 1, justifyContent: 'center' }}
          >
            <KeyRound size={16} />
            <span>Join with Code</span>
          </button>
        </div>

        {/* Tab 1: Create Organisation */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreate} className="auth-form" noValidate>
            <div className="form-group auth-field-group">
              <label className="form-label" htmlFor="new-org-name">
                Organisation or Company Name
              </label>
              <div className="input-with-icon">
                <Building2 size={17} className="input-icon" />
                <input
                  id="new-org-name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. Acme Corporation or Drello Labs"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                />
              </div>
              <span className="field-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                You will become the Owner of this organisation and can invite team members.
              </span>
            </div>

            <button
              type="submit"
              className="primary-cta-btn auth-submit-btn"
              disabled={loading || !orgName.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Provisioning Workspace...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Create Organisation & Enter</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Claim Invitation or Join Code */}
        {activeTab === 'invite' && (
          <form onSubmit={handleClaim} className="auth-form" noValidate>
            <div className="form-group auth-field-group">
              <label className="form-label" htmlFor="invite-token-input">
                Organisation Joining Code or Invite Token
              </label>
              <div className="input-with-icon">
                <KeyRound size={17} className="input-icon" />
                <input
                  id="invite-token-input"
                  type="text"
                  className="form-input"
                  placeholder="e.g. GGHJ-9771"
                  value={inviteToken}
                  onChange={(e) => setInviteToken(e.target.value.toUpperCase())}
                  style={{ fontFamily: 'monospace', textTransform: 'uppercase' }}
                  required
                />
              </div>
              <span className="field-hint" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Enter the organisation worker joining code (e.g. GGHJ-9771) or invitation token.
              </span>
            </div>

            <button
              type="submit"
              className="primary-cta-btn auth-submit-btn"
              disabled={loading || !inviteToken.trim()}
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="spin-animation" />
                  <span>Validating Token...</span>
                </>
              ) : (
                <>
                  <KeyRound size={16} />
                  <span>Join Organisation</span>
                </>
              )}
            </button>
          </form>
        )}

        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', textAlign: 'center' }}>
          <button
            type="button"
            className="secondary-btn"
            style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
            onClick={handleQuickJoinDemo}
            disabled={loading}
          >
            🚀 Quick Start: Join Demo Organisation (Acme Corp)
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};
