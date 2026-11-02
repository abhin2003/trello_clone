import React, { useState } from 'react';
import {
  Building2,
  ArrowRight,
  Shield,
  Crown,
  UserCheck,
  Plus,
  KeyRound,
  LogOut,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { AuthLayout } from './AuthLayout';
import { useNavigate } from '../../router/Router';
import type { UserRole } from '../../types/saas';

export const SelectOrganisationPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    userProfile,
    memberships,
    selectOrganisation,
    createOrganisation,
    claimInvitation,
    joinOrganisation,
    joinWithCode,
    logout,
  } = useAuth();

  const [isCreating, setIsCreating] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [isClaiming, setIsClaiming] = useState(false);
  const [inviteToken, setInviteToken] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const res = await createOrganisation(newOrgName.trim());
      if (!res.success) {
        setActionError(res.error || 'Failed to create organisation');
      } else {
        setIsCreating(false);
        const createdSlug = res.organisation?.slug || newOrgName.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
        const orgId = res.organisation?.id || res.organisationId;
        if (orgId) {
          selectOrganisation(orgId);
        }
        setNewOrgName('');
        navigate(`/org/${createdSlug}/dashboard`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleClaimInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteToken.trim()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const cleanInput = inviteToken.trim();
      // Try joinWithCode first (handles org join codes like GGHJ-9771 and tokens)
      const res = await joinWithCode(cleanInput);
      if (res.success && res.organisation) {
        setIsClaiming(false);
        setInviteToken('');
        navigate(`/org/${res.organisation.slug}/dashboard`);
        return;
      }

      // Fallback to claimInvitation
      const invRes = await claimInvitation(cleanInput);
      if (!invRes.success) {
        setActionError(res.error || invRes.error || 'Invalid or expired joining code or invitation token');
      } else {
        setIsClaiming(false);
        setInviteToken('');
        const slug = invRes.organisation?.slug || 'acme-corp';
        navigate(`/org/${slug}/dashboard`);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuickJoinDemo = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const res = await joinOrganisation('org-acme', 'owner');
      if (res.success && res.organisation) {
        selectOrganisation(res.organisation.id);
        navigate(`/org/${res.organisation.slug}/dashboard`);
      } else {
        setActionError(res.error || 'Failed to join demo organisation');
      }
    } finally {
      setActionLoading(false);
    }
  };

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="badge-pill badge-active" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <Crown size={12} />
            Owner
          </span>
        );
      case 'admin':
        return (
          <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}>
            <Shield size={12} />
            Admin
          </span>
        );
      case 'member':
        return (
          <span className="badge-pill badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <UserCheck size={12} />
            Member
          </span>
        );
      case 'guest':
        return (
          <span className="badge-pill badge-warning" style={{ fontSize: '0.72rem' }}>
            Guest
          </span>
        );
    }
  };

  return (
    <AuthLayout
      title={memberships.length === 0 ? "Create Your Workspace" : "Select Your Organisation"}
      subtitle={
        memberships.length === 0
          ? `Welcome, ${userProfile?.name || 'User'}. Set up your organisation workspace to start using Drello.`
          : `Welcome back, ${userProfile?.name || 'User'}. Choose which organisation workspace to open.`
      }
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

          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="auth-link-btn"
              onClick={() => {
                setIsClaiming((p) => !p);
                setIsCreating(false);
                setActionError(null);
              }}
            >
              Have a join code or invite?
            </button>
            {memberships.length > 0 && (
              <button
                type="button"
                className="auth-link-btn"
                onClick={() => {
                  setIsCreating((p) => !p);
                  setIsClaiming(false);
                  setActionError(null);
                }}
              >
                + Create new organisation
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="select-org-content">
        {actionError && (
          <div className="auth-error-banner" style={{ marginBottom: '1rem' }}>
            <AlertCircle size={16} />
            <span>{actionError}</span>
          </div>
        )}

        {/* Claim Invitation Accordion Form */}
        {isClaiming && (
          <form onSubmit={handleClaimInvite} className="callout-card" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <KeyRound size={16} color="var(--accent-blue)" />
              <span>Join Organisation with Code or Token</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Enter the worker joining code (e.g. <code>GGHJ-9771</code>) or invitation token:
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. GGHJ-9771"
                value={inviteToken}
                onChange={(e) => setInviteToken(e.target.value.toUpperCase())}
                style={{ fontFamily: 'monospace', fontSize: '0.85rem', textTransform: 'uppercase' }}
                required
              />
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={actionLoading || !inviteToken.trim()}
              >
                {actionLoading ? <RefreshCw size={15} className="spin-animation" /> : 'Join'}
              </button>
            </div>
          </form>
        )}

        {/* Create Organisation Accordion Form (for when user already has orgs and toggled create) */}
        {isCreating && memberships.length > 0 && (
          <form onSubmit={handleCreateOrg} className="callout-card" style={{ marginBottom: '1.25rem' }}>
            <h4 style={{ margin: '0 0 6px 0', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Plus size={16} color="var(--accent-emerald)" />
              <span>Register New Organisation</span>
            </h4>
            <p style={{ margin: '0 0 10px 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              Enter the name of your company or department. You will be set as the Owner.
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Nexus Innovations"
                value={newOrgName}
                onChange={(e) => setNewOrgName(e.target.value)}
                required
              />
              <button
                type="submit"
                className="primary-cta-btn"
                disabled={actionLoading || !newOrgName.trim()}
              >
                {actionLoading ? <RefreshCw size={15} className="spin-animation" /> : 'Create'}
              </button>
            </div>
          </form>
        )}

        {/* Zero Organisations State: Direct creation and quick start */}
        {memberships.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '6px 0 12px 0' }}>
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '14px',
                background: 'rgba(59, 130, 246, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '14px',
              }}
            >
              <Building2 size={26} color="var(--accent-blue)" />
            </div>

            <h3 style={{ margin: '0 0 6px 0', fontSize: '1.2rem', fontWeight: 600, color: '#f8fafc' }}>
              Create Your Organisation
            </h3>
            <p style={{ margin: '0 auto 20px auto', maxWidth: '420px', fontSize: '0.86rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              You don't have an organisation workspace yet. Enter your company or team name below to initialize your workspace as Owner and open your visual Kanban boards.
            </p>

            <form onSubmit={handleCreateOrg} style={{ maxWidth: '420px', margin: '0 auto', textAlign: 'left' }}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Organisation / Company Name
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Drello Innovations or Acme Tech"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <button
                type="submit"
                className="primary-cta-btn"
                disabled={actionLoading || !newOrgName.trim()}
                style={{ width: '100%', justifyContent: 'center', padding: '12px 18px', fontSize: '0.92rem' }}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={16} className="spin-animation" />
                    <span>Creating Workspace...</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span>Create Organisation & Open Workspace</span>
                  </>
                )}
              </button>
            </form>

            <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-light)', maxWidth: '420px', margin: '20px auto 0 auto' }}>
              <button
                type="button"
                className="secondary-btn"
                style={{ width: '100%', justifyContent: 'center', fontSize: '0.84rem' }}
                onClick={handleQuickJoinDemo}
              >
                🚀 Quick Start: Join Demo Organisation (Acme Corp)
              </button>
            </div>
          </div>
        ) : (
          /* Organisations List Grid */
          <div className="org-cards-list">
            {memberships.map((m) => {
              const org = m.organisation;
              const isSuspended = org.status === 'suspended';

              const handleEnter = () => {
                selectOrganisation(org.id);
                navigate(`/org/${org.slug}/dashboard`);
              };

              return (
                <div
                  key={org.id}
                  className={`org-selection-card ${isSuspended ? 'card-suspended' : ''}`}
                  onClick={handleEnter}
                >
                  <div className="org-card-left">
                    <div
                      className="org-avatar-box"
                      style={{ backgroundColor: org.primaryColor || '#3b82f6' }}
                    >
                      <Building2 size={20} color="#ffffff" />
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="org-card-name">{org.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        {renderRoleBadge(m.role)}
                        {m.jobTitle && <span className="org-card-job">{m.jobTitle}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="org-card-right">
                    <button
                      type="button"
                      className="org-enter-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEnter();
                      }}
                    >
                      <span>Enter</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AuthLayout>
  );
};
